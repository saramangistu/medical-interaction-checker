// routes/accountRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // Middleware להעלאת קבצים
const { 
    renderAccountPage, 
    getAccountData, 
    updateAccount, 
    deleteAccount   // ✅ חדש
} = require('../controllers/accountController');

// 📌 רינדור עמוד החשבון (EJS)
router.get('/', renderAccountPage);

// 📌 קבלת פרטי החשבון כ-JSON (ל-AJAX אם נרצה)
router.get('/data', getAccountData);

// 📌 עדכון חשבון (כולל העלאת תמונת פרופיל)
router.post('/', upload.single('profileImage'), updateAccount);

// 📌 מחיקת חשבון עצמי (רק למטופל)
router.post('/delete', deleteAccount);   // ✅ חדש

module.exports = router;