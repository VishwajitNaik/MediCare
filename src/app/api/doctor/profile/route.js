import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import Doctor from '../../../../models/Doctor';
import connectDB from '../../../../lib/mongodb';

export async function GET(request) {
  try {
    await connectDB();
    const user = await requireAuth('DOCTOR');

    // Fetch doctor profile
    const doctor = await Doctor.findById(user.id).select('name specialty email mobile hospital');

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: doctor._id,
      name: doctor.name,
      specialty: doctor.specialty,
      email: doctor.email,
      mobile: doctor.mobile,
      hospital: doctor.hospital
    });
  } catch (error) {
    console.error('Doctor profile error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
