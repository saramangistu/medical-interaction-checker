// middleware/upload.js
const multer = require('multer');
const fs = require('fs');

function getDestination(req, file, cb) {
    let folder = 'images/foods'; // ברירת מחדל - תמונות מזון

    // אם הנתיב כולל 'profile' → שמור בתיקיית profile
    if (req.baseUrl.includes('account') || req.baseUrl.includes('profile')) {
        folder = 'images/profile';
    }

    const destPath = __dirname + '/../public/' + folder;

    // יצירת התיקייה אם היא לא קיימת
    if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
    }

    cb(null, destPath);
}

const storage = multer.diskStorage({
    destination: getDestination,
    filename: (req, file, cb) => {
        // שם קובץ ייחודי — תאריך + מילישניות + סיומת
        const originalName = file.originalname;
        const ext = originalName.substring(originalName.lastIndexOf('.'));
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        cb(null, uniqueName);
    }
});

// הגבלה — עד 5MB, וקבלת תמונות בלבד
function fileFilter(req, file, cb) {
    const allowed = /jpeg|jpg|png/;
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.') + 1).toLowerCase();
    const mime = file.mimetype;

    if (allowed.test(ext) && allowed.test(mime)) {
        cb(null, true);
    } else {
        req.fileValidationError = '❌ Only JPG, JPEG, and PNG files are allowed!';
        cb(null, false);
    }
}

module.exports = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
});