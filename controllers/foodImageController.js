// controllers/foodImageController.js
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { imagga, usda, ollama } = require('../config/config');

/**
 * זיהוי תגיות מהתמונה באמצעות Imagga API
 * ✅ מחזיר את 10 התיוגים הגבוהים ביותר
 */
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

    // מחזירים את 10 התגיות המובילות
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
    const detectedTags = await detectMainTags(filePath);

    const foodTags = ['food', 'dish', 'meal', 'fruit', 'vegetable', 'dessert', 'drink', 'meat', 'pasta', 'bread', 'pizza', 'salad'];

    // בדיקה אם יש בכלל תגית אוכל בין ה־10 הגבוהות
    const hasFood = detectedTags.some(tag => foodTags.includes(tag.name));
    if (!hasFood) {
      return res.render('pages/foodImageCheck', {
        result: { error: `⚠ No valid food tag detected (tags: ${detectedTags.map(t => t.name).join(', ') || 'none'})` },
        user: req.session.user || null
      });
    }

    // ניקח את התגית הראשונה (הכי גבוהה) עבור Ollama
    const mainTag = detectedTags[0];

    const fdcData = await getFoodDataFromFDC(mainTag.name);
    if (!fdcData) {
      return res.render('pages/foodImageCheck', {
        result: { error: 'No USDA data found for detected food.' },
        user: req.session.user || null
      });
    }

    const analysis = await analyzeFoodWithOllama(mainTag.name, fdcData, req.body.condition || 'unspecified');

    res.render('pages/foodImageCheck', {
      result: { 
        valid: true, 
        foodName: mainTag.name, 
        usdaSnippet: `${fdcData.name}`,
        ingredients: fdcData.ingredients,
        ollamaAnalysis: analysis,
        imageUrl: `/uploads/${req.file.filename}`,
        confidence: mainTag.confidence.toFixed(1),
        allTags: detectedTags   // ✅ מציג את 10 התגיות הגבוהות למי שרוצה
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