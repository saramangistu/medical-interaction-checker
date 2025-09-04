// controllers/profileImageController.js
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { imagga } = require('../config/config');

// --- זיהוי תגיות עם confidence גבוה ---
async function detectMainTags(filePath) {
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(filePath));

    const response = await axios.post(
      `${imagga.baseUrl}/tags`,
      form,
      {
        headers: form.getHeaders(),
        auth: { username: imagga.key, password: imagga.secret }
      }
    );

    const tags = response.data.result?.tags || [];
    if (!tags.length) return [];

    // מחזירים את 10 התגיות המובילות בלבד
    return tags
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10)
      .map(t => ({
        name: t.tag.en.toLowerCase(),
        confidence: t.confidence
      }));

  } catch (err) {
    console.error('⚠ Error detecting tags:', err.message);
    return [];
  }
}

// --- GET – טופס ריק ---
function getProfileImagePage(req, res) {
  res.render('pages/profileImageCheck', { 
    user: req.session.user || null,
    result: null 
  });
}

// --- POST – עיבוד התמונה ---
async function postProfileImageCheck(req, res) {
  try {
    if (!req.file) {
      return res.render('pages/profileImageCheck', {
        user: req.session.user || null,
        result: { error: '⚠ No image uploaded.', uploadedImage: null }
      });
    }

    const filePath = `public/uploads/${req.file.filename}`;
    const detected = await detectMainTags(filePath);

    const personTags = ['person', 'man', 'woman', 'people', 'face', 'boy', 'girl'];

    if (!detected.length) {
      return res.render('pages/profileImageCheck', {
        user: req.session.user || null,
        result: {
          error: "⚠ No tags with confidence ≥ 80% were found.",
          uploadedImage: `/uploads/${req.file.filename}`
        }
      });
    }

    // נמצא תגית אדם אם קיימת
    const detectedPerson = detected.find(tag => personTags.includes(tag.name));

    if (!detectedPerson) {
      return res.render('pages/profileImageCheck', {
        user: req.session.user || null,
        result: {
          error: `⚠ No valid person tag found. Top detected: "${detected[0].name}" (${detected[0].confidence.toFixed(1)}%).`,
          uploadedImage: `/uploads/${req.file.filename}`
        }
      });
    }

    // ✅ נמצא אדם עם confidence ≥ 80
    res.render('pages/profileImageCheck', {
      user: req.session.user || null,
      result: {
        success: `✅ Valid profile picture: "${detectedPerson.name}" (${detectedPerson.confidence.toFixed(1)}%).`,
        uploadedImage: `/uploads/${req.file.filename}`,
        tag: detectedPerson.name,
        confidence: detectedPerson.confidence.toFixed(1)
      }
    });

  } catch (err) {
    console.error('❌ Error in postProfileImageCheck:', err.message);
    res.render('pages/profileImageCheck', {
      user: req.session.user || null,
      result: { error: `⚠ Error analyzing image: ${err.message}`, uploadedImage: null }
    });
  }
}

// ✅ ייצוא כל הפונקציות
module.exports = {
  detectMainTags,
  getProfileImagePage,
  postProfileImageCheck
};