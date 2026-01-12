import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Medical from '../../../../../models/Medical';
import connectDB from '../../../../../lib/mongodb';

export async function POST(request) {
  try {
    await connectDB();
    const { mobile, password } = await request.json();

    // Find medical staff by mobile
    const medical = await Medical.findOne({ mobile });
    if (!medical) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, medical.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: medical._id, role: 'MEDICAL' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    const response = NextResponse.json({
      message: 'Login successful',
      medical: { id: medical._id, name: medical.name, email: medical.email }
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
