'use client';

import { useState, useEffect } from 'react';

export default function SubscriptionPopup({ isOpen, onClose, user }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
      loadRazorpaySDK();
    }
  }, [isOpen]);

  const loadRazorpaySDK = () => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => console.error('Failed to load Razorpay SDK');
    document.head.appendChild(script);
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/subscription/plans');
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const startSubscription = async (plan) => {
    if (!razorpayLoaded) {
      alert('Payment system is still loading. Please wait...');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: plan.name,
          amount: plan.amount,
          interval: plan.interval,
          intervalCount: plan.intervalCount,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.order.amount,
          currency: 'INR',
          name: 'MilkHub',
          description: 'Subscription Payment',
          order_id: data.order.id,
          handler: async function (response) {
            alert('Payment Successful!');
            console.log(response);

            // Activate subscription immediately after payment
            try {
              const activateRes = await fetch('/api/subscription/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: response.razorpay_order_id }),
              });
              const activateData = await activateRes.json();
              if (activateData.success) {
                alert('Subscription activated successfully!');
              } else {
                alert('Payment successful, but subscription activation failed. Please contact support.');
              }
            } catch (error) {
              console.error('Error activating subscription:', error);
              alert('Payment successful, but subscription activation failed. Please contact support.');
            }
          },
          theme: {
            color: '#3399cc',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        alert('Error starting subscription: ' + (data.error || 'Order not created'));
      }
    } catch (error) {
      console.error('Error starting subscription:', error);
      alert('Error starting subscription');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Debug: Check what user data we have
  console.log('SubscriptionPopup - Raw user prop:', user);
  console.log('SubscriptionPopup - User _id:', user?._id);
  console.log('SubscriptionPopup - User id:', user?.id);

  // Temporary: Show user data even if incomplete for debugging
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <p className="text-center text-red-600 font-semibold">No user data received</p>
          <p className="text-center text-gray-500 text-sm mt-2">Check console for details</p>
        </div>
      </div>
    );
  }

  if (!user._id && !user.id) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <p className="text-center text-red-600 font-semibold">User ID missing</p>
          <p className="text-center text-gray-500 text-sm mt-2">User: {JSON.stringify(user)}</p>
        </div>
      </div>
    );
  }

  // For debugging - show user data
  console.log('SubscriptionPopup user data:', user);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-3xl">💳</span>
              Choose Your Subscription Plan
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Select a plan to continue using our premium medical store management features.
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                  selectedPlan?.id === plan.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                  <div className="text-3xl font-bold text-blue-600 mt-2">
                    ₹{plan.amount}
                    <span className="text-sm font-normal text-gray-500">/{plan.interval.toLowerCase()}</span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {selectedPlan?.id === plan.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startSubscription(plan);
                    }}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Subscribe Now'}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-semibold text-gray-800 mb-2">Test Payment Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <strong>Card Number:</strong> 4111 1111 1111 1111
              </div>
              <div>
                <strong>Expiry:</strong> Any future date
              </div>
              <div>
                <strong>CVV:</strong> 123
              </div>
              <div>
                <strong>OTP:</strong> 123456
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
