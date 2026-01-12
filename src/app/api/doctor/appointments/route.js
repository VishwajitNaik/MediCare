import { NextResponse } from 'next/server';
import Appointment from '../../../../models/Appointment';
import Patient from '../../../../models/Patient';
import connectDB from '../../../../lib/mongodb';
import { requireAuth } from '../../../../lib/auth';

// GET - Get doctor's appointments (today by default, or by date)
export async function GET(request) {
  try {
    await connectDB();
    const doctor = await requireAuth('DOCTOR');

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    // Default to today's date if no date provided
    const queryDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build query
    let query = {
      doctorId: doctor.id,
      appointmentDate: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    // Get appointments with patient details
    const appointments = await Appointment.find(query)
      .populate('patientId', 'name mobile age gender medicalHistory')
      .sort({ appointmentDate: 1, slotTime: 1 })
      .lean();

    // Format appointments for frontend
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment._id,
      patient: {
        id: appointment.patientId._id,
        name: appointment.patientId.name,
        mobile: appointment.patientId.mobile,
        age: appointment.patientId.age,
        gender: appointment.patientId.gender,
        medicalHistory: appointment.patientId.medicalHistory
      },
      appointmentDate: appointment.appointmentDate,
      slotTime: appointment.slotTime,
      duration: appointment.duration,
      type: appointment.type,
      status: appointment.status,
      reason: appointment.reason,
      notes: appointment.notes,
      tokenNumber: appointment.tokenNumber,
      fee: appointment.fee,
      paymentStatus: appointment.paymentStatus,
      clinicAddress: appointment.clinicAddress,
      createdAt: appointment.createdAt,
      // Formatted fields for display
      appointmentDateFormatted: appointment.appointmentDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      slotTimeFormatted: formatTime(appointment.slotTime),
      statusColor: getStatusColor(appointment.status),
      isUpcoming: appointment.status === 'confirmed' || appointment.status === 'scheduled',
      isInProgress: appointment.consultationStartedAt && !appointment.consultationCompletedAt,
      canStartConsultation: (appointment.status === 'confirmed' || appointment.status === 'scheduled') &&
                           !appointment.consultationStartedAt,
      canCompleteConsultation: appointment.consultationStartedAt && !appointment.consultationCompletedAt
    }));

    // Get appointment statistics for the day
    const stats = await getAppointmentStats(doctor.id, startOfDay, endOfDay);

    return NextResponse.json({
      success: true,
      data: {
        appointments: formattedAppointments,
        stats,
        queryDate: queryDate.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Doctor appointments GET error:', error);
    return NextResponse.json({
      error: 'Failed to fetch appointments',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// PUT - Update appointment status (confirm, start consultation, complete, etc.)
export async function PUT(request) {
  try {
    await connectDB();
    const doctor = await requireAuth('DOCTOR');

    const { appointmentId, action, notes } = await request.json();

    if (!appointmentId || !action) {
      return NextResponse.json({
        error: 'Appointment ID and action are required'
      }, { status: 400 });
    }

    // Find the appointment
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId: doctor.id
    });

    if (!appointment) {
      return NextResponse.json({
        error: 'Appointment not found'
      }, { status: 404 });
    }

    let updateData = {};
    let message = '';

    switch (action) {
      case 'confirm':
        if (appointment.status !== 'scheduled') {
          return NextResponse.json({
            error: 'Only scheduled appointments can be confirmed'
          }, { status: 400 });
        }
        updateData.status = 'confirmed';
        message = 'Appointment confirmed successfully';
        break;

      case 'start_consultation':
        if (appointment.status !== 'confirmed' && appointment.status !== 'scheduled') {
          return NextResponse.json({
            error: 'Appointment must be confirmed before starting consultation'
          }, { status: 400 });
        }
        if (appointment.consultationStartedAt) {
          return NextResponse.json({
            error: 'Consultation already started'
          }, { status: 400 });
        }
        updateData.consultationStartedAt = new Date();
        updateData.status = 'confirmed'; // Ensure status is confirmed
        message = 'Consultation started';
        break;

      case 'complete_consultation':
        if (!appointment.consultationStartedAt) {
          return NextResponse.json({
            error: 'Consultation must be started before completing'
          }, { status: 400 });
        }
        if (appointment.consultationCompletedAt) {
          return NextResponse.json({
            error: 'Consultation already completed'
          }, { status: 400 });
        }
        updateData.consultationCompletedAt = new Date();
        updateData.status = 'completed';
        message = 'Consultation completed successfully';
        break;

      case 'cancel':
        if (appointment.status === 'completed') {
          return NextResponse.json({
            error: 'Cannot cancel completed appointments'
          }, { status: 400 });
        }
        updateData.status = 'cancelled';
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = 'doctor';
        updateData.cancellationReason = notes || 'Cancelled by doctor';
        message = 'Appointment cancelled successfully';
        break;

      case 'mark_no_show':
        updateData.status = 'no-show';
        message = 'Appointment marked as no-show';
        break;

      case 'check_in':
        updateData.checkedInAt = new Date();
        updateData.checkedInBy = doctor.id; // Assuming doctor is checking in
        message = 'Patient checked in successfully';
        break;

      default:
        return NextResponse.json({
          error: 'Invalid action'
        }, { status: 400 });
    }

    // Update the appointment
    await Appointment.findByIdAndUpdate(appointmentId, updateData);

    return NextResponse.json({
      success: true,
      message,
      data: {
        appointmentId,
        action,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Doctor appointments PUT error:', error);
    return NextResponse.json({
      error: 'Failed to update appointment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Helper function to format time
function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Helper function to get status color
function getStatusColor(status) {
  switch (status) {
    case 'scheduled': return 'yellow';
    case 'confirmed': return 'blue';
    case 'completed': return 'green';
    case 'cancelled': return 'red';
    case 'no-show': return 'gray';
    default: return 'gray';
  }
}

// Helper function to get appointment statistics
async function getAppointmentStats(doctorId, startDate, endDate) {
  const stats = await Appointment.aggregate([
    {
      $match: {
        doctorId: doctorId,
        appointmentDate: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalFees: { $sum: '$fee' }
      }
    }
  ]);

  const statusCounts = {
    total: 0,
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0
  };

  let totalFees = 0;

  stats.forEach(stat => {
    const status = stat._id;
    statusCounts[status] = stat.count;
    statusCounts.total += stat.count;
    totalFees += stat.totalFees;
  });

  // Get current consultation (in progress)
  const currentConsultation = await Appointment.findOne({
    doctorId,
    consultationStartedAt: { $exists: true },
    consultationCompletedAt: { $exists: false }
  })
  .populate('patientId', 'name age gender')
  .sort({ consultationStartedAt: -1 });

  // Get next patient in queue
  const nextPatient = await Appointment.findOne({
    doctorId,
    appointmentDate: { $gte: startDate, $lt: endDate },
    status: { $in: ['scheduled', 'confirmed'] },
    consultationStartedAt: { $exists: false }
  })
  .populate('patientId', 'name age gender')
  .sort({ tokenNumber: 1 });

  return {
    ...statusCounts,
    totalFees,
    currentConsultation: currentConsultation ? {
      id: currentConsultation._id,
      patientName: currentConsultation.patientId.name,
      patientAge: currentConsultation.patientId.age,
      patientGender: currentConsultation.patientId.gender,
      tokenNumber: currentConsultation.tokenNumber,
      startedAt: currentConsultation.consultationStartedAt
    } : null,
    nextPatient: nextPatient ? {
      id: nextPatient._id,
      patientName: nextPatient.patientId.name,
      patientAge: nextPatient.patientId.age,
      patientGender: nextPatient.patientId.gender,
      tokenNumber: nextPatient.tokenNumber
    } : null
  };
}
