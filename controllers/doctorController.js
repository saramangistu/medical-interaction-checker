// controllers/doctorController.js
const User = require('../models/userModel');
const bcrypt = require('bcrypt');

// ================== פאנל רופא ==================
exports.getDoctorPanel = async (req, res) => {
    try {
        const patients = await User.find({ role: 'patient' });
        res.render('pages/doctorPanel', { patients, user: req.session.user || null });
    } catch (err) {
        console.error(err);
        res.render('pages/error', {
            error: 'Failed to load doctor panel',
            user: req.session.user || null
        });
    }
};

// ================== טופס הוספת מטופל ==================
exports.getAddPatient = (req, res) => {
    res.render('pages/addPatient', { user: req.session.user || null });
};

// ================== טופס עריכת מטופל ==================
exports.getEditPatient = async (req, res) => {
    try {
        const patient = await User.findById(req.params.id);
        if (!patient) {
            return res.render('pages/error', {
                error: 'Patient not found',
                user: req.session.user || null
            });
        }
        res.render('pages/editPatient', { patient, user: req.session.user || null });
    } catch (err) {
        console.error(err);
        res.render('pages/error', {
            error: 'Error fetching patient',
            user: req.session.user || null
        });
    }
};

// ================== הצגת מטופל לפי ID ==================
exports.getPatientById = async (req, res) => {
    try {
        const patient = await User.findById(req.params.id);
        if (!patient) {
            return res.render('pages/error', {
                error: 'Patient not found',
                user: req.session.user || null
            });
        }
        res.render('pages/patientDetails', { patient, user: req.session.user || null });
    } catch (err) {
        console.error(err);
        res.render('pages/error', {
            error: 'Failed to fetch patient',
            user: req.session.user || null
        });
    }
};

// ================== דף פרטי מטופל ==================
exports.getPatientDetails = async (req, res) => {
    try {
        const patient = await User.findById(req.params.id);
        if (!patient) {
            return res.render('pages/error', {
                error: 'Patient not found',
                user: req.session.user || null
            });
        }
        res.render('pages/patientDetails', { patient, user: req.session.user || null });
    } catch (err) {
        console.error(err);
        res.render('pages/error', {
            error: 'Failed to load patient details',
            user: req.session.user || null
        });
    }
};

// ================== יצירת מטופל חדש ==================
exports.createPatient = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            username,
            password,
            birthDate,
            gender,
            pregnant,
            breastfeeding,
            medicalConditions,
            currentMedications,
            email,
            phone
        } = req.body;

        // הצפנת סיסמה
        const hashedPassword = await bcrypt.hash(password, 10);

        // פיצול רשימות למערכים
        const medicalArr = medicalConditions
            ? medicalConditions.split(',').map(s => s.trim()).filter(Boolean)
            : [];
        const medsArr = currentMedications
            ? currentMedications.split(',').map(s => s.trim()).filter(Boolean)
            : [];

        // בניית אובייקט מטופל
        const newPatient = new User({
            firstName,
            lastName,
            username,
            password: hashedPassword,
            birthDate,
            gender,
            pregnant: gender === 'female' ? Boolean(pregnant) : false,
            breastfeeding: gender === 'female' ? Boolean(breastfeeding) : false,
            medicalConditions: medicalArr,
            currentMedications: medsArr,
            email,
            phone,
            profileImage: req.file ? `/images/profile/${req.file.filename}` : null,
            role: 'patient'
        });

        await newPatient.save();
        res.redirect('/doctor/panel');
    } catch (err) {
        console.error(err);
        res.render('pages/addPatient', {
            error: 'Failed to create patient',
            user: req.session.user || null
        });
    }
};

// ================== עדכון מטופל ==================
exports.updatePatient = async (req, res) => {
    try {
        const updates = { ...req.body };

        // אם יש קובץ חדש → עדכון תמונה
        if (req.file) {
            updates.profileImage = `/images/profile/${req.file.filename}`;
        }

        // פיצול רשימות
        if (updates.medicalConditions) {
            updates.medicalConditions = updates.medicalConditions.split(',')
                .map(s => s.trim())
                .filter(Boolean);
        }
        if (updates.currentMedications) {
            updates.currentMedications = updates.currentMedications.split(',')
                .map(s => s.trim())
                .filter(Boolean);
        }

        // עדכון בסיסמה אם סופקה חדשה
        if (updates.password && updates.password.trim() !== '') {
            updates.password = await bcrypt.hash(updates.password, 10);
        } else {
            delete updates.password; // לא לעדכן אם ריק
        }

        const updated = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!updated) {
            return res.render('pages/error', {
                error: 'Patient not found',
                user: req.session.user || null
            });
        }
        res.redirect('/doctor/panel');
    } catch (err) {
        console.error(err);
        res.render('pages/error', {
            error: 'Failed to update patient',
            user: req.session.user || null
        });
    }
};

// ================== מחיקת מטופל ==================
exports.deletePatient = async (req, res) => {
    try {
        const deleted = await User.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.render('pages/error', {
                error: 'Patient not found',
                user: req.session.user || null
            });
        }
        res.redirect('/doctor/panel');
    } catch (err) {
        console.error(err);
        res.render('pages/error', {
            error: 'Failed to delete patient',
            user: req.session.user || null
        });
    }
};