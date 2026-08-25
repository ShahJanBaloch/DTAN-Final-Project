const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');

// ====================================================
// LOAD ENVIRONMENT VARIABLES
// ====================================================
// Local development: loads .env
// Vercel production: uses Environment Variables from Vercel
dotenv.config({
  path: path.join(__dirname, '.env')
});

// ====================================================
// IMPORT DATABASE
// ====================================================

const { testConnection } = require('./backend/config/db');

// ====================================================
// IMPORT ERROR MIDDLEWARE
// ====================================================

const {
  notFound,
  errorHandler
} = require('./backend/middleware/errorMiddleware');

// ====================================================
// IMPORT ROUTES
// ====================================================

const authRoutes = require('./backend/routes/authRoutes');
const artisanRoutes = require('./backend/routes/artisanRoutes');
const categoryRoutes = require('./backend/routes/categoryRoutes');
const productRoutes = require('./backend/routes/productRoutes');
const serviceRoutes = require('./backend/routes/serviceRoutes');
const galleryRoutes = require('./backend/routes/galleryRoutes');
const messageRoutes = require('./backend/routes/messageRoutes');
const aiRoutes = require('./backend/routes/aiRoutes');
const orderRoutes = require('./backend/routes/orderRoutes');

// ====================================================
// CREATE EXPRESS APPLICATION
// ====================================================

const app = express();

// Trust Vercel / reverse proxy
app.set('trust proxy', 1);

// ====================================================
// PROJECT PATHS
// ====================================================

const frontendPath = path.join(__dirname, 'frontend');

const publicPath = path.join(frontendPath, 'public');

const adminPath = path.join(frontendPath, 'admin');

const cssPath = path.join(frontendPath, 'css');

const jsPath = path.join(frontendPath, 'js');

const uploadsPath = path.join(
  __dirname,
  'backend',
  'uploads'
);

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

app.use(
  express.json({
    limit: '10mb'
  })
);

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

    secret:
      process.env.SESSION_SECRET ||
      'change-this-development-secret',

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,

      // HTTP locally, HTTPS on Vercel production
      secure: process.env.NODE_ENV === 'production',

      sameSite: 'lax',

      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

// ====================================================
// 5. STATIC FILES
// ====================================================

// Uploaded product/artisan images
app.use(
  '/uploads',
  express.static(uploadsPath)
);

// CSS
app.use(
  '/css',
  express.static(cssPath)
);

// JavaScript
app.use(
  '/js',
  express.static(jsPath)
);

// Public HTML files
app.use(
  '/public',
  express.static(publicPath)
);

// Admin HTML files
app.use(
  '/admin',
  express.static(adminPath)
);

// Root-relative public assets used by pages served through clean URLs.
app.use(
  express.static(publicPath)
);

// ====================================================
// 6. HEALTH CHECK
// ====================================================

app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();

    return res.status(200).json({
      success: true,
      message: 'BalochHunar API is running',
      timestamp: new Date().toISOString(),
      environment:
        process.env.NODE_ENV || 'development',
      database:
        dbStatus.connected
          ? 'connected'
          : 'disconnected',
      databaseDetail: dbStatus.message
    });

  } catch (error) {
    console.error(
      'Health check error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// ====================================================
// 7. API ROUTES
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
  return res.sendFile(
    path.join(publicPath, 'index.html')
  );
});
app.get('/index', (req, res) => {
  return res.sendFile(
    path.join(publicPath, 'index.html')
  );
});
app.get('/index.html', (req, res) => {
  return res.sendFile(
    path.join(publicPath, 'index.html')
  );
});

// About page
app.get('/about', (req, res) => {
  return res.sendFile(
    path.join(publicPath, 'about.html')
  );
});
app.get('/about.html', (req, res) => {
  return res.sendFile(
    path.join(publicPath, 'about.html')
  );
});


// Products page
app.get('/products', (req, res) => {
  return res.sendFile(
    path.join(publicPath, 'products.html')
  );
});
app.get('/products.html', (req, res) => {
  return res.sendFile(
    path.join(publicPath, 'products.html')
  );
});
app.get('/products-page', (req, res) => {
  return res.sendFile(
    path.join(publicPath, 'products.html')
  );
});

// Services page
app.get('/services', (req, res) => {
  return res.sendFile(
    path.join(publicPath, 'services.html')
  );
});
app.get('/services-page', (req, res) => {
  return res.sendFile(
    path.join(publicPath, 'services.html')
  );
});
app.get('/services.html', (req, res) => {
  return res.sendFile(
    path.join(publicPath, 'services.html')
  );
});

// Contact page
app.get('/contact', (req, res) => {
  return res.sendFile(
    path.join(publicPath, 'contact.html')
  );
});
app.get('/contact.html', (req, res) => {
  return res.sendFile(
    path.join(publicPath, 'contact.html')
  );
});

// Order and tracking pages
app.get('/order', (req, res) => {
  return res.sendFile(
    path.join(publicPath, 'order.html')
  );
});
app.get('/order.html', (req, res) => {
  return res.sendFile(
    path.join(publicPath, 'order.html')
  );
});
app.get('/track-order', (req, res) => {
  return res.sendFile(
    path.join(publicPath, 'track-order.html')
  );
});
app.get('/track-order.html', (req, res) => {
  return res.sendFile(
    path.join(publicPath, 'track-order.html')
  );
});


// ====================================================
// 9. ADMIN ROUTES
// ====================================================

// Admin login page
app.get('/admin-login', (req, res) => {
  return res.sendFile(
    path.join(adminPath, 'login.html')
  );
});
app.get('/admin/login', (req, res) => {
  return res.sendFile(
    path.join(adminPath, 'login.html')
  );
});
app.get('/admin/index.html', (req, res) => {
  return res.sendFile(
    path.join(adminPath, 'dashboard.html')
  );
});

// ====================================================
// 10. ERROR HANDLERS
// IMPORTANT: THESE MUST ALWAYS BE LAST
// ====================================================

// 404 - Route not found
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ====================================================
// EXPORT EXPRESS APPLICATION FOR VERCEL
// ====================================================

module.exports = app;