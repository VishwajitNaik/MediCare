import { NextResponse } from 'next/server';
import Medicine from '../../../../models/Medicine';
import connectDB from '../../../../lib/mongodb';
import { requireAuth } from '../../../../lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    await requireAuth(); // Any logged in user

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = {};
    if (search && search.trim()) {
      // Search in name, brandName, and category
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { brandName: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const medicines = await Medicine.find(query).sort({ name: 1 });

    return NextResponse.json({ medicines });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
