/**
 * ═══════════════════════════════════════════════════════════════════
 *  Karadeniz Game Jam 2026 — Client-Side JavaScript
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Features:
 *  1. Dynamic countdown timer
 *  2. Mobile navigation toggle
 *  3. Navbar scroll effect
 *  4. FAQ accordion
 *  5. Registration form tab switching
 *  6. Dynamic team member rows
 *  7. Scroll-triggered fade-in animations
 *  8. Client-side form validation (Turkish)
 *  9. Cryptographic theme teaser (scrambling text)
 * ═══════════════════════════════════════════════════════════════════
 */

document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  initNavigation();
  initFAQ();
  initFormTabs();
  initTeamMembers();
  initScrollAnimations();
  initFormValidation();
  initThemeTeaser();
});


/* ─── 1. COUNTDOWN TIMER ─────────────────────────────────────────── */

function initCountdown() {
  const countdownEl = document.getElementById('countdown');
  if (!countdownEl) return;

  const targetDate = new Date(countdownEl.dataset.target).getTime();

  function update() {
    const now = Date.now();
    const diff = targetDate - now;

    if (diff <= 0) {
      // Event has started
      document.getElementById('countdown-days').textContent = '00';
      document.getElementById('countdown-hours').textContent = '00';
      document.getElementById('countdown-minutes').textContent = '00';
      document.getElementById('countdown-seconds').textContent = '00';
      return;
    }

    const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minutesEl = document.getElementById('countdown-minutes');
    const secondsEl = document.getElementById('countdown-seconds');

    if (daysEl)    daysEl.textContent    = String(days).padStart(2, '0');
    if (hoursEl)   hoursEl.textContent   = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  // Initial update + interval
  update();
  setInterval(update, 1000);
}


/* ─── 2. MOBILE NAVIGATION ──────────────────────────────────────── */

function initNavigation() {
  const toggle = document.getElementById('nav-toggle');
  const mobile = document.getElementById('nav-mobile');
  const navbar = document.getElementById('navbar');

  if (!toggle || !mobile) return;

  // Hamburger toggle
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    mobile.classList.toggle('active');
  });

  // Close mobile menu when clicking a link
  mobile.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      mobile.classList.remove('active');
    });
  });

  // Navbar scroll effect
  if (navbar) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;

      if (currentScroll > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }

      lastScroll = currentScroll;
    }, { passive: true });
  }
}


/* ─── 3. FAQ ACCORDION ───────────────────────────────────────────── */

