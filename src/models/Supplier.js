import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    altMobile: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    drugLicense: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Pharmaceutical', 'Medical Equipment', 'General', 'Other'],
      default: 'Pharmaceutical',
    },
    specialization: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Supplier ||
  mongoose.model('Supplier', supplierSchema);
