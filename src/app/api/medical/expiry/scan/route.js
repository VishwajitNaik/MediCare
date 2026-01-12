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

export async function POST() {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(`🔄 Starting expiry scan for medical store ${user.id} on ${todayString}`);

    // Get all inventory items for this medical store
    const allInventory = await Inventory.find({
      medicalId: user.id,
      availableStock: { $gt: 0 }
    });

    console.log(`📦 Found ${allInventory.length} inventory items to scan`);

    let updatedCount = 0;
    let expiredCount = 0;
    let discountedCount = 0;

    // Process each inventory item
    for (const item of allInventory) {
      const expiryDate = new Date(item.expiryDate);
      const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

      // Calculate new status and discounts
      const newStatus = calculateExpiryStatus(daysLeft);

      // Calculate discounted price
      const newDiscountedPrice = newStatus.discountPercent > 0
        ? item.sellingPrice - (item.sellingPrice * newStatus.discountPercent) / 100
        : null;

      // Check if update is needed
      const needsUpdate =
        item.expiryStatus !== newStatus.expiryStatus ||
        item.saleLocked !== newStatus.saleLocked ||
        item.discountPercent !== newStatus.discountPercent ||
        item.discountedPrice !== newDiscountedPrice;

      if (needsUpdate) {
        await Inventory.findByIdAndUpdate(item._id, {
          expiryStatus: newStatus.expiryStatus,
          saleLocked: newStatus.saleLocked,
          discountPercent: newStatus.discountPercent,
          discountedPrice: newDiscountedPrice
        });

        updatedCount++;

        if (newStatus.expiryStatus === 'EXPIRED') {
          expiredCount++;
        } else if (newStatus.discountPercent > 0) {
          discountedCount++;
        }

        console.log(`✅ Updated ${item.batchNumber}: ${newStatus.expiryStatus}, discount: ${newStatus.discountPercent}%, locked: ${newStatus.saleLocked}`);
      }
    }

    console.log(`🎯 Expiry scan completed: ${updatedCount} items updated, ${expiredCount} expired, ${discountedCount} discounted`);

    return NextResponse.json({
      success: true,
      message: 'Expiry scan completed successfully',
      stats: {
        totalScanned: allInventory.length,
        updated: updatedCount,
        expired: expiredCount,
        discounted: discountedCount,
        scanDate: todayString
      }
    });

  } catch (error) {
    console.error('❌ Expiry scan error:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error during expiry scan' }, { status: 500 });
  }
}

// GET endpoint to check scan status (for debugging)
export async function GET() {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const stats = await Inventory.aggregate([
      { $match: { medicalId: user.id, availableStock: { $gt: 0 } } },
      {
        $group: {
          _id: '$expiryStatus',
          count: { $sum: 1 },
          totalDiscounted: {
            $sum: { $cond: [{ $gt: ['$discountPercent', 0] }, 1, 0] }
          },
          totalLocked: {
            $sum: { $cond: ['$saleLocked', 1, 0] }
          }
        }
      }
    ]);

    const summary = {
      SAFE: 0,
      NEAR_EXPIRY: 0,
      EXPIRED: 0,
      totalDiscounted: 0,
      totalLocked: 0
    };

    stats.forEach(stat => {
      summary[stat._id] = stat.count;
      if (stat._id === 'NEAR_EXPIRY') {
        summary.totalDiscounted = stat.totalDiscounted;
      }
      if (stat._id === 'EXPIRED') {
        summary.totalLocked = stat.totalLocked;
      }
    });

    return NextResponse.json({
      expiryStats: summary,
      lastScan: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting expiry stats:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
