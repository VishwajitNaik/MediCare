import { requireAuth } from "../../../../lib/auth";
import Medical from "../../../../models/Medical";
import connectDB from "../../../../lib/mongodb";

export async function POST(req) {
  try {
    await connectDB();

    const user = await requireAuth('MEDICAL');
    const body = await req.json();

    const { orderId } = body;

    // Find user by pending order ID
    const userDetails = await Medical.findOne({ _id: user.id, pendingOrderId: orderId });

    if (!userDetails) {
      return Response.json({
        success: false,
        error: 'Order not found or already processed'
      }, { status: 404 });
    }

    // Calculate subscription end date based on interval
    const startDate = new Date();
    let endDate = new Date(startDate);

    if (userDetails.subscriptionInterval === 'MONTH') {
      endDate.setMonth(endDate.getMonth() + userDetails.subscriptionIntervalCount);
    } else if (userDetails.subscriptionInterval === 'WEEK') {
      endDate.setDate(endDate.getDate() + (7 * userDetails.subscriptionIntervalCount));
    } else if (userDetails.subscriptionInterval === 'DAY') {
      endDate.setDate(endDate.getDate() + userDetails.subscriptionIntervalCount);
    }

    // Activate subscription
    await Medical.findByIdAndUpdate(user.id, {
      subscriptionStatus: 'active',
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
      lastPaymentDate: startDate,
      nextBillingDate: endDate,
      pendingOrderId: null, // Clear pending order
    });

    return Response.json({
      success: true,
      message: 'Subscription activated successfully'
    });
  } catch (error) {
    console.error('Error activating subscription:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
