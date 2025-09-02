// routes/doctorRoutes.js
const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { ensureAuthenticated, ensureDoctor } = require('../middleware/auth');
const upload = require('../middleware/upload'); // ⬅️ שימוש במידלוור הקיים

// --- מוגן: רק רופא מחובר ---
router.get('/panel', ensureAuthenticated, ensureDoctor, doctorController.getDoctorPanel);

router.get('/panel/add-patient', ensureAuthenticated, ensureDoctor, doctorController.getAddPatient);

// ⬅️ כאן מוסיפים upload.single('profileImage') כדי שגם body וגם הקובץ יעברו נכון
router.post(
  '/panel/add-patient',
  ensureAuthenticated,
  ensureDoctor,
  upload.single('profileImage'),
  doctorController.createPatient
);

router.get('/panel/patient/:id', ensureAuthenticated, ensureDoctor, doctorController.getPatientDetails);

router.get('/panel/patient/:id/edit', ensureAuthenticated, ensureDoctor, doctorController.getEditPatient);

// אם רוצים לאפשר עדכון תמונה גם כאן, מוסיפים אותו:
router.post(
  '/panel/patient/:id/edit',
  ensureAuthenticated,
  ensureDoctor,
  upload.single('profileImage'),
  doctorController.updatePatient
);

// --- מחיקת מטופל ---
router.post('/panel/patient/:id/delete', ensureAuthenticated, ensureDoctor, doctorController.deletePatient);

module.exports = router;