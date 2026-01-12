'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PatientMedicines() {
  const [medicines, setMedicines] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    fetchMedicines(currentPage);
  }, [currentPage]);

  const fetchMedicines = async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/auth/patient/medicines?page=${page}&limit=20`);
      const data = await response.json();

      if (response.ok && data.success) {
        setMedicines(data.data.medicineHistory);
        setSummary(data.data.summary);
        setPagination(data.data.pagination);
      } else if (response.status === 401) {
        router.push('/patient/signin');
      } else {
        setError(data.error || 'Failed to fetch medicine history');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PARTIAL':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimingText = (timing) => {
    const timingMap = {
      'MORNING_BEFORE_FOOD': 'Morning (before food)',
      'MORNING_AFTER_FOOD': 'Morning (after food)',
      'AFTERNOON_BEFORE_FOOD': 'Afternoon (before food)',
      'AFTERNOON_AFTER_FOOD': 'Afternoon (after food)',
      'NIGHT_BEFORE_FOOD': 'Night (before food)',
      'NIGHT_AFTER_FOOD': 'Night (after food)'
    };

    return timing.map(t => timingMap[t] || t).join(', ');
  };

  const filteredMedicines = medicines.filter(medicine => {
    if (filterStatus === 'all') return true;
    return medicine.paymentStatus === filterStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading your medicine purchase history...</p>
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
            onClick={() => fetchMedicines(currentPage)}
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
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">💊</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Medicines</h1>
                <p className="text-gray-600">Complete history of your medicine purchases</p>
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
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{summary.totalPurchases}</p>
                <p className="text-sm text-gray-600">Total Purchases</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">₹{summary.totalAmount}</p>
                <p className="text-sm text-gray-600">Total Amount</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{summary.paidPurchases}</p>
                <p className="text-sm text-gray-600">Paid Bills</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{summary.pendingPurchases}</p>
                <p className="text-sm text-gray-600">Pending Bills</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">₹{summary.averagePurchase}</p>
                <p className="text-sm text-gray-600">Avg. Purchase</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Filter Medicine Records</h2>
              <p className="text-sm text-gray-600">View purchases by payment status</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All Records', count: medicines.length },
                { value: 'PAID', label: 'Paid', count: medicines.filter(m => m.paymentStatus === 'PAID').length },
                { value: 'PENDING', label: 'Pending', count: medicines.filter(m => m.paymentStatus === 'PENDING').length },
                { value: 'PARTIAL', label: 'Partial', count: medicines.filter(m => m.paymentStatus === 'PARTIAL').length }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === filter.value
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

        {/* Medicine Purchase History */}
        <div className="space-y-6">
          {filteredMedicines.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">💊</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {filterStatus === 'all' ? 'No medicine purchases found' : `No ${filterStatus.toLowerCase()} purchases found`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filterStatus === 'all'
                  ? 'You haven\'t purchased any medicines yet.'
                  : `No purchases with ${filterStatus.toLowerCase()} payment status.`
                }
              </p>
              <button
                onClick={() => setFilterStatus('all')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                View All Purchases
              </button>
            </div>
          ) : (
            filteredMedicines.map((purchase) => (
              <div key={purchase._id} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🏥</span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Visit on {purchase.visitDateFormatted}
                        </h3>
                        <p className="text-gray-600">
                          {purchase.medicalId?.name || 'Medical Store'} • {purchase.source.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.paymentStatus)}`}>
                      {purchase.paymentStatus}
                    </span>
                  </div>

                  {/* Medicines List */}
                  <div className="space-y-4 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Medicines Purchased:</h4>
                    {purchase.medicines.map((medicine, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <h5 className="font-medium text-gray-900">{medicine.medicineName}</h5>
                            <p className="text-sm text-gray-600">{medicine.medicineType} • {medicine.medicineStrength}</p>
                          </div>

                          <div>
                            <h6 className="text-sm font-medium text-gray-700">Dosage</h6>
                            <p className="text-sm text-gray-600">{medicine.dosePerTime}</p>
                          </div>

                          <div>
                            <h6 className="text-sm font-medium text-gray-700">Timing</h6>
                            <p className="text-sm text-gray-600">{getTimingText(medicine.timing)}</p>
                          </div>

                          <div>
                            <h6 className="text-sm font-medium text-gray-700">Details</h6>
                            <p className="text-sm text-gray-600">
                              {medicine.totalQuantity} units • ₹{medicine.unitPrice} each
                            </p>
                            <p className="text-sm font-medium text-gray-900">₹{medicine.totalPrice}</p>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Start Date:</span>
                              <p className="text-gray-600">{new Date(medicine.startDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Duration:</span>
                              <p className="text-gray-600">{medicine.durationDays} days</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Total Qty:</span>
                              <p className="text-gray-600">{medicine.totalQuantity}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Actual Qty:</span>
                              <p className="text-gray-600">{medicine.actualQuantity}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      <p>Bill Date: {purchase.createdAtFormatted}</p>
                      {purchase.notes && <p className="mt-1">Notes: {purchase.notes}</p>}
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">₹{purchase.totalAmount}</p>
                      <div className="flex space-x-2 mt-2">
                        <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm font-medium hover:bg-blue-100">
                          📄 View Bill
                        </button>
                        <button className="px-3 py-1 bg-green-50 text-green-600 rounded text-sm font-medium hover:bg-green-100">
                          📧 Share
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                    page === currentPage
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} MediCare Clinic. Your medicine purchase records are securely stored.</p>
            <p className="mt-1">For billing concerns, contact: billing@medicare.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
