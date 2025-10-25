const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const ISSUER = process.env.AUTH0_ISSUER_BASE_URL.endsWith('/')
    ? process.env.AUTH0_ISSUER_BASE_URL
    : process.env.AUTH0_ISSUER_BASE_URL + '/';

const AUDIENCE = process.env.AUTH0_AUDIENCE;

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        jwksUri: `${ISSUER}.well-known/jwks.json`,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10
    }),
    audience: AUDIENCE,
    issuer: ISSUER,
    algorithms: ['RS256']
});

function requireM2M(scopeNeeded) {
    return [
        checkJwt,
        (req, res, next) => {
            if (!scopeNeeded) return next();
            const scopes = ((req.auth && req.auth.scope) || '').split(' ').filter(Boolean);
            if (!scopes.includes(scopeNeeded)) return res.sendStatus(403);
            next();
        }
    ];
}

module.exports = { requireM2M };
