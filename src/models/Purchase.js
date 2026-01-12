import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema(
  {
    medicalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medical',
      required: true,
    },

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
    },

    items: [
      {
        medicineId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Medicine',
          required: true,
        },

        batchNumber: {
          type: String,
          required: true,
        },

        expiryDate: {
          type: Date,
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        purchasePrice: {
          type: Number,
          required: true,
        },

        total: {
          type: Number,
          required: true,
        },
      },
    ],

    totalPurchaseAmount: {
      type: Number,
      required: true,
    },

    purchaseDate: {
      type: Date,
      default: Date.now,
    },

    // Status for tracking purchase processing
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

// Ensure invoice number is unique per medical store
purchaseSchema.index({ medicalId: 1, invoiceNumber: 1 }, { unique: true });

export default mongoose.models.Purchase || mongoose.model('Purchase', purchaseSchema);
