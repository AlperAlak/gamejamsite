/**
 * ═══════════════════════════════════════════════════════════════════
 *  Registration Routes — Form submission endpoints
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Handles POST requests for:
 *  - Individual participant registration
 *  - Team registration (with team members)
 *
 *  All routes are rate-limited and validated via middleware.
 * ═══════════════════════════════════════════════════════════════════
 */

const express    = require('express');
const router     = express.Router();
const regController       = require('../controllers/registrationController');
const rateLimiter         = require('../middleware/rateLimiter');
const { validateParticipant, validateTeam } = require('../middleware/validator');
const registrationCheck   = require('../middleware/registrationCheck');

// ─── Individual Registration ────────────────────────────────────────
// POST /kayit/bireysel → Register a single participant
router.post(
  '/bireysel',
  registrationCheck(),      // ← Kill Switch Guard
  rateLimiter.registrationLimiter,
  validateParticipant,
  regController.registerIndividual
);

// ─── Team Registration ──────────────────────────────────────────────
// POST /kayit/takim → Register a team with members
router.post(
  '/takim',
  registrationCheck(),      // ← Kill Switch Guard
  rateLimiter.registrationLimiter,
  validateTeam,
  regController.registerTeam
);

module.exports = router;
