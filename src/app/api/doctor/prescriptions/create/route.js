import { NextResponse } from 'next/server';
import Prescription from '../../../../../models/Prescription';
import Patient from '../../../../../models/Patient';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const user = await requireAuth('DOCTOR');

    const { patientId, medicines } = await request.json();

    // Verify patient exists and can be accessed by this doctor
    // Doctors can create prescriptions for patients they created or any patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Optional: Check if doctor has permission to create prescriptions for this patient
    // For now, allow any doctor to create prescriptions for any patient

    const prescription = new Prescription({
      patientId,
      doctor: user.id,
      medicines,
    });

    await prescription.save();

    return NextResponse.json({
      message: 'Prescription created successfully',
      prescription: {
        id: prescription._id,
        patientId: prescription.patientId,
        medicines: prescription.medicines,
        fulfilled: prescription.fulfilled,
      }
    }, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
