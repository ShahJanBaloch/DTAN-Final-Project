const { pool } = require('../config/db');

/**
 * Get all gallery items
 * GET /api/gallery
 */
async function getAllGallery(req, res, next) {
  try {
    const [items] = await pool.query('SELECT * FROM gallery ORDER BY id DESC');
    return res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create/upload new gallery item
 * POST /api/gallery (Admin Protected)
 */
async function createGalleryItem(req, res, next) {
  try {
    const { title, craft_type, description, image_url } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required for gallery items'
      });
    }

    let image = null;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    } else if (image_url && image_url.trim()) {
      image = image_url.trim();
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide or upload an image'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO gallery (title, craft_type, image, description) VALUES (?, ?, ?, ?)',
      [
        title.trim(),
        craft_type ? craft_type.trim() : null,
        image,
        description ? description.trim() : null
      ]
    );

    const [newItem] = await pool.query('SELECT * FROM gallery WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Gallery item added successfully',
      data: newItem[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete gallery item
 * DELETE /api/gallery/:id (Admin Protected)
 */
async function deleteGalleryItem(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id, title FROM gallery WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Gallery item not found with ID ${id}`
      });
    }

    await pool.query('DELETE FROM gallery WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: `Gallery item "${existing[0].title}" deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllGallery,
  createGalleryItem,
  deleteGalleryItem
};
