import { NextResponse } from 'next/server';
import Prescription from '../../../../../models/Prescription';
import Inventory from '../../../../../models/Inventory';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const { prescriptionId } = await request.json();

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription || prescription.fulfilled) {
      return NextResponse.json({ error: 'Prescription not found or already fulfilled' }, { status: 404 });
    }

    // Process each medicine in the prescription using FIFO
    for (const med of prescription.medicines) {
      const requiredQuantity = med.totalQuantity;

      // Find available inventory for this medicine (FIFO by expiry date)
      const availableInventory = await Inventory.find({
        medicalId: user.id,
        medicineId: med.medicine,
        availableStock: { $gt: 0 },
        expiryDate: { $gt: new Date() }, // Not expired
      }).sort({ expiryDate: 1 }); // FIFO - earliest expiry first

      let remainingQuantity = requiredQuantity;

      for (const inventory of availableInventory) {
        if (remainingQuantity <= 0) break;

        const deductQuantity = Math.min(remainingQuantity, inventory.availableStock);

        inventory.availableStock -= deductQuantity;
        remainingQuantity -= deductQuantity;

        await inventory.save();
      }

      if (remainingQuantity > 0) {
        return NextResponse.json({
          error: `Insufficient stock for ${med.medicineName || 'medicine'}. Required: ${requiredQuantity}, Available: ${requiredQuantity - remainingQuantity}`
        }, { status: 400 });
      }
    }

    // Update prescription as fulfilled
    prescription.fulfilled = true;
    prescription.fulfilledAt = new Date();
    prescription.fulfilledBy = user.id;
    await prescription.save();

    return NextResponse.json({ message: 'Prescription fulfilled successfully' });
  } catch (error) {
    console.error('Prescription fulfillment error:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
