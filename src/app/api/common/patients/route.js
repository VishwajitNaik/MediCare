import { NextResponse } from 'next/server';
import Patient from '../../../../models/Patient';
import connectDB from '../../../../lib/mongodb';
import { requireAuth } from '../../../../lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    await requireAuth(); // Any logged in user

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = {};
    if (search && search.length >= 2) {
      // Search by name or mobile number
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const patients = await Patient.find(query)
      .sort({ name: 1 })
      .limit(search ? 10 : 100); // Limit results for search

    return NextResponse.json({ patients });
  } catch (error) {
    console.error('Patients fetch error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const user = await requireAuth(); // Allow both doctors and medical staff to create patients

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
      // No doctor field - created by medical staff
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
