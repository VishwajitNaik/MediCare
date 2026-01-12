import { NextResponse } from 'next/server';
import Patient from '../../../../../models/Patient';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const user = await requireAuth('DOCTOR');

    const { name, mobile, age, gender, medicalHistory } = await request.json();

    // Check if patient already exists with this mobile number
    const existingPatient = await Patient.findOne({ mobile });
    if (existingPatient) {
      return NextResponse.json({
        error: 'Patient with this mobile number already exists. All healthcare providers can access this patient.',
        patient: {
          id: existingPatient._id,
          name: existingPatient.name,
          age: existingPatient.age,
          gender: existingPatient.gender,
        },
        code: 'PATIENT_EXISTS'
      }, { status: 409 });
    }

    const patient = new Patient({
      name,
      mobile,
      age,
      gender,
      medicalHistory,
      createdBy: user.id,
      createdByModel: 'Doctor',
    });

    await patient.save();

    return NextResponse.json({
      message: 'Patient created successfully. This patient can now be accessed by all healthcare providers.',
      patient: {
        id: patient._id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
      }
    }, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Handle MongoDB duplicate key error
    if (error.code === 11000 && error.keyPattern?.mobile) {
      return NextResponse.json({
        error: 'A patient with this mobile number already exists',
        code: 'DUPLICATE_MOBILE'
      }, { status: 409 });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({
        error: `Validation failed: ${validationErrors.join(', ')}`,
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    console.error('Patient creation error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
