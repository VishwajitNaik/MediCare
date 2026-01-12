import mongoose from 'mongoose';

const patientMedicineSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },

    medicalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medical',
      required: true,
    },

    // Visit date/time when patient received medicine
    visitDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Array of medicines served in this visit
    medicines: [
      {
        medicineId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Medicine',
          required: true,
        },

        // How medicine should be taken
        dosePerTime: {
          type: String, // "1 tablet", "5 ml"
          required: true,
        },

        timing: [
          {
            type: String,
            enum: [
              'MORNING_BEFORE_FOOD',
              'MORNING_AFTER_FOOD',
              'AFTERNOON_BEFORE_FOOD',
              'AFTERNOON_AFTER_FOOD',
              'NIGHT_BEFORE_FOOD',
              'NIGHT_AFTER_FOOD',
            ],
          },
        ],

        startDate: {
          type: Date,
          required: true,
        },

        durationDays: {
          type: Number,
          required: true,
        },

        totalQuantity: {
          type: Number,
          required: true,
        },

        actualQuantity: {
          type: Number,
          required: true,
        },

        unitPrice: {
          type: Number,
          required: true,
        },

        totalPrice: {
          type: Number,
          required: true,
        },
      },
    ],

    // Overall visit information
    totalAmount: {
      type: Number,
      required: true,
    },

    source: {
      type: String,
      enum: ['DOCTOR_PRESCRIPTION', 'MEDICAL_DIRECT'],
      required: true,
    },

    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
    },

    // Payment status
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'PARTIAL'],
      default: 'PENDING',
    },

    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.PatientMedicine ||
  mongoose.model('PatientMedicine', patientMedicineSchema);
