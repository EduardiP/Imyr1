// db.js — krijimi/migrimi i tabelave (i ndare nga server.js)
// Eksporton initDB(pool). Server.js e therret nje here ne nisje.

// --- Krijimi i tabelave ---
async function initDB(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bizneset (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT now(),
      emri TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      fjalekalimi TEXT,                -- i hash-uar (bcrypt); NULL nese hyri me Google
      kategoria TEXT,                  -- kategoria e biznesit
      plani TEXT DEFAULT 'falas',      -- falas | plan1 | plan2 ...
      website TEXT,                    -- faqja e biznesit
      celes TEXT UNIQUE                -- celesi unik per snippet-in
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS promovimet (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT now(),
      biznes_id INT REFERENCES bizneset(id) ON DELETE CASCADE,
      titulli TEXT,
      teksti TEXT,
      imazh_url TEXT,
      link TEXT,
      aktiv BOOLEAN DEFAULT true
    );
  `);
  // Seanca (per te mbajtur perdoruesin te loguar)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seancat (
      token TEXT PRIMARY KEY,
      biznes_id INT REFERENCES bizneset(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  // Seanca admin (paneli yt)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_seancat (
      token TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  // --- Faza 2: kolona shtese per lidhjen/gjurmimin (shtohen vetem nese s'ekzistojne) ---
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS snippet_active BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS origjina TEXT`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS kandidat_url TEXT`);
  // Analiza AI (kategorizimi + permbledhja per algoritmin)
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS pershkrimi TEXT`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS lejo_analize BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS kategoria_kryesore TEXT`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS nenkategorite TEXT`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS permbledhje TEXT`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS tipi TEXT`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS logo_url TEXT`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS madhesia_desktop TEXT DEFAULT '188x214'`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS madhesia_mobile TEXT`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS pozicioni_reklames TEXT DEFAULT 'qender'`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS pranoi_kushtet BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS pranoi_oferta BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS pranoi_kushtet_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE bizneset ALTER COLUMN fjalekalimi DROP NOT NULL`).catch(()=>{});
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS url_konvertimi TEXT`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS track_active BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS track_seen_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE bizneset ADD COLUMN IF NOT EXISTS track_url TEXT`);

  // Ngjarjet (shfaqje/klikime) — per gjurmimin
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ngjarjet (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT now(),
      biznes_id INT REFERENCES bizneset(id) ON DELETE CASCADE,
      lloji TEXT,        -- 'view' | 'click'
      origjina TEXT
    );
  `);
  // Atribuimi: cila reklame u shfaq dhe e kujt eshte (reklamuesi)
  await pool.query(`ALTER TABLE ngjarjet ADD COLUMN IF NOT EXISTS reklama_id INT`);
  await pool.query(`ALTER TABLE ngjarjet ADD COLUMN IF NOT EXISTS reklamues_id INT`);
  // Gjurmimi i konvertimit: kodi qe lidh klikimin me konvertimin
  await pool.query(`ALTER TABLE ngjarjet ADD COLUMN IF NOT EXISTS klik_kod TEXT`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ngjarjet_klik_kod ON ngjarjet (klik_kod)`);

  console.log('DB gati.');
}

module.exports = { initDB };
