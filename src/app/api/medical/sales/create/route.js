import { NextResponse } from 'next/server';
import Sale from '../../../../../models/Sale';
import Inventory from '../../../../../models/Inventory';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const { patientId, items, paymentMode, prescriptionId } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    // Validate inventory availability and calculate totals
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const { medicineId, inventoryId, quantity } = item;

      // Find the inventory item
      const inventory = await Inventory.findOne({
        _id: inventoryId,
        medicineId,
        medicalId: user.id,
        availableStock: { $gte: quantity }
      });

      if (!inventory) {
        return NextResponse.json({
          error: `Insufficient stock for medicine ${medicineId}. Required: ${quantity}`
        }, { status: 400 });
      }

      // Check if medicine is locked from sale (expired)
      if (inventory.saleLocked) {
        return NextResponse.json({
          error: `Medicine batch ${inventory.batchNumber} is expired and cannot be sold`
        }, { status: 400 });
      }

      // Use discounted price if available, otherwise use regular selling price
      const finalSellingPrice = inventory.discountedPrice ?? inventory.sellingPrice;

      const itemTotal = quantity * finalSellingPrice;
      totalAmount += itemTotal;

      validatedItems.push({
        medicineId,
        inventoryId,
        quantity,
        purchasePrice: inventory.purchasePrice,
        sellingPrice: finalSellingPrice, // Use final price (may be discounted)
        originalPrice: inventory.sellingPrice, // Keep original for reference
        discountApplied: inventory.discountedPrice ? inventory.discountPercent : 0,
        total: itemTotal,
      });
    }

    // Generate unique bill number
    let billNumber;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      billNumber = `BILL-${dateStr}-${randomNum}`;
      attempts++;

      // Check if bill number already exists
      const existingSale = await Sale.findOne({ billNumber });
      if (!existingSale) {
        break;
      }
    } while (attempts < maxAttempts);

    if (!billNumber) {
      return NextResponse.json({ error: 'Could not generate unique bill number' }, { status: 500 });
    }

    // Create the sale
    const sale = new Sale({
      medicalId: user.id,
      patientId,
      billNumber,
      items: validatedItems,
      totalAmount,
      paymentMode,
      prescriptionId,
    });

    await sale.save();

    // Deduct from inventory (FIFO already handled in inventory query above)
    for (const item of validatedItems) {
      await Inventory.findByIdAndUpdate(item.inventoryId, {
        $inc: { availableStock: -item.quantity }
      });
    }

    return NextResponse.json({
      message: 'Sale created successfully',
      sale: {
        id: sale._id,
        billNumber: sale.billNumber,
        totalAmount: sale.totalAmount,
        paymentMode: sale.paymentMode,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Sale creation error:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
