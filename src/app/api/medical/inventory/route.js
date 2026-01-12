import { NextResponse } from 'next/server';
import Inventory from '../../../../models/Inventory';
import Sale from '../../../../models/Sale';
import connectDB from '../../../../lib/mongodb';
import { requireAuth } from '../../../../lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const { searchParams } = new URL(request.url);
    const medicineId = searchParams.get('medicineId');

    if (!medicineId) {
      return NextResponse.json({ error: 'Medicine ID is required' }, { status: 400 });
    }

    // Get inventory for specific medicine
    const inventory = await Inventory.find({
      medicalId: user.id,
      medicineId: medicineId
    })
      .populate('medicineId', 'name brandName dosageForm strength unit')
      .populate('supplierId', 'name companyName')
      .sort({ expiryDate: 1 });

    // Get stock history (sales/purchases for this medicine)
    const sales = await Sale.find({
      medicalId: user.id,
      'items.medicineId': medicineId
    })
      .populate('patientId', 'name mobile')
      .populate('prescriptionId')
      .select('saleDate items paymentMode billNumber totalAmount')
      .sort({ saleDate: -1 })
      .limit(50); // Limit to last 50 transactions

    // Filter and format stock history
    const stockHistory = [];
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.medicineId.toString() === medicineId) {
          stockHistory.push({
            date: sale.saleDate,
            type: 'SALE',
            quantity: item.quantity,
            price: item.price,
            reference: `Bill #${sale.billNumber}`,
            patientName: sale.patientId?.name || 'N/A',
            paymentMode: sale.paymentMode
          });
        }
      });
    });

    // Also add purchase history if we had purchase records
    // For now, we'll focus on sales history as that's what's implemented

    return NextResponse.json({
      inventory: inventory.map(item => ({
        _id: item._id,
        quantity: item.availableStock,
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        supplier: item.supplierId ? {
          name: item.supplierId.name,
          companyName: item.supplierId.companyName
        } : null
      })),
      stockHistory: stockHistory.slice(0, 10) // Return only last 10 transactions
    });

  } catch (error) {
    console.error('Inventory API error:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
