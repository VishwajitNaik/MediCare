import { NextResponse } from 'next/server';
import Sale from '../../../../../models/Sale';
import connectDB from '../../../../../lib/mongodb';
import { requireAuth } from '../../../../../lib/auth';

export async function GET() {
  try {
    await connectDB();
    const user = await requireAuth('MEDICAL');

    // Get start of current week (Monday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    // Aggregate sales by medicine for this week
    const topSelling = await Sale.aggregate([
      {
        $match: {
          medicalId: user.id,
          saleDate: { $gte: startOfWeek }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.medicineId',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          saleCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'medicines',
          localField: '_id',
          foreignField: '_id',
          as: 'medicine'
        }
      },
      {
        $unwind: '$medicine'
      },
      {
        $project: {
          medicineId: '$_id',
          medicineName: '$medicine.name',
          brandName: '$medicine.brandName',
          strength: '$medicine.strength',
          totalQuantity: 1,
          totalRevenue: 1,
          saleCount: 1
        }
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return NextResponse.json({ topSelling });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Top selling medicines error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
