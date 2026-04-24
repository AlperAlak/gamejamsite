/**
 * ═══════════════════════════════════════════════════════════════════
 *  Auth Middleware — Protects admin routes
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Checks if the user has an active admin session.
 *  If not, redirects them to the admin login page.
 * ═══════════════════════════════════════════════════════════════════
 */

/**
 * Require admin authentication.
 * Attach to any route that needs protection:
 *   router.get('/dashboard', requireAdmin, controller.getDashboard);
 */
exports.requireAdmin = (req, res, next) => {
  console.log('--- AUTH CHECK ---');
  console.log('Session ID:', req.sessionID);
  console.log('Is Authenticated (isAdmin):', req.session ? req.session.isAdmin : 'NO_SESSION');
  console.log('Session Content:', req.session ? JSON.stringify(req.session) : 'null');

  if (req.session && req.session.isAdmin) {
    return next();
  }

  // Persist returnTo before redirecting so it survives the round-trip
  if (req.session) {
    req.session.returnTo = req.originalUrl;
    req.session.save(() => {
      res.redirect('/admin/login');
    });
  } else {
    res.redirect('/admin/login');
  }
};
