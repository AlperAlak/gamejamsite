/**
 * ═══════════════════════════════════════════════════════════════════
 *  Karadeniz Game Jam 2026 — Main Server Entry Point
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Express.js application with:
 *  - Helmet for security headers
 *  - Session-based authentication for admin panel
 *  - EJS templating engine
 *  - Custom CSRF protection
 *  - Rate limiting on sensitive endpoints
 *  - HPP (HTTP Parameter Pollution) protection
 *
 *  Architecture: MVC (Model-View-Controller)
 * ═══════════════════════════════════════════════════════════════════
 */

// ─── Load Environment Variables ─────────────────────────────────────
require('dotenv').config();

console.log('DEBUG: Admin Password is set:', !!process.env.ADMIN_PASSWORD);

// ─── Core Dependencies ─────────────────────────────────────────────
const express  = require('express');
const path     = require('path');
const helmet   = require('helmet');
const session  = require('express-session');
const hpp      = require('hpp');
const crypto   = require('crypto');
const redis    = require('redis');
const RedisStore = require('connect-redis').default;
const i18next  = require('i18next');
const Backend  = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
// const passport = require('./config/passport');

// ─── Database Module ────────────────────────────────────────────────
const database = require('./config/db');

// ─── Initialize Express App & Clients ───────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

// Initialize Redis Client (connect is awaited before server starts — see boot sequence at the bottom)
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.on('error', (err) => console.error('Redis Client Error:', err));
global.redisClient = redisClient; // Export for rate limiters if needed

// Initialize i18next
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'tr',
    preload: ['tr', 'en', 'de'],
    backend: {
      loadPath: path.join(__dirname, '/locales/{{lng}}/translation.json')
    }
  });

// ═══════════════════════════════════════════════════════════════════
//  MIDDLEWARE STACK
// ═══════════════════════════════════════════════════════════════════

/**
 * 1. SECURITY HEADERS (Helmet)
 *    Sets various HTTP headers to help protect the app.
 *    Custom CSP allows Google Fonts & inline styles for our cyberpunk design.
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com"],
      scriptSrc:    ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://www.google.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc:       ["'self'", "data:", "https:", "https://www.google.com", "https://maps.gstatic.com", "https://maps.googleapis.com"],
      connectSrc:  ["'self'"],
      frameSrc:    ["'self'", "https://www.google.com", "https://maps.google.com", "http://googleusercontent.com/maps.google.com"],
      objectSrc:   ["'none'"],
      baseUri:     ["'self'"],
      formAction:  ["'self'"]
    }
  },
  frameguard: { action: 'sameorigin' }
}));

/**
 * 2. HTTP PARAMETER POLLUTION PROTECTION
 */
app.use(hpp());

/**
 * 3. BODY PARSERS
 */
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

/**
 * 4. STATIC FILES
 */
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));

/**
 * 5. SESSION CONFIGURATION (Redis Store)
 */
app.set('trust proxy', 1); // Trust first proxy (NGINX) for secure cookies
app.use(session({
  store:             new RedisStore({ client: redisClient, prefix: "kgj_sess:" }),
  secret:            process.env.SESSION_SECRET || 'fallback-dev-secret-change-me',
  resave:            true,
  saveUninitialized: false,
  name: 'kgj.sid',
  cookie: {
    secure:   false, // Must be false for local HTTP
    httpOnly: true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   24 * 60 * 60 * 1000 // 24 hours
  }
}));

/**
 * 5.1 i18n & PASSPORT MIDDLEWARE
 */
app.use(middleware.handle(i18next));
  // app.use(passport.initialize());
  // app.use(passport.session());

/**
 * 6. CUSTOM CSRF PROTECTION
 *    Generates a per-session CSRF token and validates it on state-changing requests.
 *    On failure, redirects gracefully instead of rendering a dead-end 403 page.
 */
