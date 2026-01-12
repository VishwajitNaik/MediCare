import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import DoseTracking from '../../../../../models/DoseTracking';
import PatientMedicine from '../../../../../models/PatientMedicine';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

// GET - Fetch today's doses and upcoming doses
export async function GET(request) {
  try {
    await connectDB();
    const user = await requireAuth('PATIENT');

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const includeUpcoming = searchParams.get('includeUpcoming') === 'true';

    console.log('User ID from auth:', user.id);
    console.log('Requested date:', date);

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build query for doses - filter by patient and today's date
    let query = {
      patientId: new mongoose.Types.ObjectId(user.id),
    };

    if (includeUpcoming) {
      // Include upcoming doses for the next 7 days
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      query.doseDate = { $gte: today, $lte: nextWeek };
    } else {
      // Just today's doses
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.doseDate = { $gte: today, $lt: tomorrow };
    }

    console.log('Dose query:', query);

    // Get today's doses
    const dosesFromDB = await DoseTracking.find(query)
      .populate('medicineId', 'name brandName')
      .populate('patientMedicineId', 'visitDate')
      .sort({ doseTime: 1 })
      .lean();

    console.log('Found dosesFromDB:', dosesFromDB.length);

    // Format doses for response
    const formattedDoses = dosesFromDB.map(dose => ({
      id: dose._id,
      medicineId: dose.medicineId._id,
      medicineName: dose.medicineId.name,
      brandName: dose.medicineId.brandName,
      doseDate: dose.doseDate,
      doseTime: dose.doseTime,
      timing: dose.timing,
      doseAmount: dose.doseAmount,
      status: dose.status,
      completedAt: dose.completedAt,
      notes: dose.notes,
      reminderEnabled: dose.reminderEnabled,
      // Formatted fields
      doseDateFormatted: dose.doseDate.toLocaleDateString('en-IN'),
      doseTimeFormatted: formatTime(dose.doseTime),
      timingFormatted: formatTiming(dose.timing),
      isToday: dose.doseDate.toDateString() === new Date().toDateString(),
      isPast: dose.doseDate < new Date() && dose.doseTime < new Date().toTimeString().slice(0, 5),
    }));

    console.log("Doses :-", dosesFromDB);
    console.log("Formatted Doses :-", formattedDoses);

    // Group by date for upcoming doses
    const groupedDoses = formattedDoses.reduce((acc, dose) => {
      const dateKey = dose.doseDate.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(dose);
      return acc;
    }, {});

    // Get summary stats
    const todayDoses = formattedDoses.filter(d => d.isToday);
    const stats = {
      todayTotal: todayDoses.length,
      todayCompleted: todayDoses.filter(d => d.status === 'COMPLETED').length,
      todayPending: todayDoses.filter(d => d.status === 'PENDING').length,
      todayMissed: todayDoses.filter(d => d.status === 'MISSED').length,
      nextDoseTime: getNextDoseTime(todayDoses),
    };

    return NextResponse.json({
      success: true,
      data: {
        doses: formattedDoses,
        groupedDoses,
        stats,
        requestedDate: date,
      }
    });

  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Patient doses GET error:', error);
    return NextResponse.json({
      error: 'Failed to fetch doses',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// POST - Mark dose as completed
export async function POST(request) {
  try {
    await connectDB();
    const user = await requireAuth('PATIENT');

    const { doseId, status = 'COMPLETED', notes } = await request.json();

    if (!doseId) {
      return NextResponse.json({
        error: 'Dose ID is required'
      }, { status: 400 });
    }

    // Find and update the dose
    const dose = await DoseTracking.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(doseId),
        patientId: new mongoose.Types.ObjectId(user.id)
      },
      {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        completedBy: 'PATIENT',
        notes: notes || null,
      },
      { new: true }
    ).populate('medicineId', 'name brandName');

    if (!dose) {
      return NextResponse.json({
        error: 'Dose not found or access denied'
      }, { status: 404 });
    }

    // Get next dose for the same medicine
    const nextDose = await DoseTracking.findOne({
      patientId: new mongoose.Types.ObjectId(user.id),
      medicineId: dose.medicineId._id,
      doseDate: { $gte: new Date() },
      _id: { $ne: dose._id }, // Exclude current dose
      status: 'PENDING'
    })
    .sort({ doseDate: 1, doseTime: 1 })
    .limit(1)
    .lean();

    return NextResponse.json({
      success: true,
      message: `Dose marked as ${status.toLowerCase()}`,
      data: {
        dose: {
          id: dose._id,
          medicineName: dose.medicineId.name,
          status: dose.status,
          completedAt: dose.completedAt,
        },
        nextDose: nextDose ? {
          id: nextDose._id,
          medicineName: dose.medicineId.name,
          doseDate: nextDose.doseDate,
          doseTime: nextDose.doseTime,
          doseDateFormatted: nextDose.doseDate.toLocaleDateString('en-IN'),
          doseTimeFormatted: formatTime(nextDose.doseTime),
        } : null
      }
    });

  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Patient doses POST error:', error);
    return NextResponse.json({
      error: 'Failed to update dose',
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

// Helper function to format timing
function formatTiming(timing) {
  const timingMap = {
    'MORNING_BEFORE_FOOD': 'Morning (before food)',
    'MORNING_AFTER_FOOD': 'Morning (after food)',
    'AFTERNOON_BEFORE_FOOD': 'Afternoon (before food)',
    'AFTERNOON_AFTER_FOOD': 'Afternoon (after food)',
    'NIGHT_BEFORE_FOOD': 'Night (before food)',
    'NIGHT_AFTER_FOOD': 'Night (after food)',
  };

  return timingMap[timing] || timing;
}

// Helper function to get next dose time
function getNextDoseTime(todayDoses) {
  const now = new Date();
  const pendingDoses = todayDoses.filter(d => d.status === 'PENDING');

  if (pendingDoses.length === 0) return null;

  // Find next dose time
  let nextDose = null;
  let nextTime = null;

  for (const dose of pendingDoses) {
    const doseDateTime = new Date(`${dose.doseDate.toISOString().split('T')[0]}T${dose.doseTime}`);
    if (doseDateTime > now && (!nextTime || doseDateTime < nextTime)) {
      nextTime = doseDateTime;
      nextDose = dose;
    }
  }

  return nextDose ? {
    medicineName: nextDose.medicineName,
    time: nextDose.doseTimeFormatted,
    minutesUntil: Math.floor((nextTime - now) / (1000 * 60))
  } : null;
}
