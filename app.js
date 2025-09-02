// ===== Dependencies =====
const express = require('express');
const session = require('express-session');
const connectDB = require('./config/db');
const { ensureAuthenticated, ensureDoctor } = require('./middleware/auth');

const app = express();

// ===== DB connection =====
connectDB();

// ===== View engine (EJS) =====
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(__dirname + '/public'));

// Session management
app.use(session({
    secret: process.env.SESSION_SECRET || 'mysecret', // לשים ENV בפרודקשן
    resave: false,
    saveUninitialized: false
}));

// ===== Routes =====
const authRoutes = require('./routes/authRoutes');
const drugCheckRoutes = require('./routes/drugCheckRoutes');
const imageCheckRoutes = require('./routes/imageCheckRoutes');
const accountRoutes = require('./routes/accountRoutes');
const doctorRoutes = require('./routes/doctorRoutes');

// ===== Public pages (ללא אימות) =====
app.get('/login', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/'); // אם כבר מחובר – שלח לעמוד הבית
    }
    res.render('pages/login', { user: null });
});

app.get('/register', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/');
    }
    res.render('pages/register', { user: null });
});

// Authentication API
app.use('/auth', authRoutes);

// ===== Protected routes =====
app.use('/drug-check', ensureAuthenticated, drugCheckRoutes);
app.use('/image-check', ensureAuthenticated, imageCheckRoutes); // ✅ לא חוסם "/"
app.use('/account', ensureAuthenticated, accountRoutes);

// ===== Home page =====
app.get('/', ensureAuthenticated, (req, res) => {
    res.render('pages/home', { user: req.session?.user || null });
});

// מסלולים לרופאים בלבד (אחרי דף הבית כדי לא לחסום אותו)
app.use('/doctor', ensureAuthenticated, ensureDoctor, doctorRoutes);

// ===== Start server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));