app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  res.locals.csrfToken = req.session.csrfToken;

  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const token = req.body._csrf || req.headers['x-csrf-token'];

    if (!token || token !== req.session.csrfToken) {
      console.log('--- CSRF ATTACK DETECTED OR STALE SESSION ---');
      console.log('Expected Token (Session):', req.session.csrfToken);
      console.log('Received Token (Body):', req.body._csrf);
      console.log('Received Token (Headers):', req.headers['x-csrf-token']);
      console.log('Request Path:', req.originalUrl);
      console.log('Request Headers:', req.headers);
      
      // Stale session (e.g. after server restart wiped Redis) or genuine CSRF attack.
      // Redirect gracefully so the user gets a fresh page with a valid token.
      req.session.flashError = 'Oturumunuz sona erdi. Lütfen tekrar deneyin.';
      const redirectTo = req.session.isAdmin ? '/admin/dashboard' : '/admin/login';
      return res.redirect(redirectTo);
    }
  }

  next();
});

/**
 * 7. TEMPLATE-GLOBAL LOCALS
 *    Variables available to every EJS template.
 */
app.use((req, res, next) => {
  // Flash messages
  res.locals.flashSuccess = req.session.flashSuccess || null;
  res.locals.flashError   = req.session.flashError || null;
  delete req.session.flashSuccess;
  delete req.session.flashError;

  // Event configuration
  res.locals.eventStartDate = process.env.EVENT_START_DATE || '2026-08-15T10:00:00+03:00';
  res.locals.eventEndDate   = process.env.EVENT_END_DATE   || '2026-08-17T18:00:00+03:00';
  res.locals.whatsappLink   = process.env.WHATSAPP_LINK    || '#';
  res.locals.currentYear    = new Date().getFullYear();
  
  // Inject translation function to views
  res.locals.t = req.t;

  next();
});

// ═══════════════════════════════════════════════════════════════════
//  VIEW ENGINE
// ═══════════════════════════════════════════════════════════════════

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ═══════════════════════════════════════════════════════════════════
//  ROUTE MOUNTING
// ═══════════════════════════════════════════════════════════════════

const pageRoutes         = require('./routes/pageRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const adminRoutes        = require('./routes/adminRoutes');
const registrationCheck  = require('./middleware/registrationCheck');

app.use('/',      pageRoutes);
app.use('/kayit', registrationRoutes);
app.use('/admin', adminRoutes);

// ─── OAUTH ROUTES (REMOVED) ──────────────────────────────────────────
/*
app.get('/auth/google', registrationCheck(true), passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', 
...
app.post('/complete-profile', registrationCheck(true), regController.completeProfile);
*/

// ═══════════════════════════════════════════════════════════════════
//  ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════

/** 404 Handler */
app.use((req, res) => {
  res.status(404).render('pages/error', {
    title: 'Sayfa Bulunamadı',
    message: 'Aradığınız sayfa bulunamadı. Ana sayfaya dönmek için butona tıklayın.',
    statusCode: 404
  });
});

/** Global Error Handler */
app.use((err, req, res, next) => {
  console.error('─── UNHANDLED ERROR ───');
  console.error('Time:', new Date().toISOString());
  console.error('URL:', req.originalUrl);
  console.error('Method:', req.method);
  console.error('Error:', err.stack || err.message || err);
  console.error('───────────────────────');

  const isDev = process.env.NODE_ENV !== 'production';

  res.status(err.status || 500).render('pages/error', {
    title: 'Sunucu Hatası',
    message: isDev
      ? `Bir hata oluştu: ${err.message}`
      : 'Beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
    statusCode: err.status || 500
  });
});

// ═══════════════════════════════════════════════════════════════════
//  START SERVER (after database is ready)
// ═══════════════════════════════════════════════════════════════════

/**
 * Wait for the database and Redis to initialize,
 * then start the Express server.
 */
Promise.all([
  database.ready,
  redisClient.connect().then(() => console.log('✅ Redis connection established'))
]).then(() => {
  app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  🎮 Karadeniz Game Jam 2026 Platform');
    console.log(`  🌐 Server running at http://localhost:${PORT}`);
    console.log(`  📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('═══════════════════════════════════════════════════════');
  });
}).catch((err) => {
  console.error('❌ Failed to initialize dependencies:', err);
  process.exit(1);
});

module.exports = app;
