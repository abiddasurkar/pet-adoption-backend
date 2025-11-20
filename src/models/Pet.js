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
        values: ['dog', 'cat', 'bird', 'rabbit', 'other'],
        message: 'Species must be dog, cat, bird, rabbit, or other'
      }
    },
    breed: { 
      type: String, 
      required: [true, 'Breed is required'],
      trim: true,
      maxlength: [50, 'Breed cannot exceed 50 characters']
    },
    age: { 
      type: Number, 
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [50, 'Age seems unrealistic']
    },
    photoUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+\..+/.test(v);
        },
        message: 'Please provide a valid URL'
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
        values: ['Available', 'Under Review', 'Adopted'],
        message: 'Status must be Available, Under Review, or Adopted'
      }, 
      default: 'Available' 
    },
    gender: {
      type: String,
      enum: {
        values: ['male', 'female', 'unknown'],
        message: 'Gender must be male, female, or unknown'
      },
      default: 'unknown'
    },
    size: {
      type: String,
      enum: {
        values: ['small', 'medium', 'large'],
        message: 'Size must be small, medium, or large'
      }
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
petSchema.index({ createdAt: -1 });

export default mongoose.model('Pet', petSchema);