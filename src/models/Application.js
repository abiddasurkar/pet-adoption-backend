import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: [true, 'User ID is required'] 
    },
    petId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Pet', 
      required: [true, 'Pet ID is required'] 
    },
    status: { 
      type: String, 
      enum: {
        values: ['Pending', 'Approved', 'Rejected'],
        message: 'Status must be Pending, Approved, or Rejected'
      }, 
      default: 'Pending' 
    },
    userMessage: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
    },
    appliedDate: { 
      type: Date, 
      default: Date.now 
    },
    decidedDate: {
      type: Date
    }
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound index to prevent duplicate applications
applicationSchema.index({ userId: 1, petId: 1 }, { unique: true });

// Indexes for better query performance
applicationSchema.index({ status: 1 });
applicationSchema.index({ petId: 1 });
applicationSchema.index({ userId: 1 });
applicationSchema.index({ appliedDate: -1 });

// Virtual for application duration (in days)
applicationSchema.virtual('processingDays').get(function() {
  if (this.decidedDate && this.appliedDate) {
    return Math.ceil((this.decidedDate - this.appliedDate) / (1000 * 60 * 60 * 24));
  }
  return null;
});

export default mongoose.model('Application', applicationSchema);