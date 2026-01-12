import { NextResponse } from 'next/server';
import Sale from '../../../../../models/Sale';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const page = parseInt(searchParams.get('page')) || 1;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const skip = (page - 1) * limit;

    // Build query
    let query = { medicalId: user.id };

    // Date filtering
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) {
        query.saleDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.saleDate.$lte = new Date(endDate);
      }
    }

    // Get sales with populated data
    const sales = await Sale.find(query)
      .populate('patientId', 'name mobile')
      .populate('items.medicineId', 'name brandName')
      .populate('prescriptionId', 'prescriptionNumber')
      .sort({ saleDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const totalCount = await Sale.countDocuments(query);

    // Format sales for response
    const formattedSales = sales.map(sale => ({
      id: sale._id,
      billNumber: sale.billNumber,
      patient: sale.patientId ? {
        id: sale.patientId._id,
        name: sale.patientId.name,
        mobile: sale.patientId.mobile
      } : null,
      items: sale.items.map(item => ({
        medicineId: item.medicineId._id,
        medicineName: item.medicineId.name,
        brandName: item.medicineId.brandName,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice,
        total: item.total
      })),
      totalAmount: sale.totalAmount,
      paymentMode: sale.paymentMode,
      saleDate: sale.saleDate,
      prescriptionId: sale.prescriptionId?._id,
      prescriptionNumber: sale.prescriptionId?.prescriptionNumber,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      // Formatted dates
      saleDateFormatted: new Date(sale.saleDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      createdAtFormatted: new Date(sale.createdAt).toLocaleDateString('en-IN')
    }));

    return NextResponse.json({
      success: true,
      data: {
        sales: formattedSales,
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

    console.error('Medical sales list error:', error);
    return NextResponse.json({
      error: 'Failed to fetch sales',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
