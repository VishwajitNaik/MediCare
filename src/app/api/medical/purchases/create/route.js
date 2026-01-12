import { NextResponse } from 'next/server';
import Purchase from '../../../../../models/Purchase';
import Inventory from '../../../../../models/Inventory';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const { supplierId, invoiceNumber, items } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    // Calculate total purchase amount and validate items
    let totalPurchaseAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const { medicineId, batchNumber, expiryDate, quantity, purchasePrice } = item;

      if (!medicineId || !batchNumber || !expiryDate || !quantity || !purchasePrice) {
        return NextResponse.json({
          error: 'All item fields are required: medicineId, batchNumber, expiryDate, quantity, purchasePrice'
        }, { status: 400 });
      }

      const itemTotal = quantity * purchasePrice;
      totalPurchaseAmount += itemTotal;

      validatedItems.push({
        medicineId,
        batchNumber,
        expiryDate: new Date(expiryDate),
        quantity,
        purchasePrice,
        total: itemTotal,
      });
    }

    // Create the purchase record
    const purchase = new Purchase({
      medicalId: user.id,
      supplierId,
      invoiceNumber: invoiceNumber || `TEMP-${Date.now()}`, // Generate temp if not provided
      items: validatedItems,
      totalPurchaseAmount,
      status: 'COMPLETED', // Auto-complete for now, can be made pending later
    });

    await purchase.save();

    // Create/Update inventory records
    for (const item of validatedItems) {
      // Check if inventory batch already exists
      let inventory = await Inventory.findOne({
        medicalId: user.id,
        medicineId: item.medicineId,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
      });

      if (inventory) {
        // Update existing inventory batch
        inventory.totalStock += item.quantity;
        inventory.availableStock += item.quantity;
        await inventory.save();
      } else {
        // Create new inventory batch
        const sellingPrice = Math.round((item.purchasePrice * 1.3) * 100) / 100; // Default 30% markup, rounded to 2 decimals

        inventory = new Inventory({
          medicalId: user.id,
          medicineId: item.medicineId,
          supplierId,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          totalStock: item.quantity,
          availableStock: item.quantity,
          purchasePrice: item.purchasePrice,
          sellingPrice,
          reorderLevel: 10, // Default reorder level
        });

        await inventory.save();
      }
    }

    return NextResponse.json({
      message: 'Purchase created successfully',
      purchase: {
        id: purchase._id,
        invoiceNumber: purchase.invoiceNumber,
        totalPurchaseAmount: purchase.totalPurchaseAmount,
        itemsCount: purchase.items.length,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Purchase creation error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Invoice number already exists for this medical store' }, { status: 400 });
    }
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
