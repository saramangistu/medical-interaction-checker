const express = require('express');
const router = express.Router();
const { getDrugCheckPage, postDrugCheck } = require('../controllers/drugCheckController');

// טופס בדיקת אינטראקציה (GET)
router.get('/form', getDrugCheckPage);

// שליחת נתונים ובדיקת אינטראקציה (POST)
router.post('/check', postDrugCheck);

module.exports = router;