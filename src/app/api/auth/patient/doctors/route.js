import { NextResponse } from 'next/server';
import Doctor from '../../../../../models/Doctor';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const user = await requireAuth('PATIENT');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const search = searchParams.get('search');

    // Build query - include doctors that are active OR don't have isActive field (backwards compatibility)
    let query = { $or: [{ isActive: true }, { isActive: { $exists: false } }] };

    if (specialty && specialty !== 'all') {
      query.specialty = specialty;
    }

    if (search) {
      // Combine active doctor condition with search conditions
      query.$and = [
        { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { specialty: { $regex: search, $options: 'i' } },
            { hospital: { $regex: search, $options: 'i' } }
          ]
        }
      ];
      // Remove the original $or since we're using $and now
      delete query.$or;
    }

    // Get doctors with basic info
    const doctors = await Doctor.find(query)
      .select('name email mobile specialty hospital experience licenseNumber clinicAddress isActive')
      .sort({ name: 1 })
      .lean();

      console.log("doctors", doctors);
      

    // Get unique specialties for filter dropdown
    const specialties = await Doctor.distinct('specialty', { isActive: true });

    // Format doctor data for patients
    const formattedDoctors = doctors.map(doctor => ({
      id: doctor._id,
      name: doctor.name,
      specialty: doctor.specialty,
      hospital: doctor.hospital,
      experience: doctor.experience,
      clinicAddress: doctor.clinicAddress,
      // Don't expose sensitive info like email/mobile to patients
      contactInfo: 'Available during appointment booking',
      // Add rating/availability info (mock for now)
      rating: (4.2 + Math.random() * 0.8).toFixed(1), // Mock rating 4.2-5.0
      nextAvailable: getNextAvailableDate(),
      consultationFee: getConsultationFee(doctor.specialty)
    }));

    return NextResponse.json({
      success: true,
      data: {
        doctors: formattedDoctors,
        specialties: specialties.filter(s => s), // Remove null/undefined
        totalDoctors: formattedDoctors.length
      }
    });

  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Patient doctors API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch doctors',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Helper function to get mock next available date
function getNextAvailableDate() {
  const today = new Date();
  const daysToAdd = Math.floor(Math.random() * 7) + 1; // 1-7 days from now
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysToAdd);

  return nextDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

// Helper function to get consultation fee based on specialty
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

  return feeMap[specialty] || 400; // Default fee
}
