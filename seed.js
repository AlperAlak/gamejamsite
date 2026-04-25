/**
 * ═══════════════════════════════════════════════════════════════════
 *  Karadeniz Game Jam 2026 — Mock Data Generator (Seed Script)
 * ═══════════════════════════════════════════════════════════════════
 *  Usage:
 *  - node seed.js 50          -> Adds 50 mock people (mix of indiv/teams)
 *  - node seed.js --clear     -> Wipes all participant/team data
 *  - node seed.js             -> Default: Adds 10 mock people
 * ═══════════════════════════════════════════════════════════════════
 */

const dbModule = require('./config/db');

// --- Static Data ---
const schedule = [
  { day: 'Friday', time: '13:00', title: 'Başlangıç ve Tanışma', description: 'Cuma günü başlangıcı' },
  { day: 'Friday', time: '14:30', title: 'Konuşmalar', description: 'Bilgilendirmeler' },
  { day: 'Friday', time: '15:00', title: 'Belge Dağıtımı ve Konu Açıklanması', description: '' },
  { day: 'Friday', time: '15:30', title: 'Etkinlik Başlama Saati', description: 'The Great Start' },
  { day: 'Friday', time: '18:30', title: 'Yemek Dağıtımı', description: '' },
  { day: 'Friday', time: '19:30', title: 'Ödüllü Kahoot', description: '' },
  { day: 'Friday', time: '01:00', title: 'Atıştırmalık Dağıtımı', description: '' },
  { day: 'Saturday', time: '08:00', title: 'Kahvaltı', description: '' },
  { day: 'Saturday', time: '10:00', title: 'Sanal Oyun Turnuvası', description: 'Topluluk Seçimi' },
  { day: 'Saturday', time: '13:00', title: 'Öğle Yemeği', description: '' },
  { day: 'Saturday', time: '16:00', title: 'Fiziksel Oyun Turnuvası', description: '' },
  { day: 'Saturday', time: '19:00', title: 'Akşam Yemeği', description: '' },
  { day: 'Saturday', time: '01:00', title: 'Gece Atıştırmalığı', description: '' },
  { day: 'Sunday', time: '08:00', title: 'Kahvaltı', description: '' },
  { day: 'Sunday', time: '13:00', title: 'Öğle Yemeği', description: '' },
  { day: 'Sunday', time: '15:30', title: 'Oyunların Değerlendirilmesi & Etkileşim', description: '' },
  { day: 'Sunday', time: '21:00', title: 'Büyük Ödül Töreni & Kapanış', description: '' }
];

const firstNames = ['Alper', 'Burak', 'Cansu', 'Deniz', 'Emre', 'Fatma', 'Gizem', 'Hakan', 'Ilgın', 'Jale', 'Kaan', 'Lale', 'Mert', 'Nil', 'Okan', 'Pelin'];
const lastNames  = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Yıldız', 'Öztürk', 'Aydın', 'Özkan', 'Arslan', 'Doğan', 'Kılıç', 'Aslan'];
const universities = ['KTÜ', 'Trabzon Üniversitesi', 'Avrasya Üniversitesi', 'Gümüşhane Üniversitesi', 'Giresun Üniversitesi'];

// --- Helper Functions ---
function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function generatePhone() { return '05' + Math.floor(100000000 + Math.random() * 900000000); }

async function clearData(db) {
  console.log('🧹 Clearing all participant and team data...');
  await db.prepare('TRUNCATE TABLE team_members, teams, participants RESTART IDENTITY CASCADE').run([]);
  console.log('✅ Database wiped clean.');
}

async function seedSystemData(db) {
  console.log('⚙️ Seeding system settings and schedule...');
  
  // Schedule
  await db.prepare('CREATE TABLE IF NOT EXISTS schedule (id SERIAL PRIMARY KEY, day VARCHAR(50), time VARCHAR(10), title VARCHAR(255), description TEXT)').run([]);
  await db.prepare('DELETE FROM schedule').run([]);
  for (const item of schedule) {
    await db.prepare('INSERT INTO schedule (day, time, title, description) VALUES ($1, $2, $3, $4)')
      .run([item.day, item.time, item.title, item.description]);
  }

  // Settings
  await db.prepare("INSERT INTO system_settings (key, value) VALUES ('event_date', '15-16-17 Mayıs 2026') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value").run([]);
  await db.prepare("INSERT INTO system_settings (key, value) VALUES ('event_location', 'Akçaabat Kültür Merkezi') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value").run([]);
}

async function main() {
  const args = process.argv.slice(2);
  const db = await dbModule.getDb();
  
  try {
    // 1. Check for --clear flag
    if (args.includes('--clear')) {
      await clearData(db);
      process.exit(0);
    }

    // 2. Parse target count
    let targetCount = parseInt(args[0], 10);
    if (isNaN(targetCount)) targetCount = 10;

    console.log(`🚀 Generating mock data for ~${targetCount} people...`);

    // Ensure system data is there
    await seedSystemData(db);

    let currentPeople = 0;
    let participantCount = 0;
    let teamCount = 0;

    while (currentPeople < targetCount) {
      const isTeam = Math.random() > 0.6; // 40% chance of being a team

      if (isTeam && (targetCount - currentPeople) >= 2) {
        // Create a Team
        const memberCount = Math.min(Math.floor(Math.random() * 4) + 2, targetCount - currentPeople); // 2-5 members
        const teamName = `Team ${Math.random().toString(36).substring(7).toUpperCase()}`;
        const captainName = `${getRandom(firstNames)} ${getRandom(lastNames)}`;
        const captainEmail = `captain_${Math.random().toString(36).substring(7)}@test.com`;
        
        const teamResult = await db.prepare(`
          INSERT INTO teams (team_name, captain_name, captain_email, captain_phone, university, member_count, status, ip_address)
          VALUES ($1, $2, $3, $4, $5, $6, 'approved', '127.0.0.1')
          RETURNING id
        `).get([teamName, captainName, captainEmail, generatePhone(), getRandom(universities), memberCount]);

        const teamId = teamResult.id;

        // Add members
        for (let i = 0; i < memberCount - 1; i++) {
          await db.prepare('INSERT INTO team_members (team_id, full_name, email) VALUES ($1, $2, $3)')
            .run([teamId, `${getRandom(firstNames)} ${getRandom(lastNames)}`, `member_${Math.random().toString(36).substring(7)}@test.com`]);
        }

        currentPeople += memberCount;
        teamCount++;
      } else {
        // Create Individual Participant
        const name = `${getRandom(firstNames)} ${getRandom(lastNames)}`;
        const email = `user_${Math.random().toString(36).substring(7)}@test.com`;
        
        await db.prepare(`
          INSERT INTO participants (full_name, email, phone, university, status, ip_address)
          VALUES ($1, $2, $3, $4, 'approved', '127.0.0.1')
        `).run([name, email, generatePhone(), getRandom(universities)]);

        currentPeople++;
        participantCount++;
      }
    }

    // Final Report
    const occupancy = Math.min((currentPeople / 100) * 100, 100).toFixed(1);
    console.log('\n' + '═'.repeat(50));
    console.log(`✅ İŞLEM TAMAMLANDI PATRON!`);
    console.log(`📊 Rapor:`);
    console.log(`👤 Bireysel Katılımcı: ${participantCount}`);
    console.log(`👥 Takım Sayısı: ${teamCount}`);
    console.log(`🔥 Toplam İnsan: ${currentPeople}`);
    console.log(`📈 Admin Panel Doluluk Oranı: %${occupancy}`);
    console.log('═'.repeat(50) + '\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Generator failed:', err);
    process.exit(1);
  }
}

main();