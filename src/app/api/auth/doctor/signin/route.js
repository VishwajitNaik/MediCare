import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Doctor from '../../../../../models/Doctor';
import connectDB from '../../../../../lib/mongodb';

export async function POST(request) {
  try {
    await connectDB();
    const { mobile, password } = await request.json();

    // Find doctor by mobile
    const doctor = await Doctor.findOne({ mobile });
    if (!doctor) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, doctor.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: doctor._id, role: 'DOCTOR' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    const response = NextResponse.json({
      message: 'Login successful',
      doctor: { id: doctor._id, name: doctor.name, email: doctor.email }
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
