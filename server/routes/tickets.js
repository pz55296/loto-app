const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect');
const { Ticket, Round } = require('../models');
const { validatePersonalId, validateNumbers } = require('../utils/validators');
const QRCode = require('qrcode');

router.get('/tickets/new', requiresAuth(), async (req, res) => {
  const round = await Round.findOne({ where: { active: true } });
  if (!round) return res.send('Nema aktivnog kola.');
  res.render('ticket_form', { roundId: round.id });
});

router.post('/tickets', requiresAuth(), async (req, res) => {
  try {
    const { personal_id, numbers } = req.body || {};

    const round = await Round.findOne({ where: { active: true } });
    if (!round) return res.status(400).send('Uplate nisu aktivne.');

    if (!validatePersonalId(personal_id)) {
      return res.status(400).send('Neispravna osobna iskaznica/putovnica (1–20 znakova).');
    }

    let parsedNumbers;
    if (Array.isArray(numbers)) {
      parsedNumbers = numbers.map(n => parseInt(String(n).trim(), 10));
    } else if (typeof numbers === 'string') {
      parsedNumbers = numbers.split(',').map(n => parseInt(n.trim(), 10));
    } else {
      return res.status(400).send('Neispravni brojevi.');
    }

    if (!validateNumbers(parsedNumbers)) {
      return res.status(400).send('Neispravni brojevi (6–10 jedinstvenih iz raspona 1–45).');
    }

    const ticket = await Ticket.create({
      personal_id,
      numbers: parsedNumbers,
      roundId: round.id
    });

    const fromForm = req.is('application/x-www-form-urlencoded');
    const wantsHtml = req.accepts(['html', 'png', 'json']) === 'html';
    if (fromForm || wantsHtml) {
      return res.redirect(303, `/ticket/${ticket.id}`);
    }

    const BASE = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const qrUrl = `${BASE}/ticket/${ticket.id}`;

    const pngBuffer = await QRCode.toBuffer(qrUrl, { type: 'png', margin: 1, scale: 4 });
    res.set('Content-Type', 'image/png');
    return res.status(200).send(pngBuffer);

  } catch (err) {
    console.error(err);
    return res.status(500).send('Greška na serveru.');
  }
});

router.get('/ticket/:uuid', async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.uuid, { include: Round });
    if (!ticket) return res.status(404).send('Listić ne postoji.');

    res.render('ticket', {
      ticket,
      drawn_numbers: ticket.Round?.drawn_numbers || []
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška na serveru.');
  }
});

router.get('/ticket/:uuid/qr.png', async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.uuid, { include: Round });
    if (!ticket) return res.status(404).send('Listić ne postoji.');

    const qrUrl = `${req.protocol}://${req.get('host')}/ticket/${ticket.id}`;
    const pngBuffer = await QRCode.toBuffer(qrUrl, { type: 'png', margin: 1, scale: 4 });

    res.set('Content-Type', 'image/png');
    res.status(200).send(pngBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška na serveru.');
  }
});

module.exports = router;
