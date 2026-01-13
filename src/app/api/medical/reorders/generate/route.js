import { NextResponse } from 'next/server';
import Inventory from '../../../../../models/Inventory';
import ReorderDraft from '../../../../../models/ReorderDraft';
import Sale from '../../../../../models/Sale';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function POST() {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    // Get all inventory items for this medical store (include all items for reorder analysis)
    const inventories = await Inventory.find({
      medicalId: user.id
    }).populate('medicineId supplierId');

    let processedCount = 0;
    let reorderCreatedCount = 0;

    for (const inventory of inventories) {
      try {
        // Calculate average daily consumption (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const salesData = await Sale.aggregate([
          {
            $match: {
              medicalId: user.id,
              saleDate: { $gte: sevenDaysAgo }
            }
          },
          { $unwind: '$items' },
          {
            $match: {
              'items.medicineId': inventory.medicineId._id
            }
          },
          {
            $group: {
              _id: null,
              totalQuantity: { $sum: '$items.quantity' },
              lastSoldDate: { $max: '$saleDate' }
            }
          }
        ]);

        const avgDailyConsumption = salesData.length > 0
          ? Math.round((salesData[0].totalQuantity / 7) * 100) / 100
          : 0;

        // Update inventory with latest consumption data
        inventory.avgDailyConsumption = avgDailyConsumption;
        if (salesData.length > 0 && salesData[0].lastSoldDate) {
          inventory.lastSoldDate = salesData[0].lastSoldDate;
        }
        await inventory.save();

        // Calculate days left
        const daysLeft = avgDailyConsumption > 0
          ? Math.round((inventory.availableStock / avgDailyConsumption) * 100) / 100
          : 999; // If no consumption, don't reorder

        // Check if reorder is needed (be more aggressive for testing)
        const reorderLevel = inventory.reorderLevel || 10; // Default to 10 if not set
        const needsReorder =
          inventory.availableStock <= reorderLevel ||
          daysLeft <= 7 || // More lenient: reorder if less than 7 days left
          inventory.availableStock <= 5 || // Always reorder if stock is critically low
          inventory.availableStock <= reorderLevel * 1.5; // Reorder if getting close to limit

        if (needsReorder) {
          console.log(`Reorder needed for ${inventory.medicineId?.name}: stock=${inventory.availableStock}, reorderLevel=${inventory.reorderLevel}, supplierId=${inventory.supplierId}`);

          // Calculate suggested quantity (10 days worth minus current stock)
          const targetStock = Math.max(avgDailyConsumption * 10, inventory.reorderLevel * 2);
          const suggestedQuantity = Math.max(1, Math.round(targetStock - inventory.availableStock));

          // Determine reason
          let reason = 'LOW_STOCK';
          if (daysLeft <= 3 && inventory.availableStock > inventory.reorderLevel) {
            reason = 'FAST_MOVING';
          }

          // Check supplier availability
          const supplierId = inventory.preferredSupplierId || inventory.supplierId;
          if (!supplierId) {
            console.log(`Skipping ${inventory.medicineId?.name}: no supplier assigned`);
            continue; // Skip items without suppliers
          }

          // Check if reorder draft already exists for this medicine (any status)
          const existingDraft = await ReorderDraft.findOne({
            medicalId: user.id,
            medicineId: inventory.medicineId._id
          });

          if (!existingDraft) {
            try {
              // Create new reorder draft only if none exists
              await ReorderDraft.create({
                medicalId: user.id,
                medicineId: inventory.medicineId._id,
                supplierId: supplierId,
                suggestedQuantity,
                reason,
                daysLeft,
                avgDailyConsumption,
                currentStock: inventory.availableStock,
              });
              reorderCreatedCount++;
              console.log(`Created reorder draft for ${inventory.medicineId?.name}`);
            } catch (createError) {
              console.error(`Failed to create reorder draft for ${inventory.medicineId?.name}:`, createError.message);
            }
          } else {
            console.log(`Reorder draft already exists for ${inventory.medicineId?.name} (status: ${existingDraft.status})`);
            // Update existing draft with latest data if it's still relevant
            if (existingDraft.status === 'PENDING' && needsReorder) {
              existingDraft.suggestedQuantity = suggestedQuantity;
              existingDraft.reason = reason;
              existingDraft.daysLeft = daysLeft;
              existingDraft.avgDailyConsumption = avgDailyConsumption;
              existingDraft.currentStock = inventory.availableStock;
              existingDraft.supplierId = supplierId;
              await existingDraft.save();
            }
          }
        }

        processedCount++;
      } catch (itemError) {
        console.error(`Error processing inventory item ${inventory._id}:`, itemError);
        // Continue with next item
      }
    }

    return NextResponse.json({
      message: 'Auto-reorder analysis completed',
      processedItems: processedCount,
      reorderDraftsCreated: reorderCreatedCount,
    });

  } catch (error) {
    console.error('Auto-reorder generation error:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
