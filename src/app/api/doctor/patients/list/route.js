import { NextResponse } from 'next/server';
import Patient from '../../../../../models/Patient';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function GET() {
  try {
    await connectDB();
    const user = await requireAuth('DOCTOR');

    // Show all patients (unified system) - no doctor-specific filtering
    const patients = await Patient.find({})
      .populate({
        path: 'createdBy',
        select: 'name',
        refPath: 'createdByModel'
      })
      .sort({ createdAt: -1 });

      console.log("patients", patients);
      

    return NextResponse.json({ patients });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
