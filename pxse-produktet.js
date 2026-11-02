// pxse-produktet.js — faqet publike te aplikacioneve.
// /apps          -> lista e aplikacioneve (public/pxse-apps.html)
// /transcription -> faqja e sherbimit te transkriptimit (public/pxse-transcription.html)
// /products      -> ridrejtim i perhershem te /apps (adresa e vjeter)
// Per nje aplikacion te ri: shto nje karte te pxse-apps.html (dhe, nese ka faqe te vet, nje rresht ketu).
const path = require('path');

module.exports = function (app) {
  const dir = path.join(__dirname, 'public');
  app.get('/apps', (req, res) => res.sendFile(path.join(dir, 'pxse-apps.html')));
  app.get('/transcription', (req, res) => res.sendFile(path.join(dir, 'pxse-transcription.html')));
  app.get('/products', (req, res) => res.redirect(301, '/apps'));
};
