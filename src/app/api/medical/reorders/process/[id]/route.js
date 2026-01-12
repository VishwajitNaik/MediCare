import { NextResponse } from 'next/server';
import ReorderDraft from '../../../../../../models/ReorderDraft';
import Purchase from '../../../../../../models/Purchase';
import Inventory from '../../../../../../models/Inventory';
import connectDB from '../../../../../../lib/mongodb';
import { requireAuth } from '../../../../../../lib/auth';
import mongoose from 'mongoose';

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  try {
    return mongoose.Types.ObjectId.isValid(id);
  } catch (error) {
    return false;
  }
};

export async function POST(request, { params }) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');
    const { id } = await params;
    const { action } = await request.json(); // 'order' or 'ignore'

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return NextResponse.json({ 
        error: 'Invalid reorder draft ID format',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    // Find the reorder draft
    const reorderDraft = await ReorderDraft.findOne({
      _id: id,
      medicalId: user.id,
      status: 'PENDING'
    }).populate('medicineId supplierId');

    if (!reorderDraft) {
      return NextResponse.json({ error: 'Reorder draft not found' }, { status: 404 });
    }

    if (action === 'ignore') {
      // Mark as ignored
      reorderDraft.status = 'IGNORED';
      await reorderDraft.save();

      return NextResponse.json({
        message: 'Reorder draft ignored',
        reorderDraft: reorderDraft
      });
    }

    if (action === 'order') {
      // Generate a temporary invoice number
      const invoiceNumber = `AUTO-${Date.now()}`;

      // Create the purchase record
      const purchase = new Purchase({
        medicalId: user.id,
        supplierId: reorderDraft.supplierId._id,
        invoiceNumber,
        items: [{
          medicineId: reorderDraft.medicineId._id,
          batchNumber: `AUTO-${Date.now()}`, // Auto-generated batch
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          quantity: reorderDraft.suggestedQuantity,
          purchasePrice: 0, // Will be set when actually received
          total: 0,
        }],
        totalPurchaseAmount: 0, // Will be calculated when received
        status: 'PENDING', // Waiting for delivery
      });

      await purchase.save();

      // Mark reorder draft as ordered
      reorderDraft.status = 'ORDERED';
      await reorderDraft.save();

      return NextResponse.json({
        message: 'Purchase order created from reorder draft',
        purchase: {
          id: purchase._id,
          invoiceNumber: purchase.invoiceNumber,
          supplierName: reorderDraft.supplierId.name,
          medicineName: reorderDraft.medicineId.name,
          quantity: reorderDraft.suggestedQuantity,
        },
        reorderDraft: reorderDraft
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Reorder processing error:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === 'CastError') {
      return NextResponse.json({ 
        error: 'Invalid ObjectId format',
        code: 'CAST_ERROR'
      }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
