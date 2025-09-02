const fs = require('fs');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { detectMainTag } = require('./profileImageController');

/**
 * 📌 בדיקה מיידית של תמונה (AJAX)
 */
const validateProfileImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image uploaded.' });
    }

    try {
        const detected = await detectMainTag(req.file.path);
        const personTags = ['person', 'man', 'woman', 'people', 'face', 'boy', 'girl'];
        const isPerson = detected?.name && personTags.includes(detected.name);

        if (!isPerson) {
            fs.unlinkSync(req.file.path); // מוחק תמונה לא תקינה
            return res.json({
                success: false,
                message: `❌ The uploaded image must clearly contain a person. Detected: "${detected?.name || 'none'}"`
            });
        }

        // אם תקין – נחזיר אישור ונתיב זמני להציג Preview
        return res.json({
            success: true,
            message: '✅ Valid person image',
            fileUrl: `/uploads/${req.file.filename}`
        });
    } catch (err) {
        console.error('❌ Error validating profile image:', err);
        return res.status(500).json({ success: false, message: 'Server error validating image' });
    }
};

/**
 * 📌 רישום מטופל (EJS)
 */
const postRegisterPatient = async (req, res) => {
    const {
        username, password,
        firstName, lastName, birthDate, gender, pregnant, breastfeeding,
        medicalConditions, currentMedications, email, phone
    } = req.body;

    if (!username || !password || !firstName || !lastName || !birthDate) {
        return res.render('pages/registerPatient', { error: 'All required fields must be filled.', user: null });
    }

    if (!req.file) {
        return res.render('pages/registerPatient', { error: 'Profile image is required.', user: null });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            fs.unlinkSync(req.file.path);
            return res.render('pages/registerPatient', { error: 'Username already exists.', user: null });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            password: hashedPassword,
            role: 'patient',
            firstName,
            lastName,
            birthDate: new Date(birthDate),
            gender,
            pregnant: gender === 'female' && pregnant === 'true',
            breastfeeding: gender === 'female' && breastfeeding === 'true',
            medicalConditions: Array.isArray(medicalConditions)
                ? medicalConditions
                : (medicalConditions ? medicalConditions.split(',').map(s => s.trim()) : []),
            currentMedications: Array.isArray(currentMedications)
                ? currentMedications
                : (currentMedications ? currentMedications.split(',').map(s => s.trim()) : []),
            email,
            phone,
            profileImage: `/uploads/${req.file.filename}`
        });

        await user.save();
        res.redirect('/auth/login');
    } catch (err) {
        console.error('❌ Error registering patient:', err);
        res.render('pages/registerPatient', { error: 'Error registering patient.', user: null });
    }
};

/**
 * 📌 רישום רופא (EJS)
 */
const postRegisterDoctor = async (req, res) => {
    const {
        username, password, firstName, lastName,
        specialization, licenseNumber, yearsOfExperience,
        email, phone
    } = req.body;

    if (!username || !password || !firstName || !lastName || !specialization || !licenseNumber || !yearsOfExperience) {
        return res.render('pages/registerDoctor', { error: 'All required fields must be filled.', user: null });
    }

    if (!req.file) {
        return res.render('pages/registerDoctor', { error: 'Profile image is required.', user: null });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            fs.unlinkSync(req.file.path);
            return res.render('pages/registerDoctor', { error: 'Username already exists.', user: null });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const doctor = new User({
            username,
            password: hashedPassword,
            role: 'doctor',
            firstName,
            lastName,
            specialization,
            licenseNumber,
            yearsOfExperience: Number(yearsOfExperience),
            email,
            phone,
            profileImage: `/uploads/${req.file.filename}`
        });

        await doctor.save();
        res.redirect('/auth/login');
    } catch (err) {
        console.error('❌ Error registering doctor:', err);
        res.render('pages/registerDoctor', { error: 'Error registering doctor.', user: null });
    }
};

/**
 * 📌 התחברות (EJS)
 */
const postLogin = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.render('pages/login', { error: '❌ Username does not exist.', user: null });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('pages/login', { error: '❌ Incorrect password.', user: null });
        }

        req.session.user = {
            username: user.username,
            role: user.role,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            birthDate: user.birthDate || null,
            age: user.age || null,
            gender: user.gender || '',
            pregnant: user.pregnant || false,
            breastfeeding: user.breastfeeding || false,
            medicalConditions: Array.isArray(user.medicalConditions) ? user.medicalConditions : [],
            currentMedications: Array.isArray(user.currentMedications) ? user.currentMedications : [],
            email: user.email || '',
            phone: user.phone || '',
            specialization: user.specialization || '',
            licenseNumber: user.licenseNumber || '',
            yearsOfExperience: user.yearsOfExperience || null,
            profileImage: user.profileImage || '/uploads/default.png'
        };

        res.redirect('/');
    } catch (err) {
        console.error('❌ Error during login:', err);
        res.render('pages/login', { error: '⚠ Server error during login.', user: null });
    }
};

/**
 * 📌 התנתקות
 */
const logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('❌ Error during logout:', err);
            return res.redirect('/account');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
};

/**
 * 📌 המשתמש הנוכחי (API)
 */
const getCurrentUser = (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in.' });
    }
    res.json({ user: req.session.user });
};

// ייצוא כל הפונקציות
module.exports = {
    postRegisterPatient,
    postRegisterDoctor,
    postLogin,
    logout,
    getCurrentUser,
    validateProfileImage   // ✅ חדש – בדיקה מיידית בהעלאה
};