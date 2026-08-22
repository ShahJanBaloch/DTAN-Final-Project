const { pool } = require('../config/db');

/**
 * Get all products with dynamic multi-faceted search, category, artisan, price range, and sorting
 * GET /api/products
 */
async function getAllProducts(req, res, next) {
  try {
    const { search, category, artisan, featured, min_price, max_price, sort } = req.query;

    let sql = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.tags,
        p.image,
        p.is_featured,
        p.created_at,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        p.artisan_id,
        a.name AS artisan_name,
        a.location AS artisan_location
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN artisans a ON p.artisan_id = a.id
      WHERE 1 = 1
    `;

    const params = [];

    // 1. Search filter across all relevant text fields (parameterized)
    if (search && search.trim()) {
      sql += ` AND (
        p.name LIKE ? OR 
        p.description LIKE ? OR 
        p.tags LIKE ? OR 
        a.name LIKE ? OR 
        a.location LIKE ? OR 
        c.name LIKE ?
      )`;
      const searchWildcard = `%${search.trim()}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }

    // 2. Category filter (by ID or Slug)
    if (category) {
      if (!isNaN(category)) {
        sql += ` AND p.category_id = ?`;
        params.push(Number(category));
      } else {
        sql += ` AND c.slug = ?`;
        params.push(category.trim());
      }
    }

    // 3. Artisan filter (by ID)
    if (artisan && !isNaN(artisan)) {
      sql += ` AND p.artisan_id = ?`;
      params.push(Number(artisan));
    }

    // 4. Featured filter
    if (featured === 'true' || featured === '1') {
      sql += ` AND p.is_featured = 1`;
    }

    // 5. Price range filters
    if (min_price && !isNaN(min_price)) {
      sql += ` AND p.price >= ?`;
      params.push(Number(min_price));
    }
    if (max_price && !isNaN(max_price)) {
      sql += ` AND p.price <= ?`;
      params.push(Number(max_price));
    }

    // 6. Safe sorting whitelist
    switch (sort) {
      case 'price_asc':
        sql += ` ORDER BY p.price ASC, p.id DESC`;
        break;
      case 'price_desc':
        sql += ` ORDER BY p.price DESC, p.id DESC`;
        break;
      case 'name_asc':
        sql += ` ORDER BY p.name ASC`;
        break;
      case 'newest':
      default:
        sql += ` ORDER BY p.id DESC`;
        break;
    }

    const [products] = await pool.query(sql, params);

    return res.status(200).json({
      success: true,
      count: products.length,
      filtersApplied: {
        search: search || null,
        category: category || null,
        artisan: artisan || null,
        featured: featured || null,
        sort: sort || 'newest'
      },
      data: products
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single product by ID (with full category and artisan details)
 * GET /api/products/:id
 */
async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.tags,
        p.image,
        p.is_featured,
        p.created_at,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        p.artisan_id,
        a.name AS artisan_name,
        a.location AS artisan_location,
        a.craft_type AS artisan_craft_type,
        a.bio AS artisan_bio,
        a.image AS artisan_image
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN artisans a ON p.artisan_id = a.id
      WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Product not found with ID ${id}`
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create new product
 * POST /api/products (Admin Protected)
 */
async function createProduct(req, res, next) {
  try {
    const { name, description, price, category_id, artisan_id, tags, is_featured, image_url } = req.body;

    const numPrice = Number(price);

    // Verify Category exists
    const [catRows] = await pool.query('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (catRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid category selected (ID ${category_id} does not exist)`
      });
    }

    // Verify Artisan exists
    const [artRows] = await pool.query('SELECT id FROM artisans WHERE id = ?', [artisan_id]);
    if (artRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid artisan selected (ID ${artisan_id} does not exist)`
      });
    }

    // Determine Image URL
    let image = 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800';
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    } else if (image_url && image_url.trim()) {
      image = image_url.trim();
    }

    const isFeaturedVal = (is_featured === true || is_featured === 'true' || is_featured === '1' || is_featured === 1) ? 1 : 0;

    const [result] = await pool.query(
      `INSERT INTO products (category_id, artisan_id, name, description, price, tags, image, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(category_id),
        Number(artisan_id),
        name.trim(),
        description.trim(),
        numPrice,
        tags ? tags.trim() : null,
        image,
        isFeaturedVal
      ]
    );

    const [newProduct] = await pool.query(
      `SELECT p.*, c.name AS category_name, a.name AS artisan_name 
       FROM products p
       JOIN categories c ON p.category_id = c.id
       JOIN artisans a ON p.artisan_id = a.id
       WHERE p.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update product
 * PUT /api/products/:id (Admin Protected)
 */
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, price, category_id, artisan_id, tags, is_featured, image_url } = req.body;

    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Product not found with ID ${id}`
      });
    }

    // Verify category if updated
    const targetCatId = category_id ? Number(category_id) : existing[0].category_id;
    const [catRows] = await pool.query('SELECT id FROM categories WHERE id = ?', [targetCatId]);
    if (catRows.length === 0) {
      return res.status(400).json({ success: false, message: `Category ID ${targetCatId} does not exist` });
    }

    // Verify artisan if updated
    const targetArtId = artisan_id ? Number(artisan_id) : existing[0].artisan_id;
    const [artRows] = await pool.query('SELECT id FROM artisans WHERE id = ?', [targetArtId]);
    if (artRows.length === 0) {
      return res.status(400).json({ success: false, message: `Artisan ID ${targetArtId} does not exist` });
    }

    let image = existing[0].image;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    } else if (image_url && image_url.trim()) {
      image = image_url.trim();
    }

    const numPrice = price !== undefined ? Number(price) : existing[0].price;
    const isFeaturedVal = is_featured !== undefined 
      ? ((is_featured === true || is_featured === 'true' || is_featured === '1' || is_featured === 1) ? 1 : 0)
      : existing[0].is_featured;

    await pool.query(
      `UPDATE products 
       SET category_id = ?, artisan_id = ?, name = ?, description = ?, price = ?, tags = ?, image = ?, is_featured = ?
       WHERE id = ?`,
      [
        targetCatId,
        targetArtId,
        name ? name.trim() : existing[0].name,
        description ? description.trim() : existing[0].description,
        numPrice,
        tags !== undefined ? (tags ? tags.trim() : null) : existing[0].tags,
        image,
        isFeaturedVal,
        id
      ]
    );

    const [updated] = await pool.query(
      `SELECT p.*, c.name AS category_name, a.name AS artisan_name 
       FROM products p
       JOIN categories c ON p.category_id = c.id
       JOIN artisans a ON p.artisan_id = a.id
       WHERE p.id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete product
 * DELETE /api/products/:id (Admin Protected)
 */
async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id, name FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Product not found with ID ${id}`
      });
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: `Product "${existing[0].name}" deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
