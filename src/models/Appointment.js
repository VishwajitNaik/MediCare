import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },

    appointmentDate: {
      type: Date,
      required: true,
    },

    slotTime: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Slot time must be in HH:MM format'
      }
    },

    duration: {
      type: Number,
      default: 15, // minutes - matches slot duration
      min: 5,
      max: 120,
    },

    type: {
      type: String,
      enum: ['new', 'follow-up', 'review', 'emergency'],
      default: 'new',
    },

    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },

    reason: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    // Token number for the day
    tokenNumber: {
      type: Number,
      min: 1,
    },

    // For rescheduling
    originalAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },

    // Appointment fee (if applicable)
    fee: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
    },

    // Location/clinic information
    clinicAddress: {
      type: String,
    },

    // Virtual appointment details (future use)
    isVirtual: {
      type: Boolean,
      default: false,
    },

    meetingLink: {
      type: String,
    },

    // Cancellation details
    cancelledAt: {
      type: Date,
    },

    cancellationReason: {
      type: String,
    },

    cancelledBy: {
      type: String,
      enum: ['patient', 'doctor', 'system'],
    },

    // Reminder settings
    reminderSent: {
      type: Boolean,
      default: false,
    },

    reminderSentAt: {
      type: Date,
    },

    // Check-in details
    checkedInAt: {
      type: Date,
    },

    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medical', // Receptionist/medical staff
    },

    // Consultation details
    consultationStartedAt: {
      type: Date,
    },

    consultationCompletedAt: {
      type: Date,
    },

    // Follow-up appointment suggestion
    suggestedFollowUpDate: {
      type: Date,
    },

    followUpReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Compound index to prevent double booking
appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, appointmentTime: 1 },
  { unique: true, sparse: true }
);

// Index for efficient queries
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });

export default mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
