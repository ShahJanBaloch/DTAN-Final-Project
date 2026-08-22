const { pool } = require('../config/db');

/**
 * Get all bespoke artisan services
 * GET /api/services
 */
async function getAllServices(req, res, next) {
  try {
    const [services] = await pool.query('SELECT * FROM services ORDER BY id ASC');
    return res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single service by ID
 * GET /api/services/:id
 */
async function getServiceById(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Service not found with ID ${id}`
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
 * Create new service
 * POST /api/services (Admin Protected)
 */
async function createService(req, res, next) {
  try {
    const { title, description, icon, estimated_days, starting_price } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Service title and description are required'
      });
    }

    const price = starting_price !== undefined ? Number(starting_price) : 0.0;

    const [result] = await pool.query(
      `INSERT INTO services (title, description, icon, estimated_days, starting_price)
       VALUES (?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description.trim(),
        icon ? icon.trim() : 'fas fa-palette',
        estimated_days ? estimated_days.trim() : '7-14 business days',
        isNaN(price) ? 0.0 : price
      ]
    );

    const [newService] = await pool.query('SELECT * FROM services WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: newService[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update service
 * PUT /api/services/:id (Admin Protected)
 */
async function updateService(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, icon, estimated_days, starting_price } = req.body;

    const [existing] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Service not found with ID ${id}`
      });
    }

    const price = starting_price !== undefined ? Number(starting_price) : existing[0].starting_price;

    await pool.query(
      `UPDATE services 
       SET title = ?, description = ?, icon = ?, estimated_days = ?, starting_price = ?
       WHERE id = ?`,
      [
        title ? title.trim() : existing[0].title,
        description ? description.trim() : existing[0].description,
        icon ? icon.trim() : existing[0].icon,
        estimated_days ? estimated_days.trim() : existing[0].estimated_days,
        isNaN(price) ? existing[0].starting_price : price,
        id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete service
 * DELETE /api/services/:id (Admin Protected)
 */
async function deleteService(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id, title FROM services WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Service not found with ID ${id}`
      });
    }

    await pool.query('DELETE FROM services WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: `Service "${existing[0].title}" deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};
