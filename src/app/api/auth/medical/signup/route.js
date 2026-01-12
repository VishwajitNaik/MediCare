import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Medical from '../../../../../models/Medical';
import connectDB from '../../../../../lib/mongodb';

export async function POST(request) {
  try {
    await connectDB();
    const { email, mobile, password, name, department, designation, employeeId } = await request.json();

    // Check if medical staff already exists
    const existingMedical = await Medical.findOne({ $or: [{ email }, { mobile }] });
    if (existingMedical) {
      return NextResponse.json({ error: 'Medical staff already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create medical staff
    const medical = new Medical({
      email,
      mobile,
      password: hashedPassword,
      name,
      department,
      designation,
      employeeId,
    });

    await medical.save();

    return NextResponse.json({ message: 'Medical staff registered successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
