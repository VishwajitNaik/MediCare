import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Sale from '../../../../../models/Sale';
import Purchase from '../../../../../models/Purchase';
import Inventory from '../../../../../models/Inventory';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    // Default to today if no date provided
    const reportDate = date ? new Date(date) : new Date();

    // Create date range in UTC to avoid timezone issues
    const startOfDay = new Date(Date.UTC(reportDate.getUTCFullYear(), reportDate.getUTCMonth(), reportDate.getUTCDate()));
    const endOfDay = new Date(Date.UTC(reportDate.getUTCFullYear(), reportDate.getUTCMonth(), reportDate.getUTCDate() + 1));

    // Debug: Check what sales exist for this medical store
    console.log('Daily report for medicalId:', user.id);
    console.log('Date range:', startOfDay.toISOString(), 'to', endOfDay.toISOString());

    const allSalesForMedical = await Sale.find({ medicalId: user.id }).limit(10);
    console.log('All sales for this medical store:', allSalesForMedical.length);
    allSalesForMedical.forEach(sale => {
      console.log('Sale:', sale._id, sale.saleDate, sale.totalAmount, sale.medicalId);
    });

    // Get sales for the day
    console.log('Running aggregation with medicalId:', user.id, 'type:', typeof user.id);
    const medicalObjectId = new mongoose.Types.ObjectId(user.id);
    console.log('Converted to ObjectId:', medicalObjectId);

    const salesAggregation = await Sale.aggregate([
      {
        $match: {
          medicalId: medicalObjectId, // Use ObjectId for proper comparison
          saleDate: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' },
          billsCount: { $sum: 1 },
          cashAmount: {
            $sum: {
              $cond: [{ $eq: ['$paymentMode', 'CASH'] }, '$totalAmount', 0]
            }
          },
          upiAmount: {
            $sum: {
              $cond: [{ $eq: ['$paymentMode', 'UPI'] }, '$totalAmount', 0]
            }
          },
          cardAmount: {
            $sum: {
              $cond: [{ $eq: ['$paymentMode', 'CARD'] }, '$totalAmount', 0]
            }
          }
        }
      }
    ]);

    console.log('Sales aggregation result:', salesAggregation);

    // Debug: Check purchases for this medical store
    const allPurchasesForMedical = await Purchase.find({ medicalId: user.id }).limit(10);
    console.log('All purchases for this medical store:', allPurchasesForMedical.length);
    allPurchasesForMedical.forEach(purchase => {
      console.log('Purchase:', purchase._id, purchase.purchaseDate, purchase.totalPurchaseAmount, purchase.medicalId, purchase.status);
    });

    // Get purchases for the day
    const purchasesAggregation = await Purchase.aggregate([
      {
        $match: {
          medicalId: medicalObjectId, // Use ObjectId for proper comparison
          purchaseDate: { $gte: startOfDay, $lte: endOfDay },
          status: 'COMPLETED'
        }
      },
      {
        $group: {
          _id: null,
          purchaseAmount: { $sum: '$totalPurchaseAmount' },
          invoicesCount: { $sum: 1 }
        }
      }
    ]);

    console.log('Purchases aggregation result:', purchasesAggregation);

    // Debug: Check inventory for this medical store
    const allInventoryForMedical = await Inventory.find({ medicalId: user.id }).limit(10);
    console.log('All inventory for this medical store:', allInventoryForMedical.length);
    allInventoryForMedical.forEach(inv => {
      console.log('Inventory:', inv._id, inv.availableStock, inv.purchasePrice, inv.medicalId);
      const stockValue = inv.availableStock * inv.purchasePrice;
      console.log('Stock value for this item:', stockValue);
    });

    // Calculate stock valuation (current inventory value)
    const stockValuation = await Inventory.aggregate([
      {
        $match: { medicalId: medicalObjectId } // Use ObjectId for proper comparison
      },
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: {
              $multiply: ['$availableStock', '$purchasePrice']
            }
          },
          totalItems: { $sum: 1 },
          lowStockItems: {
            $sum: {
              $cond: [
                { $lte: ['$availableStock', '$reorderLevel'] },
                1,
                0
              ]
            }
          },
          expiringSoon: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lte: ['$expiryDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] },
                    { $gt: ['$expiryDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          expiredItems: {
            $sum: {
              $cond: [
                { $lt: ['$expiryDate', new Date()] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    console.log('Stock valuation aggregation result:', stockValuation);

    // Extract results
    const sales = salesAggregation[0] || {
      revenue: 0,
      billsCount: 0,
      cashAmount: 0,
      upiAmount: 0,
      cardAmount: 0
    };

    const purchases = purchasesAggregation[0] || {
      purchaseAmount: 0,
      invoicesCount: 0
    };

    const stock = stockValuation[0] || {
      totalValue: 0,
      totalItems: 0,
      lowStockItems: 0,
      expiringSoon: 0,
      expiredItems: 0
    };

    // Calculate profit
    const profit = sales.revenue - purchases.purchaseAmount;

    const report = {
      date: reportDate.toISOString().split('T')[0],
      sales: {
        revenue: sales.revenue,
        billsCount: sales.billsCount,
        paymentBreakdown: {
          cash: sales.cashAmount,
          upi: sales.upiAmount,
          card: sales.cardAmount
        }
      },
      purchases: {
        amount: purchases.purchaseAmount,
        invoicesCount: purchases.invoicesCount
      },
      profit,
      stock: {
        totalValue: stock.totalValue,
        totalItems: stock.totalItems,
        alerts: {
          lowStockItems: stock.lowStockItems,
          expiringSoon: stock.expiringSoon,
          expiredItems: stock.expiredItems
        }
      }
    };

    return NextResponse.json({ report });

  } catch (error) {
    console.error('Daily report error:', error);
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
