'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function MedicalPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, today, week
  const [searchTerm, setSearchTerm] = useState('');

  const prescriptionsRef = useRef([]);
  const statsRef = useRef([]);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    // Animate prescriptions on load
    if (!loading && prescriptionsRef.current.length > 0) {
      gsap.fromTo(prescriptionsRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.5,
          ease: "power2.out"
        }
      );
    }
  }, [loading, prescriptions]);

  useEffect(() => {
    // Animate stats cards
    if (statsRef.current.length > 0) {
      gsap.fromTo(statsRef.current,
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          stagger: 0.2,
          duration: 0.6,
          ease: "back.out(1.2)"
        }
      );
    }
  }, [prescriptions]);

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch('/api/medical/prescriptions/fetch');
      const data = await res.json();
      if (res.ok) {
        setPrescriptions(data.prescriptions);
      } else {
        setError(data.error || 'Failed to fetch prescriptions');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const fulfillPrescription = async (prescriptionId) => {
    // Create confirmation modal
    const confirmModal = document.createElement('div');
    confirmModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    confirmModal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
        <div class="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-center">
          <div class="text-5xl mb-4">⚠️</div>
          <h3 class="text-xl font-bold text-white">Confirm Fulfillment</h3>
        </div>
        <div class="p-6 text-center">
          <p class="text-gray-600 mb-6">Are you sure you want to fulfill this prescription? This will deduct from inventory.</p>
          <div class="flex gap-3">
            <button id="confirmYes" class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200">
              Yes, Fulfill
            </button>
            <button id="confirmNo" class="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-xl transition-all duration-200">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(confirmModal);
    
    return new Promise((resolve) => {
      document.getElementById('confirmYes').onclick = async () => {
        gsap.to(confirmModal, {
          opacity: 0,
          scale: 0.8,
          duration: 0.3,
          onComplete: () => {
            confirmModal.remove();
            resolve(true);
          }
        });
      };
      
      document.getElementById('confirmNo').onclick = () => {
        gsap.to(confirmModal, {
          opacity: 0,
          scale: 0.8,
          duration: 0.3,
          onComplete: () => {
            confirmModal.remove();
            resolve(false);
          }
        });
      };
    }).then(async (confirmed) => {
      if (!confirmed) return;

      try {
        const res = await fetch('/api/medical/prescriptions/fulfill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prescriptionId }),
        });

        const data = await res.json();
        if (res.ok) {
          // Show success animation
          const successEl = document.createElement('div');
          successEl.className = 'fixed top-4 right-4 px-6 py-3 bg-green-500 text-white rounded-xl shadow-lg z-50 animate-slide-in-right';
          successEl.textContent = '✅ Prescription fulfilled successfully';
          document.body.appendChild(successEl);
          
          setTimeout(() => {
            gsap.to(successEl, {
              opacity: 0,
              y: -20,
              duration: 0.3,
              onComplete: () => successEl.remove()
            });
          }, 3000);

          // Animate the fulfilled prescription card
          const fulfilledCard = document.querySelector(`[data-id="${prescriptionId}"]`);
          if (fulfilledCard) {
            gsap.to(fulfilledCard, {
              backgroundColor: '#f0fdf4',
              borderColor: '#bbf7d0',
              duration: 0.5,
              onComplete: () => {
                setTimeout(() => {
                  fetchPrescriptions(); // Refresh list
                }, 500);
              }
            });
          }
        } else {
          alert(data.error || 'Failed to fulfill prescription');
        }
      } catch (err) {
        alert('Network error');
      }
    });
  };

  // Filter and search prescriptions
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = searchTerm === '' ||
      prescription.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const prescriptionDate = new Date(prescription.date);
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const matchesFilter = 
      filter === 'all' ||
      (filter === 'today' && prescriptionDate.toDateString() === today.toDateString()) ||
      (filter === 'week' && prescriptionDate >= weekAgo);

    return matchesSearch && matchesFilter;
  });

  // Calculate statistics
  const stats = {
    total: prescriptions.length,
    today: prescriptions.filter(p => 
      new Date(p.date).toDateString() === new Date().toDateString()
    ).length,
    week: prescriptions.filter(p => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(p.date) >= weekAgo;
    }).length,
    medicines: prescriptions.reduce((total, p) =>
      total + p.medicines.reduce((medTotal, m) => medTotal + m.totalQuantity, 0), 0
    ),
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Loading prescriptions...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
        <div className="text-6xl text-red-500 mb-4 text-center">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Error Loading Prescriptions</h2>
        <p className="text-gray-600 mb-6 text-center">{error}</p>
        <button
          onClick={fetchPrescriptions}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 flex items-center gap-3">
          <span className="text-4xl">📋</span>
          Prescription Management
        </h1>
        <p className="text-gray-600">Manage and fulfill doctor prescriptions</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div 
          ref={el => statsRef.current[0] = el}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover-lift"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Prescriptions</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        <div 
          ref={el => statsRef.current[1] = el}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover-lift"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Today's</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.today}</h3>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>

        <div 
          ref={el => statsRef.current[2] = el}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover-lift"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">This Week</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.week}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div 
          ref={el => statsRef.current[3] = el}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover-lift"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Medicines</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.medicines}</h3>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-xl">🔍</span>
              Search Prescriptions
            </label>
            <input
              type="text"
              placeholder="Search by patient or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-xl">📅</span>
              Filter by Date
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('today')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 ${
                  filter === 'today'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setFilter('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 ${
                  filter === 'week'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Week
              </button>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-xl">📊</span>
              Showing Results
            </label>
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
              <span className="font-medium text-gray-700">
                {filteredPrescriptions.length} prescriptions
              </span>
              <span className="text-sm text-gray-500">
                of {prescriptions.length} total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-6">
        {filteredPrescriptions.map((prescription, index) => (
          <div
            key={prescription._id}
            ref={el => prescriptionsRef.current[index] = el}
            data-id={prescription._id}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:border-blue-300 transition-all duration-300"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Prescription #{prescription._id.slice(-6)}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {new Date(prescription.date).toLocaleDateString()}
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        {prescription.medicines.length} medicines
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => fulfillPrescription(prescription._id)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                >
                  <span className="text-xl">✅</span>
                  Fulfill Prescription
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Patient Information */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">👤</span>
                    Patient Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-semibold text-gray-800">{prescription.patientId?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-semibold text-gray-800">{prescription.patientId?.age || 'N/A'} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gender:</span>
                      <span className="font-semibold text-gray-800">{prescription.patientId?.gender || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Doctor Information */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">👨‍⚕️</span>
                    Doctor Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-semibold text-gray-800">{prescription.doctor?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Specialty:</span>
                      <span className="font-semibold text-gray-800">{prescription.doctor?.specialty || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">License:</span>
                      <span className="font-semibold text-gray-800">{prescription.doctor?.licenseNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medicines List */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">💊</span>
                  Prescribed Medicines
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {prescription.medicines.map((med, medIndex) => (
                    <div
                      key={medIndex}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-all duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">💊</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{med.medicine?.name || med.medicineName || 'Medicine Name'}</div>
                          <div className="text-sm text-gray-500">{med.medicine?.brandName || 'N/A'}</div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-gray-600">Dosage:</span>
                            <span className="font-medium text-gray-800">{med.dosePerTime} per time</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm text-gray-600">Quantity:</span>
                            <span className="font-bold text-blue-600">{med.totalQuantity}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm text-gray-600">Duration:</span>
                            <span className="text-sm font-medium text-gray-700">{med.durationDays} days</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm text-gray-600">Strength:</span>
                            <span className="text-sm font-medium text-gray-700">{med.medicine?.strength || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm text-gray-600">Timing:</span>
                            <span className="text-sm font-medium text-gray-700">{med.timing?.join(', ') || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Created: {new Date(prescription.createdAt).toLocaleString()}
                </div>
                <button
                  onClick={() => fulfillPrescription(prescription._id)}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <span>✅</span>
                  Fulfill Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPrescriptions.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center animate-fade-in-up">
          <div className="text-6xl mb-6">📋</div>
          <h3 className="text-2xl font-bold text-gray-600 mb-2">No Prescriptions Found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'No pending prescriptions available'}
          </p>
          {(searchTerm || filter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilter('all');
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}