import mongoose from 'mongoose';

const doctorAvailabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },

    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    },

    startTime: {
      type: String,
      required: function() { return this.isWorkingDay; },
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Start time must be in HH:MM format'
      }
    },

    endTime: {
      type: String,
      required: function() { return this.isWorkingDay; },
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'End time must be in HH:MM format'
      }
    },

    slotDuration: {
      type: Number,
      default: 15, // minutes
      min: 5,
      max: 60,
    },

    breakStart: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Break start time must be in HH:MM format'
      }
    },

    breakEnd: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Break end time must be in HH:MM format'
      }
    },

    isWorkingDay: {
      type: Boolean,
      default: true,
    },

    maxPatientsPerDay: {
      type: Number,
      default: 20,
      min: 1,
    },

    // Override for specific dates (holidays, special schedules)
    dateOverride: {
      type: Date,
    },

    isOverrideActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index to ensure one schedule per doctor per day
doctorAvailabilitySchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });

// Index for efficient queries
doctorAvailabilitySchema.index({ doctorId: 1, isWorkingDay: 1 });

export default mongoose.models.DoctorAvailability || mongoose.model('DoctorAvailability', doctorAvailabilitySchema);
