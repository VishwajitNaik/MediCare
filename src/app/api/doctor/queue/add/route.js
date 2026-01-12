import { NextResponse } from 'next/server';
import Patient from '../../../../../models/Patient';
import PatientQueue from '../../../../../models/PatientQueue';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const user = await requireAuth('DOCTOR'); // Allow doctors and medical staff

    const { patientData, patientId, doctorId, priority = 'NORMAL', notes = '' } = await request.json();

    // Use provided doctorId or default to authenticated user's ID if they are a doctor
    const finalDoctorId = doctorId || (user.role === 'DOCTOR' ? user.id : null);

    if (!finalDoctorId) {
      return NextResponse.json({
        error: 'Doctor ID is required'
      }, { status: 400 });
    }

    let patient;

    // If patientId is provided, use existing patient
    if (patientId) {
      patient = await Patient.findById(patientId);
      if (!patient) {
        return NextResponse.json({
          error: 'Patient not found'
        }, { status: 404 });
      }
    }
    // Otherwise, create new patient or find existing by mobile
    else if (patientData) {
      const { name, mobile, age, gender } = patientData;

      // Validate required fields
      if (!name || !mobile || !age || !gender) {
        return NextResponse.json({
          error: 'Patient name, mobile, age, and gender are required'
        }, { status: 400 });
      }

      // Check if patient already exists
      patient = await Patient.findOne({ mobile });

      // If patient doesn't exist, create new patient
      if (!patient) {
        patient = new Patient({
          name,
          mobile,
          age: parseInt(age),
          gender,
          createdBy: user.id,
          createdByModel: user.role === 'DOCTOR' ? 'Doctor' : 'Medical'
        });
        await patient.save();
      }
    } else {
      return NextResponse.json({
        error: 'Either patientData or patientId must be provided'
      }, { status: 400 });
    }

    // Check if patient is already in queue for this doctor
    const existingQueue = await PatientQueue.findOne({
      patientId: patient._id,
      doctorId: finalDoctorId,
      status: { $in: ['WAITING', 'IN_PROGRESS'] },
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today only
      }
    });

    if (existingQueue) {
      return NextResponse.json({
        error: 'Patient is already in queue for this doctor today'
      }, { status: 400 });
    }

    // Get next queue number for this doctor today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastQueue = await PatientQueue.findOne({
      doctorId: finalDoctorId,
      createdAt: { $gte: today }
    }).sort({ queueNumber: -1 });

    const nextQueueNumber = lastQueue ? lastQueue.queueNumber + 1 : 1;

    // Generate token number (e.g., "DOC001-01" for doctor 001, queue number 1)
    const tokenNumber = `DOC${finalDoctorId.slice(-3).toUpperCase()}-${nextQueueNumber.toString().padStart(2, '0')}`;

    // Create queue entry
    const queueEntry = new PatientQueue({
      patientId: patient._id,
      doctorId: finalDoctorId,
      queueNumber: nextQueueNumber,
      tokenNumber,
      addedBy: user.id,
      addedByModel: user.role === 'DOCTOR' ? 'Doctor' : 'Medical',
      priority,
      notes
    });

    await queueEntry.save();

    // Populate patient data for response
    await queueEntry.populate('patientId', 'name mobile age gender');

    return NextResponse.json({
      message: 'Patient added to queue successfully',
      queueEntry: {
        ...queueEntry.toObject(),
        patient: queueEntry.patientId
      }
    });

  } catch (error) {
    console.error('Error adding patient to queue:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
