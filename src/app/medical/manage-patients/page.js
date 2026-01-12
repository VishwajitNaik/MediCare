// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';

// export default function ManagePatients() {
//   const [patients, setPatients] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [userRole, setUserRole] = useState('');

//   useEffect(() => {
//     fetchUserInfo();
//     fetchPatients();
//   }, []);

//   const fetchUserInfo = async () => {
//     try {
//       // Get user info from a protected route to determine role
//       const res = await fetch('/api/medical/medicines'); // Any protected route
//       if (res.ok) {
//         setUserRole('MEDICAL');
//       } else {
//         // Try doctor route
//         const doctorRes = await fetch('/api/doctor/patients/list');
//         if (doctorRes.ok) {
//           setUserRole('DOCTOR');
//         }
//       }
//     } catch (err) {
//       // Handle error
//     }
//   };

//   const fetchPatients = async () => {
//     try {
//       const res = await fetch('/api/common/patients');
//       const data = await res.json();
//       if (res.ok) {
//         setPatients(data.patients);
//       } else {
//         setError(data.error || 'Failed to fetch patients');
//       }
//     } catch (err) {
//       setError('Network error');
//     }
//     setLoading(false);
//   };

//   const canEditPatient = (patient) => {
//     // Medical staff can edit patients they created (no doctor field)
//     return userRole === 'MEDICAL' && !patient.doctor;
//   };

//   if (loading) return <div>Loading...</div>;
//   if (error) return <div>Error: {error}</div>;

//   return (
//     <div style={{ padding: '20px' }}>
//       <h1>Manage Patients</h1>
//       <Link href="/medical/manage-patients/add">
//         <button style={{ padding: '10px', marginBottom: '20px' }}>Add New Patient</button>
//       </Link>
//       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//         <thead>
//           <tr style={{ borderBottom: '1px solid #ccc' }}>
//             <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
//             <th style={{ textAlign: 'left', padding: '10px' }}>Mobile</th>
//             <th style={{ textAlign: 'left', padding: '10px' }}>Age</th>
//             <th style={{ textAlign: 'left', padding: '10px' }}>Gender</th>
//             <th style={{ textAlign: 'left', padding: '10px' }}>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {patients.map((patient) => (
//             <tr key={patient._id} style={{ borderBottom: '1px solid #eee' }}>
//               <td style={{ padding: '10px' }}>{patient.name}</td>
//               <td style={{ padding: '10px' }}>{patient.mobile}</td>
//               <td style={{ padding: '10px' }}>{patient.age}</td>
//               <td style={{ padding: '10px' }}>{patient.gender}</td>
//               <td style={{ padding: '10px' }}>
//                 {canEditPatient(patient) && (
//                   <Link href={`/medical/manage-patients/${patient._id}`}>
//                     <button style={{ marginRight: '5px', padding: '5px 10px' }}>Edit</button>
//                   </Link>
//                 )}
//                 <Link href={`/medical/patients/${patient._id}/serve-medicine`}>
//                   <button style={{ padding: '5px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px' }}>
//                     Serve Medicine
//                   </button>
//                 </Link>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       {patients.length === 0 && <p>No patients found</p>}
//     </div>
//   );
// }


'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

