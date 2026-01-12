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
    const user = await requireAuth('DOCTOR');
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
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
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

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const user = await requireAuth('DOCTOR');
    const { id } = await params;
    
    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return NextResponse.json({ 
        error: 'Invalid patient ID format',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    const { name, age, gender, medicalHistory } = await request.json();

    const patient = await Patient.findByIdAndUpdate(
      id,
      { name, age, gender, medicalHistory },
      { new: true }
    );

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Patient updated', patient });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
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

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const user = await requireAuth('DOCTOR');
    const { id } = await params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return NextResponse.json({ 
        error: 'Invalid patient ID format',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    const patient = await Patient.findByIdAndDelete(id);
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Patient deleted' });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
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
