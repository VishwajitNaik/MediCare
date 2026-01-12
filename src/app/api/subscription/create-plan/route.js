import axios from "axios";
import { requireAuth } from "../../../../lib/auth";

export async function POST(req) {
  try {
    // Only allow admin to create plans
    await requireAuth('admin');

    const body = await req.json();

    const response = await axios.post(
      `${process.env.CASHFREE_BASE_URL}`,
      {
        plan_name: body.planName,
        plan_type: "PERIODIC",
        amount: body.amount,
        currency: "INR",
        interval: body.interval, // DAY / WEEK / MONTH
        interval_count: body.intervalCount
      },
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return Response.json({
      success: true,
      plan: response.data
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return Response.json({
      success: false,
      error: error.response?.data?.message || error.message
    }, { status: 500 });
  }
}
