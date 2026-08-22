const { pool } = require('../config/db');

/**
 * Helper to slugify category names
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * Get all categories with product count
 * GET /api/categories
 */
async function getAllCategories(req, res, next) {
  try {
    const [categories] = await pool.query(
      `SELECT c.id, c.name, c.slug, c.description, c.created_at, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id
       GROUP BY c.id
       ORDER BY c.name ASC`
    );

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single category by ID
 * GET /api/categories/:id
 */
async function getCategoryById(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT id, name, slug, description, created_at FROM categories WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Category not found with ID ${id}`
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
 * Create new category
 * POST /api/categories (Admin Protected)
 */
async function createCategory(req, res, next) {
  try {
    const { name, description, slug } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const cleanName = name.trim();
    const finalSlug = slug && slug.trim() ? slugify(slug) : slugify(cleanName);

    // Check duplicate name or slug
    const [existing] = await pool.query(
      'SELECT id FROM categories WHERE name = ? OR slug = ?',
      [cleanName, finalSlug]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name or slug already exists'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
      [cleanName, finalSlug, description ? description.trim() : null]
    );

    const [newCategory] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update category
 * PUT /api/categories/:id (Admin Protected)
 */
async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, slug } = req.body;

    const [existing] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Category not found with ID ${id}`
      });
    }

    const cleanName = name ? name.trim() : existing[0].name;
    const finalSlug = slug ? slugify(slug) : slugify(cleanName);

    // Ensure unique name/slug across other records
    const [duplicates] = await pool.query(
      'SELECT id FROM categories WHERE (name = ? OR slug = ?) AND id != ?',
      [cleanName, finalSlug, id]
    );

    if (duplicates.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Another category with this name or slug already exists'
      });
    }

    await pool.query(
      'UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?',
      [cleanName, finalSlug, description !== undefined ? (description ? description.trim() : null) : existing[0].description, id]
    );

    const [updated] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete category
 * DELETE /api/categories/:id (Admin Protected)
 */
async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id, name FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Category not found with ID ${id}`
      });
    }

    // Check if products belong to this category (Foreign key protection)
    const [productsCount] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );

    if (productsCount[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${existing[0].name}" because it contains ${productsCount[0].count} product(s). Please move or delete the products first.`
      });
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: `Category "${existing[0].name}" deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
