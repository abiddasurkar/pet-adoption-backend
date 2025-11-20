// ============================================
// BACKEND SETUP - Pet Adoption System
// ============================================

// 1. package.json

// 2. .env.example
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/petadoption
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

// 3. src/index.js

// ============================================
// MODELS
// ============================================

// 4. src/models/User.js

// 5. 



// 6. src/models/Application.js

// ============================================
// MIDDLEWARE
// ============================================

// 7. src/middleware/auth.js

// ============================================
// ROUTES
// ============================================

// 8. src/routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, phone, address } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      name,
      phone,
      address,
      role: 'user',
    });

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// 9. src/routes/petRoutes.js

// 10. src/routes/applicationRoutes.js

// ============================================
// .gitignore
// ============================================

