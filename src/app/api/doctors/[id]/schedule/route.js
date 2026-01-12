import { NextResponse } from 'next/server';
import DoctorAvailability from '../../../../../models/DoctorAvailability';
import DoctorLeave from '../../../../../models/DoctorLeave';

export async function GET(request, { params }) {
  try {
    const { id: doctorId } = await params;

    if (!doctorId) {
      return NextResponse.json({
        error: 'Doctor ID is required'
      }, { status: 400 });
    }

    // Get doctor's availability schedule (one record per day of week)
    const availability = await DoctorAvailability.find({
      doctorId,
      isWorkingDay: true
    }).sort({ dayOfWeek: 1 });

    // Get doctor's leave dates
    const leaves = await DoctorLeave.find({
      doctorId,
      isApproved: true,
      isCancelled: false,
      startDate: { $gte: new Date() } // Only future leaves
    }).select('startDate endDate');

    // Create a set of leave dates for quick lookup
    const leaveDates = new Set();
    leaves.forEach(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        leaveDates.add(date.toISOString().split('T')[0]);
      }
    });

    // Get unique available days
    const availableDays = availability.map(schedule => getDayName(schedule.dayOfWeek));

    // Get schedule details
    const scheduleDetails = availability.reduce((acc, schedule) => {
      const dayName = getDayName(schedule.dayOfWeek);
      acc[dayName] = {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        breakStart: schedule.breakStart,
        breakEnd: schedule.breakEnd,
        slotDuration: schedule.slotDuration,
        maxPatients: schedule.maxPatientsPerDay
      };
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        schedule: scheduleDetails,
        availableDays,
        leaveDates: Array.from(leaveDates)
      }
    });

  } catch (error) {
    console.error('Doctor schedule API error:', error);
    return NextResponse.json({
      error: 'Failed to get doctor schedule',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Helper function to get day name
function getDayName(dayIndex) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
}
