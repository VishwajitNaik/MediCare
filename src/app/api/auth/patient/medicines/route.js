import { NextResponse } from 'next/server';
import PatientMedicine from '../../../../../models/PatientMedicine';
import Medicine from '../../../../../models/Medicine';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const user = await requireAuth('PATIENT');

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const page = parseInt(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;

    // Get patient's medicine purchase history
    const medicineHistory = await PatientMedicine.find({ patientId: user.id })
      .populate('medicalId', 'name location')
      .populate('prescriptionId')
      .sort({ visitDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await PatientMedicine.countDocuments({ patientId: user.id });

    // Enrich medicine data with medicine names
    const enrichedHistory = await Promise.all(
      medicineHistory.map(async (record) => {
        const enrichedMedicines = await Promise.all(
          record.medicines.map(async (med) => {
            try {
              const medicine = await Medicine.findById(med.medicineId).select('name type strength').lean();
              return {
                ...med,
                medicineName: medicine?.name || 'Unknown Medicine',
                medicineType: medicine?.type || 'N/A',
                medicineStrength: medicine?.strength || 'N/A'
              };
            } catch (error) {
              console.error('Error fetching medicine details:', error);
              return {
                ...med,
                medicineName: 'Unknown Medicine',
                medicineType: 'N/A',
                medicineStrength: 'N/A'
              };
            }
          })
        );

        return {
          ...record,
          medicines: enrichedMedicines,
          // Format dates for display
          visitDateFormatted: new Date(record.visitDate).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          createdAtFormatted: new Date(record.createdAt).toLocaleDateString('en-IN'),
        };
      })
    );

    // Calculate summary statistics
    const totalPurchases = medicineHistory.length;
    const totalAmount = medicineHistory.reduce((sum, record) => sum + record.totalAmount, 0);
    const paidPurchases = medicineHistory.filter(record => record.paymentStatus === 'PAID').length;
    const pendingPurchases = medicineHistory.filter(record => record.paymentStatus === 'PENDING').length;

    return NextResponse.json({
      success: true,
      data: {
        medicineHistory: enrichedHistory,
        summary: {
          totalPurchases,
          totalAmount: totalAmount.toFixed(2),
          paidPurchases,
          pendingPurchases,
          averagePurchase: totalPurchases > 0 ? (totalAmount / totalPurchases).toFixed(2) : 0
        },
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

    console.error('Patient medicines API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch medicine purchase history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
