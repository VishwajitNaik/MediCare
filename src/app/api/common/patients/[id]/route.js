import { NextResponse } from 'next/server';
import Patient from '../../../../../models/Patient';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';
import mongoose from 'mongoose';

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  try {
    return mongoose.Types.ObjectId.isValid(id);
  } catch (error) {
    return false;
  }
};

export async function GET(request, { params }) {
  try {
    await connectDB();
    await requireAuth(); // Any logged in user (doctor or medical)

    const { id } = await params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return NextResponse.json({ 
        error: 'Invalid patient ID format',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === 'CastError') {
      return NextResponse.json({ 
        error: 'Invalid ObjectId format',
        code: 'CAST_ERROR'
      }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
