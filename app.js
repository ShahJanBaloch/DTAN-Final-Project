const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');

// Load environment variables locally
dotenv.config({
  path: path.join(__dirname, '.env')
});

// Database
const { testConnection } = require('./backend/config/db');

// Error middleware
const {
  notFound,
  errorHandler
} = require('./backend/middleware/errorMiddleware');

// Routes
const authRoutes = require('./backend/routes/authRoutes');
const artisanRoutes = require('./backend/routes/artisanRoutes');
const categoryRoutes = require('./backend/routes/categoryRoutes');
const productRoutes = require('./backend/routes/productRoutes');
const serviceRoutes = require('./backend/routes/serviceRoutes');
const galleryRoutes = require('./backend/routes/galleryRoutes');
const messageRoutes = require('./backend/routes/messageRoutes');
const aiRoutes = require('./backend/routes/aiRoutes');
const orderRoutes = require('./backend/routes/orderRoutes');

const app = express();

app.set('trust proxy', 1);

const frontendPath = path.join(__dirname, 'frontend');
const publicPath = path.join(frontendPath, 'public');
const adminPath = path.join(frontendPath, 'admin');
const cssPath = path.join(frontendPath, 'css');
const jsPath = path.join(frontendPath, 'js');
const uploadsPath = path.join(__dirname, 'backend', 'uploads');


app.use('/uploads', express.static(uploadsPath));
app.use('/css', express.static(cssPath));
app.use('/js', express.static(jsPath));
app.use('/public', express.static(publicPath));
app.use('/admin', express.static(adminPath));

// ====================================================
// ERROR HANDLERS
// ====================================================
app.use(notFound);
app.use(errorHandler);

// ====================================================
// EXPORT FOR VERCEL
// ====================================================
module.exports = app;