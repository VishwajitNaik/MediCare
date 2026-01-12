import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    // Basic identity
    name: {
      type: String,
      required: true,
      trim: true,
    },

    brandName: {
      type: String,
      required: true,
      trim: true,
    },

    // Tablet / Syrup / Injection
    dosageForm: {
      type: String,
      enum: ['TABLET', 'SYRUP', 'CAPSULE', 'INJECTION', 'DROPS', 'CREAM'],
      required: true,
    },

    // Strength like 500 mg, 250 mg, 5 ml
    strength: {
      type: String,
      required: true,
    },

    // For pharmacy calculation
    unit: {
      type: String,
      enum: ['TABLET', 'ML', 'CAPSULE'],
      required: true,
    },

    // Medical classification (optional for MVP)
    category: {
      type: String,
      default: 'GENERAL',
    },

    // Safety flags
    prescriptionRequired: {
      type: Boolean,
      default: true,
    },

    // Active / inactive medicine
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Medicine ||
  mongoose.model('Medicine', medicineSchema);
