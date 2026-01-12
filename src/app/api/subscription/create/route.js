import razorpay from "../../../../lib/razorpay";
import { requireAuth } from "../../../../lib/auth";
import Medical from "../../../../models/Medical";
import connectDB from "../../../../lib/mongodb";

export async function POST(req) {
  try {
    await connectDB();

    const user = await requireAuth('MEDICAL');
    const body = await req.json();

    // Fetch user details from database to get mobile number
    const userDetails = await Medical.findById(user.id);
    if (!userDetails) {
      return Response.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Create Razorpay Order for one-time payment
    const options = {
      amount: body.amount * 100, // ₹ → paise
      currency: "INR",
      receipt: `receipt_sub_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Store pending subscription info in database
    await Medical.findByIdAndUpdate(user.id, {
      subscriptionStatus: 'pending',
      subscriptionAmount: body.amount,
      subscriptionInterval: body.interval,
      subscriptionIntervalCount: body.intervalCount,
      // Store order ID for webhook processing
      pendingOrderId: order.id,
    });

    return Response.json({
      success: true,
      order: order,
      orderId: order.id
    });
  } catch (error) {
    console.error('Error creating subscription order:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
