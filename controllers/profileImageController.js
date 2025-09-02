// controllers/profileImageController.js
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { imagga } = require('../config/config');

// --- זיהוי תגית מובילה ---
async function detectMainTag(filePath) {
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
  if (!tags.length) return null;

  // מחזירים תמיד את התגית הראשונה עם הביטחון הגבוה ביותר
  const bestTag = tags[0];
  return {
    name: bestTag.tag.en.toLowerCase(),
    confidence: bestTag.confidence
  };
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
        result: { error: 'No image uploaded.', uploadedImage: null }
      });
    }

    const filePath = `public/uploads/${req.file.filename}`;
    const detected = await detectMainTag(filePath);

    const personTags = ['person', 'man', 'woman', 'people', 'face', 'boy', 'girl'];

    if (!detected || !personTags.includes(detected.name)) {
      return res.render('pages/profileImageCheck', {
        user: req.session.user || null,
        result: {
          error: `⚠ Detected "${detected?.name || 'none'}". Please upload a clear person image.`,
          uploadedImage: `/uploads/${req.file.filename}`
        }
      });
    }

    res.render('pages/profileImageCheck', {
      user: req.session.user || null,
      result: {
        success: `Valid profile picture: "${detected.name}" (${detected.confidence.toFixed(1)}%).`,
        uploadedImage: `/uploads/${req.file.filename}`,
        tag: detected.name,
        confidence: detected.confidence.toFixed(1)
      }
    });

  } catch (err) {
    res.render('pages/profileImageCheck', {
      user: req.session.user || null,
      result: { error: err.message, uploadedImage: null }
    });
  }
}

// ✅ ייצוא כל הפונקציות
module.exports = {
  detectMainTag,
  getProfileImagePage,
  postProfileImageCheck
};