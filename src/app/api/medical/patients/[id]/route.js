import { NextResponse } from 'next/server';
import Patient from '../../../../../models/Patient';
import PatientMedicine from '../../../../../models/PatientMedicine';
import Sale from '../../../../../models/Sale';
import Prescription from '../../../../../models/Prescription';
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
    const user = await requireAuth(); // Allow both doctors and medical staff to read patient info

    const { id } = await params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        error: 'Invalid patient ID format',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    // Fetch patient details
    const patient = await Patient.findById(id);
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Fetch patient medicines history
    const patientMedicines = await PatientMedicine.find({ patientId: id })
      .populate('medicalId', 'name')
      .populate('medicines.medicineId', 'name brandName strength dosageForm')
      .populate('prescriptionId')
      .sort({ visitDate: -1 });

    // Fetch sales/purchases history
    const sales = await Sale.find({ patientId: id })
      .populate('medicalId', 'name')
      .populate('items.medicineId', 'name brandName strength')
      .populate('prescriptionId')
      .sort({ saleDate: -1 });

    // Fetch all prescriptions (both fulfilled and unfulfilled)
    const prescriptions = await Prescription.find({ patientId: id })
      .populate('doctor', 'name specialization')
      .populate('medicines.medicine', 'name brandName strength')
      .populate('fulfilledBy', 'name')
      .sort({ date: -1 });

    return NextResponse.json({
      patient,
      history: {
        medicines: patientMedicines,
        purchases: sales,
        prescriptions: prescriptions
      }
    });
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
    await requireAuth('MEDICAL');

    const { id } = await params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return NextResponse.json({ 
        error: 'Invalid patient ID format',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    const { name, mobile, age, gender, medicalHistory } = await request.json();

    // Medical staff can only edit patients they created (those without doctor field)
    const patient = await Patient.findOneAndUpdate(
      { _id: id, doctor: { $exists: false } }, // Only patients created by medical staff
      { name, mobile, age, gender, medicalHistory },
      { new: true }
    );

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found or access denied' }, { status: 404 });
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
    await requireAuth('MEDICAL');

    const { id } = await params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return NextResponse.json({ 
        error: 'Invalid patient ID format',
        code: 'INVALID_OBJECT_ID'
      }, { status: 400 });
    }

    // Medical staff can only delete patients they created (those without doctor field)
    const patient = await Patient.findOneAndDelete({
      _id: id,
      doctor: { $exists: false } // Only patients created by medical staff
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found or access denied' }, { status: 404 });
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
