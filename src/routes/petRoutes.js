import express from 'express';
import Pet from '../models/Pet.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all pets with pagination and filters
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const species = req.query.species || '';
    const breed = req.query.breed || '';
    const age = req.query.age || '';

    // Build filter
    const filter = { status: 'Available' };
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (species) filter.species = species;
    if (breed) filter.breed = { $regex: breed, $options: 'i' };

    const limit = 9;
    const skip = (page - 1) * limit;

    const pets = await Pet.find(filter).skip(skip).limit(limit);
    const total = await Pet.countDocuments(filter);

    res.json({
      success: true,
      pets,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single pet
router.get('/:id', async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }
    res.json(pet);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add pet (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, species, breed, age, photoUrl, description } = req.body;

    const pet = await Pet.create({
      name,
      species,
      breed,
      age,
      photoUrl,
      description,
      status: 'Available',
    });

    res.status(201).json({ success: true, data: pet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update pet (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pet = await Pet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: pet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete pet (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Pet.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Pet deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
