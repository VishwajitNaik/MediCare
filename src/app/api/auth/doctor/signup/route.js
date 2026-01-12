import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Doctor from '../../../../../models/Doctor';
import connectDB from '../../../../../lib/mongodb';

export async function POST(request) {
  try {
    await connectDB();
    const { email, mobile, password, name, specialty, licenseNumber, hospital, experience } = await request.json();

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ $or: [{ email }, { mobile }] });
    if (existingDoctor) {
      return NextResponse.json({ error: 'Doctor already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create doctor
    const doctor = new Doctor({
      email,
      mobile,
      password: hashedPassword,
      name,
      specialty,
      licenseNumber,
      hospital,
      experience: parseInt(experience),
    });

    await doctor.save();

    return NextResponse.json({ message: 'Doctor registered successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
