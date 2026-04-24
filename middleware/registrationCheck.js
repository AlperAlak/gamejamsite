/**
 * ═══════════════════════════════════════════════════════════════════
 *  Registration Check Middleware — Kill Switch Guard
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Blocks all POST registration requests and OAuth callback routes
 *  when the admin has toggled registrations CLOSED.
 *
 *  Behaviour when registrations are closed:
 *    - JSON requests  → 403 JSON response
 *    - HTML requests  → 403 error page render
 *    - Redirects      → back to /kayit-formu with a flash message
 * ═══════════════════════════════════════════════════════════════════
 */

const SystemSetting = require('../models/SystemSetting');

/**
 * Middleware: reject the request when registration_open === 'false'.
 *
 * Use `redirectOnClosed` flag to redirect instead of returning a 403
 * (needed for OAuth callback routes that can't display a form error).
 *
 * @param {boolean} [redirectOnClosed=false]
 */
const registrationCheck = (redirectOnClosed = false) => async (req, res, next) => {
  try {
    const isOpen = await SystemSetting.isRegistrationOpen();

    if (isOpen) {
      return next(); // registrations are open — proceed normally
    }

    // ── Registrations are CLOSED ─────────────────────────────────
    const message = 'Kayıtlar şu an kapalıdır.';

    if (redirectOnClosed) {
      req.session.flashError = message;
      return res.redirect('/kayit-formu');
    }

    // For regular form POSTs: return a proper 403 error page
    return res.status(403).render('pages/error', {
      title: 'Kayıtlar Kapalı',
      message,
      statusCode: 403
    });

  } catch (err) {
    console.error('registrationCheck middleware error:', err);
    next(err);
  }
};

module.exports = registrationCheck;
