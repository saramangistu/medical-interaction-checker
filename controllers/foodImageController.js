// controllers/foodImageController.js
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { imagga, usda, ollama } = require('../config/config');

/**
 * זיהוי תגית מובילה מהתמונה באמצעות Imagga API
 * ✅ מחזיר תמיד אובייקט { name, confidence }
 */
async function detectMainTag(filePath) {
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
    if (!tags.length) return null;

    const bestTag = tags.sort((a, b) => b.confidence - a.confidence)[0];
    return {
      name: bestTag.tag.en.toLowerCase(),
      confidence: bestTag.confidence
    };
  } catch (err) {
    console.error('⚠ Error detecting main tag:', err.message);
    return null;
  }
}

/**
 * חיפוש נתוני אוכל ב-USDA לפי שם, מחזיר מוצר עם רכיבים אם קיים
 */
async function getFoodDataFromFDC(foodName) {
  try {
    const url = `${usda.baseUrl}/foods/search?query=${encodeURIComponent(foodName)}&pageSize=15&api_key=${usda.key}`;
    const res = await axios.get(url);

    if (res.data.foods?.length > 0) {
      const food = res.data.foods.find(f => f.ingredients && f.ingredients.trim() !== '') 
                || res.data.foods[0];

      let energy = 'NA';
      if (Array.isArray(food.foodNutrients)) {
        const energyNutrient = food.foodNutrients.find(n =>
          n.nutrientName && n.nutrientName.toLowerCase().includes('energy')
        );
        if (energyNutrient) {
          energy = `${energyNutrient.value} ${energyNutrient.unitName || ''}`;
        }
      }

      return {
        name: food.description || foodName,
        ingredients: food.ingredients || 'Not specified',
        energy
      };
    }
    return null;
  } catch (err) {
    console.error('Error fetching USDA data:', err.message);
    return null;
  }
}

/**
 * ניתוח רכיבי המזון עם Ollama – פרומפט מעודכן
 */
async function analyzeFoodWithOllama(foodName, fdcData, condition) {
  const mainIngredients = fdcData.ingredients || 'Not specified';

  const ollamaPrompt = `
You are a nutrition assistant. Given the dish: ${foodName}
with ingredients: ${mainIngredients}
and the medical condition: ${condition},
Detail in a single paragraph whether it is SAFE, CAUTION, or AVOID for this condition, and why.
End with a concluding word on a new line: SAFE, CAUTION, or AVOID.
  `;

  try {
    const response = await axios.post(`${ollama.url}/api/generate`, {
      model: ollama.model,
      prompt: ollamaPrompt,
      stream: false
    });

    let answer = response.data?.response || 'No detailed info found.';
    answer = answer.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    answer = answer.replace(/\bSAFE\b\s*$/i, '<span class="status safe">SAFE</span>');
    answer = answer.replace(/\bCAUTION\b\s*$/i, '<span class="status caution">CAUTION</span>');
    answer = answer.replace(/\bAVOID\b\s*$/i, '<span class="status avoid">AVOID</span>');
    return answer;

  } catch (err) {
    console.error('Error contacting Ollama:', err.message);
    return `Error contacting Ollama: ${err.message}`;
  }
}

/**
 * GET – הצגת טופס ריק
 */
exports.getFoodImagePage = (req, res) => {
  res.render('pages/foodImageCheck', { 
    result: null,
    user: req.session.user || null
  });
};

/**
 * POST – קבלת התמונה, זיהוי, חיפוש וניתוח
 */
exports.postFoodImageCheck = async (req, res) => {
  try {
    if (!req.file) {
      return res.render('pages/foodImageCheck', { 
        result: { error: 'No image uploaded.' },
        user: req.session.user || null
      });
    }

    const filePath = `public/uploads/${req.file.filename}`;
    const detected = await detectMainTag(filePath);
    const mainTag = detected?.name;

    const foodTags = ['food', 'dish', 'meal', 'fruit', 'vegetable', 'dessert', 'drink', 'meat', 'pasta', 'bread', 'pizza', 'salad'];
    if (!mainTag || !foodTags.includes(mainTag)) {
      return res.render('pages/foodImageCheck', {
        result: { error: `⚠ Image tag detected: "${mainTag || 'none'}" is not recognized as food.` },
        user: req.session.user || null
      });
    }

    const fdcData = await getFoodDataFromFDC(mainTag);
    if (!fdcData) {
      return res.render('pages/foodImageCheck', {
        result: { error: 'No USDA data found for detected food.' },
        user: req.session.user || null
      });
    }

    const analysis = await analyzeFoodWithOllama(mainTag, fdcData, req.body.condition || 'unspecified');

    res.render('pages/foodImageCheck', {
      result: { 
        valid: true, 
        foodName: mainTag, 
        usdaSnippet: `${fdcData.name}`,
        ingredients: fdcData.ingredients,
        ollamaAnalysis: analysis,
        imageUrl: `/uploads/${req.file.filename}`,
        confidence: detected?.confidence?.toFixed(1) || null
      },
      user: req.session.user || null
    });

  } catch (err) {
    console.error('Error in food image check:', err.message);
    res.render('pages/foodImageCheck', { 
      result: { error: err.message },
      user: req.session.user || null
    });
  }
};