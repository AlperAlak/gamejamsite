const dbModule = require('./config/db');

const schedule = [
  // Day 1
  { day: 'Friday', time: '13:00', title: 'Başlangıç ve Tanışma', description: 'Cuma günü başlangıcı' },
  { day: 'Friday', time: '14:30', title: 'Konuşmalar', description: 'Bilgilendirmeler' },
  { day: 'Friday', time: '15:00', title: 'Belge Dağıtımı ve Konu Açıklanması', description: '' },
  { day: 'Friday', time: '15:30', title: 'Etkinlik Başlama Saati', description: 'The Great Start' },
  { day: 'Friday', time: '18:30', title: 'Yemek Dağıtımı', description: '' },
  { day: 'Friday', time: '19:30', title: 'Ödüllü Kahoot', description: '' },
  { day: 'Friday', time: '01:00', title: 'Atıştırmalık Dağıtımı', description: '' },
  // Day 2
  { day: 'Saturday', time: '08:00', title: 'Kahvaltı', description: '' },
  { day: 'Saturday', time: '10:00', title: 'Sanal Oyun Turnuvası', description: 'Topluluk Seçimi' },
  { day: 'Saturday', time: '13:00', title: 'Öğle Yemeği', description: '' },
  { day: 'Saturday', time: '16:00', title: 'Fiziksel Oyun Turnuvası', description: '' },
  { day: 'Saturday', time: '19:00', title: 'Akşam Yemeği', description: '' },
  { day: 'Saturday', time: '01:00', title: 'Gece Atıştırmalığı', description: '' },
  // Day 3
  { day: 'Sunday', time: '08:00', title: 'Kahvaltı', description: '' },
  { day: 'Sunday', time: '13:00', title: 'Öğle Yemeği', description: '' },
  { day: 'Sunday', time: '15:30', title: 'Oyunların Değerlendirilmesi & Etkileşim', description: '' },
  { day: 'Sunday', time: '21:00', title: 'Büyük Ödül Töreni & Kapanış', description: '' }
];

async function seed() {
  console.log('🌱 Starting DB seed process...');
  try {
    const db = await dbModule.getDb();

    console.log('Creating schedule table...');
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS schedule (
        id SERIAL PRIMARY KEY,
        day VARCHAR(50),
        time VARCHAR(10),
        title VARCHAR(255),
        description TEXT
      )
    `).run([]);

    console.log('Clearing old schedule...');
    await db.prepare('DELETE FROM schedule').run([]);

    console.log('Inserting Schedule Data...');
    for (const item of schedule) {
      await db.prepare('INSERT INTO schedule (day, time, title, description) VALUES ($1, $2, $3, $4)')
        .run([item.day, item.time, item.title, item.description]);
    }

    console.log('Updating system_settings with Event Info...');
    await db.prepare('INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value')
      .run(['event_date', '15-16-17 May 2026']);
    
    await db.prepare('INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value')
      .run(['event_location', 'Akçaabat Kültür Merkezi']);

    console.log('✅ BÜTÜN VERİLER BAŞARIYLA EKLENDİ PATRON!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();