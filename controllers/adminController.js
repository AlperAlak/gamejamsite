/**
 * ═══════════════════════════════════════════════════════════════════
 *  Admin Controller — Dashboard, login, and management actions
 * ═══════════════════════════════════════════════════════════════════
 */

const crypto         = require('crypto');
const Participant    = require('../models/Participant');
const Team           = require('../models/Team');
const Submission     = require('../models/Submission');
const SystemSetting  = require('../models/SystemSetting');
const Sponsor        = require('../models/Sponsor');
const emailService   = require('../utils/emailService');

// ─── Authentication ─────────────────────────────────────────────────

/**
 * GET /admin/login — Render admin login page
 */
exports.getLoginPage = (req, res) => {
  if (req.session.isAdmin) {
    return res.redirect('/admin/dashboard');
  }

  res.render('admin/login', {
    title: 'Yönetici Girişi | Karadeniz Game Jam 2026',
    error: null,
    csrfToken: req.session.csrfToken
  });
};

/**
 * POST /admin/login — Authenticate admin with password
 * Uses constant-time comparison to prevent timing attacks.
 */
exports.postLogin = (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  console.log('[LOGIN] Attempt received — body has password:', !!password);
  console.log('[LOGIN] ADMIN_PASSWORD configured:', !!adminPassword);

  // Safety check: reject if ADMIN_PASSWORD is not configured
  if (!adminPassword) {
    console.error('[LOGIN] ❌ ADMIN_PASSWORD env var is not set!');
    return res.render('admin/login', {
      title: 'Yönetici Girişi | Karadeniz Game Jam 2026',
      csrfToken: req.session.csrfToken,   // ← required or next submit loops
      error: 'Sunucu yapılandırma hatası. Lütfen yönetici ile iletişime geçin.'
    });
  }

  // Constant-time comparison to prevent timing attacks
  let isValid = false;
  try {
    isValid = password &&
      adminPassword.length === password.length &&
      crypto.timingSafeEqual(
        Buffer.from(adminPassword, 'utf8'),
        Buffer.from(password, 'utf8')
      );
  } catch (e) {
    console.error('[LOGIN] timingSafeEqual threw:', e.message);
    isValid = false;
  }

  console.log('[LOGIN] Password match:', isValid);

  if (!isValid) {
    console.warn('[LOGIN] ❌ Invalid password — re-rendering login with error.');
    return res.render('admin/login', {
      title: 'Yönetici Girişi | Karadeniz Game Jam 2026',
      csrfToken: req.session.csrfToken,   // ← required or next submit loops
      error: 'Geçersiz şifre. Lütfen tekrar deneyin.'
    });
  }

  // Regenerate session ID to prevent session fixation attacks
  req.session.regenerate((err) => {
    if (err) {
      console.error('[LOGIN] ❌ Session regeneration error:', err);
      return res.render('admin/login', {
        title: 'Yönetici Girişi | Karadeniz Game Jam 2026',
        csrfToken: req.session.csrfToken, // ← required or next submit loops
        error: 'Oturum oluşturulamadı. Lütfen tekrar deneyin.'
      });
    }

    req.session.isAdmin    = true;
    req.session.loginTime  = new Date().toISOString();
    req.session.csrfToken  = crypto.randomBytes(32).toString('hex');

    console.log('[LOGIN] ✅ Session populated — saving to Redis...');

    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('[LOGIN] ❌ Session save error:', saveErr);
      } else {
        console.log('[LOGIN] ✅ Session saved successfully — redirecting to dashboard.');
      }
      res.redirect('/admin/dashboard');
    });
  });
};


/**
 * POST /admin/logout — Destroy admin session
 */
exports.postLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Session destruction error:', err);
    res.redirect('/admin/login');
  });
};

// ─── Dashboard ──────────────────────────────────────────────────────

