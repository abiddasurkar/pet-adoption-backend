import express from 'express';
import multer from 'multer';
import Pet from '../models/Pet.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { responseHandler } from '../utils/responseHandler.js';

const router = express.Router();

// Multer memory storage for image → base64 conversion
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'), false);
    }
  }
});

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return responseHandler.error(res, 'File size exceeds 5MB limit', 400);
    }
    if (err.code === 'LIMIT_PART_COUNT') {
      return responseHandler.error(res, 'Too many file parts', 400);
    }
    return responseHandler.error(res, `Upload error: ${err.message}`, 400);
  }
  if (err) {
    return responseHandler.error(res, err.message, 400);
  }
  next();
};

// ---------------------------------------------------
// GET: Featured Pets (Must come BEFORE /:id route)
// ---------------------------------------------------
router.get('/featured', async (req, res) => {
  try {
    const pets = await Pet.find({
      status: 'available',
      isFeatured: true
    })
      .limit(6)
      .sort({ createdAt: -1 });

    return responseHandler.success(res, pets, 'Featured pets retrieved successfully');
  } catch (err) {
    return responseHandler.error(res, err.message);
  }
});

// ---------------------------------------------------
// GET: All pets with filters + pagination
// ---------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;

    const filter = {};
    
    // Only filter by 'available' if status not explicitly provided
    if (!req.query.status) {
      filter.status = 'available';
    } else if (req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    // Apply other filters
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.species) {
      filter.species = req.query.species;
    }
    if (req.query.breed) {
      filter.breed = { $regex: req.query.breed, $options: 'i' };
    }
    if (req.query.age) {
      filter.age = req.query.age;
    }
    if (req.query.size) {
      filter.size = req.query.size;
    }
    if (req.query.gender) {
      filter.gender = req.query.gender;
    }
    if (req.query.healthStatus) {
      filter.healthStatus = req.query.healthStatus;
    }
    if (req.query.temperament) {
      filter.temperament = { $in: [req.query.temperament] };
    }

    const skip = (page - 1) * limit;

    const pets = await Pet.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Pet.countDocuments(filter);

    return res.json({
      success: true,
      data: pets,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPets: total,
    });

  } catch (err) {
    console.error('Error fetching pets:', err);
    return responseHandler.error(res, err.message);
  }
});

// ---------------------------------------------------
// GET: Single Pet by ID
// ---------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    // Validate MongoDB ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return responseHandler.error(res, 'Invalid pet ID format', 400);
    }

    const pet = await Pet.findById(req.params.id);
    
    if (!pet) {
      return responseHandler.notFound(res, 'Pet');
    }

    return responseHandler.success(res, pet, 'Pet retrieved successfully');
  } catch (err) {
    console.error('Error fetching pet:', err);
    return responseHandler.error(res, err.message);
  }
});

// ---------------------------------------------------
// POST: Create Pet (Admin) — Supports Base64 Images
// ---------------------------------------------------
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  upload.single('photo'),
  handleMulterError,
  async (req, res) => {
    try {
      let petData = req.body;

      // If file uploaded → convert to base64
      if (req.file) {
        petData.photoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      }

      // Comprehensive validation
      const requiredFields = ['name', 'species', 'breed', 'age', 'description'];
      const missingFields = requiredFields.filter(field => !petData[field]);

      if (missingFields.length > 0) {
        return responseHandler.error(
          res,
          `Missing required fields: ${missingFields.join(', ')}`,
          400
        );
      }

      if (!petData.photoBase64) {
        return responseHandler.error(res, 'Pet photo is required', 400);
      }

      // Create pet with all fields
      const pet = await Pet.create({
        name: petData.name.trim(),
        species: petData.species,
        breed: petData.breed.trim(),
        age: petData.age,
        size: petData.size || 'medium',
        gender: petData.gender || 'unknown',
        healthStatus: petData.healthStatus || 'good',
        temperament: Array.isArray(petData.temperament) ? petData.temperament : [],
        description: petData.description.trim(),
        photoBase64: petData.photoBase64,
        isFeatured: petData.isFeatured === true || petData.isFeatured === 'true',
        status: petData.status || 'available'
      });

      return responseHandler.success(res, pet, 'Pet created successfully', 201);

    } catch (err) {
      console.error('Error creating pet:', err);
      
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return responseHandler.validationError(res, errors);
      }

      return responseHandler.error(res, err.message);
    }
  }
);

// ---------------------------------------------------
// PUT: Update Pet (Admin) — Supports Base64
// ---------------------------------------------------
router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
  upload.single('photo'),
  handleMulterError,
  async (req, res) => {
    try {
      // Validate MongoDB ObjectId format
      if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return responseHandler.error(res, 'Invalid pet ID format', 400);
      }

      const existingPet = await Pet.findById(req.params.id);
      if (!existingPet) {
        return responseHandler.notFound(res, 'Pet');
      }

      let updateData = req.body;

      // Handle new uploaded image
      if (req.file) {
        updateData.photoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      }

      // Trim string fields if present
      if (updateData.name) updateData.name = updateData.name.trim();
      if (updateData.breed) updateData.breed = updateData.breed.trim();
      if (updateData.description) updateData.description = updateData.description.trim();

      // Convert isFeatured to boolean if present
      if (updateData.isFeatured !== undefined) {
        updateData.isFeatured = updateData.isFeatured === true || updateData.isFeatured === 'true';
      }

      // Ensure temperament is an array
      if (updateData.temperament && !Array.isArray(updateData.temperament)) {
        updateData.temperament = [updateData.temperament];
      }

      const updatedPet = await Pet.findByIdAndUpdate(
        req.params.id, 
        updateData, 
        {
          new: true,
          runValidators: true
        }
      );

      return responseHandler.success(res, updatedPet, 'Pet updated successfully');

    } catch (err) {
      console.error('Error updating pet:', err);
      
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return responseHandler.validationError(res, errors);
      }
      
      return responseHandler.error(res, err.message);
    }
  }
);

// ---------------------------------------------------
// PATCH: Partial Update Pet (Admin)
// ---------------------------------------------------
router.patch('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Validate MongoDB ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return responseHandler.error(res, 'Invalid pet ID format', 400);
    }

    const existingPet = await Pet.findById(req.params.id);
    if (!existingPet) {
      return responseHandler.notFound(res, 'Pet');
    }

    const updateData = req.body;

    // Trim string fields if present
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.breed) updateData.breed = updateData.breed.trim();
    if (updateData.description) updateData.description = updateData.description.trim();

    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    return responseHandler.success(res, updatedPet, 'Pet updated successfully');

  } catch (err) {
    console.error('Error partially updating pet:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return responseHandler.validationError(res, errors);
    }
    
    return responseHandler.error(res, err.message);
  }
});

// ---------------------------------------------------
// DELETE: Remove Pet (Admin)
// ---------------------------------------------------
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Validate MongoDB ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return responseHandler.error(res, 'Invalid pet ID format', 400);
    }

    const pet = await Pet.findByIdAndDelete(req.params.id);
    
    if (!pet) {
      return responseHandler.notFound(res, 'Pet');
    }

    return responseHandler.success(res, { id: req.params.id }, 'Pet deleted successfully');

  } catch (err) {
    console.error('Error deleting pet:', err);
    return responseHandler.error(res, err.message);
  }
});

export default router;