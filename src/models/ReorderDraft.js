import mongoose from 'mongoose';

const reorderDraftSchema = new mongoose.Schema(
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
      required: true,
    },

    suggestedQuantity: {
      type: Number,
      required: true,
    },

    reason: {
      type: String,
      enum: ['LOW_STOCK', 'FAST_MOVING', 'EXPIRING_SOON'],
      required: true,
    },

    status: {
      type: String,
      enum: ['PENDING', 'ORDERED', 'IGNORED'],
      default: 'PENDING',
    },

    daysLeft: {
      type: Number,
      default: 0,
    },

    avgDailyConsumption: {
      type: Number,
      default: 0,
    },

    currentStock: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate reorder drafts
reorderDraftSchema.index({
  medicalId: 1,
  medicineId: 1,
  status: 1
}, {
  unique: true,
  partialFilterExpression: { status: 'PENDING' }
});

export default mongoose.models.ReorderDraft ||
  mongoose.model('ReorderDraft', reorderDraftSchema);
