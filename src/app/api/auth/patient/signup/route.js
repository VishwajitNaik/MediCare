import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Patient from '../../../../../models/Patient';
import connectDB from '../../../../../lib/mongodb';

export async function POST(request) {
  try {
    await connectDB();
    const { action, mobile, otp, name, email, password, age, gender } = await request.json();

    // Step 1: Check mobile and get patient info
    if (action === 'check_mobile') {
      if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
        return NextResponse.json({
          error: 'Valid 10-digit mobile number required'
        }, { status: 400 });
      }

      const existingPatient = await Patient.findOne({ mobile });

      if (existingPatient) {
        // Patient exists - return info for account activation
        return NextResponse.json({
          patientExists: true,
          patient: {
            id: existingPatient._id,
            name: existingPatient.name,
            age: existingPatient.age,
            gender: existingPatient.gender,
            medicalHistory: existingPatient.medicalHistory,
            createdByModel: existingPatient.createdByModel
          }
        });
      } else {
        // New patient - allow full registration
        return NextResponse.json({
          patientExists: false
        });
      }
    }

    // Step 2: Verify OTP before proceeding
    if (action === 'verify_otp') {
      // OTP verification is handled by the OTP API
      // This is just to confirm the flow
      return NextResponse.json({
        message: 'OTP verification step completed'
      });
    }

    // Step 3: Create or activate account
    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
      return NextResponse.json({
        error: 'Valid 10-digit mobile number required'
      }, { status: 400 });
    }

    // Validate required fields
    if (!name || !mobile || !password) {
      return NextResponse.json({
        error: 'Name, mobile, and password are required'
      }, { status: 400 });
    }

    // Check if patient already exists with this mobile
    const existingPatient = await Patient.findOne({ mobile });

    if (existingPatient) {
      // If patient exists and already has a password, they can't sign up again
      if (existingPatient.password) {
        return NextResponse.json({
          error: 'An account with this mobile number already exists. Please sign in instead.',
          code: 'ACCOUNT_EXISTS'
        }, { status: 409 });
      }

      // If patient exists but no password, they can activate their account
      // Update their information and set password
      const hashedPassword = await bcrypt.hash(password, 10);

      const updateData = {
        password: hashedPassword,
        isActive: true,
        createdByModel: 'Patient' // Mark as self-registered
      };

      // Update email if provided and not already set
      if (email && !existingPatient.email) {
        updateData.email = email;
      }

      // Update other fields if they differ
      if (name !== existingPatient.name) updateData.name = name;
      if (age && age !== existingPatient.age) updateData.age = age;
      if (gender && gender !== existingPatient.gender) updateData.gender = gender;

      const updatedPatient = await Patient.findOneAndUpdate(
        { _id: existingPatient._id },
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedPatient) {
        throw new Error('Failed to update patient record');
      }

      console.log('Updated patient:', {
        id: updatedPatient._id,
        name: updatedPatient.name,
        email: updatedPatient.email,
        hasPassword: !!updatedPatient.password,
        isActive: updatedPatient.isActive,
        createdByModel: updatedPatient.createdByModel,
        updateData: updateData
      });

      return NextResponse.json({
        message: 'Account activated successfully! Your existing medical records are now linked to your account.',
        patient: {
          id: updatedPatient._id,
          name: updatedPatient.name,
          mobile: updatedPatient.mobile,
          email: updatedPatient.email
        }
      }, { status: 201 });

    } else {
      // Create new patient account
      // Check if email is already taken (if provided)
      if (email) {
        const emailExists = await Patient.findOne({ email });
        if (emailExists) {
          return NextResponse.json({
            error: 'Email is already registered. Please use a different email or sign in.',
            code: 'EMAIL_EXISTS'
          }, { status: 409 });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new patient
      const patient = new Patient({
        name,
        mobile,
        email: email || undefined, // Optional email
        password: hashedPassword,
        age: parseInt(age),
        gender,
        isActive: true,
        createdByModel: 'Patient', // Self-registered
      });

      await patient.save();

      return NextResponse.json({
        message: 'Account created successfully! Welcome to your personal health portal.',
        patient: {
          id: patient._id,
          name: patient.name,
          mobile: patient.mobile,
          email: patient.email
        }
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Patient signup error:', error);

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern?.mobile) {
        return NextResponse.json({
          error: 'Mobile number already exists',
          code: 'DUPLICATE_MOBILE'
        }, { status: 409 });
      }
      if (error.keyPattern?.email) {
        return NextResponse.json({
          error: 'Email already exists',
          code: 'DUPLICATE_EMAIL'
        }, { status: 409 });
      }
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({
        error: `Validation failed: ${validationErrors.join(', ')}`,
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
