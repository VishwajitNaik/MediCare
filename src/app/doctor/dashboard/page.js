// 'use client';

// import Link from 'next/link';

// export default function DoctorDashboard() {
//   return (
//     <div style={{ padding: '20px' }}>
//       <h1>Doctor Dashboard</h1>
//       <nav>
//         <ul style={{ listStyle: 'none', padding: 0 }}>
//           <li style={{ margin: '10px 0' }}>
//             <Link href="/doctor/patients" style={{ textDecoration: 'none', color: 'blue' }}>
//               Manage Patients
//             </Link>
//           </li>
//           <li style={{ margin: '10px 0' }}>
//             <Link href="/doctor/prescriptions" style={{ textDecoration: 'none', color: 'blue' }}>
//               Manage Prescriptions
//             </Link>
//           </li>
//           <li style={{ margin: '10px 0' }}>
//             <Link href="/api/auth/logout" style={{ textDecoration: 'none', color: 'red' }}>
//               Logout
//             </Link>
//           </li>
//         </ul>
//       </nav>
//     </div>
//   );
// }


'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import {
  FaUserInjured,
  FaFilePrescription,
  FaCalendarCheck,
  FaChartLine,
  FaBell,
  FaSearch,
  FaSignOutAlt,
  FaHospitalUser,
  FaMedkit,
  FaClipboardCheck,
  FaUserMd,
  FaCapsules,
  FaHistory,
  FaRobot
} from 'react-icons/fa';

