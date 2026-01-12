import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Appointment from '../../../../../models/Appointment';
import Doctor from '../../../../../models/Doctor';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const user = await requireAuth('PATIENT');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit')) || 20;
    const page = parseInt(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;

    // Build query - ensure patientId is ObjectId
    let query = { patientId: new mongoose.Types.ObjectId(user.id) };

    if (status !== 'all') {
      query.status = status;
    }

    // Get appointments with doctor details
    const appointments = await Appointment.find(query)
      .populate('doctorId', 'name specialty hospital clinicAddress')
      .sort({ appointmentDate: -1, slotTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const totalCount = await Appointment.countDocuments(query);

    // Format appointments for display
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment._id,
      doctor: {
        id: appointment.doctorId._id,
        name: appointment.doctorId.name,
        specialty: appointment.doctorId.specialty,
        hospital: appointment.doctorId.hospital,
        clinicAddress: appointment.doctorId.clinicAddress
      },
      appointmentDate: appointment.appointmentDate,
      slotTime: appointment.slotTime,
      duration: appointment.duration,
      type: appointment.type,
      status: appointment.status,
      reason: appointment.reason,
      notes: appointment.notes,
      fee: appointment.fee,
      paymentStatus: appointment.paymentStatus,
      clinicAddress: appointment.clinicAddress,
      isVirtual: appointment.isVirtual,
      meetingLink: appointment.meetingLink,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      // Formatted dates for display
      appointmentDateFormatted: new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      slotTimeFormatted: formatTime(appointment.slotTime),
      createdAtFormatted: new Date(appointment.createdAt).toLocaleDateString('en-IN')
    }));

    // Get appointment statistics
    const stats = await getAppointmentStats(user.id);

    return NextResponse.json({
      success: true,
      data: {
        appointments: formattedAppointments,
        stats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalRecords: totalCount,
          limit
        }
      }
    });

  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Patient appointments GET error:', error);
    return NextResponse.json({
      error: 'Failed to fetch appointments',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const user = await requireAuth('PATIENT');

    const {
      doctorId,
      appointmentDate,
      appointmentTime,
      appointmentType,
      symptoms,
      notes
    } = await request.json();

    // Validate required fields
    if (!doctorId || !appointmentDate || !appointmentTime) {
      return NextResponse.json({
        error: 'Doctor, date, and time are required'
      }, { status: 400 });
    }

    // Validate appointment date (not in past, not too far in future)
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();
    const maxFutureDate = new Date();
    maxFutureDate.setMonth(maxFutureDate.getMonth() + 3); // Max 3 months ahead

    if (appointmentDateTime <= now) {
      return NextResponse.json({
        error: 'Appointment date and time must be in the future'
      }, { status: 400 });
    }

    if (appointmentDateTime > maxFutureDate) {
      return NextResponse.json({
        error: 'Appointments can only be booked up to 3 months in advance'
      }, { status: 400 });
    }

    // Check if doctor exists and is active
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isActive) {
      return NextResponse.json({
        error: 'Doctor not found or unavailable'
      }, { status: 404 });
    }

    // Check for conflicting appointments (same doctor, date, time)
    const conflictingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: new Date(appointmentDate),
      slotTime: appointmentTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (conflictingAppointment) {
      return NextResponse.json({
        error: 'This time slot is already booked. Please choose a different time.'
      }, { status: 409 });
    }

    // Check if patient has another appointment at the same time
    const patientConflict = await Appointment.findOne({
      patientId: user.id,
      appointmentDate: new Date(appointmentDate),
      slotTime: appointmentTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (patientConflict) {
      return NextResponse.json({
        error: 'You already have an appointment at this time.'
      }, { status: 409 });
    }

    // Get consultation fee
    const consultationFee = getConsultationFee(doctor.specialty);

    // Create appointment
    const appointment = new Appointment({
      patientId: user.id,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      slotTime: appointmentTime,
      type: appointmentType || 'new',
      reason: symptoms, // symptoms field maps to reason
      notes,
      fee: consultationFee,
      clinicAddress: doctor.clinicAddress,
      status: 'scheduled' // Doctor needs to confirm
    });

    await appointment.save();

    // Populate doctor details for response
    await appointment.populate('doctorId', 'name specialty hospital clinicAddress');

    return NextResponse.json({
      success: true,
      message: 'Appointment booked successfully! Please wait for doctor confirmation.',
      data: {
        appointment: {
          id: appointment._id,
          doctor: {
            id: appointment.doctorId._id,
            name: appointment.doctorId.name,
            specialty: appointment.doctorId.specialty,
            hospital: appointment.doctorId.hospital,
            clinicAddress: appointment.doctorId.clinicAddress
          },
          appointmentDate: appointment.appointmentDate,
          slotTime: appointment.slotTime,
          type: appointment.type,
          status: appointment.status,
          fee: appointment.fee,
          createdAt: appointment.createdAt
        }
      }
    }, { status: 201 });

  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Handle duplicate key error (double booking prevention)
    if (error.code === 11000) {
      return NextResponse.json({
        error: 'This time slot is no longer available. Please choose a different time.'
      }, { status: 409 });
    }

    console.error('Patient appointments POST error:', error);
    return NextResponse.json({
      error: 'Failed to book appointment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Helper function to format time
function formatTime(timeString) {
  if (!timeString) return 'N/A';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Helper function to get appointment statistics
async function getAppointmentStats(patientId) {
  try {
    const stats = await Appointment.aggregate([
      { $match: { patientId: new mongoose.Types.ObjectId(patientId) } },
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
      pending: 0,    // Maps to 'scheduled'
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0
    };

    let totalFees = 0;

    // Map database status values to frontend expected values
    stats.forEach(stat => {
      const dbStatus = stat._id; // 'scheduled', 'confirmed', 'completed', etc.
      const count = stat.count;
      const fees = stat.totalFees || 0;

      // Map database statuses to frontend status keys
      let frontendStatus;
      switch (dbStatus) {
        case 'scheduled':
          frontendStatus = 'pending';
          break;
        case 'confirmed':
          frontendStatus = 'confirmed';
          break;
        case 'completed':
          frontendStatus = 'completed';
          break;
        case 'cancelled':
          frontendStatus = 'cancelled';
          break;
        case 'no-show':
          frontendStatus = 'noShow';
          break;
        default:
          frontendStatus = 'pending'; // fallback
      }

      if (statusCounts.hasOwnProperty(frontendStatus)) {
        statusCounts[frontendStatus] += count;
        totalFees += fees;
        statusCounts.total += count;
      }
    });

    // Get next appointment
    const nextAppointment = await Appointment.findOne({
      patientId: new mongoose.Types.ObjectId(patientId),
      appointmentDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    })
    .populate('doctorId', 'name specialty')
    .sort({ appointmentDate: 1, slotTime: 1 })
    .limit(1);

    return {
      ...statusCounts,
      totalFees,
      nextAppointment: nextAppointment ? {
        id: nextAppointment._id,
        doctorName: nextAppointment.doctorId.name,
        specialty: nextAppointment.doctorId.specialty,
        date: nextAppointment.appointmentDate,
        time: nextAppointment.slotTime,
        dateFormatted: new Date(nextAppointment.appointmentDate).toLocaleDateString('en-IN'),
        timeFormatted: formatTime(nextAppointment.slotTime)
      } : null
    };
  } catch (error) {
    console.error('Error calculating appointment stats:', error);
    // Return default stats on error
    return {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      totalFees: 0,
      nextAppointment: null
    };
  }
}

// Helper function to get consultation fee
function getConsultationFee(specialty) {
  const feeMap = {
    'General Physician': 300,
    'Cardiologist': 800,
    'Dermatologist': 500,
    'Orthopedic': 600,
    'Pediatrician': 400,
    'Gynecologist': 500,
    'ENT Specialist': 400,
    'Ophthalmologist': 450,
    'Dentist': 350,
    'Psychiatrist': 700,
    'Neurologist': 900,
    'Urologist': 600,
    'Endocrinologist': 650,
    'Oncologist': 1000
  };

  return feeMap[specialty] || 400;
}
