const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['patient', 'doctor'], 
        required: true 
    },

    // Common fields
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { 
        type: String, 
        required: true, 
        lowercase: true, 
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email address']
    },
    phone: { type: String, trim: true },

    profileImage: { type: String, default: '/images/profile/avatar.png' },

    // Patient-specific
    birthDate: { 
        type: Date,
        required: function() { return this.role === 'patient'; }
    },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    pregnant: { type: Boolean, default: false },
    breastfeeding: { type: Boolean, default: false },
    medicalConditions: { type: [String], default: [] },
    currentMedications: { type: [String], default: [] },

    // Doctor-specific
    specialization: {  
        type: String, 
        required: function() { return this.role === 'doctor'; }
    },
    licenseNumber: { 
        type: String, 
        required: function() { return this.role === 'doctor'; }
    },
    yearsOfExperience: { 
        type: Number, 
        min: 0,
        required: function() { return this.role === 'doctor'; }
    }

}, { timestamps: true });

// ✅ גיל מחושב
userSchema.virtual('age').get(function () {
    if (!this.birthDate) return null;
    const today = new Date();
    let age = today.getFullYear() - this.birthDate.getFullYear();
    const m = today.getMonth() - this.birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < this.birthDate.getDate())) {
        age--;
    }
    return age;
});

userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);