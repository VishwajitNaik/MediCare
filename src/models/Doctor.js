import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  hospital: String,
  experience: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  clinicAddress: { type: String },
}, { timestamps: true });

export default mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
