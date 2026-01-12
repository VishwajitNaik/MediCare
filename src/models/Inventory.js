import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    medicalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medical',
      required: true,
    },

    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },

    batchNumber: {
      type: String,
      required: true,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    purchasePrice: {
      type: Number,
      required: true,
    },

    sellingPrice: {
      type: Number,
      required: true,
    },

    totalStock: {
      type: Number,
      required: true,
    },

    availableStock: {
      type: Number,
      required: true,
    },

    reorderLevel: {
      type: Number,
      default: 10, // alert threshold
    },

    // Auto-reorder fields
    avgDailyConsumption: {
      type: Number,
      default: 0, // auto calculated from sales data
    },

    lastSoldDate: {
      type: Date,
    },

    autoReorderEnabled: {
      type: Boolean,
      default: true,
    },

    preferredSupplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },

    // Expiry management fields
    discountPercent: {
      type: Number,
      default: 0,
    },

    discountedPrice: {
      type: Number,
    },

    expiryStatus: {
      type: String,
      enum: ["SAFE", "NEAR_EXPIRY", "EXPIRED"],
      default: "SAFE",
    },

    saleLocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Inventory ||
  mongoose.model('Inventory', inventorySchema);
