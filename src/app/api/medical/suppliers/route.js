import { NextResponse } from 'next/server';
import Supplier from '../../../../models/Supplier';
import connectDB from '../../../../lib/mongodb';
import { requireAuth } from '../../../../lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    await requireAuth('MEDICAL');

    const { name, companyName, mobile, email, address } = await request.json();

    // Check if supplier already exists
    const existingSupplier = await Supplier.findOne({ email });
    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier with this email already exists' },
        { status: 400 }
      );
    }

    const supplier = new Supplier({
      name,
      companyName,
      mobile,
      email,
      address,
    });

    await supplier.save();

    return NextResponse.json({
      message: 'Supplier added successfully',
      supplier: {
        id: supplier._id,
        name: supplier.name,
        companyName: supplier.companyName,
        email: supplier.email,
      }
    }, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    await requireAuth('MEDICAL');

    const suppliers = await Supplier.find({}).sort({ name: 1 });

    return NextResponse.json({ suppliers });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
