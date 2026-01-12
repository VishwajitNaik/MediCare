import mongoose from 'mongoose';

// Function to generate bill number
function generateBillNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  // Use a counter or random number for uniqueness
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BILL-${dateStr}-${randomNum}`;
}

const saleSchema = new mongoose.Schema(
  {
    medicalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medical',
      required: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },

    billNumber: {
      type: String,
      required: true,
      unique: true,
    },

    items: [
      {
        medicineId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Medicine',
          required: true,
        },

        inventoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Inventory',
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

        sellingPrice: {
          type: Number,
          required: true,
        },

        total: {
          type: Number,
          required: true,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    paymentMode: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD'],
      required: true,
    },

    saleDate: {
      type: Date,
      default: Date.now,
    },

    // For tracking prescription fulfillment
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
    },
  },
  { timestamps: true }
);



export default mongoose.models.Sale || mongoose.model('Sale', saleSchema);
