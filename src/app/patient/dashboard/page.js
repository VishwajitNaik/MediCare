'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PatientDashboard() {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);
  const [todayDoses, setTodayDoses] = useState([]);
  const [doseStats, setDoseStats] = useState(null);
  const [updatingDose, setUpdatingDose] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchPatientData();
    fetchRecentActivity();
    fetchTodayDoses();
  }, []);

  const fetchPatientData = async () => {
    try {
      const res = await fetch('/api/auth/patient/profile');
      const data = await res.json();

      if (res.ok) {
        setPatient(data.patient);
      } else if (res.status === 401) {
        router.push('/patient/signin');
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    // Mock data for now - will be replaced with real API calls
    setRecentActivity([
      {
        id: 1,
        type: 'appointment',
        title: 'Doctor Consultation',
        description: 'General checkup with Dr. Smith',
        date: new Date().toISOString(),
        status: 'completed'
      },
      {
        id: 2,
        type: 'prescription',
        title: 'Medicine Prescribed',
        description: 'Paracetamol 500mg - 3 times daily',
        date: new Date(Date.now() - 86400000).toISOString(),
        status: 'active'
      },
      {
        id: 3,
        type: 'lab',
        title: 'Blood Test Results',
        description: 'Complete blood count results available',
        date: new Date(Date.now() - 172800000).toISOString(),
        status: 'completed'
      }
    ]);
  };

  const fetchTodayDoses = async () => {
    try {
      const res = await fetch('/api/auth/patient/doses');
      const data = await res.json();

      if (res.ok && data.success) {
        setTodayDoses(data.data.doses.filter(d => d.isToday));
        setDoseStats(data.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch today doses:', err);
    }
  };

  const handleTakeDose = async (doseId, status = 'COMPLETED') => {
    if (updatingDose) return;

    setUpdatingDose(doseId);
    try {
      const res = await fetch('/api/auth/patient/doses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doseId, status })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Refresh today's doses
        await fetchTodayDoses();

        // Show success message
        const dose = todayDoses.find(d => d.id === doseId);
        alert(`✅ ${dose?.medicineName} dose marked as ${status.toLowerCase()}!`);

        // If there's a next dose, show reminder
        if (data.data.nextDose) {
          setTimeout(() => {
            alert(`💊 Next dose: ${data.data.nextDose.medicineName} at ${data.data.nextDose.doseTimeFormatted}`);
          }, 1000);
        }
      } else {
        alert(data.error || 'Failed to update dose');
      }
    } catch (err) {
      console.error('Failed to update dose:', err);
      alert('Failed to update dose. Please try again.');
    } finally {
      setUpdatingDose(null);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'appointment':
        return '👨‍⚕️';
      case 'prescription':
        return '💊';
      case 'lab':
        return '🧪';
      default:
        return '📋';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'active':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-xl mb-4">
            <p className="text-red-600 font-semibold">Error: {error}</p>
          </div>
          <button
            onClick={fetchPatientData}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {patient?.name?.charAt(0)?.toUpperCase() || 'P'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {patient?.name?.split(' ')[0] || 'Patient'}
                </h1>
                <p className="text-gray-600">Your personal health dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/patient/profile"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Edit Profile
              </Link>
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  router.push('/patient/signin');
                }}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Visits',
              value: '12',
              icon: '🏥',
              color: 'from-blue-500 to-cyan-500',
              description: 'Healthcare visits this year'
            },
            {
              title: 'Active Prescriptions',
              value: '3',
              icon: '💊',
              color: 'from-green-500 to-emerald-500',
              description: 'Currently taking medicines'
            },
            {
              title: 'Upcoming Appointments',
              value: '1',
              icon: '📅',
              color: 'from-purple-500 to-indigo-500',
              description: 'Scheduled for next week'
            },
            {
              title: 'Health Score',
              value: '85%',
              icon: '❤️',
              color: 'from-red-500 to-pink-500',
              description: 'Overall health rating'
            }
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                  href="/patient/appointments"
                  className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <span className="text-3xl mb-2">📅</span>
                  <span className="text-sm font-medium text-gray-900">Book Appointment</span>
                </Link>

                <Link
                  href="/patient/history"
                  className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <span className="text-3xl mb-2">📋</span>
                  <span className="text-sm font-medium text-gray-900">Medical History</span>
                </Link>

                <Link
                  href="/patient/medicines"
                  className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <span className="text-3xl mb-2">💊</span>
                  <span className="text-sm font-medium text-gray-900">My Medicines</span>
                </Link>

                <Link
                  href="/patient/profile"
                  className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <span className="text-3xl mb-2">👤</span>
                  <span className="text-sm font-medium text-gray-900">Update Profile</span>
                </Link>
              </div>
            </div>

            {/* Today's Doses */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">💊</span>
                  Today's Medicine Doses
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {doseStats ? `${doseStats.todayCompleted}/${doseStats.todayTotal} completed` : 'Loading...'}
                  </span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: doseStats ? `${(doseStats.todayCompleted / Math.max(doseStats.todayTotal, 1)) * 100}%` : '0%'
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {todayDoses.length > 0 ? (
                <div className="space-y-4">
                  {todayDoses
                    .sort((a, b) => a.doseTime.localeCompare(b.doseTime))
                    .map((dose) => (
                      <div
                        key={dose.id}
                        className={`p-4 rounded-xl border transition-all duration-200 ${
                          dose.status === 'COMPLETED'
                            ? 'bg-green-50 border-green-200'
                            : dose.status === 'MISSED'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                              dose.status === 'COMPLETED'
                                ? 'bg-green-500 text-white'
                                : dose.status === 'MISSED'
                                ? 'bg-red-500 text-white'
                                : 'bg-blue-500 text-white'
                            }`}>
                              💊
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{dose.medicineName}</h3>
                              <p className="text-sm text-gray-600">
                                {dose.doseAmount} • {dose.timingFormatted}
                              </p>
                              <p className="text-xs text-gray-500">
                                {dose.doseTimeFormatted}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            {dose.status === 'COMPLETED' ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-green-600 font-medium">✓ Taken</span>
                                <span className="text-xs text-gray-500">
                                  {dose.completedAt ? new Date(dose.completedAt).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : ''}
                                </span>
                              </div>
                            ) : dose.status === 'MISSED' ? (
                              <span className="text-red-600 font-medium">⚠️ Missed</span>
                            ) : (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleTakeDose(dose.id, 'COMPLETED')}
                                  disabled={updatingDose === dose.id}
                                  className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {updatingDose === dose.id ? '...' : '✅ Take Dose'}
                                </button>
                                <button
                                  onClick={() => handleTakeDose(dose.id, 'MISSED')}
                                  disabled={updatingDose === dose.id}
                                  className="px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Skip
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                  {/* Next Dose Reminder */}
                  {doseStats?.nextDoseTime && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">⏰</span>
                        <div>
                          <h4 className="font-semibold text-blue-900">Next Dose Reminder</h4>
                          <p className="text-blue-800">
                            {doseStats.nextDoseTime.medicineName} in {doseStats.nextDoseTime.minutesUntil} minutes
                            ({doseStats.nextDoseTime.time})
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💊</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No doses scheduled for today</h3>
                  <p className="text-gray-600 mb-6">
                    You don't have any medicine doses scheduled for today. Great job staying on track!
                  </p>
                  <Link
                    href="/patient/medicines"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Medicine History
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <Link
                  href="/patient/history"
                  className="text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  View All →
                </Link>
              </div>

              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{activity.title}</h3>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Profile Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{patient?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mobile:</span>
                  <span className="font-medium">{patient?.mobile || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Age:</span>
                  <span className="font-medium">{patient?.age || 'N/A'} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender:</span>
                  <span className="font-medium">{patient?.gender || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{patient?.email || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Health Tips */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Health Tips</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 mt-1">💧</span>
                  <div>
                    <h3 className="font-medium text-gray-900">Stay Hydrated</h3>
                    <p className="text-sm text-gray-600">Drink at least 8 glasses of water daily</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 mt-1">🏃‍♂️</span>
                  <div>
                    <h3 className="font-medium text-gray-900">Regular Exercise</h3>
                    <p className="text-sm text-gray-600">30 minutes of physical activity daily</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-purple-600 mt-1">😴</span>
                  <div>
                    <h3 className="font-medium text-gray-900">Quality Sleep</h3>
                    <p className="text-sm text-gray-600">7-9 hours of sleep per night</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <h2 className="text-xl font-bold text-red-900 mb-4">Emergency Contact</h2>
              <div className="space-y-2">
                <p className="text-red-800">
                  <span className="font-medium">Helpline:</span> 108 (Ambulance)
                </p>
                <p className="text-red-800">
                  <span className="font-medium">Emergency:</span> 112 (Police)
                </p>
                <p className="text-red-800">
                  <span className="font-medium">Fire:</span> 101
                </p>
              </div>
              <button className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
                Emergency Help
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} MediCare Clinic. Your health data is secure and private.</p>
            <p className="mt-1">For support, contact: support@medicare.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
