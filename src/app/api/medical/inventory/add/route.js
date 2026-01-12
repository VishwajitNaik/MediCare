import { NextResponse } from 'next/server';
import Inventory from '../../../../../models/Inventory';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const {
      medicineId,
      supplierId,
      batchNumber,
      expiryDate,
      purchasePrice,
      sellingPrice,
      totalStock,
      reorderLevel = 10,
    } = await request.json();

    // Check if inventory already exists for this medicine and batch
    let inventory = await Inventory.findOne({
      medicalId: user.id,
      medicineId,
      batchNumber,
    });

    if (inventory) {
      // Update existing inventory
      inventory.totalStock += totalStock;
      inventory.availableStock += totalStock;
    } else {
      // Create new inventory entry
      inventory = new Inventory({
        medicalId: user.id,
        medicineId,
        supplierId,
        batchNumber,
        expiryDate: new Date(expiryDate),
        purchasePrice,
        sellingPrice,
        totalStock,
        availableStock: totalStock,
        reorderLevel,
      });
    }

    await inventory.save();

    return NextResponse.json({
      message: 'Inventory updated successfully',
      inventory: {
        id: inventory._id,
        medicineId: inventory.medicineId,
        batchNumber: inventory.batchNumber,
        expiryDate: inventory.expiryDate,
        totalStock: inventory.totalStock,
        availableStock: inventory.availableStock,
        reorderLevel: inventory.reorderLevel,
      },
    }, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
