import mongoose from 'mongoose';

const doctorLeaveSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ['holiday', 'sick', 'emergency', 'personal', 'conference', 'training'],
      default: 'personal',
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medical', // Admin/medical store owner
    },

    approvedAt: {
      type: Date,
    },

    notes: {
      type: String,
      trim: true,
    },

    // For emergency leaves - immediate approval
    isEmergency: {
      type: Boolean,
      default: false,
    },

    // Track who requested the leave
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor', // Usually the doctor themselves
      required: true,
    },

    // Cancellation details
    isCancelled: {
      type: Boolean,
      default: false,
    },

    cancelledAt: {
      type: Date,
    },

    cancellationReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
doctorLeaveSchema.index({ doctorId: 1, startDate: 1, endDate: 1 });
doctorLeaveSchema.index({ isApproved: 1, startDate: 1 });

// Note: Date validation is now handled in the API route for better error control
// Pre-save middleware removed to avoid Mongoose compatibility issues

export default mongoose.models.DoctorLeave || mongoose.model('DoctorLeave', doctorLeaveSchema);
