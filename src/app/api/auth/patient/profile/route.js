import { NextResponse } from 'next/server';
import Patient from '../../../../../models/Patient';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const user = await requireAuth('PATIENT');

    // Get patient profile
    const patient = await Patient.findById(user.id).select('-password');

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Return patient profile
    return NextResponse.json({
      patient: {
        id: patient._id,
        name: patient.name,
        mobile: patient.mobile,
        email: patient.email,
        age: patient.age,
        gender: patient.gender,
        medicalHistory: patient.medicalHistory,
        isActive: patient.isActive,
        emailVerified: patient.emailVerified,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
        // Include creation info if available
        createdBy: patient.createdBy,
        createdByModel: patient.createdByModel
      }
    });

  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Patient profile error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const user = await requireAuth('PATIENT');

    const { name, email, age, gender, medicalHistory } = await request.json();

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (age !== undefined) updateData.age = parseInt(age);
    if (gender !== undefined) updateData.gender = gender;
    if (medicalHistory !== undefined) updateData.medicalHistory = medicalHistory;

    // Check if email is being changed and if it's already taken
    if (email !== undefined) {
      const existingPatient = await Patient.findOne({
        email,
        _id: { $ne: user.id }
      });
      if (existingPatient) {
        return NextResponse.json({
          error: 'Email is already registered by another user',
          code: 'EMAIL_EXISTS'
        }, { status: 409 });
      }
    }

    // Update patient profile
    const updatedPatient = await Patient.findByIdAndUpdate(
      user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedPatient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      patient: {
        id: updatedPatient._id,
        name: updatedPatient.name,
        mobile: updatedPatient.mobile,
        email: updatedPatient.email,
        age: updatedPatient.age,
        gender: updatedPatient.gender,
        medicalHistory: updatedPatient.medicalHistory,
        isActive: updatedPatient.isActive,
        emailVerified: updatedPatient.emailVerified,
        updatedAt: updatedPatient.updatedAt
      }
    });

  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({
        error: `Validation failed: ${validationErrors.join(', ')}`,
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Handle MongoDB duplicate key errors
    if (error.code === 11000 && error.keyPattern?.email) {
      return NextResponse.json({
        error: 'Email is already registered',
        code: 'DUPLICATE_EMAIL'
      }, { status: 409 });
    }

    console.error('Patient profile update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