export default function DoctorDashboard() {
  const router = useRouter();
  const containerRef = useRef(null);
  const cardsRef = useRef([]);
  const statsRef = useRef([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalPatients: 0,
    todaysAppointments: 0,
    pendingPrescriptions: 0,
    upcomingAppointments: 0,
    patientSatisfaction: 95
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Check authentication and redirect if not logged in as doctor
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to fetch doctor profile to check if authenticated
        const response = await fetch('/api/doctor/profile');
        if (!response.ok) {
          // Not authenticated or not a doctor, redirect to home
          router.push('/');
          return;
        }
      } catch (error) {
        // Authentication failed, redirect to home
        router.push('/');
        return;
      }
    };

    checkAuth();
  }, [router]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoadingStats(true);
        const response = await fetch('/api/doctor/dashboard');
        const data = await response.json();
        if (response.ok) {
          setDashboardStats(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Fetch upcoming appointments
  useEffect(() => {
    const fetchUpcomingAppointments = async () => {
      try {
        setLoadingAppointments(true);
        const response = await fetch('/api/doctor/appointments/upcoming');
        const data = await response.json();
        if (response.ok) {
          setUpcomingAppointments(data.appointments || []);
        }
      } catch (error) {
        console.error('Error fetching upcoming appointments:', error);
        setUpcomingAppointments([]);
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchUpcomingAppointments();
  }, []);

  // Fetch doctor profile
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        setLoadingProfile(true);
        const response = await fetch('/api/doctor/profile');
        const data = await response.json();
        if (response.ok) {
          setDoctorProfile(data);
        }
      } catch (error) {
        console.error('Error fetching doctor profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchDoctorProfile();
  }, []);

  // Initialize GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance animation
      gsap.from('.dashboard-title', {
        duration: 0.8,
        y: -30,
        opacity: 0,
        ease: 'power3.out'
      });

      gsap.from('.welcome-text', {
        duration: 0.8,
        y: 20,
        opacity: 0,
        delay: 0.2,
        ease: 'power3.out'
      });

      // Cards animation with stagger
      gsap.from(cardsRef.current, {
        duration: 0.8,
        y: 40,
        opacity: 0,
        stagger: 0.1,
        delay: 0.4,
        ease: 'power3.out'
      });

      // Stats cards animation
      gsap.from(statsRef.current, {
        duration: 0.6,
        scale: 0.8,
        opacity: 0,
        stagger: 0.1,
        delay: 0.6,
        ease: 'back.out(1.7)'
      });

      // Hover animations
      cardsRef.current.forEach(card => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            duration: 0.3,
            y: -5,
            scale: 1.02,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            ease: 'power2.out'
          });
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            duration: 0.3,
            y: 0,
            scale: 1,
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.05)',
            ease: 'power2.out'
          });
        });
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  const quickStats = [
    {
      label: 'Total Patients',
      value: loadingStats ? '...' : dashboardStats.totalPatients.toLocaleString(),
      icon: FaUserInjured,
      color: 'from-blue-500 to-cyan-500',
      change: loadingStats ? '...' : '+12%'
    },
    {
      label: 'Today\'s Appointments',
      value: loadingStats ? '...' : dashboardStats.todaysAppointments.toString(),
      icon: FaCalendarCheck,
      color: 'from-green-500 to-emerald-500',
      change: loadingStats ? '...' : '+3'
    },
    {
      label: 'Pending Prescriptions',
      value: loadingStats ? '...' : dashboardStats.pendingPrescriptions.toString(),
      icon: FaFilePrescription,
      color: 'from-purple-500 to-pink-500',
      change: loadingStats ? '...' : '-2'
    },
    {
      label: 'Upcoming Appointments',
      value: loadingStats ? '...' : dashboardStats.upcomingAppointments.toString(),
      icon: FaChartLine,
      color: 'from-orange-500 to-amber-500',
      change: loadingStats ? '...' : '+1.2%'
    },
  ];

  const dashboardCards = [
    {
      title: 'Patient Queue',
      description: 'Manage walk-in patients and queue system',
      icon: FaUserMd,
      href: '/doctor/queue',
      color: 'bg-gradient-to-br from-red-50 to-rose-100',
      iconColor: 'text-red-600',
      btnColor: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'Manage Patients',
      description: 'View, add, and manage patient records',
      icon: FaHospitalUser,
      href: '/doctor/patients',
      color: 'bg-gradient-to-br from-blue-50 to-blue-100',
      iconColor: 'text-blue-600',
      btnColor: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Create Prescription',
      description: 'Create and manage medical prescriptions',
      icon: FaCapsules,
      href: '/doctor/prescriptions/new',
      color: 'bg-gradient-to-br from-green-50 to-emerald-100',
      iconColor: 'text-green-600',
      btnColor: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'View Prescriptions',
      description: 'Review and manage existing prescriptions',
      icon: FaClipboardCheck,
      href: '/doctor/prescriptions',
      color: 'bg-gradient-to-br from-purple-50 to-violet-100',
      iconColor: 'text-purple-600',
      btnColor: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Appointments',
      description: 'Manage today\'s and upcoming appointments',
      icon: FaCalendarCheck,
      href: '/doctor/appointments',
      color: 'bg-gradient-to-br from-orange-50 to-amber-100',
      iconColor: 'text-orange-600',
      btnColor: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Medical History',
      description: 'Access patient medical history and records',
      icon: FaHistory,
      href: '/doctor/medical-history',
      color: 'bg-gradient-to-br from-cyan-50 to-teal-100',
      iconColor: 'text-cyan-600',
      btnColor: 'bg-cyan-500 hover:bg-cyan-600'
    },
    {
      title: 'Voice Assistant',
      description: 'Use voice commands for quick actions',
      icon: FaRobot,
      href: '/doctor/voice-assistant',
      color: 'bg-gradient-to-br from-pink-50 to-pink-100',
      iconColor: 'text-pink-600',
      btnColor: 'bg-pink-500 hover:bg-pink-600'
    },
  ];

  const recentActivities = [
    { patient: 'Rahul Sharma', action: 'New prescription added', time: '10 min ago', status: 'completed' },
    { patient: 'Priya Patel', action: 'Appointment scheduled', time: '25 min ago', status: 'pending' },
    { patient: 'Amit Kumar', action: 'Medical record updated', time: '1 hour ago', status: 'completed' },
    { patient: 'Sneha Singh', action: 'Lab results received', time: '2 hours ago', status: 'completed' },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="dashboard-title text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Welcome back, <span className="text-blue-600">
                {loadingProfile ? 'Dr. ...' : `Dr. ${doctorProfile?.name || 'Doctor'}`}
              </span>
            </h1>
            <p className="welcome-text text-gray-600 text-lg">
              Here's what's happening in your clinic today
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            {/* Search Bar */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients, records..."
                className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
              />
            </div>
            
            {/* Notifications */}
            <button className="relative p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow">
              <FaBell className="text-gray-600 text-xl" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </button>
            
            {/* Profile */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                DS
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {loadingProfile ? 'Dr. ...' : `Dr. ${doctorProfile?.name || 'Doctor'}`}
                </p>
                <p className="text-sm text-gray-500">
                  {loadingProfile ? '...' : doctorProfile?.specialty || 'Specialist'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                ref={el => statsRef.current[index] = el}
                className={`bg-white rounded-xl shadow-lg p-6 border border-gray-200`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                    <Icon className="text-white text-2xl" />
                  </div>
                  <span className={`text-sm font-semibold ${
                    stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Cards Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div
                    key={index}
                    ref={el => cardsRef.current[index] = el}
                    className={`${card.color} rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-white shadow-sm`}>
                        <Icon className={`${card.iconColor} text-2xl`} />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-gray-600 mb-6">{card.description}</p>
                    <Link href={card.href}>
                      <button className={`${card.btnColor} text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 w-full`}>
                        Access
                      </button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                <Link href="/doctor/activity" className="text-blue-600 hover:text-blue-700 font-medium">
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`h-2 w-2 mt-2 rounded-full ${
                      activity.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.patient}</p>
                      <p className="text-gray-600 text-sm">{activity.action}</p>
                    </div>
                    <span className="text-gray-400 text-sm whitespace-nowrap">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Upcoming Appointments</h3>
              <div className="space-y-4">
                {loadingAppointments ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-500 text-sm mt-2">Loading appointments...</p>
                  </div>
                ) : upcomingAppointments.length > 0 ? (
                  upcomingAppointments.slice(0, 5).map((appointment, index) => {
                    // Format time to 12-hour format
                    const time = new Date(`1970-01-01T${appointment.time}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    });

                    // Check if appointment is today
                    const isToday = new Date(appointment.date).toDateString() === new Date().toDateString();

                    return (
                      <div key={appointment.id || index} className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                        <div className="text-center">
                          <p className="font-bold text-blue-600">{time}</p>
                          <p className="text-xs text-gray-500">
                            {isToday ? 'Today' : new Date(appointment.date).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{appointment.patient}</p>
                          <p className="text-sm text-gray-600">{appointment.type}</p>
                        </div>
                        <button
                          onClick={() => {
                            window.location.href = `/doctor/patients/${appointment.patientId}`;
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                        >
                          View
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6">
                    <div className="text-4xl mb-2">📅</div>
                    <p className="text-gray-500 text-sm">No upcoming appointments</p>
                    <p className="text-gray-400 text-xs mt-1">Schedule appointments to see them here</p>
                  </div>
                )}
              </div>
              <Link href="/doctor/appointments">
                <button className="w-full mt-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                  View All Appointments
                </button>
              </Link>
            </div>

            {/* Logout Section */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl shadow-lg p-6 border border-red-200">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <FaSignOutAlt className="text-red-600 text-2xl" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">End of Session</h3>
                  <p className="text-sm text-gray-600">Log out from your account</p>
                </div>
              </div>
              <Link href="/api/auth/logout">
                <button className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-semibold hover:from-red-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  <FaSignOutAlt className="inline mr-2" />
                  Logout
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} MediCare Clinic. All rights reserved.</p>
          <p className="mt-1">Last login: Today at 09:15 AM</p>
        </div>
      </div>
    </div>
  );
}
