// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';

// export default function PatientService() {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [selectedPatient, setSelectedPatient] = useState(null);
//   const [showAddPatient, setShowAddPatient] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleSearch = async () => {
//     if (!searchQuery.trim()) return;

//     setLoading(true);
//     setError('');

//     try {
//       const res = await fetch(`/api/medical/patients?q=${encodeURIComponent(searchQuery)}`);
//       const data = await res.json();

//       if (res.ok) {
//         setSearchResults(data.patients);
//         if (data.patients.length === 0) {
//           setShowAddPatient(true);
//         } else {
//           setShowAddPatient(false);
//         }
//       } else {
//         setError(data.error || 'Search failed');
//       }
//     } catch (err) {
//       setError('Network error');
//     }
//     setLoading(false);
//   };

//   const selectPatient = (patient) => {
//     setSelectedPatient(patient);
//     setSearchResults([]);
//     setSearchQuery('');
//   };

//   return (
//     <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
//       <h1>Patient Medicine Service</h1>

//       {!selectedPatient ? (
//         <div style={{ marginBottom: '30px' }}>
//           <h2>Search Patient</h2>
//           <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
//             <input
//               type="text"
//               placeholder="Enter mobile number or patient name"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
//               style={{ flex: 1, padding: '10px' }}
//             />
//             <button onClick={handleSearch} disabled={loading} style={{ padding: '10px 20px' }}>
//               {loading ? 'Searching...' : 'Search'}
//             </button>
//           </div>

//           {error && <p style={{ color: 'red' }}>{error}</p>}

//           {searchResults.length > 0 && (
//             <div>
//               <h3>Search Results:</h3>
//               {searchResults.map((patient) => (
//                 <div key={patient._id} style={{
//                   border: '1px solid #ccc',
//                   padding: '15px',
//                   margin: '10px 0',
//                   cursor: 'pointer'
//                 }} onClick={() => selectPatient(patient)}>
//                   <h4>{patient.name}</h4>
//                   <p>Mobile: {patient.mobile}</p>
//                   <p>Age: {patient.age}, Gender: {patient.gender}</p>
//                   <p><em>Click to select this patient</em></p>
//                 </div>
//               ))}
//             </div>
//           )}

//           {showAddPatient && (
//             <div style={{ border: '2px dashed #ccc', padding: '20px', marginTop: '20px' }}>
//               <h3>Patient Not Found</h3>
//               <p>No patient found with "{searchQuery}". Would you like to add a new patient?</p>
//               <Link href="/medical/patients/add">
//                 <button style={{ padding: '10px 20px', background: '#007bff', color: 'white' }}>
//                   Add New Patient
//                 </button>
//               </Link>
//             </div>
//           )}
//         </div>
//       ) : (
//         <div>
//           <div style={{ background: '#e8f5e8', padding: '15px', marginBottom: '20px', borderRadius: '4px' }}>
//             <h2>Selected Patient</h2>
//             <h3>{selectedPatient.name}</h3>
//             <p>Mobile: {selectedPatient.mobile}</p>
//             <p>Age: {selectedPatient.age}, Gender: {selectedPatient.gender}</p>
//             <button onClick={() => setSelectedPatient(null)} style={{ marginTop: '10px', padding: '5px 10px' }}>
//               Change Patient
//             </button>
//           </div>

