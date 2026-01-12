import { NextResponse } from 'next/server';
import Inventory from '../../../../../models/Inventory';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function GET() {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const inventory = await Inventory.find({ medicalId: user.id })
      .populate('medicineId', 'name brandName dosageForm strength unit')
      .populate('supplierId', 'name companyName')
      .sort({ expiryDate: 1 }); // Show earliest expiry first

    // First, calculate aggregated stock levels by medicine
    const medicineStockMap = new Map();
    inventory.forEach(item => {
      const medicineId = item.medicineId._id.toString();
      if (!medicineStockMap.has(medicineId)) {
        medicineStockMap.set(medicineId, {
          totalAvailable: 0,
          reorderLevel: item.reorderLevel,
          medicineName: item.medicineId.name
        });
      }
      medicineStockMap.get(medicineId).totalAvailable += item.availableStock;
    });

    // Add low stock alerts and expiry management info
    const today = new Date();
    const inventoryWithAlerts = inventory.map(item => {
      const daysLeft = Math.ceil((item.expiryDate - today) / (1000 * 60 * 60 * 24));
      const isExpired = item.expiryDate < today;

      // Calculate expiry status
      let expiryStatus = 'SAFE';
      if (isExpired) {
        expiryStatus = 'EXPIRED';
      } else if (daysLeft <= 30) { // Near expiry within 30 days
        expiryStatus = 'NEAR_EXPIRY';
      }

      // Calculate discount percentage for near expiry items
      let discountPercent = 0;
      let finalSellingPrice = item.discountedPrice ?? item.sellingPrice;

      if (expiryStatus === 'NEAR_EXPIRY') {
        if (daysLeft <= 7) {
          discountPercent = 50; // 50% discount for items expiring within 7 days
        } else if (daysLeft <= 14) {
          discountPercent = 30; // 30% discount for items expiring within 14 days
        } else if (daysLeft <= 21) {
          discountPercent = 20; // 20% discount for items expiring within 21 days
        } else {
          discountPercent = 10; // 10% discount for items expiring within 30 days
        }
        finalSellingPrice = item.sellingPrice * (1 - discountPercent / 100);
      }

      // Check medicine-level low stock (aggregated across all batches)
      const medicineId = item.medicineId._id.toString();
      const medicineStock = medicineStockMap.get(medicineId);
      const isMedicineLowStock = medicineStock && medicineStock.totalAvailable <= medicineStock.reorderLevel;

      return {
        ...item.toObject(),
        isLowStock: item.availableStock <= item.reorderLevel, // Keep batch-level low stock
        isMedicineLowStock, // New: medicine-level low stock
        medicineTotalStock: medicineStock?.totalAvailable || 0,
        isExpired,
        daysLeft,
        expiryStatus,
        discountPercent,
        finalSellingPrice,
        hasDiscount: item.discountedPrice && item.discountedPrice < item.sellingPrice,
      };
    });

    return NextResponse.json({ inventory: inventoryWithAlerts });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
