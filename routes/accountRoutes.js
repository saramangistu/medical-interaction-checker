// routes/accountRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // Middleware להעלאת קבצים
const { 
    renderAccountPage, 
    getAccountData, 
    updateAccount, 
    deleteAccount
} = require('../controllers/accountController');

// 📌 רינדור עמוד החשבון (EJS)
router.get('/', renderAccountPage);

// 📌 קבלת פרטי החשבון כ-JSON (ל-AJAX אם נרצה)
router.get('/data', getAccountData);

// 📌 עדכון חשבון (כולל העלאת תמונת פרופיל)
router.post(
    '/',
    upload.single('profileImage'),
    (req, res, next) => {
        if (req.fileValidationError) {
            return res.render('pages/account', {
                user: req.session.user || null,
                error: req.fileValidationError
            });
        }
        next();
    },
    updateAccount
);

// 📌 מחיקת חשבון עצמי (רק למטופל)
router.post('/delete', deleteAccount);

module.exports = router;