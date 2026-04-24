const Participant = require('../models/Participant');
const Team = require('../models/Team');
const emailService = require('../utils/emailService');

/**
 * POST /kayit/bireysel — Handle individual registration
 */
exports.registerIndividual = async (req, res, next) => {
  try {
    const { fullName, email, phone, university, experienceLevel, motivation } = req.body;

    // 1. Capacity Check (Limit: 100)
    const currentCount = await Participant.getTotalPeopleCount();
    if (currentCount >= 100) {
      return res.status(400).json({
        success: false,
        message: "Maalesef kontenjanımız dolmuştur. Gösterdiğiniz ilgi için teşekkür ederiz!"
      });
    }

    // 2. Check for duplicate email
    const existing = await Participant.findByEmail(email);
    if (existing) {
      return res.status(400).render('pages/register', {
        title: 'Kayıt Ol | Karadeniz Game Jam 2026',
        errors: [{ field: 'email', message: 'Bu e-posta adresi ile zaten kayıt oluşturulmuş. Lütfen detaylar için e-postanızı kontrol edin.' }],
        formData: req.body,
        registrationOpen: true
      });
    }

    // Create participant
    await Participant.create({
      full_name: fullName,
      email,
      phone,
      university,
      experience_level: experienceLevel,
      motivation,
      ip_address: req.ip
    });

    // Send confirmation email (async, don't await so it doesn't slow down the response)
    emailService.sendRegistrationConfirmation(email, fullName);

    res.redirect('/basarili');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /kayit/takim — Handle team registration
 */
exports.registerTeam = async (req, res, next) => {
  try {
    const {
      teamName, captainName, captainEmail, captainPhone,
      university, memberNames, memberEmails
    } = req.body;

    // 1. Capacity Check (Limit: 100)
    const currentCount = await Participant.getTotalPeopleCount();
    if (currentCount >= 100) {
      return res.status(400).json({
        success: false,
        message: "Maalesef kontenjanımız dolmuştur. Gösterdiğiniz ilgi için teşekkür ederiz!"
      });
    }

    // 2. Dupe checks
    const existingTeam = await Team.findByName(teamName);
    if (existingTeam) {
      return res.status(400).render('pages/register', {
        title: 'Kayıt Ol | Karadeniz Game Jam 2026',
        errors: [{ field: 'teamName', message: 'Bu takım adı zaten alınmış.' }],
        formData: req.body,
        registrationOpen: true
      });
    }

    const existingCaptain = await Team.findByCaptainEmail(captainEmail);
    if (existingCaptain) {
      return res.status(400).render('pages/register', {
        title: 'Kayıt Ol | Karadeniz Game Jam 2026',
        errors: [{ field: 'captainEmail', message: 'Bu e-posta adresi ile zaten bir takım kaydı var. Lütfen detaylar için e-postanızı kontrol edin.' }],
        formData: req.body,
        registrationOpen: true
      });
    }

    // Prepare members
    const names  = Array.isArray(memberNames)  ? memberNames  : [memberNames];
    const emails = Array.isArray(memberEmails) ? memberEmails : [memberEmails];
    
    const members = [];
    if (names) {
      for (let i = 0; i < names.length; i++) {
        const name = names[i] ? names[i].trim() : '';
        const mail = emails[i] ? emails[i].trim() : '';
        if (name && mail) {
          members.push({ fullName: name, email: mail });
        }
      }
    }

    // Create team and members
    await Team.create({
      team_name: teamName,
      captain_name: captainName,
      captain_email: captainEmail,
      captain_phone: captainPhone,
      university,
      member_count: members.length + 1,
      ip_address: req.ip,
      members
    });

    // Send confirmation email to captain (async)
    emailService.sendRegistrationConfirmation(captainEmail, captainName);

    res.redirect('/basarili');
  } catch (error) {
    next(error);
  }
};
