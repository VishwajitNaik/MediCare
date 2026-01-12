import { requireAuth } from "../../../../lib/auth";
import Medical from "../../../../models/Medical";
import connectDB from "../../../../lib/mongodb";

export async function GET(req) {
  try {
    await connectDB();

    const user = await requireAuth('MEDICAL');

    const medicalUser = await Medical.findById(user.id).select([
      'subscriptionStatus',
      'subscriptionPlanId',
      'subscriptionId',
      'subscriptionStartDate',
      'subscriptionEndDate',
      'subscriptionAmount',
      'subscriptionCurrency',
      'subscriptionInterval',
      'subscriptionIntervalCount',
      'lastPaymentDate',
      'nextBillingDate',
      'autoRenew'
    ]);

    if (!medicalUser) {
      return Response.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Check if subscription is expired
    const now = new Date();
    let isExpired = false;
    if (medicalUser.subscriptionEndDate && medicalUser.subscriptionEndDate < now) {
      isExpired = true;
      // Update status if expired
      if (medicalUser.subscriptionStatus === 'active') {
        await Medical.findByIdAndUpdate(user.id, { subscriptionStatus: 'expired' });
        medicalUser.subscriptionStatus = 'expired';
      }
    }

    return Response.json({
      success: true,
      subscription: {
        status: medicalUser.subscriptionStatus,
        planId: medicalUser.subscriptionPlanId,
        subscriptionId: medicalUser.subscriptionId,
        startDate: medicalUser.subscriptionStartDate,
        endDate: medicalUser.subscriptionEndDate,
        amount: medicalUser.subscriptionAmount,
        currency: medicalUser.subscriptionCurrency,
        interval: medicalUser.subscriptionInterval,
        intervalCount: medicalUser.subscriptionIntervalCount,
        lastPaymentDate: medicalUser.lastPaymentDate,
        nextBillingDate: medicalUser.nextBillingDate,
        autoRenew: medicalUser.autoRenew,
        isExpired: isExpired,
        isActive: medicalUser.subscriptionStatus === 'active' && !isExpired
      },
      user: {
        id: medicalUser._id,
        email: medicalUser.email,
        mobile: medicalUser.mobile,
        name: medicalUser.name
      }
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