/**
 * GET /admin/dashboard — Main admin dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const [participants, teams, submissions, registrationOpen, sponsors] = await Promise.all([
      Participant.findAll(),
      Team.findAll(),
      Submission.findAll(),
      SystemSetting.isRegistrationOpen(),
      Sponsor.findAll()
    ]);

    const [
      totalParticipants, totalTeams, totalSubmissions,
      pendingParticipants, pendingTeams,
      approvedParticipants, approvedTeams,
      totalPeople
    ] = await Promise.all([
      Participant.count(),
      Team.count(),
      Submission.count(),
      Participant.countByStatus('pending'),
      Team.countByStatus('pending'),
      Participant.countByStatus('approved'),
      Team.countByStatus('approved'),
      Participant.getTotalPeopleCount()
    ]);

    const stats = {
      totalParticipants,
      totalTeams,
      totalSubmissions,
      pendingParticipants,
      pendingTeams,
      approvedParticipants,
      approvedTeams,
      totalPeople
    };

    res.render('admin/dashboard', {
      title: 'Yönetici Paneli | Karadeniz Game Jam 2026',
      stats,
      participants,
      teams,
      submissions,
      registrationOpen,
      sponsors,
      csrfToken: req.session.csrfToken
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('pages/error', {
      title: 'Sunucu Hatası',
      message: 'Kontrol paneli yüklenirken bir hata oluştu.',
      statusCode: 500
    });
  }
};

// ─── Registration Kill Switch ────────────────────────────────────────

/**
 * POST /admin/toggle-registration
 * Flips the registration_open flag in the database.
 */
exports.toggleRegistration = async (req, res) => {
  try {
    const isOpen = await SystemSetting.isRegistrationOpen();
    const newValue = isOpen ? 'false' : 'true';
    await SystemSetting.set('registration_open', newValue);

    req.session.flashSuccess = isOpen
      ? 'Kayıtlar başarıyla KAPATILDI.'
      : 'Kayıtlar başarıyla AÇILDI.';
  } catch (error) {
    console.error('Toggle registration error:', error);
    req.session.flashError = 'Kayıt durumu değiştirilemedi. Lütfen tekrar deneyin.';
  }
  res.redirect('/admin/dashboard');
};

// ─── Participant Management ─────────────────────────────────────────

exports.approveParticipant = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (participant) {
      await Participant.updateStatus(req.params.id, 'approved');
      req.session.flashSuccess = 'Katılımcı onaylandı.';
      // Send notification email (async)
      emailService.sendApprovalEmail(participant.email, participant.full_name);
    } else {
      req.session.flashError = 'Katılımcı bulunamadı.';
    }
  } catch (error) {
    console.error('Approve participant error:', error);
    req.session.flashError = 'İşlem sırasında bir hata oluştu.';
  }
  res.redirect('/admin/dashboard');
};

exports.rejectParticipant = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (participant) {
      await Participant.updateStatus(req.params.id, 'rejected');
      req.session.flashSuccess = 'Katılımcı reddedildi.';
      // Send notification email (async)
      emailService.sendRejectionEmail(participant.email, participant.full_name);
    } else {
      req.session.flashError = 'Katılımcı bulunamadı.';
    }
  } catch (error) {
    console.error('Reject participant error:', error);
    req.session.flashError = 'İşlem sırasında bir hata oluştu.';
  }
  res.redirect('/admin/dashboard');
};

// ─── Team Management ────────────────────────────────────────────────

exports.approveTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (team) {
      await Team.updateStatus(req.params.id, 'approved');
      req.session.flashSuccess = 'Takım onaylandı.';
      // Send notification email to captain (async)
      emailService.sendApprovalEmail(team.captain_email, team.captain_name);
    } else {
      req.session.flashError = 'Takım bulunamadı.';
    }
  } catch (error) {
    console.error('Approve team error:', error);
    req.session.flashError = 'İşlem sırasında bir hata oluştu.';
  }
  res.redirect('/admin/dashboard');
};

