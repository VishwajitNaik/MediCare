'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PatientHistory() {
  const [patient, setPatient] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchPatientData();
    fetchMedicalHistory();
  }, []);

  const fetchPatientData = async () => {
    try {
      const res = await fetch('/api/auth/patient/profile');
      const data = await res.json();

      if (res.ok) {
        setPatient(data.patient);
      } else if (res.status === 401) {
        router.push('/patient/signin');
      }
    } catch (err) {
      console.error('Error fetching patient data:', err);
    }
  };

  const fetchMedicalHistory = async () => {
    try {
      // Mock data for now - will be replaced with real API calls
      const mockHistory = [
        {
          id: 1,
          date: new Date(Date.now() - 86400000 * 7).toISOString(),
          type: 'consultation',
          provider: 'Dr. Sarah Johnson',
          facility: 'City General Hospital',
          diagnosis: 'Seasonal flu',
          treatment: 'Rest, hydration, antipyretics',
          prescription: ['Paracetamol 500mg - 3 times daily for 5 days', 'Rest and hydration'],
          notes: 'Patient responded well to treatment. Follow up in 1 week if symptoms persist.',
          status: 'completed'
        },
        {
          id: 2,
          date: new Date(Date.now() - 86400000 * 30).toISOString(),
          type: 'lab_test',
          provider: 'Dr. Michael Chen',
          facility: 'MedLab Diagnostics',
          diagnosis: 'Routine blood work',
          treatment: 'Results within normal range',
          prescription: [],
          notes: 'All parameters normal. Continue regular health checkups.',
          status: 'completed'
        },
        {
          id: 3,
          date: new Date(Date.now() - 86400000 * 90).toISOString(),
          type: 'vaccination',
          provider: 'Nurse Emily Davis',
          facility: 'City Health Clinic',
          diagnosis: 'Annual flu vaccination',
          treatment: 'Influenza vaccine administered',
          prescription: [],
          notes: 'No adverse reactions. Next vaccination due in 1 year.',
          status: 'completed'
        },
        {
          id: 4,
          date: new Date(Date.now() - 86400000 * 180).toISOString(),
          type: 'consultation',
          provider: 'Dr. Robert Wilson',
          facility: 'City General Hospital',
          diagnosis: 'Hypertension follow-up',
          treatment: 'Continue current medication regimen',
          prescription: ['Amlodipine 5mg - Once daily', 'Lifestyle modifications'],
          notes: 'Blood pressure well controlled. Continue monitoring.',
          status: 'completed'
        },
        {
          id: 5,
          date: new Date(Date.now() - 86400000 * 365).toISOString(),
          type: 'emergency',
          provider: 'Dr. Lisa Thompson',
          facility: 'Emergency Department',
          diagnosis: 'Acute gastroenteritis',
          treatment: 'IV fluids, antiemetics',
          prescription: ['Ondansetron 4mg - Every 8 hours as needed', 'Oral rehydration solution'],
          notes: 'Admitted for 24 hours observation. Discharged stable.',
          status: 'completed'
        }
      ];

      setMedicalHistory(mockHistory);
    } catch (err) {
      setError('Failed to load medical history');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'consultation':
        return '👨‍⚕️';
      case 'lab_test':
        return '🧪';
      case 'vaccination':
        return '💉';
      case 'emergency':
        return '🚑';
      default:
        return '📋';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800';
      case 'lab_test':
        return 'bg-green-100 text-green-800';
      case 'vaccination':
        return 'bg-purple-100 text-purple-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredHistory = medicalHistory.filter(item => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading your medical history...</p>
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
            onClick={fetchMedicalHistory}
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
              <Link href="/patient/dashboard">
                <button className="flex items-center text-green-600 hover:text-green-700 font-medium">
                  ← Back to Dashboard
                </button>
              </Link>
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {patient?.name?.charAt(0)?.toUpperCase() || 'P'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Medical History</h1>
                <p className="text-gray-600">Complete record of your healthcare visits</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
              >
                📄 Print History
              </button>
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
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Filter Medical Records</h2>
              <p className="text-sm text-gray-600">View specific types of medical visits and procedures</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All Records', count: medicalHistory.length },
                { value: 'consultation', label: 'Consultations', count: medicalHistory.filter(h => h.type === 'consultation').length },
                { value: 'lab_test', label: 'Lab Tests', count: medicalHistory.filter(h => h.type === 'lab_test').length },
                { value: 'vaccination', label: 'Vaccinations', count: medicalHistory.filter(h => h.type === 'vaccination').length },
                { value: 'emergency', label: 'Emergency', count: medicalHistory.filter(h => h.type === 'emergency').length }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterType(filter.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === filter.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Visits',
              value: medicalHistory.length,
              icon: '🏥',
              color: 'from-blue-500 to-cyan-500'
            },
            {
              title: 'Consultations',
              value: medicalHistory.filter(h => h.type === 'consultation').length,
              icon: '👨‍⚕️',
              color: 'from-green-500 to-emerald-500'
            },
            {
              title: 'Lab Tests',
              value: medicalHistory.filter(h => h.type === 'lab_test').length,
              icon: '🧪',
              color: 'from-purple-500 to-indigo-500'
            },
            {
              title: 'This Year',
              value: medicalHistory.filter(h => {
                const visitDate = new Date(h.date);
                const currentYear = new Date().getFullYear();
                return visitDate.getFullYear() === currentYear;
              }).length,
              icon: '📅',
              color: 'from-red-500 to-pink-500'
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
            </div>
          ))}
        </div>

        {/* Medical History Timeline */}
        <div className="space-y-6">
          {filteredHistory.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No medical records found</h3>
              <p className="text-gray-600 mb-6">
                {filterType === 'all'
                  ? 'You haven\'t had any medical visits yet.'
                  : `No ${filterType.replace('_', ' ')} records found.`
                }
              </p>
              <button
                onClick={() => setFilterType('all')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                View All Records
              </button>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-green-200"></div>

              {filteredHistory.map((record, index) => (
                <div key={record.id} className="relative mb-8">
                  {/* Timeline dot */}
                  <div className="absolute left-6 w-4 h-4 bg-green-600 rounded-full border-4 border-white shadow"></div>

                  {/* Record card */}
                  <div className="ml-16 bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getTypeIcon(record.type)}</span>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 capitalize">
                              {record.type.replace('_', ' ')}
                            </h3>
                            <p className="text-gray-600">
                              {new Date(record.date).toLocaleDateString('en-IN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(record.type)}`}>
                          {record.status}
                        </span>
                      </div>

                      {/* Provider & Facility */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Healthcare Provider</h4>
                          <p className="text-gray-700">{record.provider}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Facility</h4>
                          <p className="text-gray-700">{record.facility}</p>
                        </div>
                      </div>

                      {/* Diagnosis */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-1">Diagnosis/Procedure</h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{record.diagnosis}</p>
                      </div>

                      {/* Treatment */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-1">Treatment/Results</h4>
                        <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{record.treatment}</p>
                      </div>

                      {/* Prescription */}
                      {record.prescription && record.prescription.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Prescription</h4>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <ul className="list-disc list-inside space-y-1">
                              {record.prescription.map((item, idx) => (
                                <li key={idx} className="text-gray-700">{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {record.notes && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-1">Doctor's Notes</h4>
                          <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg italic">{record.notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                          📄 Download Report
                        </button>
                        <button className="px-4 py-2 bg-green-50 text-green-600 rounded-lg font-medium hover:bg-green-100 transition-colors">
                          📧 Share with Doctor
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} MediCare Clinic. Your medical records are securely stored.</p>
            <p className="mt-1">For privacy concerns, contact: privacy@medicare.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
