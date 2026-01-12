import { NextResponse } from 'next/server';
import Patient from '../../../../models/Patient';
import connectDB from '../../../../lib/mongodb';
import { requireAuth } from '../../../../lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    // Allow both doctors and medical staff to search patients in unified system
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || ''; // Search query (mobile or name), default to empty

    let patients;
    if (query.trim()) {
      // If query provided, search by mobile or name
      patients = await Patient.find({
        $or: [
          { mobile: { $regex: query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } },
        ],
      }).limit(50); // Limit search results

      console.log("patient", patients);
      

    } else {
      // If no query, return all patients (for "Load All Patients" functionality)
      patients = await Patient.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json({ patients });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const { name, mobile, age, gender, medicalHistory } = await request.json();

    // Check if patient already exists
    const existingPatient = await Patient.findOne({ mobile });
    if (existingPatient) {
      return NextResponse.json(
        { error: 'Patient with this mobile number already exists' },
        { status: 400 }
      );
    }

    const patient = new Patient({
      name,
      mobile,
      age,
      gender,
      medicalHistory,
      createdBy: user.id,
      createdByModel: 'Medical',
    });

    await patient.save();

    return NextResponse.json({
      message: 'Patient created successfully',
      patient: {
        id: patient._id,
        name: patient.name,
        mobile: patient.mobile,
        age: patient.age,
        gender: patient.gender,
      }
    }, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
