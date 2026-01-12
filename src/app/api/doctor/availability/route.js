import { NextResponse } from 'next/server';
import DoctorAvailability from '../../../../models/DoctorAvailability';
import DoctorLeave from '../../../../models/DoctorLeave';
import connectDB from '../../../../lib/mongodb';
import { requireAuth } from '../../../../lib/auth';

// GET - Get doctor's current availability and leave schedule
export async function GET(request) {
  try {
    await connectDB();
    const doctor = await requireAuth('DOCTOR');

    // Get doctor's availability schedule (one record per day of week)
    const availability = await DoctorAvailability.find({ doctorId: doctor.id })
      .sort({ dayOfWeek: 1 })
      .lean();

    // Get doctor's leave records
    const leaves = await DoctorLeave.find({
      doctorId: doctor.id,
      $or: [
        { isCancelled: false },
        { isCancelled: { $exists: false } }
      ]
    })
      .sort({ startDate: -1 })
      .lean();

    // Format availability data for frontend
    const formattedAvailability = [];
    for (let day = 0; day < 7; day++) {
      const daySchedule = availability.find(a => a.dayOfWeek === day);
      formattedAvailability.push({
        day: day,
        dayName: getDayName(day),
        enabled: daySchedule?.isWorkingDay || false,
        startTime: daySchedule?.startTime || '09:00',
        endTime: daySchedule?.endTime || '17:00',
        breakStart: daySchedule?.breakStart || '',
        breakEnd: daySchedule?.breakEnd || '',
        slotDuration: daySchedule?.slotDuration || 15,
        maxPatients: daySchedule?.maxPatientsPerDay || 20
      });
    }

    // Format leave data
    const formattedLeaves = leaves.map(leave => ({
      id: leave._id,
      startDate: leave.startDate.toISOString().split('T')[0],
      endDate: leave.endDate.toISOString().split('T')[0],
      reason: leave.reason,
      type: leave.type,
      isApproved: leave.isApproved,
      notes: leave.notes,
      createdAt: leave.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        availability: formattedAvailability,
        leaves: formattedLeaves
      }
    });

  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Doctor availability GET error:', error);
    return NextResponse.json({
      error: 'Failed to fetch availability',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// POST - Update doctor's availability schedule
export async function POST(request) {
  try {
    await connectDB();
    const doctor = await requireAuth('DOCTOR');

    const { availability } = await request.json();

    if (!availability || !Array.isArray(availability)) {
      return NextResponse.json({
        error: 'Availability schedule is required'
      }, { status: 400 });
    }

    // Validate availability data
    for (const day of availability) {
      if (!day.hasOwnProperty('day') || !day.hasOwnProperty('enabled')) {
        return NextResponse.json({
          error: 'Invalid availability data format'
        }, { status: 400 });
      }

      if (day.enabled) {
        if (!day.startTime || !day.endTime) {
          return NextResponse.json({
            error: `Working hours required for ${day.dayName}`
          }, { status: 400 });
        }

        // Validate time format
        if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(day.startTime) ||
            !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(day.endTime)) {
          return NextResponse.json({
            error: 'Invalid time format. Use HH:MM format'
          }, { status: 400 });
        }

        // Check if start time is before end time
        if (day.startTime >= day.endTime) {
          return NextResponse.json({
            error: `Start time must be before end time for ${day.dayName}`
          }, { status: 400 });
        }
      }
    }

    // Update or create availability records
    const updatePromises = availability.map(async (day) => {
      if (day.enabled) {
        return DoctorAvailability.findOneAndUpdate(
          { doctorId: doctor.id, dayOfWeek: day.day },
          {
            doctorId: doctor.id,
            dayOfWeek: day.day,
            startTime: day.startTime,
            endTime: day.endTime,
            breakStart: day.breakStart || undefined,
            breakEnd: day.breakEnd || undefined,
            slotDuration: day.slotDuration || 15,
            maxPatientsPerDay: day.maxPatients || 20,
            isWorkingDay: true
          },
          { upsert: true, new: true }
        );
      } else {
        // If not working, remove the record or mark as not working
        return DoctorAvailability.findOneAndUpdate(
          { doctorId: doctor.id, dayOfWeek: day.day },
          {
            doctorId: doctor.id,
            dayOfWeek: day.day,
            isWorkingDay: false
          },
          { upsert: true, new: true }
        );
      }
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: 'Availability schedule updated successfully'
    });

  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Doctor availability POST error:', error);
    return NextResponse.json({
      error: 'Failed to update availability',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Helper function to get day name
function getDayName(dayIndex) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
}
