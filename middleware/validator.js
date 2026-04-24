/**
 * ═══════════════════════════════════════════════════════════════════
 *  Validator Middleware — Server-side form validation & sanitization
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Validates and sanitizes all registration form inputs before they
 *  reach the controller. Returns Turkish-language error messages.
 *
 *  Sanitization:
 *  - Trims whitespace from all string fields
 *  - Escapes HTML entities to prevent XSS via stored data
 *
 *  Validation:
 *  - Required field checks
 *  - Email format validation
 *  - Phone format validation (Turkish)
 *  - String length limits
 * ═══════════════════════════════════════════════════════════════════
 */

// ─── Helper: Escape HTML Entities ───────────────────────────────────
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ─── Helper: Validate Email Format ──────────────────────────────────
function isValidEmail(email) {
  // RFC 5322 simplified — good enough for registration forms
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ─── Helper: Validate Turkish Phone Format ──────────────────────────
function isValidPhone(phone) {
  // Accepts: 05XX XXX XXXX, +90 5XX XXX XXXX, 5XXXXXXXXX, etc.
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^(\+90|0)?5\d{9}$/;
  return phoneRegex.test(cleaned);
}

// ─── Helper: Sanitize All String Fields in Body ─────────────────────
function sanitizeBody(body) {
  const sanitized = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      sanitized[key] = escapeHtml(value.trim());
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v => typeof v === 'string' ? escapeHtml(v.trim()) : v);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Validate individual participant registration.
 */
exports.validateParticipant = (req, res, next) => {
  req.body = sanitizeBody(req.body);

  const { fullName, email, phone, university, experienceLevel, motivation } = req.body;
  const errors = [];

  if (!fullName || fullName.length < 2) {
    errors.push({ field: 'fullName', message: 'Ad Soyad en az 2 karakter olmalıdır.' });
  }

  if (!email || !isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Geçerli bir e-posta adresi giriniz.' });
  }

  if (!phone || !isValidPhone(phone)) {
    errors.push({ field: 'phone', message: 'Geçerli bir telefon numarası giriniz.' });
  }

  if (!university || university.length < 2) {
    errors.push({ field: 'university', message: 'Üniversite/Okul adı gereklidir.' });
  }

  const validLevels = ['beginner', 'intermediate', 'advanced'];
  if (!experienceLevel || !validLevels.includes(experienceLevel)) {
    errors.push({ field: 'experienceLevel', message: 'Geçerli bir deneyim seviyesi seçiniz.' });
  }

  if (motivation && motivation.length > 500) {
    errors.push({ field: 'motivation', message: 'Motivasyon metni en fazla 500 karakter olabilir.' });
  }

  if (errors.length > 0) {
    return res.status(400).render('pages/register', {
      title: 'Kayıt Ol | Karadeniz Game Jam 2026',
      errors,
      formData: req.body,
      registrationOpen: true // Assuming true if they reached here
    });
  }

  next();
};

/**
 * Validate team registration.
 */
exports.validateTeam = (req, res, next) => {
  req.body = sanitizeBody(req.body);

  const {
    teamName, captainName, captainEmail, captainPhone,
    university, memberNames, memberEmails
  } = req.body;
  const errors = [];

  if (!teamName || teamName.length < 2) {
    errors.push({ field: 'teamName', message: 'Takım adı en az 2 karakter olmalıdır.' });
  }

  if (!captainName || captainName.length < 2) {
    errors.push({ field: 'captainName', message: 'Kaptan adı soyadı gereklidir.' });
  }

  if (!captainEmail || !isValidEmail(captainEmail)) {
    errors.push({ field: 'captainEmail', message: 'Geçerli bir e-posta adresi giriniz.' });
  }

  if (!captainPhone || !isValidPhone(captainPhone)) {
    errors.push({ field: 'captainPhone', message: 'Geçerli bir telefon numarası giriniz.' });
  }

  if (!university || university.length < 2) {
    errors.push({ field: 'university', message: 'Üniversite/Okul adı gereklidir.' });
  }

  if (memberNames && memberEmails) {
    const names  = Array.isArray(memberNames)  ? memberNames  : [memberNames];
    const emails = Array.isArray(memberEmails) ? memberEmails : [memberEmails];

    for (let i = 0; i < names.length; i++) {
      if (names[i] && names[i].trim() && emails[i]) {
        if (!isValidEmail(emails[i].trim())) {
          errors.push({
            field: `memberEmails_${i}`,
            message: `${i + 1}. üye için geçerli bir e-posta adresi giriniz.`
          });
        }
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).render('pages/register', {
      title: 'Kayıt Ol | Karadeniz Game Jam 2026',
      errors,
      formData: req.body,
      registrationOpen: true
    });
  }

  next();
};
