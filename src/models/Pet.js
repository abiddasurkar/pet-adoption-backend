import mongoose from 'mongoose';

const petSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    species: { type: String, required: true },
    breed: { type: String, required: true },
    age: { type: Number, required: true },
    photoUrl: String,
    description: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['Available', 'Under Review', 'Adopted'], 
      default: 'Available' 
    },
  },
  { timestamps: true }
);

export default mongoose.model('Pet', petSchema);