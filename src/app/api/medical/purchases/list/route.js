import { NextResponse } from 'next/server';
import Purchase from '../../../../../models/Purchase';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function GET() {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const purchases = await Purchase.find({ medicalId: user.id })
      .populate('supplierId', 'name companyName')
      .populate('items.medicineId', 'name brandName strength')
      .sort({ createdAt: -1 }); // Most recent first

    return NextResponse.json({ purchases });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
