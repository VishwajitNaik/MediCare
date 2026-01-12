// Static subscription plans for demo
// In production, you might fetch these from Cashfree or store in database
const subscriptionPlans = [
  {
    id: 'basic_monthly',
    name: 'Basic Monthly',
    amount: 499,
    currency: 'INR',
    interval: 'MONTH',
    intervalCount: 1,
    description: 'Basic plan for small medical stores',
    features: [
      'Inventory management',
      'Basic reporting',
      'Patient records',
      'Prescription management'
    ]
  },
  {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    amount: 999,
    currency: 'INR',
    interval: 'MONTH',
    intervalCount: 1,
    description: 'Premium plan for growing medical stores',
    features: [
      'All Basic features',
      'Advanced analytics',
      'Multi-user access',
      'Priority support',
      'Export reports'
    ]
  },
  {
    id: 'enterprise_monthly',
    name: 'Enterprise Monthly',
    amount: 1999,
    currency: 'INR',
    interval: 'MONTH',
    intervalCount: 1,
    description: 'Complete solution for large medical stores',
    features: [
      'All Premium features',
      'Unlimited users',
      'API access',
      'Custom integrations',
      '24/7 phone support'
    ]
  }
];

export async function GET(req) {
  try {
    return Response.json({
      success: true,
      plans: subscriptionPlans
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
