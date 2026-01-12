'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  User,
  Play,
  Check,
  X,
  Phone,
  FileText,
  ChevronRight,
  Users,
  AlertCircle
} from 'lucide-react';

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/doctor/appointments?date=${selectedDate}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setAppointments(data.data.appointments);
        setStats(data.data.stats);
      } else if (response.status === 401) {
        router.push('/doctor/signin');
      } else {
        setError(data.error || 'Failed to fetch appointments');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, action, notes = '') => {
    try {
      const response = await fetch('/api/doctor/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, action, notes })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message);
        fetchAppointments(); // Refresh data

        // Clear current patient if consultation completed
        if (action === 'complete_consultation') {
          setCurrentPatient(null);
        }

        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update appointment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const startConsultation = (appointment) => {
    setCurrentPatient(appointment);
    updateAppointmentStatus(appointment.id, 'start_consultation');
  };

  const completeConsultation = () => {
    if (currentPatient) {
      updateAppointmentStatus(currentPatient.id, 'complete_consultation');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Separate appointments by status
  const waitingList = appointments.filter(apt =>
    apt.status === 'scheduled' || apt.status === 'confirmed'
  ).sort((a, b) => a.tokenNumber - b.tokenNumber);

  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading your appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/doctor/dashboard">
                <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
                  ← Back to Dashboard
                </button>
              </Link>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">👨‍⚕️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
                <p className="text-gray-600">Manage your daily consultations and patient queue</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  router.push('/doctor/signin');
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
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8 rounded">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 font-medium">{success}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Appointments</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{stats.scheduled}</p>
                <p className="text-sm text-gray-600">Scheduled</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.confirmed}</p>
                <p className="text-sm text-gray-600">Confirmed</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">₹{stats.totalFees}</p>
                <p className="text-sm text-gray-600">Total Earnings</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Consultation */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <User /> Current Consultation
              </h2>

              {currentPatient ? (
                <div className="space-y-6">
                  {/* Patient Info */}
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {currentPatient.patient.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-blue-900">{currentPatient.patient.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-blue-700">
                            <span>Token #{currentPatient.tokenNumber}</span>
                            <span>{currentPatient.patient.age} years, {currentPatient.patient.gender}</span>
                            <span>{currentPatient.appointmentType}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-blue-600">Consultation Started</p>
                        <p className="font-semibold text-blue-900">
                          {new Date(currentPatient.consultationStartedAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Patient Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">Contact Information</h4>
                        <p className="text-blue-700">📞 {currentPatient.patient.mobile}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">Appointment Details</h4>
                        <p className="text-blue-700">🕒 {currentPatient.slotTimeFormatted}</p>
                        <p className="text-blue-700">💰 ₹{currentPatient.fee}</p>
                      </div>
                    </div>

                    {/* Medical History */}
                    {currentPatient.patient.medicalHistory && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-blue-900 mb-2">Medical History</h4>
                        <p className="text-blue-700 bg-white p-3 rounded border">{currentPatient.patient.medicalHistory}</p>
                      </div>
                    )}

                    {/* Symptoms */}
                    {currentPatient.reason && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-blue-900 mb-2">Reason for Visit</h4>
                        <p className="text-blue-700 bg-white p-3 rounded border">{currentPatient.reason}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <button className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                        <FileText size={18} />
                        Write Prescription
                      </button>
                      <button
                        onClick={completeConsultation}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Check size={18} />
                        Complete Consultation
                      </button>
                      <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                        Refer to Specialist
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <User size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No active consultation</p>
                  <p className="text-sm">Select a patient from the waiting list to start</p>
                </div>
              )}
            </div>
          </div>

          {/* Waiting List & Quick Actions */}
          <div className="space-y-6">
            {/* Next Patient */}
            {stats?.nextPatient && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <ChevronRight size={18} />
                  Next Patient
                </h3>
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{stats.nextPatient.patientName}</h4>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      Token #{stats.nextPatient.tokenNumber}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {stats.nextPatient.patientAge} years • {stats.nextPatient.patientGender}
                  </p>
                  <button
                    onClick={() => {
                      const nextApt = appointments.find(a => a.id === stats.nextPatient.id);
                      if (nextApt) startConsultation(nextApt);
                    }}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={16} />
                    Start Consultation
                  </button>
                </div>
              </div>
            )}

            {/* Waiting List */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users size={18} />
                  Waiting List ({waitingList.length})
                </h3>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {waitingList.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Users size={32} className="mx-auto mb-2 text-gray-300" />
                    <p>No patients in waiting list</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {waitingList.map((appointment) => (
                      <div key={appointment.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {appointment.patient.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{appointment.patient.name}</h4>
                              <p className="text-sm text-gray-600">
                                Token #{appointment.tokenNumber} • {appointment.slotTimeFormatted}
                              </p>
                            </div>
                          </div>

                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => startConsultation(appointment)}
                            disabled={!appointment.canStartConsultation}
                            className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                              appointment.canStartConsultation
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            Start
                          </button>

                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'confirm')}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm hover:bg-green-200 transition-colors"
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/doctor/availability">
                  <button className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center gap-2">
                    <Calendar size={18} />
                    Manage Availability
                  </button>
                </Link>

                <button className="w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 transition-colors flex items-center gap-2">
                  <FileText size={18} />
                  View Reports
                </button>

                <button className="w-full px-4 py-3 bg-orange-50 text-orange-700 rounded-lg font-medium hover:bg-orange-100 transition-colors flex items-center gap-2">
                  <Phone size={18} />
                  Emergency Contact
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Summary */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Today's Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Completed Appointments */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Check className="text-green-600" size={18} />
                Completed ({completedAppointments.length})
              </h3>
              {completedAppointments.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No completed appointments yet</p>
              ) : (
                <div className="space-y-2">
                  {completedAppointments.slice(0, 3).map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between text-sm">
                      <span>{apt.patient.name}</span>
                      <span className="text-green-600">₹{apt.fee}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cancelled Appointments */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <X className="text-red-600" size={18} />
                Cancelled ({cancelledAppointments.length})
              </h3>
              {cancelledAppointments.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No cancelled appointments</p>
              ) : (
                <div className="space-y-2">
                  {cancelledAppointments.slice(0, 3).map((apt) => (
                    <div key={apt.id} className="text-sm text-red-600">
                      {apt.patient.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Stats */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Performance</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Patients:</span>
                  <span className="font-medium">{stats?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completion Rate:</span>
                  <span className="font-medium text-green-600">
                    {stats?.total ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Earnings:</span>
                  <span className="font-medium text-green-600">₹{stats?.totalFees || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} MediCare Clinic. Manage your appointments professionally.</p>
            <p className="mt-1">For technical support, contact: support@medicare.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
