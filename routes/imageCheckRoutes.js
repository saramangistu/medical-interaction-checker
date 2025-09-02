const express = require('express');
const router = express.Router();
const multer = require('multer');

// --- הגדרת אחסון התמונות ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads'); // ספרייה נגישה לסטטיק
    },
    filename: (req, file, cb) => {
        const extension = file.originalname.substring(file.originalname.lastIndexOf('.'));
        cb(null, Date.now() + extension); // שם קובץ ייחודי
    }
});

const upload = multer({ storage });

// --- קונטרולרים לגרסת EJS ---
const profileImageController = require('../controllers/profileImageController');
const foodImageController = require('../controllers/foodImageController');

// 📌 בדיקת תמונת פרופיל
router.get('/profile', profileImageController.getProfileImagePage); // טופס ריק
router.post('/profile', upload.single('image'), profileImageController.postProfileImageCheck); // עיבוד והצגת תוצאה

// 📌 בדיקת תמונת מזון
router.get('/food', foodImageController.getFoodImagePage); // טופס ריק
router.post('/food', upload.single('image'), foodImageController.postFoodImageCheck); // עיבוד והצגת תוצאה

module.exports = router;