function initFAQ() {
  const questions = document.querySelectorAll('.faq-question');

  questions.forEach(question => {
    question.addEventListener('click', () => {
      const item = question.closest('.faq-item');
      const isActive = item.classList.contains('active');

      // Close all other items
      document.querySelectorAll('.faq-item.active').forEach(activeItem => {
        activeItem.classList.remove('active');
      });

      // Toggle current item
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}


/* ─── 4. FORM TABS (Registration) ───────────────────────────────── */

function initFormTabs() {
  const tabs = document.querySelectorAll('.form-tab');
  if (tabs.length === 0) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      // Update tab buttons
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update panels
      document.querySelectorAll('.form-panel').forEach(panel => {
        panel.classList.remove('active');
      });

      const targetPanel = document.getElementById(`panel-${targetTab}`);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}


/* ─── 5. DYNAMIC TEAM MEMBERS ────────────────────────────────────── */

function initTeamMembers() {
  const addBtn = document.getElementById('add-member-btn');
  const container = document.getElementById('team-members-container');

  if (!addBtn || !container) return;

  // ── Event delegation: handles BOTH the static first row and dynamic rows ──
  container.addEventListener('click', (e) => {
    if (e.target.closest('.remove-member-btn')) {
      e.target.closest('.team-member-row').remove();
    }
  });

  addBtn.addEventListener('click', () => {
    const currentRows = container.querySelectorAll('.team-member-row').length;

    // Max 4 additional members (captain excluded)
    if (currentRows >= 4) {
      alert('Bir takıma kaptan dahil en fazla 5 kişi eklenebilir.');
      return;
    }

    // Build the row via DOM (no inline event handlers — CSP-safe)
    const row = document.createElement('div');
    row.className = 'team-member-row';

    const nameGroup = document.createElement('div');
    nameGroup.className = 'form-group';
    nameGroup.style.marginBottom = '0';
    nameGroup.innerHTML = '<label class="form-label">Üye Adı</label><input type="text" name="member_names" class="form-input" placeholder="Ad Soyad">';

    const emailGroup = document.createElement('div');
    emailGroup.className = 'form-group';
    emailGroup.style.marginBottom = '0';
    emailGroup.innerHTML = '<label class="form-label">Üye E-posta</label><input type="email" name="member_emails" class="form-input" placeholder="email@ornek.com">';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-member-btn';
    removeBtn.setAttribute('aria-label', 'Üyeyi kaldır');
    removeBtn.textContent = '×';

    row.appendChild(nameGroup);
    row.appendChild(emailGroup);
    row.appendChild(removeBtn);
    container.appendChild(row);

    // Focus the new name input
    row.querySelector('input[name="member_names"]').focus();
  });
}


/* ─── 6. SCROLL ANIMATIONS ──────────────────────────────────────── */

function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-in');

  if (elements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(el => observer.observe(el));
}


/* ─── 7. CLIENT-SIDE FORM VALIDATION ─────────────────────────────── */

function initFormValidation() {
  const individualForm = document.getElementById('form-individual');
  const teamForm = document.getElementById('form-team');

  if (individualForm) {
    individualForm.addEventListener('submit', (e) => {
      if (!validateIndividualForm(individualForm)) {
        e.preventDefault();
      } else {
        const btn = individualForm.querySelector('button[type="submit"]');
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<span class="spinner"></span> Yükleniyor...';
        }
      }
    });
  }

  if (teamForm) {
    teamForm.addEventListener('submit', (e) => {
      if (!validateTeamForm(teamForm)) {
        e.preventDefault();
      } else {
        const btn = teamForm.querySelector('button[type="submit"]');
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<span class="spinner"></span> Yükleniyor...';
        }
      }
    });
  }
}

function validateIndividualForm(form) {
  clearErrors(form);

  const fullName   = form.querySelector('[name="fullName"]');
  const email      = form.querySelector('[name="email"]');
  const password   = form.querySelector('[name="password"]');
  const phone      = form.querySelector('[name="phone"]');
  const university = form.querySelector('[name="university"]');
  const experience = form.querySelector('[name="experienceLevel"]');

  let isValid = true;

  if (!fullName.value.trim() || fullName.value.trim().length < 2) {
    showError(fullName, 'Ad Soyad en az 2 karakter olmalıdır.');
    isValid = false;
  }

  if (!email.value.trim() || !isValidEmail(email.value.trim())) {
    showError(email, 'Geçerli bir e-posta adresi giriniz.');
    isValid = false;
  }



  if (!phone.value.trim() || !isValidPhone(phone.value.trim())) {
    showError(phone, 'Geçerli bir telefon numarası giriniz.');
    isValid = false;
  }

  if (!university.value.trim()) {
    showError(university, 'Üniversite / Okul adı gereklidir.');
    isValid = false;
  }

  if (!experience.value) {
    showError(experience, 'Deneyim seviyesi seçiniz.');
    isValid = false;
  }

  return isValid;
}

function validateTeamForm(form) {
  clearErrors(form);

  const teamName     = form.querySelector('[name="teamName"]');
  const password     = form.querySelector('[name="password"]');
  const captainName  = form.querySelector('[name="captainName"]');
  const captainEmail = form.querySelector('[name="captainEmail"]');
  const captainPhone = form.querySelector('[name="captainPhone"]');
  const university   = form.querySelector('[name="university"]');

  let isValid = true;

  if (!teamName.value.trim() || teamName.value.trim().length < 2) {
    showError(teamName, 'Takım adı en az 2 karakter olmalıdır.');
    isValid = false;
  }



  if (!captainName.value.trim()) {
    showError(captainName, 'Kaptan adı soyadı gereklidir.');
    isValid = false;
  }

  if (!captainEmail.value.trim() || !isValidEmail(captainEmail.value.trim())) {
    showError(captainEmail, 'Geçerli bir e-posta adresi giriniz.');
    isValid = false;
  }

  if (!captainPhone.value.trim() || !isValidPhone(captainPhone.value.trim())) {
    showError(captainPhone, 'Geçerli bir telefon numarası giriniz.');
    isValid = false;
  }

  if (!university.value.trim()) {
    showError(university, 'Üniversite / Okul adı gereklidir.');
    isValid = false;
  }

  return isValid;
}

/* ─── Validation Helpers ─────────────────────────────────────────── */

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^(\+90|0)?5\d{9}$/.test(cleaned);
}

function showError(input, message) {
  input.classList.add('error');
  const errorEl = document.createElement('div');
  errorEl.className = 'form-error';
  errorEl.textContent = message;
  input.parentNode.appendChild(errorEl);
}

function clearErrors(form) {
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  form.querySelectorAll('.form-error').forEach(el => el.remove());
}


/* ─── 8. CRYPTOGRAPHIC THEME TEASER ──────────────────────────────── */

function initThemeTeaser() {
  const display = document.getElementById('theme-display');
  const progress = document.getElementById('theme-progress');
  const progressPct = document.getElementById('theme-progress-pct');

  if (!display) return;

  // Cryptographic character sets for the scramble effect
  const CRYPTO_CHARS = '0123456789ABCDEFabcdef@#$%&*!?<>{}[]|/\\~^+=_-:;';
  const HEX_PREFIXES = ['0x', '\\x', '#', '$$', '>>'];

  // Generate random crypto string
  function randomCryptoString(length) {
    let result = '';
    // Occasionally add hex-like prefixes
    if (Math.random() > 0.6) {
      result += HEX_PREFIXES[Math.floor(Math.random() * HEX_PREFIXES.length)];
      length -= 2;
    }
    for (let i = 0; i < length; i++) {
      result += CRYPTO_CHARS[Math.floor(Math.random() * CRYPTO_CHARS.length)];
    }
    return result;
  }

  // Scramble the display text continuously
  let scrambleInterval = null;
  let progressValue = 0;
  let progressDirection = 1;

  function startScramble() {
    scrambleInterval = setInterval(() => {
      // Generate scrambled text with variable length
      const len = 12 + Math.floor(Math.random() * 6);
      const scrambled = randomCryptoString(len);
      display.textContent = scrambled;
      display.setAttribute('data-text', scrambled);

      // Animate the fake progress bar (oscillates to look alive)
      progressValue += (Math.random() * 3 - 0.5) * progressDirection;

      // Bounce between 5% and 42%
      if (progressValue > 42) { progressDirection = -1; progressValue = 42; }
      if (progressValue < 5) { progressDirection = 1; progressValue = 5; }

      if (progress) {
        progress.style.width = progressValue + '%';
      }
      if (progressPct) {
        progressPct.textContent = Math.round(progressValue) + '%';
      }
    }, 80); // ~12fps for readable scramble effect
  }

  // Start scrambling when the element enters the viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        startScramble();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  observer.observe(display);
}

/**
 * Reveals the actual theme by "decrypting" the display.
 * Call this function when you're ready to announce the theme:
 *   window.revealTheme('YENİ BAŞLANGIÇLAR');
 *
 * It will animate through scrambled text, gradually revealing
 * the real characters from left to right.
 */
window.revealTheme = function(realTheme) {
  const display = document.getElementById('theme-display');
  const card = document.getElementById('theme-teaser');
  const progress = document.getElementById('theme-progress');
  const progressPct = document.getElementById('theme-progress-pct');

  if (!display || !realTheme) return;

  const CRYPTO_CHARS = '0123456789ABCDEFabcdef@#$%&*!?<>{}[]|';
  const theme = realTheme.toUpperCase();
  let revealedCount = 0;

  // Clear any existing scramble
  const decryptInterval = setInterval(() => {
    let output = '';
    for (let i = 0; i < theme.length; i++) {
      if (i < revealedCount) {
        output += theme[i];
      } else {
        output += CRYPTO_CHARS[Math.floor(Math.random() * CRYPTO_CHARS.length)];
      }
    }

    display.textContent = output;
    display.setAttribute('data-text', output);

    // Update progress
    const pct = Math.round((revealedCount / theme.length) * 100);
    if (progress) progress.style.width = pct + '%';
    if (progressPct) progressPct.textContent = pct + '%';

    revealedCount++;

    // Fully revealed
    if (revealedCount > theme.length) {
      clearInterval(decryptInterval);
      display.textContent = theme;
      display.setAttribute('data-text', theme);
      if (card) card.classList.add('decrypted');
      if (progress) progress.style.width = '100%';
      if (progressPct) progressPct.textContent = '100%';
    }
  }, 120); // Reveal one character every 120ms
};


/* ─── Console Branding ───────────────────────────────────────────── */
console.log(
  '%c🎮 Karadeniz Game Jam 2026 %c— Yapımcı: KTÜ Oyun Geliştirme Kulübü',
  'color: #00f0ff; font-size: 16px; font-weight: bold;',
  'color: #a0a0b8; font-size: 12px;'
);
