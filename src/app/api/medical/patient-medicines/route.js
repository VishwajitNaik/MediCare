import { NextResponse } from 'next/server';
import PatientMedicine from '../../../../models/PatientMedicine';
import Inventory from '../../../../models/Inventory';
import DoseTracking from '../../../../models/DoseTracking';
import connectDB from '../../../../lib/mongodb';
import { requireAuth } from '../../../../lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const {
      patientId,
      medicines, // Array of medicines to serve
      source, // 'DOCTOR_PRESCRIPTION' or 'MEDICAL_DIRECT'
      prescriptionId, // Optional, for prescription fulfillment
      notes,
    } = await request.json();

    console.log('Serve medicine request:', { patientId, medicines: medicines.length, source, prescriptionId });

    const visitDate = new Date();
    let totalAmount = 0;
    const processedMedicines = [];

    // Process each medicine in the array
    for (const med of medicines) {
      const {
        medicineId,
        dosePerTime,
        timing,
        durationDays,
        actualQuantity,
      } = med;

      // Calculate total quantity needed for dosage schedule
      const dosesPerDay = timing.length;
      const totalQuantity = dosesPerDay * durationDays;

      // Check inventory availability using FIFO
      const availableInventory = await Inventory.find({
        medicalId: user.id,
        medicineId,
        availableStock: { $gt: 0 },
        expiryDate: { $gt: new Date() },
      }).sort({ expiryDate: 1 });

      let availableQuantity = 0;
      for (const inv of availableInventory) {
        availableQuantity += inv.availableStock;
      }

      if (availableQuantity < actualQuantity) {
        return NextResponse.json({
          error: `Insufficient stock for medicine. Required: ${actualQuantity}, Available: ${availableQuantity}`
        }, { status: 400 });
      }

      // Get selling price from inventory (use the latest batch)
      const latestBatch = await Inventory.findOne({
        medicalId: user.id,
        medicineId,
        availableStock: { $gt: 0 },
      }).sort({ createdAt: -1 });

      if (!latestBatch) {
        return NextResponse.json({
          error: `No inventory found for medicine`
        }, { status: 400 });
      }

      const unitPrice = latestBatch.sellingPrice;
      const totalPrice = unitPrice * actualQuantity;
      totalAmount += totalPrice;

      // Deduct from inventory using FIFO
      let remainingQuantity = actualQuantity;
      for (const inventory of availableInventory) {
        if (remainingQuantity <= 0) break;

        const deductQuantity = Math.min(remainingQuantity, inventory.availableStock);
        inventory.availableStock -= deductQuantity;
        remainingQuantity -= deductQuantity;

        await inventory.save();
      }

      // Add to processed medicines array
      processedMedicines.push({
        medicineId,
        dosePerTime,
        timing,
        startDate: visitDate,
        durationDays,
        totalQuantity,
        actualQuantity,
        unitPrice,
        totalPrice,
      });
    }

    // Create PatientMedicine record
    console.log('Creating PatientMedicine record:', {
      patientId,
      medicalId: user.id,
      medicinesCount: processedMedicines.length,
      totalAmount,
      source
    });

    const patientMedicine = new PatientMedicine({
      patientId,
      medicalId: user.id,
      visitDate,
      medicines: processedMedicines,
      totalAmount,
      source,
      prescriptionId: source === 'DOCTOR_PRESCRIPTION' ? prescriptionId : undefined,
      notes,
    });

    const savedRecord = await patientMedicine.save();
    console.log('PatientMedicine saved successfully:', savedRecord._id);

    // Generate dose tracking records for each medicine
    try {
      await generateDoseTrackingRecords(patientId, savedRecord._id, processedMedicines, user.id);
      console.log('Dose tracking records generated successfully');
    } catch (doseError) {
      console.error('Error generating dose tracking records:', doseError);
      // Don't fail the entire operation if dose generation fails
    }

    return NextResponse.json({
      message: 'Medicines served successfully',
      patientMedicine: {
        id: savedRecord._id,
        visitDate: savedRecord.visitDate,
        medicines: processedMedicines,
        totalAmount: savedRecord.totalAmount,
        source: savedRecord.source,
      }
    }, { status: 201 });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    const query = { medicalId: user.id };
    if (patientId) {
      query.patientId = patientId;
    }

    const patientMedicines = await PatientMedicine.find(query)
      .populate('patientId', 'name mobile')
      .populate('medicineId', 'name brandName dosageForm strength')
      .sort({ createdAt: -1 });

    return NextResponse.json({ patientMedicines });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Helper function to generate dose tracking records
async function generateDoseTrackingRecords(patientId, patientMedicineId, medicines, medicalId) {
  const doseRecords = [];

  console.log('Generating doses for medicines:', medicines.map(m => ({
    medicineId: m.medicineId,
    timing: m.timing,
    timingType: typeof m.timing,
    durationDays: m.durationDays
  })));

  for (const medicine of medicines) {
    const { medicineId, dosePerTime, timing, startDate, durationDays } = medicine;

    // Handle timing - could be array of enums or formatted strings
    let timingArray = [];
    if (Array.isArray(timing)) {
      timingArray = timing;
    } else if (typeof timing === 'string') {
      // Parse formatted timing string like "Morning (before food), Night (after food)"
      timingArray = parseTimingString(timing);
    } else {
      console.warn('Invalid timing format:', timing);
      continue;
    }

    console.log(`Processing medicine ${medicineId}: timingArray=`, timingArray, `duration=${durationDays}`);

    // Generate doses for each day and each timing
    for (let day = 0; day < durationDays; day++) {
      const doseDate = new Date(startDate);
      doseDate.setDate(doseDate.getDate() + day);

      // Generate doses for each timing on this day
      for (const timingType of timingArray) {
        // Convert timing to time slots
        const timeSlots = getTimeSlotsForTiming(timingType);

        for (const timeSlot of timeSlots) {
          doseRecords.push({
            patientId,
            patientMedicineId,
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

  console.log(`Total dose records to create: ${doseRecords.length}`);

  // Bulk insert all dose records
  if (doseRecords.length > 0) {
    try {
      await DoseTracking.insertMany(doseRecords, { ordered: false });
      console.log(`Generated ${doseRecords.length} dose tracking records`);
    } catch (error) {
      // Handle duplicate key errors (same dose already exists)
      if (error.code === 11000) {
        console.log('Some dose records already exist, skipping duplicates');
      } else {
        console.error('Error inserting dose records:', error);
        throw error;
      }
    }
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
