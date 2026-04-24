/**
 * ═══════════════════════════════════════════════════════════════════
 *  Page Routes — Public-facing pages
 * ═══════════════════════════════════════════════════════════════════
 *
 *  These routes render the main public pages of the platform:
 *  - Landing page (home)
 *  - Registration page
 *  - Post-registration success page
 *  - Error page (shared)
 * ═══════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router  = express.Router();
const pageController = require('../controllers/pageController');

// ─── Landing Page ───────────────────────────────────────────────────
// GET / → Main landing page with hero, schedule, FAQ, sponsors
router.get('/', pageController.getHomePage);

// ─── Registration Page ──────────────────────────────────────────────
// GET /kayit-formu → Renders the registration form
// (Note: form submission is handled by registrationRoutes)
router.get('/kayit-formu', pageController.getRegisterPage);

// ─── Login Page ─────────────────────────────────────────────────────
// GET /giris → Renders the participant login page
router.get('/giris', pageController.getLoginPage);

// ─── Success Page ───────────────────────────────────────────────────
// GET /basarili → Shown after successful registration
router.get('/basarili', pageController.getSuccessPage);

module.exports = router;
