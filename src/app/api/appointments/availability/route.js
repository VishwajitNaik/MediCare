import { NextResponse } from 'next/server';
import DoctorAvailability from '../../../../models/DoctorAvailability';
import DoctorLeave from '../../../../models/DoctorLeave';
import Appointment from '../../../../models/Appointment';
import connectDB from '../../../../lib/mongodb';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');

    if (!doctorId || !date) {
      return NextResponse.json({
        error: 'Doctor ID and date are required'
      }, { status: 400 });
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

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
        available: false,
        reason: `Doctor is on ${leave.type} leave: ${leave.reason}`,
        leave: {
          type: leave.type,
          reason: leave.reason,
          startDate: leave.startDate,
          endDate: leave.endDate
        }
      });
    }

    // Get doctor's schedule for that day
    const schedule = await DoctorAvailability.findOne({
      doctorId,
      dayOfWeek,
      isWorkingDay: true
    });

    // If no schedule is set, use default working hours
    const defaultSchedule = {
      startTime: '09:00',
      endTime: '17:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      slotDuration: 15
    };

    const workingSchedule = schedule || defaultSchedule;

    // If no schedule exists in DB, doctor is still available with default hours
    // Only return not available if explicitly marked as not working
    if (schedule && !schedule.isWorkingDay) {
      return NextResponse.json({
        available: false,
        reason: 'Doctor is not working on this day'
      });
    }

    // Get booked appointments for that date
    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDate: {
        $gte: new Date(date + 'T00:00:00'),
        $lt: new Date(date + 'T23:59:59')
      },
      status: { $in: ['scheduled', 'confirmed'] }
    }).select('slotTime duration');

    // Generate available slots
    const availableSlots = generateTimeSlots(workingSchedule, bookedAppointments);

    return NextResponse.json({
      available: true,
      schedule: {
        startTime: workingSchedule.startTime,
        endTime: workingSchedule.endTime,
        breakStart: workingSchedule.breakStart,
        breakEnd: workingSchedule.breakEnd,
        slotDuration: workingSchedule.slotDuration
      },
      slots: availableSlots,
      totalSlots: availableSlots.length,
      bookedSlots: bookedAppointments.length
    });

  } catch (error) {
    console.error('Availability API error:', error);
    return NextResponse.json({
      error: 'Failed to check availability',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Helper function to generate time slots
function generateTimeSlots(schedule, bookedAppointments) {
  const slots = [];
  const bookedTimes = bookedAppointments.map(apt => apt.slotTime);

  let current = new Date(`1970-01-01T${schedule.startTime}`);
  const end = new Date(`1970-01-01T${schedule.endTime}`);
  const breakStart = schedule.breakStart ? new Date(`1970-01-01T${schedule.breakStart}`) : null;
  const breakEnd = schedule.breakEnd ? new Date(`1970-01-01T${schedule.breakEnd}`) : null;

  while (current < end) {
    // Skip break time
    if (breakStart && breakEnd && current >= breakStart && current < breakEnd) {
      current.setMinutes(current.getMinutes() + schedule.slotDuration);
      continue;
    }

    const timeString = current.toTimeString().slice(0, 5); // HH:MM format

    // Check if slot is already booked
    const isBooked = bookedTimes.includes(timeString);

    slots.push({
      time: timeString,
      display: formatTimeDisplay(timeString),
      available: !isBooked,
      duration: schedule.slotDuration
    });

    current.setMinutes(current.getMinutes() + schedule.slotDuration);
  }

  return slots;
}

// Helper function to format time for display
function formatTimeDisplay(timeString) {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}
