import { NextResponse } from 'next/server';
import Sale from '../../../../../../models/Sale';
import connectDB from '../../../../../../lib/mongodb';
import { requireAuth } from '../../../../../../lib/auth';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Prescription ID is required' }, { status: 400 });
    }

    // Find all sales for this prescription
    const sales = await Sale.find({
      prescriptionId: id,
      medicalId: user.id // Only sales by this medical user
    })
    .populate('patientId', 'name mobile')
    .populate('items.medicineId', 'name brandName strength')
    .populate('medicalId', 'name')
    .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      sales
    });

  } catch (error) {
    console.error('Medical sales by prescription fetch error:', error);

    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}