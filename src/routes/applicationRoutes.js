import express from 'express';
import Application from '../models/Application.js';
import Pet from '../models/Pet.js';
import User from '../models/User.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply for adoption
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { petId, userMessage } = req.body;

    // Check if pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    // Check if already applied
    const existing = await Application.findOne({ userId: req.user.id, petId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already applied for this pet' });
    }

    // Create application
    const application = await Application.create({
      userId: req.user.id,
      petId,
      userMessage,
      status: 'Pending',
    });

    // Update pet status
    await Pet.findByIdAndUpdate(petId, { status: 'Under Review' });

    res.status(201).json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user's applications
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.id })
      .populate('petId', 'name breed')
      .sort({ appliedDate: -1 });

    const formatted = applications.map(app => ({
      _id: app._id,
      petId: app.petId._id,
      petName: app.petId.name,
      status: app.status,
      appliedDate: app.appliedDate,
      adminNotes: app.adminNotes,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all applications (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('userId', 'name email')
      .populate('petId', 'name breed')
      .sort({ appliedDate: -1 });

    const formatted = applications.map(app => ({
      _id: app._id,
      userId: app.userId._id,
      userName: app.userId.name,
      petId: app.petId._id,
      petName: app.petId.name,
      status: app.status,
      appliedDate: app.appliedDate,
      adminNotes: app.adminNotes,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Approve application (admin only)
router.put('/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    // Update application
    application.status = 'Approved';
    application.adminNotes = req.body.adminNotes;
    application.decidedDate = new Date();
    await application.save();

    // Update pet status to adopted
    await Pet.findByIdAndUpdate(application.petId, { status: 'Adopted' });

    res.json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reject application (admin only)
router.put('/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    // Update application
    application.status = 'Rejected';
    application.adminNotes = req.body.adminNotes;
    application.decidedDate = new Date();
    await application.save();

    // Update pet status back to available
    await Pet.findByIdAndUpdate(application.petId, { status: 'Available' });

    res.json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Withdraw application
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (application.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Delete application
    await Application.findByIdAndDelete(req.params.id);

    // Update pet status back to available if this was the only pending app
    const otherApps = await Application.findOne({ petId: application.petId, status: 'Pending' });
    if (!otherApps) {
      await Pet.findByIdAndUpdate(application.petId, { status: 'Available' });
    }

    res.json({ success: true, message: 'Application withdrawn' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
