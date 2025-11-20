import express from 'express';
import Application from '../models/Application.js';
import Pet from '../models/Pet.js';
import User from '../models/User.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Adoption application management
 */

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Apply for pet adoption
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Application'
 *           example:
 *             petId: "507f1f77bcf86cd799439011"
 *             userMessage: "I have a large backyard and experience with dogs."
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Application'
 *       400:
 *         description: Bad request (already applied or pet not found)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/applications/my:
 *   get:
 *     summary: Get current user's applications
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User applications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Application ID
 *                   petId:
 *                     type: string
 *                     description: Pet ID
 *                   petName:
 *                     type: string
 *                     description: Pet name
 *                   status:
 *                     type: string
 *                     enum: [Pending, Approved, Rejected]
 *                   appliedDate:
 *                     type: string
 *                     format: date-time
 *                   adminNotes:
 *                     type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get all applications (Admin only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All applications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Application ID
 *                   userId:
 *                     type: string
 *                     description: User ID
 *                   userName:
 *                     type: string
 *                     description: User name
 *                   petId:
 *                     type: string
 *                     description: Pet ID
 *                   petName:
 *                     type: string
 *                     description: Pet name
 *                   status:
 *                     type: string
 *                     enum: [Pending, Approved, Rejected]
 *                   appliedDate:
 *                     type: string
 *                     format: date-time
 *                   adminNotes:
 *                     type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/applications/{id}/approve:
 *   put:
 *     summary: Approve an application (Admin only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminNotes:
 *                 type: string
 *                 description: Notes from admin about the approval
 *     responses:
 *       200:
 *         description: Application approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Application'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/applications/{id}/reject:
 *   put:
 *     summary: Reject an application (Admin only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminNotes:
 *                 type: string
 *                 description: Notes from admin about the rejection
 *     responses:
 *       200:
 *         description: Application rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Application'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/applications/{id}:
 *   delete:
 *     summary: Withdraw an application
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application withdrawn successfully
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
 *                   example: "Application withdrawn"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Unauthorized to withdraw this application
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Internal server error
 */
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