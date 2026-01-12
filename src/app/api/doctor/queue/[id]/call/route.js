import { NextResponse } from 'next/server';
import PatientQueue from '../../../../../../models/PatientQueue';
import connectDB from '../../../../../../lib/mongodb';
import { requireAuth } from '../../../../../../lib/auth';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const user = await requireAuth('DOCTOR');

    const { id } = await params;

    if (!id) {
      return NextResponse.json({
        error: 'Queue entry ID is required'
      }, { status: 400 });
    }

    // Find and update queue entry
    const queueEntry = await PatientQueue.findByIdAndUpdate(
      id,
      {
        status: 'IN_PROGRESS',
        calledAt: new Date()
      },
      { new: true }
    ).populate('patientId', 'name mobile age gender');

    if (!queueEntry) {
      return NextResponse.json({
        error: 'Queue entry not found'
      }, { status: 404 });
    }

    // Check if user has permission (doctor can only call their own patients)
    if (user.role === 'DOCTOR' && queueEntry.doctorId.toString() !== user.id) {
      return NextResponse.json({
        error: 'Unauthorized to call this patient'
      }, { status: 403 });
    }

    return NextResponse.json({
      message: 'Patient called successfully',
      queueEntry: {
        ...queueEntry.toObject(),
        patient: queueEntry.patientId
      }
    });

  } catch (error) {
    console.error('Error calling patient:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
