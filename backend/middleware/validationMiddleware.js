const { isEmail, isPositivePrice, isValidId, isValidLength, sanitizeString } = require('../utils/validation');

/**
 * Route parameter ID validation middleware
 */
function validateIdParam(req, res, next) {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid ID parameter "${id}". ID must be a positive integer.`
    });
  }
  req.params.id = Number(id);
  next();
}

/**
 * Product submission validator
 */
function validateProductInput(req, res, next) {
  const { name, description, price, category_id, artisan_id } = req.body;
  const errors = [];

  if (!isValidLength(name, 2, 200)) {
    errors.push('Product name is required (between 2 and 200 characters).');
  }

  if (!isValidLength(description, 5, 5000)) {
    errors.push('Product description is required (at least 5 characters).');
  }

  if (!isPositivePrice(price)) {
    errors.push('Price must be a valid positive number greater than 0.');
  }

  if (!isValidId(category_id)) {
    errors.push('A valid category selection is required.');
  }

  if (!isValidId(artisan_id)) {
    errors.push('A valid master artisan selection is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Sanitize fields
  req.body.name = sanitizeString(name);
  req.body.description = sanitizeString(description);
  if (req.body.tags) req.body.tags = sanitizeString(req.body.tags);

  next();
}

/**
 * Artisan submission validator
 */
function validateArtisanInput(req, res, next) {
  const { name, location, craft_type, bio } = req.body;
  const errors = [];

  if (!isValidLength(name, 2, 120)) errors.push('Artisan name must be between 2 and 120 characters.');
  if (!isValidLength(location, 2, 150)) errors.push('Artisan location is required.');
  if (!isValidLength(craft_type, 2, 100)) errors.push('Craft type is required.');
  if (!isValidLength(bio, 5, 2000)) errors.push('Biography is required (at least 5 characters).');

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.name = sanitizeString(name);
  req.body.location = sanitizeString(location);
  req.body.craft_type = sanitizeString(craft_type);
  req.body.bio = sanitizeString(bio);

  next();
}

/**
 * Category submission validator
 */
function validateCategoryInput(req, res, next) {
  const { name } = req.body;
  if (!isValidLength(name, 2, 100)) {
    return res.status(400).json({
      success: false,
      message: 'Category name is required (between 2 and 100 characters).'
    });
  }
  req.body.name = sanitizeString(name);
  next();
}

/**
 * Service submission validator
 */
function validateServiceInput(req, res, next) {
  const { title, description, starting_price } = req.body;
  const errors = [];

  if (!isValidLength(title, 2, 150)) errors.push('Service title is required.');
  if (!isValidLength(description, 5, 2000)) errors.push('Service description is required.');
  if (starting_price !== undefined && Number(starting_price) < 0) {
    errors.push('Starting price cannot be negative.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.title = sanitizeString(title);
  req.body.description = sanitizeString(description);
  next();
}

/**
 * Contact message validator
 */
function validateMessageInput(req, res, next) {
  const { name, email, subject, message } = req.body;
  const errors = [];

  if (!isValidLength(name, 2, 120)) errors.push('Your name is required.');
  if (!isEmail(email)) errors.push('A valid email address is required.');
  if (!isValidLength(subject, 2, 200)) errors.push('Subject is required.');
  if (!isValidLength(message, 10, 3000)) errors.push('Message must be at least 10 characters long.');

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.name = sanitizeString(name);
  req.body.email = sanitizeString(email).toLowerCase();
  req.body.subject = sanitizeString(subject);
  req.body.message = sanitizeString(message);

  next();
}

module.exports = {
  validateIdParam,
  validateProductInput,
  validateArtisanInput,
  validateCategoryInput,
  validateServiceInput,
  validateMessageInput
};
