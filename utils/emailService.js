const nodemailer = require('nodemailer');

/**
 * ═══════════════════════════════════════════════════════════════════
 *  Email Service — Automated notifications for Karadeniz Game Jam
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Provides methods to send registration and status update emails.
 *  Wrapped in try/catch to ensure SMTP failures do not crash the app.
 * ═══════════════════════════════════════════════════════════════════
 */

// Configure SMTP Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send a generic email with error handling.
 */
async function sendEmail({ to, subject, html }) {
  try {
    // Skip if credentials aren't provided (useful for local dev)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn(`[EMAIL] ⚠️ SMTP credentials missing. Skipping email to: ${to}`);
      return;
    }

    const info = await transporter.sendMail({
      from: `"Karadeniz Game Jam 2026" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });

    console.log(`[EMAIL] ✅ Email sent: ${info.messageId} to ${to}`);
  } catch (error) {
    console.error(`[EMAIL] ❌ Failed to send email to ${to}:`, error.message);
    // CRITICAL: We do NOT throw the error, ensuring the calling logic proceeds.
  }
}

/**
 * Trigger 1: Registration Received
 */
exports.sendRegistrationConfirmation = async (to, name) => {
  const subject = 'Kayıt Talebiniz Alındı | Karadeniz Game Jam 2026';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #00416A;">Merhaba ${name},</h2>
      <p>Karadeniz Game Jam 2026 başvurunuz başarıyla alındı! Kayıt talebiniz şu an değerlendirme aşamasındadır.</p>
      <p>Başvurunuz onaylandığında veya ek bilgiye ihtiyaç duyulduğunda size tekrar e-posta göndereceğiz.</p>
      <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>Katılmak için sabırsızlanıyoruz!</strong><br>
        Güncel duyurular için bizi takip etmeyi unutma.
      </div>
      <p>Soruların olursa bu e-postaya yanıt vererek bize ulaşabilirsin.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 0.8rem; color: #999;">Karadeniz Game Jam Organizasyon Ekibi</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
};

/**
 * Trigger 2: Application Approved
 */
exports.sendApprovalEmail = async (to, name) => {
  const subject = 'Başvurunuz Onaylandı! 🎉 | Karadeniz Game Jam 2026';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #008000;">Tebrikler ${name}!</h2>
      <p>Karadeniz Game Jam 2026 başvurunuz <strong>ONAYLANDI</strong>. Jam alanında seni görmek için sabırsızlanıyoruz!</p>
      <p>Jam süreci ve diğer detaylar hakkında yakında daha fazla bilgi paylaşacağız.</p>
      <p>Gelişmelerden anında haberdar olmak için WhatsApp topluluğumuza katılmayı unutma:</p>
      <a href="${process.env.WHATSAPP_LINK || '#'}" style="display: inline-block; padding: 10px 20px; background: #25D366; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">WhatsApp Topluluğuna Katıl</a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 0.8rem; color: #999;">Karadeniz Game Jam Organizasyon Ekibi</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
};

/**
 * Trigger 3: Application Rejected
 */
exports.sendRejectionEmail = async (to, name) => {
  const subject = 'Başvurunuz Hakkında Bilgilendirme | Karadeniz Game Jam 2026';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #800000;">Merhaba ${name},</h2>
      <p>Karadeniz Game Jam 2026 başvurunuzu üzülerek şu aşamada onaylayamadığımızı bildirmek istiyoruz.</p>
      <p>Kontenjan sınırlılığı ve değerlendirme kriterlerimiz gereği bu jam için katılımın mümkün olmamıştır. İlginiz için teşekkür eder, sonraki etkinliklerimizde görüşmeyi dileriz.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 0.8rem; color: #999;">Karadeniz Game Jam Organizasyon Ekibi</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
};
