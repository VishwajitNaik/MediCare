import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Patient from '../../../../../models/Patient';
import connectDB from '../../../../../lib/mongodb';

export async function POST(request) {
  try {
    await connectDB();
    const { identifier, password } = await request.json();

    // Find patient by mobile or email
    const patient = await Patient.findOne({
      $or: [
        { mobile: identifier },
        { email: identifier }
      ]
    });

    if (!patient) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if patient has a password (account created)
    if (!patient.password) {
      return NextResponse.json({
        error: 'Account not activated. Please contact your healthcare provider to set up your account.',
        code: 'ACCOUNT_NOT_ACTIVATED'
      }, { status: 403 });
    }

    // Check if account is active
    if (!patient.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, patient.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: patient._id, role: 'PATIENT' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    const response = NextResponse.json({
      message: 'Login successful',
      patient: {
        id: patient._id,
        name: patient.name,
        mobile: patient.mobile,
        email: patient.email
      }
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Patient signin error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
