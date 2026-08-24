const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');

// ====================================================
// LOAD ENVIRONMENT VARIABLES
// ====================================================

// This loads .env locally.
// On Vercel, environment variables come from Vercel settings.
dotenv.config({
  path: path.join(__dirname, '../.env')
});

// ====================================================
// IMPORT DATABASE
// ====================================================

const { testConnection } = require('./config/db');

// ====================================================
// IMPORT ERROR MIDDLEWARE
// ====================================================

const {
  notFound,
  errorHandler
} = require('./middleware/errorMiddleware');

// ====================================================
// IMPORT ROUTES
// ====================================================

const authRoutes = require('./routes/authRoutes');
const artisanRoutes = require('./routes/artisanRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const messageRoutes = require('./routes/messageRoutes');
const aiRoutes = require('./routes/aiRoutes');
const orderRoutes = require('./routes/orderRoutes');

// ====================================================
// CREATE EXPRESS APP
// ====================================================

const app = express();

// Trust Vercel's reverse proxy
app.set('trust proxy', 1);

// ====================================================
// DEFINE FRONTEND PATHS
// ====================================================

const frontendPath = path.join(__dirname, '../frontend');

const publicPath = path.join(frontendPath, 'public');

const adminPath = path.join(frontendPath, 'admin');

const cssPath = path.join(frontendPath, 'css');

const jsPath = path.join(frontendPath, 'js');

// ====================================================
// 1. SECURITY HEADERS
// ====================================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    },
    contentSecurityPolicy: false
  })
);

// ====================================================
// 2. CORS
// ====================================================

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

// ====================================================
// 3. BODY PARSERS
// ====================================================

app.use(express.json({
  limit: '10mb'
}));

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb'
  })
);

// ====================================================
// 4. SESSION CONFIGURATION
// ====================================================

app.use(
  session({
    name: 'balochhunar.sid',

    secret: process.env.SESSION_SECRET || 'change-this-secret',

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,

      // false locally, true in production/Vercel
      secure: process.env.NODE_ENV === 'production',

      sameSite: 'lax',

      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

// ====================================================
// 5. STATIC FILES
// ====================================================

// Uploaded images
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// CSS files
app.use(
  '/css',
  express.static(cssPath)
);

// JavaScript files
app.use(
  '/js',
  express.static(jsPath)
);

// Public frontend files
// This makes /public/index.html available if needed
app.use(
  '/public',
  express.static(publicPath)
);

// Admin frontend files
// This makes /admin/dashboard.html, etc. available
app.use(
  '/admin',
  express.static(adminPath)
);

// ====================================================
// 6. HEALTH CHECK
// IMPORTANT: BEFORE ERROR HANDLERS
// ====================================================

app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();

    res.status(200).json({
      success: true,
      message: 'BalochHunar API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus.connected
        ? 'connected'
        : 'disconnected',
      databaseDetail: dbStatus.message
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// ====================================================
// 7. API ROUTES
// IMPORTANT: BEFORE FRONTEND ERROR HANDLERS
// ====================================================

app.use('/api/auth', authRoutes);

app.use('/api/artisans', artisanRoutes);

app.use('/api/categories', categoryRoutes);

app.use('/api/products', productRoutes);

app.use('/api/services', serviceRoutes);

app.use('/api/gallery', galleryRoutes);

app.use('/api/messages', messageRoutes);

app.use('/api/ai', aiRoutes);

app.use('/api/orders', orderRoutes);

// ====================================================
// 8. PUBLIC WEBSITE ROUTES
// ====================================================

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// About page
app.get('/about', (req, res) => {
  res.sendFile(path.join(publicPath, 'about.html'));
});

// Products page
app.get('/products', (req, res) => {
  res.sendFile(path.join(publicPath, 'products.html'));
});

// Services page
app.get('/services', (req, res) => {
  res.sendFile(path.join(publicPath, 'services.html'));
});

// Contact page
app.get('/contact', (req, res) => {
  res.sendFile(path.join(publicPath, 'contact.html'));
});

// ====================================================
// 9. ADMIN ROUTES
// ====================================================

// Admin login page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(adminPath, 'login.html'));
});

// ====================================================
// 10. ERROR HANDLERS
// IMPORTANT: ALWAYS LAST
// ====================================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ====================================================
// EXPORT EXPRESS APP
// ====================================================

module.exports = app;