const express = require('express');
const router = express.Router();
const { Round } = require('../models');
const { requireM2M } = require('../utils/m2mAuth');


// helperi
async function getActiveRound() {
  return Round.findOne({ where: { active: true }, order: [['createdAt', 'DESC']] });
}
async function getLastClosedRoundWithoutResults() {
  return Round.findOne({
    where: { active: false, drawn_numbers: null },
    order: [['createdAt', 'DESC']]
  });
}

router.post('/new-round', requireM2M(), async (req, res) => {
  try {
    const active = await getActiveRound();
    if (active) return res.sendStatus(204);
    await Round.create({ active: true });
    return res.sendStatus(204);
  } catch (e) {
    console.error(e);
    return res.sendStatus(500);
  }
});

router.post('/close', requireM2M(), async (req, res) => {
  try {
    const active = await getActiveRound();
    if (!active) return res.sendStatus(204); 
    active.active = false;
    active.closedAt = new Date();
    await active.save();
    return res.sendStatus(204);
  } catch (e) {
    console.error(e);
    return res.sendStatus(500);
  }
});

router.post('/store-results', requireM2M(), async (req, res) => {
  try {
    const { numbers } = req.body || {};

    const active = await getActiveRound();
    if (active) return res.sendStatus(400);

    const round = await getLastClosedRoundWithoutResults();
    if (!round) return res.sendStatus(400);

    round.drawn_numbers = numbers;
    await round.save();
    return res.sendStatus(204);
  } catch (e) {
    console.error(e);
    return res.sendStatus(500);
  }
});

module.exports = router;
