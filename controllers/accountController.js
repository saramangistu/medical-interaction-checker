// controllers/accountController.js
const fs = require('fs');
const User = require('../models/userModel');
const { detectMainTag } = require('./profileImageController');

// 📌 רינדור עמוד החשבון
exports.renderAccountPage = (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }

    // המרה ל-Date כדי למנוע בעיה עם toISOString ב-EJS
    if (req.session.user.birthDate) {
        req.session.user.birthDate = new Date(req.session.user.birthDate);
    }

    res.render('pages/account', { user: req.session.user });
};

// 📌 קבלת פרטי החשבון
exports.getAccountData = (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({ user: req.session.user });
};

// 📌 עדכון חשבון
exports.updateAccount = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const updatedData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            birthDate: req.body.birthDate ? new Date(req.body.birthDate) : null,
            gender: req.body.gender,
            pregnant: req.body.gender === 'female' && req.body.pregnant === 'true',
            breastfeeding: req.body.gender === 'female' && req.body.breastfeeding === 'true',
            medicalConditions: req.body.medicalConditions 
                ? req.body.medicalConditions.split(',').map(s => s.trim()) 
                : [],
            currentMedications: req.body.currentMedications 
                ? req.body.currentMedications.split(',').map(s => s.trim()) 
                : [],
            email: req.body.email,
            phone: req.body.phone
        };

        // 📌 אם הועלתה תמונה — בדוק שהיא של אדם
        if (req.file) {
            const fullPath = __dirname + '/../public/images/profile/' + req.file.filename;
            const detected = await detectMainTag(fullPath);

            const personTags = ['person', 'man', 'woman', 'people', 'face', 'boy', 'girl'];
            const isPerson = detected?.name && personTags.includes(detected.name);

            if (!isPerson) {
                fs.unlinkSync(fullPath); // מחיקה אם לא עבר
                return res.status(400).render('pages/account', { 
                    user: req.session.user, 
                    error: `The uploaded image must clearly contain a person. Detected: "${detected?.name || 'none'}"`
                });
            }

            updatedData.profileImage = `/images/profile/${req.file.filename}`;
        }

        // 📌 ברירת מחדל אם אין תמונה כלל
        if (!req.file && (!req.session.user.profileImage || req.session.user.profileImage.trim() === '')) {
            updatedData.profileImage = '/images/profile/avatar.png';
        }

        // 📌 עדכון במסד
        const user = await User.findOneAndUpdate(
            { username: req.session.user.username },
            updatedData,
            { new: true }
        );

        // 📌 עדכון הסשן
        req.session.user = {
            username: user.username,
            role: user.role,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            birthDate: user.birthDate || null,
            age: user.age || null, // virtual ממודל
            gender: user.gender || '',
            pregnant: user.pregnant || false,
            breastfeeding: user.breastfeeding || false,
            medicalConditions: Array.isArray(user.medicalConditions) ? user.medicalConditions : [],
            currentMedications: Array.isArray(user.currentMedications) ? user.currentMedications : [],
            email: user.email || '',
            phone: user.phone || '',
            profileImage: user.profileImage?.trim() 
                ? user.profileImage 
                : '/images/profile/avatar.png'
        };

        // 📌 החזרה
        if (req.headers['content-type']?.includes('application/json')) {
            res.json({ success: true, user: req.session.user });
        } else {
            res.redirect('/account');
        }

    } catch (err) {
        console.error('Error updating account:', err);
        if (req.headers['content-type']?.includes('application/json')) {
            res.status(500).json({ error: 'Error updating account.' });
        } else {
            res.render('pages/account', { user: req.session.user, error: 'Error updating account.' });
        }
    }
};

// 📌 מחיקת חשבון עצמי (רק למטופל)
exports.deleteAccount = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).redirect('/auth/login');
    }

    // רק מטופל יכול למחוק את עצמו
    if (req.session.user.role !== 'patient') {
        return res.status(403).render('pages/account', { 
            user: req.session.user,
            error: 'Doctors cannot delete their own account.'
        });
    }

    try {
        await User.findOneAndDelete({ username: req.session.user.username });

        // מחיקת סשן
        req.session.destroy(() => {
            res.redirect('/');
        });
    } catch (err) {
        console.error('Error deleting account:', err);
        res.render('pages/account', { user: req.session.user, error: 'Error deleting account.' });
    }
};