//           <div style={{ display: 'flex', gap: '20px' }}>
//             <Link href={`/medical/patients/${selectedPatient._id}/serve-medicine`}>
//               <button style={{ padding: '15px 25px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
//                 Serve Medicine
//               </button>
//             </Link>
//             <Link href={`/medical/patients/${selectedPatient._id}/prescriptions`}>
//               <button style={{ padding: '15px 25px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
//                 View Prescriptions
//               </button>
//             </Link>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function PatientService() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: '',
    address: ''
  });
  
  const router = useRouter();
  const headerRef = useRef(null);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const patientCardRef = useRef(null);

  // Initialize GSAP animations
  useGSAP(() => {
    // Animate header
    gsap.from(headerRef.current, {
      y: -30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    });

    // Animate search section
    gsap.from(searchRef.current, {
      y: 20,
      opacity: 0,
      duration: 0.6,
      delay: 0.2,
      ease: "power2.out"
    });

  }, { scope: headerRef });

  // Animate search results when they appear
  useGSAP(() => {
    if (searchResults.length > 0) {
      gsap.from('.patient-card', {
        x: -30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.5,
        ease: "power2.out"
      });
    }
  }, [searchResults]);

  // Animate selected patient card
  useGSAP(() => {
    if (selectedPatient) {
      gsap.from(patientCardRef.current, {
        scale: 0.9,
        opacity: 0,
        duration: 0.6,
        ease: "back.out(1.4)"
      });
    }
  }, [selectedPatient]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/medical/patients?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      if (res.ok) {
        setSearchResults(data.patients);
        if (data.patients.length === 0) {
          setShowAddPatient(true);
        } else {
          setShowAddPatient(false);
        }
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleNewPatientSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/medical/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatientForm),
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedPatient(data.patient);
        setShowAddPatient(false);
        setNewPatientForm({
          name: '',
          mobile: '',
          age: '',
          gender: '',
          address: ''
        });
      } else {
        setError(data.error || 'Failed to add patient');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleQuickServe = () => {
    if (selectedPatient) {
      router.push(`/medical/patients/${selectedPatient._id}/serve-medicine`);
    }
  };

  return (
    <div className="min-h-screen text-gray-800 bg-gradient-to-br from-emerald-50 via-white to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-10">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
              <span className="text-white text-2xl">👥</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Patient Medicine Service
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Search for patients and serve them medication quickly and efficiently
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {!selectedPatient ? (
            <div ref={searchRef} className="space-y-8">
              {/* Search Section */}
              <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="mr-2">🔍</span> Search Patient
                </h2>
                
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute text-gray-800 inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400">📱</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter mobile number or patient name"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={loading || !searchQuery.trim()}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                      loading || !searchQuery.trim()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching...
                      </span>
                    ) : 'Search Patient'}
                  </button>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div ref={resultsRef} className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">👤</span> Search Results ({searchResults.length})
                    </h3>
                    <div className="space-y-4">
                      {searchResults.map((patient) => (
                        <div
                          key={patient._id}
                          className="patient-card bg-white border border-emerald-200 rounded-xl p-5 hover:shadow-lg hover:border-emerald-300 transition-all duration-200 cursor-pointer group"
                          onClick={() => selectPatient(patient)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                <span className="text-emerald-600 text-lg">👤</span>
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-lg">{patient.name}</h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                  <span className="flex items-center">
                                    <span className="mr-1">📱</span>
                                    {patient.mobile}
                                  </span>
                                  <span>Age: {patient.age}</span>
                                  <span>Gender: {patient.gender}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-gray-500 flex items-center">
                            <span className="mr-2">💡</span>
                            Click to select this patient for service
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Add Patient Form */}
                {showAddPatient && (
                  <div className="mt-8 bg-gradient-to-r from-emerald-50 to-white rounded-xl border border-emerald-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">➕</span> Patient Not Found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      No patient found with <span className="font-semibold">"{searchQuery}"</span>. Add as a new patient:
                    </p>
                    
                    <form onSubmit={handleNewPatientSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={newPatientForm.name}
                            onChange={(e) => setNewPatientForm({...newPatientForm, name: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mobile Number *
                          </label>
                          <input
                            type="tel"
                            required
                            value={newPatientForm.mobile}
                            onChange={(e) => setNewPatientForm({...newPatientForm, mobile: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="9876543210"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Age *
                          </label>
                          <input
                            type="number"
                            required
                            value={newPatientForm.age}
                            onChange={(e) => setNewPatientForm({...newPatientForm, age: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="30"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gender *
                          </label>
                          <select
                            required
                            value={newPatientForm.gender}
                            onChange={(e) => setNewPatientForm({...newPatientForm, gender: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address (Optional)
                        </label>
                        <textarea
                          value={newPatientForm.address}
                          onChange={(e) => setNewPatientForm({...newPatientForm, address: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          rows="3"
                          placeholder="Enter patient address..."
                        />
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowAddPatient(false)}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                        >
                          {loading ? 'Adding...' : 'Add New Patient'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-emerald-600">🔍</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">Quick Search</div>
                      <div className="text-sm text-gray-600">Find patients instantly</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-blue-600">💊</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">Quick Serve</div>
                      <div className="text-sm text-gray-600">Dispense medicine fast</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-purple-600">📋</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">Prescriptions</div>
                      <div className="text-sm text-gray-600">View medical history</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Selected Patient Section */
            <div ref={patientCardRef} className="space-y-8">
              {/* Patient Info Card */}
              <div className="bg-gradient-to-r from-emerald-50 to-white rounded-2xl shadow-lg border border-emerald-200 p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <span className="mr-3">👤</span> Selected Patient
                    </h2>
                    <p className="text-gray-600 mt-1">Ready to serve medicine</p>
                  </div>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="px-4 py-2 border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors duration-200 font-medium flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Change Patient
                  </button>
                </div>

                <div className="bg-white rounded-xl p-6 border border-emerald-100 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center space-x-4 mb-4 md:mb-0">
                      <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-white text-2xl">👤</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{selectedPatient.name}</h3>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-600">
                          <span className="flex items-center">
                            <span className="mr-2">📱</span>
                            {selectedPatient.mobile}
                          </span>
                          <span className="flex items-center">
                            <span className="mr-2">🎂</span>
                            Age: {selectedPatient.age}
                          </span>
                          <span className="flex items-center">
                            <span className="mr-2">⚧️</span>
                            {selectedPatient.gender}
                          </span>
                        </div>
                        {selectedPatient.address && (
                          <div className="mt-2 text-gray-600 flex items-start">
                            <span className="mr-2 mt-1">📍</span>
                            <span>{selectedPatient.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Patient ID: {selectedPatient._id?.substring(0, 8)}...
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid md:grid-cols-3 gap-6">
                <button
                  onClick={handleQuickServe}
                  className="group bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">💊</span>
                    </div>
                    <svg className="w-6 h-6 text-white/50 group-hover:text-white/80 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xl font-bold mb-2">Serve Medicine</div>
                    <p className="text-sm text-white/80">Dispense medication to patient</p>
                  </div>
                </button>

                <Link href={`/medical/patients/${selectedPatient._id}/prescriptions`}>
                  <div className="group bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📋</span>
                      </div>
                      <svg className="w-6 h-6 text-white/50 group-hover:text-white/80 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-bold mb-2">View Prescriptions</div>
                      <p className="text-sm text-white/80">Check medical history & prescriptions</p>
                    </div>
                  </div>
                </Link>

                <Link href={`/medical/patients/${selectedPatient._id}`}>
                  <div className="group bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📄</span>
                      </div>
                      <svg className="w-6 h-6 text-white/50 group-hover:text-white/80 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-bold mb-2">Patient Details</div>
                      <p className="text-sm text-white/80">View complete patient profile</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm text-center">
                  <div className="text-2xl font-bold text-emerald-600">0</div>
                  <div className="text-sm text-gray-600">Today's Visits</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm text-center">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600">Active Prescriptions</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm text-center">
                  <div className="text-2xl font-bold text-purple-600">₹0</div>
                  <div className="text-sm text-gray-600">Total Spent</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm text-center">
                  <div className="text-2xl font-bold text-teal-600">100%</div>
                  <div className="text-sm text-gray-600">Satisfaction</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}