import { NextResponse } from 'next/server';
import Sale from '../../../../../models/Sale';
import Purchase from '../../../../../models/Purchase';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const { searchParams } = new URL(request.url);
    const medicineId = searchParams.get('medicineId');

    if (!medicineId) {
      return NextResponse.json({ error: 'Medicine ID is required' }, { status: 400 });
    }

    const history = [];

    // Get sales history for this medicine
    const sales = await Sale.find({
      medicalId: user.id,
      'items.medicineId': medicineId
    })
      .populate('patientId', 'name mobile')
      .populate('prescriptionId')
      .select('saleDate items paymentMode billNumber totalAmount')
      .sort({ saleDate: -1 })
      .limit(50);

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.medicineId.toString() === medicineId) {
          history.push({
            _id: sale._id + '_' + item._id, // Composite ID for uniqueness
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

    // Get purchase history for this medicine (if Purchase model exists)
    try {
      const purchases = await Purchase.find({
        medicalId: user.id,
        'items.medicineId': medicineId
      })
        .populate('supplierId', 'name companyName')
        .select('purchaseDate items invoiceNumber totalAmount')
        .sort({ purchaseDate: -1 })
        .limit(50);

      purchases.forEach(purchase => {
        purchase.items.forEach(item => {
          if (item.medicineId.toString() === medicineId) {
            history.push({
              _id: purchase._id + '_' + item._id,
              date: purchase.purchaseDate,
              type: 'PURCHASE',
              quantity: item.quantity,
              price: item.purchasePrice || item.price,
              reference: `Invoice #${purchase.invoiceNumber}`,
              supplierName: purchase.supplierId?.name || 'N/A',
              paymentMode: 'PURCHASE'
            });
          }
        });
      });
    } catch (error) {
      // Purchase model might not exist yet, that's okay
      console.log('Purchase history not available');
    }

    // Sort by date (most recent first)
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    return NextResponse.json({
      history: history.slice(0, 20) // Return only last 20 transactions
    });

  } catch (error) {
    console.error('Inventory history API error:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
