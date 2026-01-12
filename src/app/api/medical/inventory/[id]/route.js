import { NextResponse } from 'next/server';
import Inventory from '../../../../../models/Inventory';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';
import mongoose from 'mongoose';

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  try {
    return mongoose.Types.ObjectId.isValid(id);
  } catch (error) {
    return false;
  }
};

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');
    const { id } = await params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return NextResponse.json({ 
        error: 'Invalid inventory ID format',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    const {
      batchNumber,
      expiryDate,
      purchasePrice,
      sellingPrice,
      reorderLevel,
      // Note: medicineId, supplierId, and totalStock cannot be changed
      // as they affect inventory tracking and stock calculations
    } = await request.json();

    const inventory = await Inventory.findOneAndUpdate(
      { _id: id, medicalId: user.id },
      {
        batchNumber,
        expiryDate: new Date(expiryDate),
        purchasePrice,
        sellingPrice,
        reorderLevel,
      },
      { new: true }
    );

    if (!inventory) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Inventory updated successfully',
      inventory
    });
  } catch (error) {
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

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');
    const { id } = await params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return NextResponse.json({ 
        error: 'Invalid inventory ID format',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    // Check if inventory has any available stock before deletion
    const inventory = await Inventory.findOne({ _id: id, medicalId: user.id });

    if (!inventory) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    if (inventory.availableStock > 0) {
      return NextResponse.json({
        error: 'Cannot delete inventory with available stock. Please ensure all stock is dispensed first.'
      }, { status: 400 });
    }

    await Inventory.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Inventory deleted successfully' });
  } catch (error) {
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
