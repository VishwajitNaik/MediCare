import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  email: { type: String, sparse: true, unique: true }, // Optional email for login
  password: { type: String }, // Password for authentication (set during account activation)
  age: { type: Number, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  medicalHistory: { type: String, default: '' },
  // Account status
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  // Optional: track who created the patient (for audit purposes)
  createdBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'createdByModel' },
  createdByModel: { type: String, enum: ['Doctor', 'Medical', 'Patient'] },
}, { timestamps: true, strictPopulate: false });

export default mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
