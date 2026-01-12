import mongoose from 'mongoose';

const doseTrackingSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },

    patientMedicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientMedicine',
      required: true,
    },

    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },

    // Dose schedule information
    doseDate: {
      type: Date,
      required: true, // Date when dose should be taken
    },

    doseTime: {
      type: String,
      required: true, // Time when dose should be taken (HH:MM format)
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Dose time must be in HH:MM format'
      }
    },

    timing: {
      type: String,
      required: true,
      enum: [
        'MORNING_BEFORE_FOOD',
        'MORNING_AFTER_FOOD',
        'AFTERNOON_BEFORE_FOOD',
        'AFTERNOON_AFTER_FOOD',
        'NIGHT_BEFORE_FOOD',
        'NIGHT_AFTER_FOOD',
      ],
    },

    doseAmount: {
      type: String,
      required: true, // e.g., "1 tablet", "5 ml"
    },

    // Status tracking
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'MISSED', 'SKIPPED'],
      default: 'PENDING',
    },

    // Completion details
    completedAt: {
      type: Date,
    },

    completedBy: {
      type: String,
      enum: ['PATIENT', 'SYSTEM'],
      default: 'PATIENT',
    },

    // Notes for skipped/missed doses
    notes: {
      type: String,
    },

    // Notification tracking
    notificationSent: {
      type: Boolean,
      default: false,
    },

    notificationSentAt: {
      type: Date,
    },

    // Reminder settings
    reminderEnabled: {
      type: Boolean,
      default: true,
    },

    reminderMinutes: {
      type: Number,
      default: 15, // Minutes before dose time to send reminder
    },
  },
  { timestamps: true }
);

// Compound index to ensure unique dose per patient per medicine per date/time
doseTrackingSchema.index(
  { patientId: 1, medicineId: 1, doseDate: 1, doseTime: 1 },
  { unique: true }
);

// Index for efficient queries
doseTrackingSchema.index({ patientId: 1, doseDate: 1, status: 1 });
doseTrackingSchema.index({ doseDate: 1, doseTime: 1, status: 1 });

export default mongoose.models.DoseTracking || mongoose.model('DoseTracking', doseTrackingSchema);