exports.rejectTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (team) {
      await Team.updateStatus(req.params.id, 'rejected');
      req.session.flashSuccess = 'Takım reddedildi.';
      // Send notification email to captain (async)
      emailService.sendRejectionEmail(team.captain_email, team.captain_name);
    } else {
      req.session.flashError = 'Takım bulunamadı.';
    }
  } catch (error) {
    console.error('Reject team error:', error);
    req.session.flashError = 'İşlem sırasında bir hata oluştu.';
  }
  res.redirect('/admin/dashboard');
};

// ─── Submission Management ──────────────────────────────────────────

exports.approveSubmission = async (req, res) => {
  try {
    await Submission.updateStatus(req.params.id, 'approved');
    req.session.flashSuccess = 'Proje onaylandı.';
  } catch (error) {
    console.error('Approve submission error:', error);
    req.session.flashError = 'İşlem sırasında bir hata oluştu.';
  }
  res.redirect('/admin/dashboard');
};

exports.rejectSubmission = async (req, res) => {
  try {
    await Submission.updateStatus(req.params.id, 'rejected');
    req.session.flashSuccess = 'Proje reddedildi.';
  } catch (error) {
    console.error('Reject submission error:', error);
    req.session.flashError = 'İşlem sırasında bir hata oluştu.';
  }
  res.redirect('/admin/dashboard');
};

// ─── Export Data ────────────────────────────────────────────────────

exports.exportCSV = async (req, res) => {
  try {
    const participants = await Participant.findAll();
    const teams = await Team.findAll();

    let csvContent = '\uFEFF'; // BOM for UTF-8 compatibility in Excel
    csvContent += 'Type,ID,Name,Email,Phone,University,Status,Created At\n';

    participants.forEach(p => {
      csvContent += `"Bireysel",${p.id},"${p.full_name}","${p.email}","${p.phone}","${p.university}","${p.status}","${p.created_at}"\n`;
    });

    teams.forEach(t => {
      csvContent += `"Takim Kaptani",${t.id},"${t.captain_name}","${t.captain_email}","${t.captain_phone}","${t.university}","${t.status}","${t.created_at}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="participants.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    req.session.flashError = 'CSV dışa aktarılırken hata oluştu.';
    res.redirect('/admin/dashboard');
  }
};

// ─── Sponsor Management ──────────────────────────────────────────────────

/**
 * POST /admin/sponsors — Add a new sponsor
 */
exports.createSponsor = async (req, res) => {
  console.log('--- ADD SPONSOR ATTEMPT ---', req.body);
  try {
    const { name, logo_url, website_url, category, display_order } = req.body;
    const safeCategory = category === 'extra' ? 'extra' : 'main';
    const order = display_order ? parseInt(display_order, 10) : 0;

    if (!name || !name.trim()) {
      req.session.flashError = 'Sponsor adı zorunludur.';
      return res.redirect('/admin/dashboard#sponsors');
    }
    if (!logo_url || !logo_url.trim()) {
      req.session.flashError = 'Logo URL zorunludur.';
      return res.redirect('/admin/dashboard#sponsors');
    }

    await Sponsor.create({
      name: name.trim(),
      logo_url: logo_url.trim(),
      website_url: website_url ? website_url.trim() : null,
      category: safeCategory,
      display_order: order
    });

    req.session.flashSuccess = `"${name.trim()}" sponsorı eklendi.`;
  } catch (error) {
    console.error('Sponsor Add Error:', error);
    req.session.flashError = 'Sponsor eklenirken bir hata oluştu.';
  }
  res.redirect('/admin/dashboard#sponsors');
};

/**
 * POST /admin/sponsors/:id/delete — Remove a sponsor
 */
exports.deleteSponsor = async (req, res) => {
  try {
    await Sponsor.delete(req.params.id);
    req.session.flashSuccess = 'Sponsor silindi.';
  } catch (error) {
    console.error('Delete sponsor error:', error);
    req.session.flashError = 'Sponsor silinirken bir hata oluştu.';
  }
  res.redirect('/admin/dashboard#sponsors');
};
