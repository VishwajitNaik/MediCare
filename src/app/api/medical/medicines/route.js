import { NextResponse } from 'next/server';
import Medicine from '../../../../models/Medicine';
import Inventory from '../../../../models/Inventory';
import connectDB from '../../../../lib/mongodb';
import { requireAuth } from '../../../../lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    await requireAuth('MEDICAL');

    const {
      name,
      brandName,
      dosageForm,
      strength,
      unit,
      category = 'GENERAL',
      prescriptionRequired = true,
      isActive = true,
    } = await request.json();

    // Check if medicine already exists
    const existingMedicine = await Medicine.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      brandName: { $regex: new RegExp(`^${brandName}$`, 'i') },
      strength,
    });

    if (existingMedicine) {
      return NextResponse.json(
        { error: 'Medicine with same name, brand, and strength already exists' },
        { status: 400 }
      );
    }

    const medicine = new Medicine({
      name,
      brandName,
      dosageForm,
      strength,
      unit,
      category,
      prescriptionRequired,
      isActive,
    });

    await medicine.save();

    return NextResponse.json({
      message: 'Medicine added successfully',
      medicine: {
        id: medicine._id,
        name: medicine.name,
        brandName: medicine.brandName,
        dosageForm: medicine.dosageForm,
        strength: medicine.strength,
        unit: medicine.unit,
      }
    }, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const medicines = await Medicine.find({ isActive: true }).sort({ name: 1 });

    // Get selling prices from inventory for each medicine
    const medicinesWithPrices = await Promise.all(
      medicines.map(async (medicine) => {
        // Get the latest inventory batch with available stock for this medicine
        const latestInventory = await Inventory.findOne({
          medicalId: user.id,
          medicineId: medicine._id,
          availableStock: { $gt: 0 },
          expiryDate: { $gt: new Date() },
        }).sort({ createdAt: -1 });

        return {
          ...medicine.toObject(),
          sellingPrice: latestInventory ? latestInventory.sellingPrice : 0,
          availableStock: latestInventory ? latestInventory.availableStock : 0,
          batchNumber: latestInventory ? latestInventory.batchNumber : null,
          expiryDate: latestInventory ? latestInventory.expiryDate : null,
        };
      })
    );

    return NextResponse.json({ medicines: medicinesWithPrices });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
