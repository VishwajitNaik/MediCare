import { NextResponse } from 'next/server';
import Supplier from '../../../../../models/Supplier';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    await requireAuth('MEDICAL');

    const { id } = params;
    const { name, companyName, mobile, email, address } = await request.json();

    // Check if supplier exists
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Check if another supplier with the same email exists (excluding current supplier)
    if (email && email !== supplier.email) {
      const existingSupplier = await Supplier.findOne({ email, _id: { $ne: id } });
      if (existingSupplier) {
        return NextResponse.json(
          { error: 'Another supplier with this email already exists' },
          { status: 400 }
        );
      }
    }

    // Update supplier
    supplier.name = name || supplier.name;
    supplier.companyName = companyName || supplier.companyName;
    supplier.mobile = mobile || supplier.mobile;
    supplier.email = email || supplier.email;
    supplier.address = address || supplier.address;

    await supplier.save();

    return NextResponse.json({
      message: 'Supplier updated successfully',
      supplier: {
        id: supplier._id,
        name: supplier.name,
        companyName: supplier.companyName,
        email: supplier.email,
        mobile: supplier.mobile,
        address: supplier.address
      }
    });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    await requireAuth('MEDICAL');

    const { id } = params;

    // Check if supplier exists
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Check if supplier has any associated inventory/purchases (optional)
    // You can add this check if needed based on your business logic

    // Delete supplier
    await Supplier.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
