import express from 'express';
import Pet from '../models/Pet.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Pets
 *   description: Pet management operations
 */

/**
 * @swagger
 * /api/pets:
 *   get:
 *     summary: Get paginated list of available pets with advanced filtering
 *     tags: [Pets]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by pet name
 *       - in: query
 *         name: species
 *         schema:
 *           type: string
 *           enum: [dog, cat, bird, rabbit, hamster, guinea_pig, fish, reptile, other]
 *         description: Filter by species
 *       - in: query
 *         name: breed
 *         schema:
 *           type: string
 *         description: Filter by breed
 *       - in: query
 *         name: age
 *         schema:
 *           type: string
 *           enum: [baby, young, adult, senior]
 *         description: Filter by age category
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *           enum: [small, medium, large, extra_large]
 *         description: Filter by size
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, unknown]
 *         description: Filter by gender
 *       - in: query
 *         name: healthStatus
 *         schema:
 *           type: string
 *           enum: [excellent, good, fair, poor, critical]
 *         description: Filter by health status
 *       - in: query
 *         name: temperament
 *         schema:
 *           type: string
 *           enum: [calm, playful, shy, energetic, independent, affectionate, protective, social]
 *         description: Filter by temperament
 *     responses:
 *       200:
 *         description: List of pets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 pets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pet'
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const species = req.query.species || '';
    const breed = req.query.breed || '';
    const age = req.query.age || '';
    const size = req.query.size || '';
    const gender = req.query.gender || '';
    const healthStatus = req.query.healthStatus || '';
    const temperament = req.query.temperament || '';

    // Build filter - only show available pets
    const filter = { status: 'available' };

    // Text search by name
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Exact match filters
    if (species) filter.species = species;
    if (breed) filter.breed = { $regex: breed, $options: 'i' };
    if (age) filter.age = age;
    if (size) filter.size = size;
    if (gender) filter.gender = gender;
    if (healthStatus) filter.healthStatus = healthStatus;

    // Temperament filter (array field - check if includes value)
    if (temperament) {
      filter.temperament = { $in: [temperament] };
    }

    const limit = 9;
    const skip = (page - 1) * limit;

    const pets = await Pet.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Pet.countDocuments(filter);

    res.json({
      success: true,
      pets,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPets: total,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/pets/featured:
 *   get:
 *     summary: Get featured pets
 *     tags: [Pets]
 *     responses:
 *       200:
 *         description: Featured pets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 pets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pet'
 *       500:
 *         description: Internal server error
 */
router.get('/featured', async (req, res) => {
  try {
    const pets = await Pet.find({
      status: 'available',
      isFeatured: true
    })
      .limit(6)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      pets,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/pets/{id}:
 *   get:
 *     summary: Get a specific pet by ID
 *     tags: [Pets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pet ID
 *     responses:
 *       200:
 *         description: Pet details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pet'
 *       404:
 *         description: Pet not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).populate('adoptedBy', 'name email');

    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    res.json({
      success: true,
      data: pet,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/pets:
 *   post:
 *     summary: Add a new pet (Admin only)
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - species
 *               - breed
 *               - age
 *               - photoBase64
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Buddy"
 *               species:
 *                 type: string
 *                 enum: [dog, cat, bird, rabbit, hamster, guinea_pig, fish, reptile, other]
 *                 example: "dog"
 *               breed:
 *                 type: string
 *                 example: "Golden Retriever"
 *               age:
 *                 type: string
 *                 enum: [baby, young, adult, senior]
 *                 example: "young"
 *               size:
 *                 type: string
 *                 enum: [small, medium, large, extra_large]
 *                 example: "large"
 *               gender:
 *                 type: string
 *                 enum: [male, female, unknown]
 *                 example: "male"
 *               healthStatus:
 *                 type: string
 *                 enum: [excellent, good, fair, poor, critical]
 *                 example: "excellent"
 *               temperament:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [calm, playful, shy, energetic, independent, affectionate, protective, social]
 *                 example: ["playful", "energetic", "affectionate"]
 *               photoBase64:
 *                 type: string
 *                 example: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *               description:
 *                 type: string
 *                 example: "Friendly and energetic golden retriever"
 *               isFeatured:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Pet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Pet'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      name,
      species,
      breed,
      age,
      size,
      gender,
      healthStatus,
      temperament,
      photoBase64,
      description,
      isFeatured,
    } = req.body;

    // Validation
    if (!name || !species || !breed || !age || !photoBase64 || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, species, breed, age, photoBase64, description',
      });
    }

    const pet = await Pet.create({
      name,
      species,
      breed,
      age,
      size: size || undefined,
      gender: gender || 'unknown',
      healthStatus: healthStatus || 'good',
      temperament: temperament || [],
      photoBase64,
      description,
      isFeatured: isFeatured || false,
      status: 'available',
    });

    res.status(201).json({ success: true, data: pet });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(', '),
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/pets/{id}:
 *   put:
 *     summary: Update a pet (Admin only)
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pet ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               species:
 *                 type: string
 *               breed:
 *                 type: string
 *               age:
 *                 type: string
 *               size:
 *                 type: string
 *               gender:
 *                 type: string
 *               healthStatus:
 *                 type: string
 *               temperament:
 *                 type: array
 *                 items:
 *                   type: string
 *               photoBase64:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [available, pending, adopted, not_available, fostered]
 *               isFeatured:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Pet updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Pet'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Pet not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if pet exists
    const petExists = await Pet.findById(id);
    if (!petExists) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    const pet = await Pet.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: pet });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(', '),
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/pets/{id}:
 *   delete:
 *     summary: Delete a pet (Admin only)
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pet ID
 *     responses:
 *       200:
 *         description: Pet deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Pet deleted successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Pet not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pet = await Pet.findByIdAndDelete(req.params.id);

    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    res.json({ success: true, message: 'Pet deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;