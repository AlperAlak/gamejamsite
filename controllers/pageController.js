/**
 * ═══════════════════════════════════════════════════════════════════
 *  Page Controller — Renders public-facing pages
 * ═══════════════════════════════════════════════════════════════════
 */

const Participant   = require('../models/Participant');
const Team          = require('../models/Team');
const SystemSetting = require('../models/SystemSetting');
const Sponsor       = require('../models/Sponsor');

/**
 * GET / — Landing Page
 * Renders the main event page with hero section, schedule, FAQ, sponsors.
 */
exports.getHomePage = async (req, res, next) => {
  try {
    const [participantCount, teamCount, registrationOpen, mainSponsors, extraSponsors] = await Promise.all([
      Participant.count(),
      Team.count(),
      SystemSetting.isRegistrationOpen(),
      Sponsor.findByCategory('main'),
      Sponsor.findByCategory('extra')
    ]);

    res.render('pages/index', {
      title: 'Karadeniz Game Jam 2026 | Ana Sayfa',
      participantCount,
      teamCount,
      registrationOpen,
      mainSponsors,
      extraSponsors
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /kayit-formu — Registration Page
 * Renders the registration form with individual/team tabs.
 */
exports.getRegisterPage = async (req, res, next) => {
  try {
    const registrationOpen = await SystemSetting.isRegistrationOpen();
    res.render('pages/register', {
      title: 'Kayıt Ol | Karadeniz Game Jam 2026',
      errors: [],
      formData: {},
      registrationOpen
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /basarili — Success Page
 * Shown after a successful registration. Includes WhatsApp join button.
 */
exports.getSuccessPage = (req, res) => {
  res.render('pages/success', {
    title: 'Kayıt Başarılı! | Karadeniz Game Jam 2026'
  });
};
/**
 * GET /giris — Login Page
 */
exports.getLoginPage = (req, res) => {
  res.render('pages/login', {
    title: 'Giriş Yap | Karadeniz Game Jam 2026'
  });
};
