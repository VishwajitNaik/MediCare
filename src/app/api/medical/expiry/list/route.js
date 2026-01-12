import { NextResponse } from 'next/server';
import Inventory from '../../../../../models/Inventory';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

// Helper function to calculate expiry status and discounts
function calculateExpiryStatus(daysLeft) {
  if (daysLeft <= 0) {
    return {
      expiryStatus: "EXPIRED",
      saleLocked: true,
      discountPercent: 0
    };
  } else if (daysLeft <= 7) {
    return {
      expiryStatus: "NEAR_EXPIRY",
      saleLocked: false,
      discountPercent: 40
    };
  } else if (daysLeft <= 30) {
    return {
      expiryStatus: "NEAR_EXPIRY",
      saleLocked: false,
      discountPercent: 30
    };
  } else if (daysLeft <= 60) {
    return {
      expiryStatus: "NEAR_EXPIRY",
      saleLocked: false,
      discountPercent: 20
    };
  } else if (daysLeft <= 90) {
    return {
      expiryStatus: "NEAR_EXPIRY",
      saleLocked: false,
      discountPercent: 10
    };
  } else {
    return {
      expiryStatus: "SAFE",
      saleLocked: false,
      discountPercent: 0
    };
  }
}

export async function GET() {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Get all inventory items with expiry information
    const inventory = await Inventory.find({
      medicalId: user.id,
      availableStock: { $gt: 0 }
    })
      .populate('medicineId', 'name brandName strength')
      .populate('supplierId', 'name companyName contactNumber')
      .sort({ expiryDate: 1 });

    // Categorize items
    const expiredItems = [];
    const nearExpiryItems = [];
    const normalItems = [];

    inventory.forEach(item => {
      if (item.expiryDate < today) {
        expiredItems.push({
          ...item.toObject(),
          status: 'EXPIRED',
          daysUntilExpiry: Math.floor((item.expiryDate - today) / (1000 * 60 * 60 * 24))
        });
      } else if (item.expiryDate <= thirtyDaysFromNow) {
        nearExpiryItems.push({
          ...item.toObject(),
          status: 'NEAR_EXPIRY',
          daysUntilExpiry: Math.floor((item.expiryDate - today) / (1000 * 60 * 60 * 24))
        });
      } else {
        normalItems.push({
          ...item.toObject(),
          status: 'NORMAL',
          daysUntilExpiry: Math.floor((item.expiryDate - today) / (1000 * 60 * 60 * 24))
        });
      }
    });

    // Group by supplier for easier management
    const groupBySupplier = (items) => {
      return items.reduce((acc, item) => {
        const supplierName = item.supplierId?.name || 'Unknown Supplier';
        if (!acc[supplierName]) {
          acc[supplierName] = {
            supplier: item.supplierId,
            items: []
          };
        }
        acc[supplierName].items.push(item);
        return acc;
      }, {});
    };

    return NextResponse.json({
      expiredItems: groupBySupplier(expiredItems),
      nearExpiryItems: groupBySupplier(nearExpiryItems),
      normalItems: groupBySupplier(normalItems),
      summary: {
        totalExpired: expiredItems.length,
        totalNearExpiry: nearExpiryItems.length,
        totalNormal: normalItems.length
      }
    });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
