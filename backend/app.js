const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');

// Load environment variables FIRST
dotenv.config({
  path: path.join(__dirname, '../.env')
});

// Database
const { testConnection } = require('./config/db');

// Error middleware
const {
  notFound,
  errorHandler
} = require('./middleware/errorMiddleware');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const artisanRoutes = require('./routes/artisanRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const messageRoutes = require('./routes/messageRoutes');
const aiRoutes = require('./routes/aiRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Create Express application
const app = express();

// Trust Vercel/reverse proxy for HTTPS
app.set('trust proxy', 1);

/*
====================================================
1. SECURITY HEADERS
====================================================
*/
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    },
    contentSecurityPolicy: false
  })
);

/*
====================================================
2. CORS
====================================================
*/
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

/*
====================================================
3. BODY PARSERS
====================================================
*/
app.use(express.json({ limit: '10mb' }));

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb'
  })
);

/*
====================================================
4. SESSION CONFIGURATION
====================================================
*/
app.use(
  session({
    name: 'balochhunar.sid',

    secret: process.env.SESSION_SECRET,

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

/*
====================================================
5. STATIC FILES
====================================================
*/

// Uploaded images
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// Frontend CSS, JS, public files, admin files
app.use(
  express.static(path.join(__dirname, '../frontend'))
);

/*
====================================================
6. HOMEPAGE
====================================================
*/

app.get('/', (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      '../frontend/public/index.html'
    )
  );
});

/*
====================================================
7. HEALTH CHECK
====================================================
*/

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

/*
====================================================
8. API ROUTES
====================================================
*/

app.use('/api/auth', authRoutes);

app.use('/api/artisans', artisanRoutes);

app.use('/api/categories', categoryRoutes);

app.use('/api/products', productRoutes);

app.use('/api/services', serviceRoutes);

app.use('/api/gallery', galleryRoutes);

app.use('/api/messages', messageRoutes);

app.use('/api/ai', aiRoutes);

app.use('/api/orders', orderRoutes);

/*
====================================================
9. ERROR HANDLERS
====================================================
*/

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

/*
====================================================
EXPORT EXPRESS APP
====================================================
*/

module.exports = app;