export default function ManagePatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const patientsRef = useRef([]);
  const statsRef = useRef([]);
  const modalRef = useRef(null);

  useEffect(() => {
    fetchUserInfo();
    fetchPatients();
  }, []);

  useEffect(() => {
    // Animate patients on load
    if (!loading && patientsRef.current.length > 0) {
      gsap.fromTo(patientsRef.current,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.05,
          duration: 0.4,
          ease: "power2.out"
        }
      );
    }
  }, [loading, patients]);

  useEffect(() => {
    // Animate stats cards
    if (statsRef.current.length > 0) {
      gsap.fromTo(statsRef.current,
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          stagger: 0.15,
          duration: 0.5,
          ease: "back.out(1.2)"
        }
      );
    }
  }, [patients]);

  const fetchUserInfo = async () => {
    try {
      const res = await fetch('/api/medical/medicines');
      if (res.ok) {
        setUserRole('MEDICAL');
      } else {
        const doctorRes = await fetch('/api/doctor/patients/list');
        if (doctorRes.ok) {
          setUserRole('DOCTOR');
        }
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/common/patients');
      const data = await res.json();
      if (res.ok) {
        setPatients(data.patients);
      } else {
        setError(data.error || 'Failed to fetch patients');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const canEditPatient = (patient) => {
    return userRole === 'MEDICAL' && !patient.doctor;
  };

  // Filter patients
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = searchTerm === '' || 
      patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.mobile?.includes(searchTerm);

    const matchesGender = filterGender === 'all' || patient.gender === filterGender;

    return matchesSearch && matchesGender;
  });

  // Calculate statistics
  const stats = {
    total: patients.length,
    male: patients.filter(p => p.gender === 'MALE').length,
    female: patients.filter(p => p.gender === 'FEMALE').length,
    other: patients.filter(p => !['MALE', 'FEMALE'].includes(p.gender)).length,
  };

  const openQuickView = (patient) => {
    setSelectedPatient(patient);
    if (modalRef.current) {
      gsap.fromTo(modalRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.2)" }
      );
    }
  };

  const closeQuickView = () => {
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.2,
        onComplete: () => setSelectedPatient(null)
      });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen ">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-medical-primary mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Loading patients database...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md border border-medical-border">
        <div className="text-6xl text-red-500 mb-4 text-center">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Error Loading Patients</h2>
        <p className="text-gray-600 mb-6 text-center">{error}</p>
        <button
          onClick={fetchPatients}
          className="w-full px-6 py-3 bg-medical-primary hover:bg-medical-dark text-white font-semibold rounded-xl transition-all duration-200"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen to-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-4xl text-medical-primary">👥</span>
              Patient Management
            </h1>
            <p className="text-gray-600 mt-2">Manage and serve patients in your medical facility</p>
          </div>
          <Link href="/medical/manage-patients/add">
            <button className="px-6 py-3 bg-medical-primary hover:bg-medical-dark text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2">
              <span className="text-xl">➕</span>
              Add New Patient
            </button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div 
            ref={el => statsRef.current[0] = el}
            className="bg-white rounded-2xl shadow-lg p-6 border border-medical-border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Patients</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</h3>
              </div>
              <div className="w-12 h-12 bg-medical-light rounded-xl flex items-center justify-center">
                <span className="text-2xl text-medical-primary">👥</span>
              </div>
            </div>
          </div>

          <div 
            ref={el => statsRef.current[1] = el}
            className="bg-white rounded-2xl shadow-lg p-6 border border-medical-border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Male Patients</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.male}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <span className="text-2xl text-blue-600">👨</span>
              </div>
            </div>
          </div>

          <div 
            ref={el => statsRef.current[2] = el}
            className="bg-white rounded-2xl shadow-lg p-6 border border-medical-border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Female Patients</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.female}</h3>
              </div>
              <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center">
                <span className="text-2xl text-pink-600">👩</span>
              </div>
            </div>
          </div>

          <div 
            ref={el => statsRef.current[3] = el}
            className="bg-white rounded-2xl shadow-lg p-6 border border-medical-border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Other</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.other}</h3>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                <span className="text-2xl text-gray-600">👤</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-2xl shadow-lg border border-medical-border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-xl text-medical-primary">🔍</span>
                Search Patients
              </label>
              <input
                type="text"
                placeholder="Search by name or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-medical-border rounded-xl focus:ring-2 focus:ring-medical-primary focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-xl text-medical-primary">⚤</span>
                Filter by Gender
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterGender('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 ${
                    filterGender === 'all'
                      ? 'bg-medical-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterGender('MALE')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 ${
                    filterGender === 'MALE'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Male
                </button>
                <button
                  onClick={() => setFilterGender('FEMALE')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 ${
                    filterGender === 'FEMALE'
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-xl text-medical-primary">📊</span>
                Showing Results
              </label>
              <div className="flex items-center justify-between px-4 py-3 bg-medical-light rounded-xl">
                <span className="font-medium text-gray-700">
                  {filteredPatients.length} patients
                </span>
                <span className="text-sm text-gray-500">
                  of {patients.length} total
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-medical-border overflow-hidden">
        <div className="p-6 border-b border-medical-border ">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl text-white">📋</span>
            Patient Database
            <span className="ml-2 px-3 py-1 bg-medical-primary text-white text-sm font-semibold rounded-full">
              {filteredPatients.length} patients
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-medical-border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Patient Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contact Information
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Medical Info
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-medical-border">
              {filteredPatients.map((patient, index) => (
                <tr 
                  key={patient._id}
                  ref={el => patientsRef.current[index] = el}
                  className="hover:bg-blue-100 transition-colors duration-150"
                >
                  {/* Patient Details */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                        patient.gender === 'MALE' ? 'bg-blue-50' : 
                        patient.gender === 'FEMALE' ? 'bg-pink-50' : 
                        'bg-gray-50'
                      }`}>
                        <span className={`text-xl ${
                          patient.gender === 'MALE' ? 'text-blue-600' : 
                          patient.gender === 'FEMALE' ? 'text-pink-600' : 
                          'text-gray-600'
                        }`}>
                          {patient.gender === 'MALE' ? '👨' : 
                           patient.gender === 'FEMALE' ? '👩' : '👤'}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{patient.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            patient.gender === 'MALE' ? 'bg-blue-100 text-blue-800' : 
                            patient.gender === 'FEMALE' ? 'bg-pink-100 text-pink-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {patient.gender || 'Not Specified'}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                            Age: {patient.age}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact Information */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📱</span>
                        <span className="font-medium text-gray-900">{patient.mobile}</span>
                      </div>
                      {patient.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">✉️</span>
                          <span className="text-gray-600 truncate">{patient.email}</span>
                        </div>
                      )}
                      {patient.address && (
                        <div className="flex items-start gap-2 text-sm mt-2">
                          <span className="text-gray-500 mt-1">🏠</span>
                          <span className="text-gray-600 line-clamp-2">{patient.address}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Medical Info */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Blood Group:</span>
                        <span className="font-medium text-gray-900">
                          {patient.bloodGroup || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Allergies:</span>
                        <span className="font-medium text-gray-900">
                          {patient.allergies?.length > 0 ? `${patient.allergies.length}` : 'None'}
                        </span>
                      </div>
                      <button
                        onClick={() => openQuickView(patient)}
                        className="text-sm text-medical-primary hover:text-medical-dark font-medium transition-colors duration-200"
                      >
                        View Full Profile →
                      </button>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      {canEditPatient(patient) && (
                        <Link href={`/medical/manage-patients/${patient._id}`}>
                          <button className="w-full px-4 py-2 bg-medical-light hover:bg-medical-primary/10 text-medical-primary font-medium rounded-lg transition-all duration-200 border border-medical-primary/30 flex items-center justify-center gap-2">
                            <span>✏️</span>
                            Edit Patient
                          </button>
                        </Link>
                      )}
                      <Link href={`/medical/patients/${patient._id}/serve-medicine`}>
                        <button className="w-full px-4 py-2 bg-medical-primary hover:bg-medical-dark text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                          <span>💊</span>
                          Serve Medicine
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPatients.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4 text-gray-400">👥</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Patients Found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterGender !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No patients in the database'}
              </p>
              {(searchTerm || filterGender !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterGender('all');
                  }}
                  className="px-6 py-2 bg-medical-primary hover:bg-medical-dark text-white font-medium rounded-lg transition-all duration-200"
                >
                  Clear Filters
                </button>
              )}
              {!searchTerm && filterGender === 'all' && (
                <Link href="/medical/manage-patients/add">
                  <button className="px-6 py-2 bg-medical-primary hover:bg-medical-dark text-white font-medium rounded-lg transition-all duration-200">
                    Add First Patient
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-medical-primary to-medical-dark p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="text-3xl">👤</span>
                  Patient Profile
                </h3>
                <button
                  onClick={closeQuickView}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                >
                  <span className="text-2xl text-white">✕</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Personal Information */}
                <div className="bg-medical-light p-4 rounded-xl border border-medical-border">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">📝</span>
                    Personal Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Full Name:</span>
                      <span className="font-semibold text-gray-800">{selectedPatient.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-semibold text-gray-800">{selectedPatient.age} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gender:</span>
                      <span className="font-semibold text-gray-800">{selectedPatient.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date of Birth:</span>
                      <span className="font-semibold text-gray-800">
                        {selectedPatient.dob ? new Date(selectedPatient.dob).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-medical-light p-4 rounded-xl border border-medical-border">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">📱</span>
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mobile:</span>
                      <span className="font-semibold text-gray-800">{selectedPatient.mobile}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-semibold text-gray-800">{selectedPatient.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span className="font-semibold text-gray-800 text-right">
                        {selectedPatient.address || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="bg-medical-light p-4 rounded-xl border border-medical-border">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🏥</span>
                  Medical Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-gray-600 text-sm">Blood Group</div>
                    <div className="font-semibold text-gray-800">
                      {selectedPatient.bloodGroup || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-sm">Height</div>
                    <div className="font-semibold text-gray-800">
                      {selectedPatient.height ? `${selectedPatient.height} cm` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-sm">Weight</div>
                    <div className="font-semibold text-gray-800">
                      {selectedPatient.weight ? `${selectedPatient.weight} kg` : 'N/A'}
                    </div>
                  </div>
                </div>
                
                {selectedPatient.allergies?.length > 0 && (
                  <div className="mt-4">
                    <div className="text-gray-600 text-sm mb-2">Allergies</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedPatient.allergies.map((allergy, idx) => (
                        <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                {canEditPatient(selectedPatient) && (
                  <Link href={`/medical/manage-patients/${selectedPatient._id}`} className="flex-1">
                    <button className="w-full px-6 py-3 bg-medical-light hover:bg-medical-primary/10 text-medical-primary font-semibold rounded-xl transition-all duration-200 border border-medical-primary/30 flex items-center justify-center gap-2">
                      <span>✏️</span>
                      Edit Patient
                    </button>
                  </Link>
                )}
                <Link href={`/medical/patients/${selectedPatient._id}/serve-medicine`} className="flex-1">
                  <button className="w-full px-6 py-3 bg-medical-primary hover:bg-medical-dark text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2">
                    <span>💊</span>
                    Serve Medicine Now
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}