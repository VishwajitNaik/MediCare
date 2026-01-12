import razorpay from "../../../../lib/razorpay";

export async function POST(req) {
  const body = await req.json();

  const options = {
    amount: body.amount * 100, // ₹ → paise
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);

  return Response.json({
    success: true,
    order,
  });
}
