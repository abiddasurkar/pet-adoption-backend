import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
    status: { 
      type: String, 
      enum: ['Pending', 'Approved', 'Rejected'], 
      default: 'Pending' 
    },
    userMessage: String,
    adminNotes: String,
    appliedDate: { type: Date, default: Date.now },
    decidedDate: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Application', applicationSchema);
