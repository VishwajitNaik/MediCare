import { NextResponse } from 'next/server';
import Prescription from '../../../../../models/Prescription';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function GET() {
  try {
    await connectDB();
    const user = await requireAuth('DOCTOR');

    const prescriptions = await Prescription.find({ doctor: user.id })
      .populate('patientId', 'name age')
      .sort({ createdAt: -1 });

    return NextResponse.json({ prescriptions });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
