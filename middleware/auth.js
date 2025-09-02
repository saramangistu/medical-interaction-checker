// middleware/auth.js
function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
}

function ensureDoctor(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'doctor') {
        return next();
    }
    res.status(403).send('Access denied');
}

module.exports = { ensureAuthenticated, ensureDoctor };