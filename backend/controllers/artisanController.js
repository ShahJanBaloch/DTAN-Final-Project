const { pool } = require('../config/db');

/**
 * Get all artisans
 * GET /api/artisans
 */
async function getAllArtisans(req, res, next) {
  try {
    const [artisans] = await pool.query(
      'SELECT id, name, location, experience_years, craft_type, bio, image, story, created_at FROM artisans ORDER BY id DESC'
    );
    return res.status(200).json({
      success: true,
      count: artisans.length,
      data: artisans
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single artisan by ID
 * GET /api/artisans/:id
 */
async function getArtisanById(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT id, name, location, experience_years, craft_type, bio, image, story, created_at FROM artisans WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Artisan not found with ID ${id}`
      });
    }

    // Also fetch products crafted by this artisan
    const [products] = await pool.query(
      `SELECT p.id, p.name, p.price, p.image, p.tags, c.name AS category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.artisan_id = ?
       ORDER BY p.id DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...rows[0],
        products
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create new artisan
 * POST /api/artisans (Admin Protected)
 */
async function createArtisan(req, res, next) {
  try {
    const { name, location, experience_years, craft_type, bio, story, image_url } = req.body;

    if (!name || !location || !craft_type || !bio) {
      return res.status(400).json({
        success: false,
        message: 'Name, location, craft type, and biography are required fields.'
      });
    }

    // Determine image: uploaded file takes precedence, then optional URL, or default placeholder
    let image = '/uploads/default-artisan.jpg';
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    } else if (image_url && image_url.trim()) {
      image = image_url.trim();
    }

    const [result] = await pool.query(
      `INSERT INTO artisans (name, location, experience_years, craft_type, bio, image, story)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        location.trim(),
        Number(experience_years) || 0,
        craft_type.trim(),
        bio.trim(),
        image,
        story ? story.trim() : null
      ]
    );

    const [newArtisan] = await pool.query('SELECT * FROM artisans WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Artisan created successfully',
      data: newArtisan[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update artisan
 * PUT /api/artisans/:id (Admin Protected)
 */
async function updateArtisan(req, res, next) {
  try {
    const { id } = req.params;
    const { name, location, experience_years, craft_type, bio, story, image_url } = req.body;

    // Verify artisan exists
    const [existing] = await pool.query('SELECT * FROM artisans WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Artisan not found with ID ${id}`
      });
    }

    let image = existing[0].image;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    } else if (image_url && image_url.trim()) {
      image = image_url.trim();
    }

    await pool.query(
      `UPDATE artisans 
       SET name = ?, location = ?, experience_years = ?, craft_type = ?, bio = ?, image = ?, story = ?
       WHERE id = ?`,
      [
        name ? name.trim() : existing[0].name,
        location ? location.trim() : existing[0].location,
        experience_years !== undefined ? Number(experience_years) : existing[0].experience_years,
        craft_type ? craft_type.trim() : existing[0].craft_type,
        bio ? bio.trim() : existing[0].bio,
        image,
        story !== undefined ? (story ? story.trim() : null) : existing[0].story,
        id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM artisans WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Artisan updated successfully',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete artisan
 * DELETE /api/artisans/:id (Admin Protected)
 */
async function deleteArtisan(req, res, next) {
  try {
    const { id } = req.params;

    // Check if artisan exists
    const [existing] = await pool.query('SELECT id, name FROM artisans WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Artisan not found with ID ${id}`
      });
    }

    // Check for active product associations (Foreign Key Safety)
    const [productCount] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE artisan_id = ?',
      [id]
    );

    if (productCount[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete artisan "${existing[0].name}" because they have ${productCount[0].count} associated product(s). Please reassign or delete their products first.`
      });
    }

    await pool.query('DELETE FROM artisans WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: `Artisan "${existing[0].name}" deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllArtisans,
  getArtisanById,
  createArtisan,
  updateArtisan,
  deleteArtisan
};
