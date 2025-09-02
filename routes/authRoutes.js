const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    postRegisterPatient,
    postRegisterDoctor,
    postLogin,
    logout,
    getCurrentUser,
    validateProfileImage // ✅ הוספנו את הפונקציה מהקונטרולר
} = require('../controllers/authController');

// 📌 הגדרת multer לשמירת תמונות
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads'); // תיקייה לשמירת תמונות
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// 📄 טפסי רישום/התחברות
router.get('/register-patient', (req, res) => {
    res.render('pages/registerPatient', { error: null, success: null, user: req.session.user || null });
});

router.get('/register-doctor', (req, res) => {
    res.render('pages/registerDoctor', { error: null, success: null, user: req.session.user || null });
});

router.get('/login', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/'); // אם כבר מחובר – שלח לעמוד הבית
    }
    res.render('pages/login', { error: null, success: null, user: null });
});

// 📌 רישום מטופל חדש (כולל העלאת תמונה)
router.post('/register-patient', upload.single('profileImage'), postRegisterPatient);

// 📌 רישום רופא חדש (כולל העלאת תמונה)
router.post('/register-doctor', upload.single('profileImage'), postRegisterDoctor);

// 📌 התחברות (גם למטופלים וגם לרופאים)
router.post('/login', postLogin);

// 📌 התנתקות
router.get('/logout', logout);

// 📌 קבלת פרטי המשתמש המחובר (API JSON בלבד)
router.get('/current', getCurrentUser);

// 📌 בדיקה מיידית של תמונת פרופיל (AJAX)
router.post('/validate-image', upload.single('profileImage'), validateProfileImage);

module.exports = router;