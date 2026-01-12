import mongoose from 'mongoose';

const MedicalSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  employeeId: String,
  // Subscription fields
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'cancelled', 'pending'],
    default: 'inactive'
  },
  subscriptionPlanId: String, // Cashfree subscription plan ID
  subscriptionId: String, // Cashfree subscription ID
  subscriptionStartDate: Date,
  subscriptionEndDate: Date,
  subscriptionAmount: Number,
  subscriptionCurrency: { type: String, default: 'INR' },
  subscriptionInterval: {
    type: String,
    enum: ['DAY', 'WEEK', 'MONTH'],
    default: 'MONTH'
  },
  subscriptionIntervalCount: { type: Number, default: 1 },
  lastPaymentDate: Date,
  nextBillingDate: Date,
  paymentMethod: String, // Store payment method info
  autoRenew: { type: Boolean, default: true },
  pendingOrderId: String, // For tracking pending Cashfree orders
}, { timestamps: true });

export default mongoose.models.Medical || mongoose.model('Medical', MedicalSchema);
