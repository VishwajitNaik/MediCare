import { NextResponse } from 'next/server';
import Patient from '../../../../../models/Patient';
import PatientQueue from '../../../../../models/PatientQueue';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const user = await requireAuth('DOCTOR');

    // Get doctor ID from query params or user ID if doctor
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId') || (user.role === 'DOCTOR' ? user.id : null);

    if (!doctorId) {
      return NextResponse.json({
        error: 'Doctor ID is required'
      }, { status: 400 });
    }

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get queue entries for today, ordered by queue number
    const queue = await PatientQueue.find({
      doctorId,
      createdAt: { $gte: today }
    })
    .populate({
      path: 'addedBy',
      select: 'name',
      refPath: 'addedByModel'
    })
    .sort({ queueNumber: 1 })
    .lean();

    // Manually populate patient data to handle missing references
    const queueWithPatients = await Promise.all(queue.map(async (item) => {
      let patientData = null;
      if (item.patientId) {
        try {
          const patient = await Patient.findById(item.patientId).select('name mobile age gender');
          if (patient) {
            patientData = patient;
          }
        } catch (error) {
          console.error('Error fetching patient for queue item:', item._id, error);
        }
      }

      return {
        ...item,
        patientId: patientData // Replace with actual patient data or null
      };
    }));

    // Group by status
    const waiting = queueWithPatients.filter(item => item.status === 'WAITING');
    const inProgress = queueWithPatients.filter(item => item.status === 'IN_PROGRESS');
    const completed = queueWithPatients.filter(item => item.status === 'COMPLETED');
    const cancelled = queueWithPatients.filter(item => item.status === 'CANCELLED');

    // Add calculated fields
    const now = new Date();
    const enrichedQueue = queueWithPatients.map(item => {
      // Ensure dates are proper Date objects
      const addedAt = item.addedAt ? new Date(item.addedAt) : new Date();
      const calledAt = item.calledAt ? new Date(item.calledAt) : null;

      // Calculate waiting time in milliseconds
      const waitingTimeMs = calledAt
        ? calledAt.getTime() - addedAt.getTime()
        : now.getTime() - addedAt.getTime();

      // Convert to minutes (ensure it's a valid number)
      const waitingTimeMinutes = isNaN(waitingTimeMs) ? 0 : Math.floor(waitingTimeMs / 60000);

      return {
        ...item,
        patient: item.patientId || { name: 'Unknown Patient', age: '?', mobile: 'N/A', gender: 'N/A' },
        patientId: undefined, // Remove nested field
        waitingTime: waitingTimeMinutes,
        queueAge: now.getTime() - addedAt.getTime(),
        addedByName: item.addedBy?.name || 'Unknown'
      };
    });

    // Find current and next patients from enriched queue
    const currentPatient = enrichedQueue.find(item => item.status === 'IN_PROGRESS');
    const nextPatient = enrichedQueue.find(item => item.status === 'WAITING');

    return NextResponse.json({
      queue: enrichedQueue,
      summary: {
        waiting: waiting.length,
        inProgress: inProgress.length,
        completed: completed.length,
        cancelled: cancelled.length,
        total: queue.length
      },
      current: currentPatient || null,
      next: nextPatient || null
    });

  } catch (error) {
    console.error('Error fetching queue:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
