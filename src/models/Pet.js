import mongoose from 'mongoose';

const petSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Pet name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    species: { 
      type: String, 
      required: [true, 'Species is required'],
      enum: {
        values: ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'guinea_pig', 'fish', 'reptile', 'other'],
        message: 'Species must be dog, cat, bird, rabbit, hamster, guinea_pig, fish, reptile, or other'
      }
    },
    breed: { 
      type: String, 
      required: [true, 'Breed is required'],
      trim: true,
      maxlength: [50, 'Breed cannot exceed 50 characters']
    },
    age: {
      type: String,
      enum: {
        values: ['baby', 'young', 'adult', 'senior'],
        message: 'Age must be baby, young, adult, or senior'
      },
      required: [true, 'Age category is required']
    },
    size: {
      type: String,
      enum: {
        values: ['small', 'medium', 'large', 'extra_large'],
        message: 'Size must be small, medium, large, or extra_large'
      }
    },
    gender: {
      type: String,
      enum: {
        values: ['male', 'female', 'unknown'],
        message: 'Gender must be male, female, or unknown'
      },
      default: 'unknown'
    },
    healthStatus: {
      type: String,
      enum: {
        values: ['excellent', 'good', 'fair', 'poor', 'critical'],
        message: 'Health status must be excellent, good, fair, poor, or critical'
      },
      default: 'good'
    },
    temperament: [{
      type: String,
      enum: {
        values: ['calm', 'playful', 'shy', 'energetic', 'independent', 'affectionate', 'protective', 'social'],
        message: 'Invalid temperament value'
      }
    }],
    photoBase64: {
      type: String,
      required: [true, 'Pet photo is required'],
      validate: {
        validator: function(v) {
          return v && v.startsWith('data:image/');
        },
        message: 'Photo must be a valid base64 data URL'
      }
    },
    description: { 
      type: String, 
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    status: { 
      type: String, 
      enum: {
        values: ['available', 'pending', 'adopted', 'not_available', 'fostered'],
        message: 'Status must be available, pending, adopted, not_available, or fostered'
      }, 
      default: 'available' 
    },
    adoptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    adoptionDate: {
      type: Date,
      default: null
    },
    isFeatured: {
      type: Boolean,
      default: false
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

// Indexes for better query performance
petSchema.index({ status: 1 });
petSchema.index({ species: 1 });
petSchema.index({ breed: 1 });
petSchema.index({ isFeatured: 1 });
petSchema.index({ adoptedBy: 1 });
petSchema.index({ createdAt: -1 });

export default mongoose.model('Pet', petSchema);