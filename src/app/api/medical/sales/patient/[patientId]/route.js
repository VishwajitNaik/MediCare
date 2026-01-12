import { NextResponse } from 'next/server';
import Sale from '../../../../../../models/Sale';
import connectDB from '../../../../../../lib/mongodb';
import { requireAuth } from '../../../../../../lib/auth';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const { patientId } = await params;

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    // Fetch all sales for this patient, sorted by date (newest first)
    const sales = await Sale.find({
      patientId,
      medicalId: user.id
    })
    .populate('items.medicineId', 'name brandName strength')
    .populate('patientId', 'name mobile')
    .sort({ saleDate: -1 });

    // Format the sales data for display
    const formattedSales = sales.map(sale => ({
      id: sale._id,
      billNumber: sale.billNumber,
      saleDate: sale.saleDate,
      totalAmount: sale.totalAmount,
      paymentMode: sale.paymentMode,
      items: sale.items.map(item => ({
        medicineName: item.medicineId?.name || 'Unknown Medicine',
        brandName: item.medicineId?.brandName || '',
        strength: item.medicineId?.strength || '',
        quantity: item.quantity,
        price: item.sellingPrice,
        total: item.total
      })),
      prescriptionId: sale.prescriptionId
    }));

    return NextResponse.json({
      sales: formattedSales,
      totalSales: sales.length,
      totalAmount: sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    });

  } catch (error) {
    console.error('Patient sales fetch error:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
