import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import Medical from '../../../../models/Medical';
import connectDB from '../../../../lib/mongodb';

export async function GET(request) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    // Fetch medical profile
    const medical = await Medical.findById(user.id).select('name specialty email mobile hospital');

    if (!medical) {
      return NextResponse.json({ error: 'Medical user not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: medical._id,
      name: medical.name,
      specialty: medical.specialty,
      email: medical.email,
      mobile: medical.mobile,
      hospital: medical.hospital
    });
  } catch (error) {
    console.error('Medical profile error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
