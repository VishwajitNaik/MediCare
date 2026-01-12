import Medical from "../../../models/Medical";
import connectDB from "../../../lib/mongodb";

export async function POST(req) {
  try {
    await connectDB();

    const payload = await req.json();
    console.log('Cashfree webhook received:', payload);

    // Verify webhook signature (you should implement proper signature verification)
    // For now, we'll trust the payload

    const eventType = payload.type;
    const orderId = payload.data?.order?.order_id;

    if (!orderId) {
      return Response.json({ status: "error", message: "No order ID" }, { status: 400 });
    }

    // Find user by pending order ID
    const user = await Medical.findOne({ pendingOrderId: orderId });

    if (!user) {
      console.error('User not found for order:', orderId);
      return Response.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    switch (eventType) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
        // Calculate subscription end date based on interval
        const startDate = new Date();
        let endDate = new Date(startDate);

        if (user.subscriptionInterval === 'MONTH') {
          endDate.setMonth(endDate.getMonth() + user.subscriptionIntervalCount);
        } else if (user.subscriptionInterval === 'WEEK') {
          endDate.setDate(endDate.getDate() + (7 * user.subscriptionIntervalCount));
        } else if (user.subscriptionInterval === 'DAY') {
          endDate.setDate(endDate.getDate() + user.subscriptionIntervalCount);
        }

        // Activate subscription
        await Medical.findByIdAndUpdate(user._id, {
          subscriptionStatus: 'active',
          subscriptionStartDate: startDate,
          subscriptionEndDate: endDate,
          lastPaymentDate: startDate,
          nextBillingDate: endDate,
          pendingOrderId: null, // Clear pending order
        });
        console.log('Subscription activated for user:', user.email);
        break;

      case 'PAYMENT_FAILED_WEBHOOK':
        // Clear pending status on payment failure
        await Medical.findByIdAndUpdate(user._id, {
          subscriptionStatus: 'inactive',
          pendingOrderId: null,
        });
        console.log('Payment failed for user:', user.email);
        break;

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return Response.json({ status: "ok" });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({
      status: "error",
      message: error.message
    }, { status: 500 });
  }
}
