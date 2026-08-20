// pamje-perkohshme.js — Link i PERKOHSHEM per te par permbajtjen e loguar (p.sh. per
// screenshot drejt Figma), PA prekur kurrsesi logjiken ekzistuese te login-it/iLoguar.
//
// SI FUNKSIONON: krijon nje SEANCE REALE (i njejti mekanizem si login-i normal — nje
// rresht i ri te tabela `seancat`), thjesht e nis automatikisht permes nje "sekreti"
// qe VETEM TI e di (env var, jo i koduar askund ne kod).
//
// SIGURIA:
// - Kerkon env var PAMJE_SEKRETI (nje varg i gjate rastesor qe e cakton VETE ti).
//   Pa te, route-i kthen 404 (mos ekziston fare, sikur s'ka route te tille).
// - Sesioni qe krijon skadon pas 2 oresh (jo 30 dite si login-i normal).
// - HIQE PLOTESISHT sapo te mbarosh me te: fshi rreshtin require() te server.js
//   (ose thjesht hiq env var-in PAMJE_SEKRETI te Railway) — s'eshte per perdorim
//   te vazhdueshem, vetem per raste te tilla (p.sh. Figma screenshot).
//
// PERDORIMI:
//   1) Shto env var PAMJE_SEKRETI te Railway — nje varg i gjate rastesor (p.sh. 32+ shenja).
//   2) Hap ne browser: https://phronexusai.com/pamje/<PAMJE_SEKRETI>?biznes=Matje
//      (zevendeso "Matje" me emrin e sakte te biznesit qe do te shohesh)
//   3) Kjo te loguan automatikisht (2 ore) dhe te ridrejton te faqja kryesore.
//   4) Kur te mbarosh, HIQE (shih SIGURIA me lart).

const crypto = require('crypto');

module.exports = function (app, pool) {
  app.get('/pamje/:sekret', async (req, res) => {
    const sekretPritur = process.env.PAMJE_SEKRETI;
    if (!sekretPritur) return res.status(404).send("S'ekziston.");
    if (req.params.sekret !== sekretPritur) return res.status(404).send("S'ekziston.");

    const emriBiznesit = (req.query.biznes || '').trim();
    if (!emriBiznesit) return res.status(400).send('Shto ?biznes=EmriISakte te URL.');

    try {
      const b = await pool.query('SELECT id FROM bizneset WHERE emri=$1 LIMIT 1', [emriBiznesit]);
      if (!b.rows.length) return res.status(404).send("S'u gjet biznes me këtë emër.");
      const bizId = b.rows[0].id;

      const token = crypto.randomBytes(24).toString('hex');
      await pool.query('INSERT INTO seancat (token, biznes_id) VALUES ($1,$2)', [token, bizId]);
      // Sesion i SHKURTER (2 ore) — ndryshe nga 30 dite e login-it normal, per siguri shtese.
      res.cookie('imyr_session', token, { httpOnly: true, sameSite: 'lax', maxAge: 2 * 60 * 60 * 1000 });
      res.redirect('/');
    } catch (e) { res.status(500).send('Gabim: ' + e.message); }
  });
};
