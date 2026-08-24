const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const { testConnection } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

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

const app = express();
// Trust Vercel's HTTPS proxy
app.set('trust proxy', 1);

// 1. Security HTTP Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false
  })
);

// 2. Cross-Origin Resource Sharing
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

// 3. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Session Configuration
app.use(
  session({
    name: 'balochhunar.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,

      // false locally, true on Vercel/production
      secure: process.env.NODE_ENV === 'production',

      maxAge: 24 * 60 * 60 * 1000,

      sameSite: 'lax'
    }
  })
);

// 5. Static File Hosting
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// 6. Health Route
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.status(200).json({
    success: true,
    message: 'BalochHunar API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus.connected ? 'connected' : 'disconnected',
    databaseDetail: dbStatus.message
  });
});

// 7. Core Business & AI API Routes
app.use('/api/auth', authRoutes);
app.use('/api/artisans', artisanRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/orders', orderRoutes);

// 8. Global Error Handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;

// 5. Static File Hosting
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.static(path.join(__dirname, '../frontend')));

// Homepage
app.get('/', (req, res) => {
  res.sendFile(
    path.join(__dirname, '../frontend/public/index.html')
  );
});

app.set('trust proxy', 1);