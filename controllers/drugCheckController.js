const axios = require('axios');

// פונקציה פנימית לבדיקת אינטראקציה בין תרופה למצב רפואי
async function checkInteraction(drug, condition) {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${encodeURIComponent(drug)}`;

    try {
        const res = await axios.get(url);
        const data = res.data.results || [];

        if (!data.length) {
            return { status: 'info', message: `ℹ No data found for the drug "${drug}".` };
        }

        // חיפוש אזכור של המצב הרפואי במידע
        const hasInteraction = data.some(item => {
            const text = JSON.stringify(item).toLowerCase();
            return text.includes((condition || '').toLowerCase());
        });

        if (hasInteraction) {
            return { status: 'warning', message: `⚠ Warning: The drug "${drug}" may not be suitable for the condition "${condition}".` };
        } else {
            return { status: 'ok', message: `✅ No known interaction found between "${drug}" and "${condition}".` };
        }

    } catch (err) {
        console.error('Error fetching data from OpenFDA:', err.message);
        return { status: 'error', message: `❌ Error fetching data from OpenFDA: ${err.message}` };
    }
}

// 📌 דף הבדיקה הראשוני (GET)
exports.getDrugCheckPage = (req, res) => {
    res.render('pages/drugCheck', { 
        user: req.session?.user || null, // ✅ שולח תמיד user
        result: null, 
        error: null, 
        drug: '', 
        condition: '' 
    });
};

// 📌 בדיקת אינטראקציה והצגת התוצאה (POST)
exports.postDrugCheck = async (req, res) => {
    const { drug, condition } = req.body;

    if (!drug || !condition) {
        return res.render('pages/drugCheck', { 
            user: req.session?.user || null,
            error: 'Both drug and condition are required.',
            result: null,
            drug,
            condition
        });
    }

    try {
        const result = await checkInteraction(drug, condition);
        res.render('pages/drugCheck', { 
            user: req.session?.user || null,
            error: null, 
            result, 
            drug, 
            condition 
        });
    } catch (err) {
        console.error('Error in drug interaction check:', err);
        res.render('pages/drugCheck', { 
            user: req.session?.user || null,
            error: 'Server error while checking interaction.',
            result: null,
            drug,
            condition
        });
    }
};