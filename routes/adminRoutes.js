/**
 * ═══════════════════════════════════════════════════════════════════
 *  Admin Routes — Protected dashboard endpoints
 * ═══════════════════════════════════════════════════════════════════
 *
 *  All routes except /admin/login are protected by the auth middleware.
 *  The admin authenticates with a password stored in .env.
 *
 *  Features:
 *  - Login / Logout
 *  - Dashboard overview (stats + data tables)
 *  - Approve/reject participants and teams
 *  - View and manage game submissions
 * ═══════════════════════════════════════════════════════════════════
 */

const express    = require('express');
const router     = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');
const rateLimiter      = require('../middleware/rateLimiter');

// ─── Login (Public) ─────────────────────────────────────────────────
router.get('/login',  adminController.getLoginPage);
router.post('/login', rateLimiter.loginLimiter, adminController.postLogin);

// ─── Logout ─────────────────────────────────────────────────────────
router.post('/logout', requireAdmin, adminController.postLogout);

// ─── Dashboard (Protected) ─────────────────────────────────────────
router.get('/',          requireAdmin, adminController.getDashboard);
router.get('/dashboard', requireAdmin, adminController.getDashboard);

// ─── Export Data ────────────────────────────────────────────────────
router.get('/export-csv', requireAdmin, adminController.exportCSV);

// ─── Registration Kill Switch ────────────────────────────────────────
router.post('/toggle-registration', requireAdmin, adminController.toggleRegistration);

// ─── Participant Management ─────────────────────────────────────────
router.post('/participants/:id/approve', requireAdmin, adminController.approveParticipant);
router.post('/participants/:id/reject',  requireAdmin, adminController.rejectParticipant);

// ─── Team Management ────────────────────────────────────────────────
router.post('/teams/:id/approve', requireAdmin, adminController.approveTeam);
router.post('/teams/:id/reject',  requireAdmin, adminController.rejectTeam);

// ─── Submission Management ──────────────────────────────────────────────────
router.post('/submissions/:id/approve', requireAdmin, adminController.approveSubmission);
router.post('/submissions/:id/reject',  requireAdmin, adminController.rejectSubmission);

// ─── Sponsor Management ──────────────────────────────────────────────────────
router.post('/sponsors',           requireAdmin, adminController.createSponsor);
router.post('/sponsors/:id/delete', requireAdmin, adminController.deleteSponsor);

module.exports = router;
