import { NextResponse } from 'next/server';
import PatientMedicine from '../../../../models/PatientMedicine';
import DoseTracking from '../../../../models/DoseTracking';
import connectDB from '../../../../lib/mongodb';
import { requireAuth } from '../../../../lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    // Temporarily skip auth for migration
    // const user = await requireAuth('MEDICAL');
    // Use a default medical user ID for migration
    const user = { id: '507f1f77bcf86cd799439011' }; // Default ObjectId

    console.log('Starting dose migration for all existing patient medicines');

    // Find all patient medicines (for migration, process all existing records)
    const patientMedicines = await PatientMedicine.find({})
      .populate('patientId', 'name mobile')
      .lean();

    console.log(`Found ${patientMedicines.length} patient medicine records`);

    let totalDosesCreated = 0;
    let processedRecords = 0;

    for (const pm of patientMedicines) {
      console.log(`Processing PatientMedicine ${pm._id} for patient ${pm.patientId?.name}`);

      // Skip records without patient data
      if (!pm.patientId || !pm.patientId._id) {
        console.log(`Skipping PatientMedicine ${pm._id} - no patient data`);
        continue;
      }

      // Check if doses already exist for this patient medicine
      const existingDoses = await DoseTracking.countDocuments({
        patientMedicineId: pm._id
      });

      if (existingDoses > 0) {
        console.log(`Doses already exist for PatientMedicine ${pm._id}, skipping`);
        continue;
      }

      // Generate doses for this patient medicine
      const doseRecords = [];

      for (const medicine of pm.medicines) {
        const { medicineId, dosePerTime, timing, startDate, durationDays } = medicine;

        // Skip medicines with invalid duration
        if (!durationDays || durationDays <= 0) {
          console.log(`Skipping medicine ${medicineId} - invalid duration: ${durationDays}`);
          continue;
        }

        // Handle timing - could be array of enums or formatted strings
        let timingArray = [];
        if (Array.isArray(timing)) {
          timingArray = timing;
        } else if (typeof timing === 'string') {
          // Parse formatted timing string
          timingArray = parseTimingString(timing);
        } else {
          console.warn(`Invalid timing format for medicine ${medicineId}:`, timing);
          continue;
        }

        console.log(`Medicine ${medicineId}: timingArray=`, timingArray, `duration=${durationDays}`);

        // Generate doses for each day and each timing
        for (let day = 0; day < durationDays; day++) {
          const doseDate = new Date(startDate || pm.visitDate);
          doseDate.setDate(doseDate.getDate() + day);

          // Generate doses for each timing on this day
          for (const timingType of timingArray) {
            // Convert timing to time slots
            const timeSlots = getTimeSlotsForTiming(timingType);

            for (const timeSlot of timeSlots) {
              doseRecords.push({
                patientId: pm.patientId._id,
                patientMedicineId: pm._id,
                medicineId,
                doseDate,
                doseTime: timeSlot,
                timing: timingType,
                doseAmount: dosePerTime,
                status: 'PENDING',
                reminderEnabled: true,
                reminderMinutes: 15,
              });
            }
          }
        }
      }

      // Insert doses for this patient medicine
      if (doseRecords.length > 0) {
        try {
          await DoseTracking.insertMany(doseRecords, { ordered: false });
          console.log(`Created ${doseRecords.length} doses for PatientMedicine ${pm._id}`);
          totalDosesCreated += doseRecords.length;
        } catch (error) {
          if (error.code === 11000) {
            console.log(`Some doses already exist for PatientMedicine ${pm._id}`);
          } else {
            console.error(`Error creating doses for PatientMedicine ${pm._id}:`, error);
          }
        }
      }

      processedRecords++;
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed. Processed ${processedRecords} records, created ${totalDosesCreated} dose records.`,
      stats: {
        totalRecords: patientMedicines.length,
        processedRecords,
        totalDosesCreated
      }
    });

  } catch (error) {
    console.error('Dose migration error:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error.message
    }, { status: 500 });
  }
}

// Helper function to parse timing strings into enum values
function parseTimingString(timingString) {
  const timingMap = {
    'morning (before food)': 'MORNING_BEFORE_FOOD',
    'morning (after food)': 'MORNING_AFTER_FOOD',
    'afternoon (before food)': 'AFTERNOON_BEFORE_FOOD',
    'afternoon (after food)': 'AFTERNOON_AFTER_FOOD',
    'night (before food)': 'NIGHT_BEFORE_FOOD',
    'night (after food)': 'NIGHT_AFTER_FOOD',
  };

  if (!timingString || typeof timingString !== 'string') return [];

  // Split by comma and clean up
  const parts = timingString.split(',').map(part => part.trim().toLowerCase());

  return parts.map(part => timingMap[part]).filter(Boolean);
}

// Helper function to get time slots for timing types
function getTimeSlotsForTiming(timing) {
  const timeSlots = {
    'MORNING_BEFORE_FOOD': ['08:00'],
    'MORNING_AFTER_FOOD': ['09:00'],
    'AFTERNOON_BEFORE_FOOD': ['13:00'],
    'AFTERNOON_AFTER_FOOD': ['14:00'],
    'NIGHT_BEFORE_FOOD': ['20:00'],
    'NIGHT_AFTER_FOOD': ['21:00'],
  };

  return timeSlots[timing] || ['09:00']; // Default fallback
}
