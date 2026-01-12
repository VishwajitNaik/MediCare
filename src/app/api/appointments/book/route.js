import { NextResponse } from 'next/server';
import Appointment from '../../../../models/Appointment';
import Doctor from '../../../../models/Doctor';
import DoctorAvailability from '../../../../models/DoctorAvailability';
import DoctorLeave from '../../../../models/DoctorLeave';
import connectDB from '../../../../lib/mongodb';
import { requireAuth } from '../../../../lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const user = await requireAuth('PATIENT');

    const {
      doctorId,
      date,
      slotTime,
      reason,
      type = 'new'
    } = await request.json();

    // Validate required fields
    if (!doctorId || !date || !slotTime) {
      return NextResponse.json({
        error: 'Doctor ID, date, and slot time are required'
      }, { status: 400 });
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    // Check if appointment date is in the future
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (appointmentDate < today) {
      return NextResponse.json({
        error: 'Cannot book appointments for past dates'
      }, { status: 400 });
    }

    // Check if doctor exists and is active
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isActive) {
      return NextResponse.json({
        error: 'Doctor not found or unavailable'
      }, { status: 404 });
    }

    // Check if doctor is on leave
    const leave = await DoctorLeave.findOne({
      doctorId,
      startDate: { $lte: appointmentDate },
      endDate: { $gte: appointmentDate },
      isApproved: true,
      isCancelled: false
    });

    if (leave) {
      return NextResponse.json({
        error: `Doctor is on ${leave.type} leave: ${leave.reason}`
      }, { status: 400 });
    }

    // Check if doctor is working on this day
    const schedule = await DoctorAvailability.findOne({
      doctorId,
      dayOfWeek,
      isWorkingDay: true
    });

    if (!schedule) {
      return NextResponse.json({
        error: 'Doctor is not working on this day'
      }, { status: 400 });
    }

    // Validate slot time is within working hours and not in break
    if (!isValidSlotTime(slotTime, schedule)) {
      return NextResponse.json({
        error: 'Selected time slot is not available'
      }, { status: 400 });
    }

    // Check for existing appointment at same time
    const conflictingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: {
        $gte: new Date(date + 'T00:00:00'),
        $lt: new Date(date + 'T23:59:59')
      },
      slotTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (conflictingAppointment) {
      return NextResponse.json({
        error: 'This time slot is no longer available. Please choose a different time.'
      }, { status: 409 });
    }

    // Check if patient has another appointment at the same time
    const patientConflict = await Appointment.findOne({
      patientId: user.id,
      appointmentDate: {
        $gte: new Date(date + 'T00:00:00'),
        $lt: new Date(date + 'T23:59:59')
      },
      slotTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (patientConflict) {
      return NextResponse.json({
        error: 'You already have an appointment at this time.'
      }, { status: 409 });
    }

    // Generate token number for the day
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const appointmentsCount = await Appointment.countDocuments({
      doctorId,
      appointmentDate: { $gte: dayStart, $lt: dayEnd }
    });

    const tokenNumber = appointmentsCount + 1;

    // Get consultation fee
    const consultationFee = getConsultationFee(doctor.specialty);

    // Create appointment
    const appointment = new Appointment({
      patientId: user.id,
      doctorId,
      appointmentDate,
      slotTime,
      type,
      reason,
      tokenNumber,
      fee: consultationFee,
      clinicAddress: doctor.clinicAddress,
      status: 'scheduled'
    });

    await appointment.save();

    // Populate doctor details for response
    await appointment.populate('doctorId', 'name specialty hospital clinicAddress');

    return NextResponse.json({
      success: true,
      message: `Appointment booked successfully! Your token number is ${tokenNumber}`,
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
        tokenNumber: appointment.tokenNumber,
        type: appointment.type,
        status: appointment.status,
        fee: appointment.fee,
        reason: appointment.reason
      }
    }, { status: 201 });

  } catch (error) {
    // Handle duplicate key error (double booking prevention)
    if (error.code === 11000) {
      return NextResponse.json({
        error: 'This time slot is no longer available. Please choose a different time.'
      }, { status: 409 });
    }

    console.error('Appointment booking error:', error);
    return NextResponse.json({
      error: 'Failed to book appointment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Helper function to validate slot time
function isValidSlotTime(slotTime, schedule) {
  const slot = new Date(`1970-01-01T${slotTime}`);
  const start = new Date(`1970-01-01T${schedule.startTime}`);
  const end = new Date(`1970-01-01T${schedule.endTime}`);
  const breakStart = schedule.breakStart ? new Date(`1970-01-01T${schedule.breakStart}`) : null;
  const breakEnd = schedule.breakEnd ? new Date(`1970-01-01T${schedule.breakEnd}`) : null;

  // Check if slot is within working hours
  if (slot < start || slot >= end) {
    return false;
  }

  // Check if slot is during break time
  if (breakStart && breakEnd && slot >= breakStart && slot < breakEnd) {
    return false;
  }

  return true;
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
