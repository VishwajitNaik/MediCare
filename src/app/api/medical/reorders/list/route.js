import { NextResponse } from 'next/server';
import ReorderDraft from '../../../../../models/ReorderDraft';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function GET() {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const reorderDrafts = await ReorderDraft.find({
      medicalId: user.id,
      status: 'PENDING'
    })
      .populate('medicineId', 'name brandName strength')
      .populate('supplierId', 'name companyName')
      .sort({ createdAt: -1 });

    return NextResponse.json({ reorderDrafts });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
