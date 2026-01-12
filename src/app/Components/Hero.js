 'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Hero() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Smart dashboard redirect function
  const handleViewDashboard = async () => {
    try {
      // Check if user is authenticated by trying to fetch doctor profile
      const doctorResponse = await fetch('/api/doctor/profile');
      if (doctorResponse.ok) {
        router.push('/doctor/dashboard');
        return;
      }

      // Check if medical user
      const medicalResponse = await fetch('/api/medical/profile');
      if (medicalResponse.ok) {
        router.push('/medical/dashboard');
        return;
      }

      // Check if patient user
      const patientResponse = await fetch('/api/auth/patient/profile');
      if (patientResponse.ok) {
        router.push('/patient/dashboard');
        return;
      }

      // Not authenticated, redirect to medical signin (default - matches navbar behavior)
      router.push('/medical/signin');
    } catch (error) {
      // Error occurred, redirect to medical signin (consistent with main flow)
      router.push('/medical/signin');
    }
  };
  
  const features = [
    {
      title: "Smart Inventory Management",
      description: "Track medicines, manage stock levels, and prevent expiry with automated alerts.",
      icon: "📦",
      color: "from-emerald-500 to-teal-600"
    },
    {
      title: "Digital Prescriptions",
      description: "Generate and send prescriptions directly to pharmacy for seamless processing.",
      icon: "💊",
      color: "from-teal-500 to-emerald-600"
    },
    {
      title: "Patient Management",
      description: "Maintain complete patient records, history, and treatment plans.",
      icon: "👥",
      color: "from-emerald-600 to-green-600"
    },
    {
      title: "Billing & Reporting",
      description: "Generate invoices, manage payments, and access comprehensive analytics.",
      icon: "📊",
      color: "from-green-500 to-emerald-500"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 bg-gradient-to-br from-emerald-50 via-white to-white overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-100 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-100 rounded-full translate-x-1/3 translate-y-1/3 opacity-50"></div>
      
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text */}
          <div className="fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-6">
              <span className="mr-2">🏥</span> Trusted by 1000+ Medical Facilities
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Advanced <span className="text-emerald-600">Medical</span> Store & Hospital Management
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              Streamline your medical operations with our comprehensive solution for inventory management, patient care, and prescription handling.
            </p>
            
            {/* Features Carousel */}
            <div className="relative bg-white rounded-xl p-6 shadow-lg border border-emerald-100 mb-8 overflow-hidden">
              <div className="flex items-center mb-4">
                <div className="flex space-x-2">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentSlide ? 'bg-emerald-600 w-4' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {features.map((feature, index) => (
                    <div key={index} className="min-w-full">
                      <div className="flex items-start space-x-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center shadow-md`}>
                          <span className="text-2xl text-white">{feature.icon}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-gray-600">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/medical/signup">
                <button className="px-8 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center">
                  <span className="mr-2">🚀</span> Get Started Free
                </button>
              </Link>
              <button
                onClick={handleViewDashboard}
                className="px-8 py-4 border-2 border-emerald-600 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-300 font-semibold text-lg flex items-center justify-center"
              >
                <span className="mr-2">📊</span> View Dashboard
              </button>
            </div>
            
            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 bg-white rounded-xl p-6 shadow-sm border border-emerald-100">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 flex items-center justify-center">
                  <span className="mr-2">🏥</span> 500+
                </div>
                <div className="text-sm text-gray-600 font-medium">Hospitals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 flex items-center justify-center">
                  <span className="mr-2">💊</span> 10K+
                </div>
                <div className="text-sm text-gray-600 font-medium">Medical Stores</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 flex items-center justify-center">
                  <span className="mr-2">📞</span> 24/7
                </div>
                <div className="text-sm text-gray-600 font-medium">Support</div>
              </div>
            </div>
          </div>

          {/* Right Column - Medical Dashboard Preview */}
          <div className="relative fade-in">
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 transform rotate-1 hover:rotate-0 transition-transform duration-300 border border-emerald-100">
              <div className="absolute -top-4 -left-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
                <span className="mr-2">📊</span> Live Dashboard
              </div>
              
              {/* Mock Dashboard */}
              <div className="space-y-4 pt-4">
                {/* Dashboard Header */}
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white text-xl">💊</span>
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-lg">Medical Inventory</div>
                      <div className="text-sm text-gray-600">Real-time tracking & analytics</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                    95% Stock ✓
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-emerald-700">1,245</div>
                        <div className="text-sm text-gray-600">Medicines</div>
                      </div>
                      <div className="text-emerald-500 text-2xl">💊</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-white p-4 rounded-xl border border-teal-100 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-teal-700">89%</div>
                        <div className="text-sm text-gray-600">Stock Health</div>
                      </div>
                      <div className="text-teal-500 text-2xl">📈</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl border border-green-100 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-green-700">324</div>
                        <div className="text-sm text-gray-600">Patients Today</div>
                      </div>
                      <div className="text-green-500 text-2xl">👥</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-emerald-700">₹1.2L</div>
                        <div className="text-sm text-gray-600">Daily Revenue</div>
                      </div>
                      <div className="text-emerald-500 text-2xl">💰</div>
                    </div>
                  </div>
                </div>

                {/* Stock Health Chart */}
                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-bold text-gray-800">Stock Health Analytics</div>
                    <div className="text-sm text-emerald-600 font-medium flex items-center">
                      <span className="mr-1">📅</span> This Week
                    </div>
                  </div>
                  <div className="flex items-end h-24 space-x-2">
                    {[40, 60, 80, 100, 70, 90, 50].map((height, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-300 ${
                            i === 3 
                              ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' 
                              : 'bg-gradient-to-t from-teal-300 to-teal-200'
                          }`}
                          style={{ height: `${height}%` }}
                        ></div>
                        <div className="text-xs text-gray-500 mt-1">
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Low Stock</span>
                    <span>Optimal</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100">
                  <div className="font-bold text-gray-800 mb-3">Quick Actions</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="bg-white hover:bg-emerald-50 text-emerald-700 py-2 rounded-lg text-sm font-medium border border-emerald-200 transition-colors duration-200">
                      Add Patient
                    </button>
                    <button className="bg-white hover:bg-emerald-50 text-emerald-700 py-2 rounded-lg text-sm font-medium border border-emerald-200 transition-colors duration-200">
                      New Order
                    </button>
                    <button className="bg-white hover:bg-emerald-50 text-emerald-700 py-2 rounded-lg text-sm font-medium border border-emerald-200 transition-colors duration-200">
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -bottom-6 -right-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-xl p-6 transform rotate-3 z-20">
              <div className="text-center text-white">
                <div className="text-2xl font-bold mb-1">99.9%</div>
                <div className="text-sm font-medium">Uptime</div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-xl p-4 transform -rotate-3 z-20 border border-emerald-100">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-emerald-600 text-xl">🔒</span>
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">Secure</div>
                  <div className="text-xs text-gray-600">HIPAA Compliant</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
