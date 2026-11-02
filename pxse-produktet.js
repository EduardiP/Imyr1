// pxse-produktet.js — faqet publike te produkteve.
// /products      -> lista e produkteve (public/pxse-products.html)
// /transcription -> faqja e sherbimit te transkriptimit (public/pxse-transcription.html)
// Per nje produkt te ri: shto nje karte te pxse-products.html (dhe, nese ka faqe te vet, nje rresht ketu).
const path = require('path');

module.exports = function (app) {
  const dir = path.join(__dirname, 'public');
  app.get('/products', (req, res) => res.sendFile(path.join(dir, 'pxse-products.html')));
  app.get('/transcription', (req, res) => res.sendFile(path.join(dir, 'pxse-transcription.html')));
};
