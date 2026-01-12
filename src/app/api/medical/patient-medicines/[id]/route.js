import { NextResponse } from 'next/server';
import PatientMedicine from '../../../../../models/PatientMedicine';
import Sale from '../../../../../models/Sale';
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

// GET - Get specific patient medicine record
export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');
    const { id } = await params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return NextResponse.json({ 
        error: 'Invalid patient medicine ID format',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    const patientMedicine = await PatientMedicine.findOne({
      _id: id,
      medicalId: user.id
    })
    .populate('patientId', 'name mobile age gender')
    .populate('medicines.medicineId', 'name brandName strength');

    if (!patientMedicine) {
      return NextResponse.json({ error: 'Patient medicine record not found' }, { status: 404 });
    }

    return NextResponse.json({ patientMedicine });
  } catch (error) {
    console.error('Get patient medicine error:', error);
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

// PUT - Update patient medicine record (for payment status)
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');
    const { id } = await params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return NextResponse.json({ 
        error: 'Invalid patient medicine ID format',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    const { paymentStatus, paymentMode, notes } = await request.json();

    const patientMedicine = await PatientMedicine.findOneAndUpdate(
      { _id: id, medicalId: user.id },
      {
        paymentStatus,
        paymentMode,
        notes,
        ...(paymentStatus === 'PAID' && { paymentCompletedAt: new Date() })
      },
      { new: true }
    )
    .populate('patientId', 'name mobile age gender')
    .populate('medicines.medicineId', 'name brandName strength');

    if (!patientMedicine) {
      return NextResponse.json({ error: 'Patient medicine record not found' }, { status: 404 });
    }

    // If payment is completed, create a Sale record for accounting
    if (paymentStatus === 'PAID' && paymentMode) {
      try {
        // Check if sale already exists
        const existingSale = await Sale.findOne({ prescriptionId: id });
        if (!existingSale) {
          console.log('Creating Sale record for PatientMedicine:', id);

          // Generate bill number manually
          const today = new Date();
          const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
          const count = await Sale.countDocuments({
            saleDate: {
              $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
              $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
            },
            medicalId: user.id
          });
          const billNumber = `BILL-${dateStr}-${String(count + 1).padStart(4, '0')}`;
          console.log('Generated bill number:', billNumber);

          // Prepare sale data
          const saleData = {
            medicalId: user.id,
            patientId: patientMedicine.patientId._id || patientMedicine.patientId,
            billNumber,
            items: patientMedicine.medicines.map(med => ({
              medicineId: med.medicineId._id || med.medicineId,
              inventoryId: med.medicineId._id || med.medicineId,
              quantity: med.actualQuantity,
              purchasePrice: Math.round((med.unitPrice * 0.7) * 100) / 100,
              sellingPrice: med.unitPrice,
              total: med.totalPrice,
            })),
            totalAmount: patientMedicine.totalAmount,
            paymentMode,
            prescriptionId: id,
          };

          console.log('Sale data to create:', JSON.stringify(saleData, null, 2));

          // Create and save sale
          const sale = new Sale(saleData);
          console.log('Sale object created');

          const savedSale = await sale.save();
          console.log('Sale saved successfully:', savedSale._id);
        } else {
          console.log('Sale already exists for this PatientMedicine');
        }
      } catch (saleError) {
        console.error('Error creating Sale record:', saleError);
        // Don't fail the payment update if sale creation fails
        // Log the error but continue
      }
    }

    return NextResponse.json({
      message: 'Patient medicine updated successfully',
      patientMedicine
    });
  } catch (error) {
    console.error('Update patient medicine error:', error);
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
