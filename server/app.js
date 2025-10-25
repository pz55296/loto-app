const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const { auth } = require('express-openid-connect');

const ticketRoutes = require('./routes/tickets');
const roundRoutes = require('./routes/rounds');
const { Round, Ticket, sequelize } = require('./models');

const app = express();

app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const IS_HTTPS = (process.env.BASE_URL || '').startsWith('https://');

app.use(auth({
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  authorizationParams: {
    response_type: 'code',
    response_mode: 'query'
  },
  session: {
    cookie: {
      sameSite: 'Lax',       
      secure: IS_HTTPS     
    }
  }
}));

console.log('OIDC cfg:', {
  issuer: process.env.AUTH0_ISSUER_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  hasClientSecret: !!process.env.AUTH0_CLIENT_SECRET,
  baseURL: process.env.BASE_URL
});

app.use((req, res, next) => {
  res.locals.currentUser = (req.oidc && req.oidc.isAuthenticated()) ? req.oidc.user : null;
  next();
});

app.use('/', ticketRoutes);
app.use('/', roundRoutes);

app.get('/', async (req, res) => {
  try {
    const round = await Round.findOne({ where: { active: true } });
    const ticketsCount = round ? await Ticket.count({ where: { roundId: round.id } }) : 0;
    res.render('index', { round, ticketsCount, currentUser: res.locals.currentUser });
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška na serveru');
  }
});

app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'invalid_token', message: err.message });
  }
  next(err);
});

const PORT = process.env.PORT || 3000;
sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
