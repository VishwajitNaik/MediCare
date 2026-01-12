import { NextResponse } from 'next/server';
import DoctorAvailability from '../../../../models/DoctorAvailability';
import DoctorLeave from '../../../../models/DoctorLeave';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');

    if (!doctorId) {
      return NextResponse.json({
        error: 'Doctor ID is required'
      }, { status: 400 });
    }

    // Get doctor's availability schedule
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

    // Generate next 30 days of available dates
    const availableDates = [];
    const today = new Date();

    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dateString = date.toISOString().split('T')[0];

      // Check if doctor is working on this day
      const daySchedule = availability.find(a => a.dayOfWeek === dayOfWeek);

      // Check if doctor is on leave
      const isOnLeave = leaveDates.has(dateString);

      if (daySchedule && !isOnLeave) {
        availableDates.push({
          date: dateString,
          dayOfWeek,
          dayName: getDayName(dayOfWeek),
          formatted: date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
          }),
          fullFormatted: date.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        availableDates,
        totalAvailable: availableDates.length
      }
    });

  } catch (error) {
    console.error('Available dates API error:', error);
    return NextResponse.json({
      error: 'Failed to get available dates',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Helper function to get day name
function getDayName(dayIndex) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
}
