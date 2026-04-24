/**
 * ═══════════════════════════════════════════════════════════════════
 *  Rate Limiter Middleware — Spam protection for sensitive endpoints
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Bypassing Redis to resolve startup crashes (ClientClosedError).
 *  Using the default express-rate-limit in-memory store.
 * ═══════════════════════════════════════════════════════════════════
 */

const rateLimit = require('express-rate-limit');

/**
 * Registration Rate Limiter
 * Max 10 attempts per IP every 15 minutes.
 */
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Çok fazla kayıt denemesi yapıldı. Lütfen 15 dakika sonra tekrar deneyin.'
  },
  handler: (req, res) => {
    res.status(429).render('pages/error', {
      title: 'Çok Fazla İstek',
      message: 'Çok fazla kayıt denemesi yapıldı. Lütfen 15 dakika sonra tekrar deneyin.',
      statusCode: 429
    });
  }
});

/**
 * Admin Login Rate Limiter
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('admin/login', {
      title: 'Yönetici Girişi | Karadeniz Game Jam 2026',
      error: 'Çok fazla giriş denemesi yapıldı. Lütfen 15 dakika sonra tekrar deneyin.'
    });
  }
});

exports.registrationLimiter = registrationLimiter;
exports.loginLimiter = loginLimiter;
