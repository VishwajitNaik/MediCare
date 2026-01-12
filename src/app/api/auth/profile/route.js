import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import Doctor from '../../../../models/Doctor';
import Medical from '../../../../models/Medical';
import connectDB from '../../../../lib/mongodb';

export async function GET() {
  try {
    await connectDB();

    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user data based on role
    let user;
    if (decoded.role === 'DOCTOR') {
      user = await Doctor.findById(decoded.id).select('-password');
    } else if (decoded.role === 'MEDICAL') {
      user = await Medical.findById(decoded.id).select('-password');
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user data
    return NextResponse.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: decoded.role,
      // Add any other fields you want to expose
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
