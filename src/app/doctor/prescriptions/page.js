// // 'use client';

// // import { useState, useEffect } from 'react';
// // import Link from 'next/link';

// // export default function Prescriptions() {
// //   const [prescriptions, setPrescriptions] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState('');

// //   useEffect(() => {
// //     fetchPrescriptions();
// //   }, []);

// //   const fetchPrescriptions = async () => {
// //     try {
// //       const res = await fetch('/api/doctor/prescriptions/list');
// //       const data = await res.json();
// //       if (res.ok) {
// //         setPrescriptions(data.prescriptions);
// //       } else {
// //         setError(data.error || 'Failed to fetch prescriptions');
// //       }
// //     } catch (err) {
// //       setError('Network error');
// //     }
// //     setLoading(false);
// //   };

// //   if (loading) return <div>Loading...</div>;
// //   if (error) return <div>Error: {error}</div>;

// //   return (
// //     <div style={{ padding: '20px' }}>
// //       <h1>Prescriptions</h1>
// //       <Link href="/doctor/prescriptions/create">
// //         <button style={{ padding: '10px', marginBottom: '20px' }}>Create New Prescription</button>
// //       </Link>
// //       <ul style={{ listStyle: 'none', padding: 0 }}>
// //         {prescriptions.map((prescription) => (
// //           <li key={prescription._id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
// //             <h3>Patient: {prescription.patientId?.name} (Age: {prescription.patientId?.age})</h3>
// //             <p>Status: {prescription.fulfilled ? 'Fulfilled' : 'Pending'}</p>
// //             <p>Date: {new Date(prescription.date).toLocaleDateString()}</p>
// //             <h4>Medicines:</h4>
// //             <ul>
// //               {prescription.medicines.map((med, index) => (
// //                 <li key={index}>
// //                   {med.medicineId?.name} - Dose: {med.dosePerTime},
// //                   Timing: {med.timing?.join(', ')},
// //                   Quantity: {med.totalQuantity},
// //                   Duration: {med.durationDays} days
// //                 </li>
// //               ))}
// //             </ul>
// //           </li>
// //         ))}
// //       </ul>
// //     </div>
// //   );
// // }

// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import Link from 'next/link';
// import gsap from 'gsap';
// import { useGSAP } from '@gsap/react';

// export default function Prescriptions() {
//   const [prescriptions, setPrescriptions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [dateFilter, setDateFilter] = useState('all');
  
//   const containerRef = useRef(null);
//   const headerRef = useRef(null);
//   const cardsRef = useRef(null);

//   useGSAP(() => {
//     // Header animation
//     gsap.from(headerRef.current, {
//       y: -50,
//       opacity: 0,
//       duration: 0.8,
//       ease: "power3.out"
//     });

//     // Stats cards animation
//     gsap.from('.stat-card', {
//       y: 30,
//       opacity: 0,
//       stagger: 0.1,
//       duration: 0.6,
//       delay: 0.3,
//       ease: "power2.out"
//     });

//   }, { scope: containerRef });

//   useEffect(() => {
//     fetchPrescriptions();
//   }, []);

//   // Animate cards when prescriptions load
//   useGSAP(() => {
//     if (!loading && prescriptions.length > 0) {
//       gsap.from('.prescription-card', {
//         y: 20,
//         opacity: 0,
//         stagger: 0.1,
//         duration: 0.5,
//         ease: "power2.out"
//       });
//     }
//   }, [loading, prescriptions]);

//   const fetchPrescriptions = async () => {
//     try {
//       setLoading(true);
//       const res = await fetch('/api/doctor/prescriptions/list');
//       const data = await res.json();
//       if (res.ok) {
//         setPrescriptions(data.prescriptions);
//       } else {
//         setError(data.error || 'Failed to fetch prescriptions');
//       }
//     } catch (err) {
//       setError('Network error. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-IN', {
//       weekday: 'short',
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   const getStatusColor = (fulfilled) => {
//     return fulfilled 
//       ? 'bg-green-100 text-green-800 border-green-200' 
//       : 'bg-yellow-100 text-yellow-800 border-yellow-200';
//   };

//   const getStatusIcon = (fulfilled) => {
//     return fulfilled ? '✅' : '⏳';
//   };

//   const getPrescriptionStats = () => {
//     const total = prescriptions.length;
//     const fulfilled = prescriptions.filter(p => p.fulfilled).length;
//     const pending = total - fulfilled;
    
//     // Count today's prescriptions
//     const today = new Date().toDateString();
//     const todayCount = prescriptions.filter(p => {
//       const prescriptionDate = new Date(p.date).toDateString();
//       return prescriptionDate === today;
//     }).length;

//     return { total, fulfilled, pending, today: todayCount };
//   };

//   const filteredPrescriptions = prescriptions.filter(prescription => {
//     // Search filter
//     const matchesSearch = searchTerm === '' || 
//       prescription.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       prescription.patientId?.mobile?.includes(searchTerm) ||
//       prescription.medicines?.some(med => 
//         med.medicineId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
//       );

//     // Status filter
//     const matchesStatus = statusFilter === 'all' || 
//       (statusFilter === 'fulfilled' && prescription.fulfilled) ||
//       (statusFilter === 'pending' && !prescription.fulfilled);

//     // Date filter
//     const prescriptionDate = new Date(prescription.date);
//     const today = new Date();
//     const todayDate = today.toDateString();
//     const prescriptionDateString = prescriptionDate.toDateString();
    
//     let matchesDate = true;
    
//     if (dateFilter === 'today') {
//       matchesDate = prescriptionDateString === todayDate;
//     } else if (dateFilter === 'week') {
//       const weekAgo = new Date();
//       weekAgo.setDate(today.getDate() - 7);
//       matchesDate = prescriptionDate >= weekAgo;
//     } else if (dateFilter === 'month') {
//       const monthAgo = new Date();
//       monthAgo.setMonth(today.getMonth() - 1);
//       matchesDate = prescriptionDate >= monthAgo;
//     }

//     return matchesSearch && matchesStatus && matchesDate;
//   });

//   const stats = getPrescriptionStats();

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
//           <p className="mt-4 text-gray-600 text-lg">Loading prescriptions...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
//       {/* Header */}
//       <div className="bg-white shadow-sm border-b border-blue-100">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//           <div className="flex flex-col md:flex-row md:items-center justify-between">
//             <div ref={headerRef} className="mb-4 md:mb-0">
//               <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
//               <p className="text-gray-600 mt-1">Manage and track patient prescriptions</p>
//             </div>
//             <Link href="/doctor/prescriptions/create">
//               <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center">
//                 <span className="mr-2">➕</span>
//                 Create New Prescription
//               </button>
//             </Link>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//           <div className="stat-card bg-white rounded-xl shadow-lg p-6 border border-blue-100">
//             <div className="flex items-center">
//               <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-4">
//                 <span className="text-white text-xl">📋</span>
//               </div>
//               <div>
//                 <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
//                 <p className="text-sm text-gray-600">Total Prescriptions</p>
//               </div>
//             </div>
//           </div>

//           <div className="stat-card bg-white rounded-xl shadow-lg p-6 border border-green-100">
//             <div className="flex items-center">
//               <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-4">
//                 <span className="text-white text-xl">✅</span>
//               </div>
//               <div>
//                 <p className="text-2xl font-bold text-gray-900">{stats.fulfilled}</p>
//                 <p className="text-sm text-gray-600">Fulfilled</p>
//               </div>
//             </div>
//           </div>

//           <div className="stat-card bg-white rounded-xl shadow-lg p-6 border border-yellow-100">
//             <div className="flex items-center">
//               <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-4">
//                 <span className="text-white text-xl">⏳</span>
//               </div>
//               <div>
//                 <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
//                 <p className="text-sm text-gray-600">Pending</p>
//               </div>
//             </div>
//           </div>

//           <div className="stat-card bg-white rounded-xl shadow-lg p-6 border border-purple-100">
//             <div className="flex items-center">
//               <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
//                 <span className="text-white text-xl">📅</span>
//               </div>
//               <div>
//                 <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
//                 <p className="text-sm text-gray-600">Today</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Filters */}
//         <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-blue-100">
//           <div className="flex flex-col md:flex-row gap-4">
//             <div className="flex-1">
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <span className="text-gray-400">🔍</span>
//                 </div>
//                 <input
//                   type="text"
//                   placeholder="Search by patient name, mobile, or medicine..."
//                   className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//               </div>
//             </div>
//             <div className="flex gap-4">
//               <select
//                 className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//               >
//                 <option value="all">All Status</option>
//                 <option value="fulfilled">Fulfilled</option>
//                 <option value="pending">Pending</option>
//               </select>
//               <select
//                 className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 value={dateFilter}
//                 onChange={(e) => setDateFilter(e.target.value)}
//               >
//                 <option value="all">All Dates</option>
//                 <option value="today">Today</option>
//                 <option value="week">Last Week</option>
//                 <option value="month">Last Month</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Error Message */}
//         {error && (
//           <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded">
//             <div className="flex items-center">
//               <div className="flex-shrink-0">
//                 <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                 </svg>
//               </div>
//               <div className="ml-3">
//                 <p className="text-sm text-red-700 font-medium">{error}</p>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Prescriptions List */}
//         <div ref={cardsRef} className="space-y-6">
//           {filteredPrescriptions.length > 0 ? (
//             filteredPrescriptions.map((prescription) => (
//               <div 
//                 key={prescription._id} 
//                 className="prescription-card bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
//               >
//                 <div className="p-6">
//                   <div className="flex items-start justify-between mb-4">
//                     <div className="flex items-center space-x-3">
//                       <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
//                         <span className="text-white font-bold text-lg">
//                           {prescription.patientId?.name?.charAt(0) || 'P'}
//                         </span>
//                       </div>
//                       <div>
//                         <h3 className="font-bold text-gray-900">{prescription.patientId?.name || 'Unknown Patient'}</h3>
//                         <p className="text-gray-600">
//                           Age: {prescription.patientId?.age || 'N/A'} • 
//                           Gender: {prescription.patientId?.gender || 'N/A'} • 
//                           Mobile: {prescription.patientId?.mobile || 'N/A'}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-center space-x-3">
//                       <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(prescription.fulfilled)}`}>
//                         {getStatusIcon(prescription.fulfilled)} {prescription.fulfilled ? 'Fulfilled' : 'Pending'}
//                       </span>
//                       <span className="text-sm text-gray-500">
//                         {formatDate(prescription.date)}
//                       </span>
//                     </div>
//                   </div>

//                   {/* Medicines List */}
//                   <div className="mb-4">
//                     <h4 className="font-medium text-gray-900 mb-2 flex items-center">
//                       <span className="mr-2">💊</span>
//                       Medicines ({prescription.medicines?.length || 0})
//                     </h4>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                       {prescription.medicines?.map((med, index) => (
//                         <div key={index} className="bg-gray-50 rounded-lg p-3">
//                           <div className="flex justify-between items-start">
//                             <div>
//                               <p className="font-medium text-gray-900">{med.medicineId?.name || 'Unknown Medicine'}</p>
//                               <p className="text-sm text-gray-600">
//                                 {med.medicineId?.brandName} • {med.medicineId?.strength}
//                               </p>
//                             </div>
//                             <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
//                               {med.dosePerTime}
//                             </span>
//                           </div>
//                           <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
//                             <div>
//                               <span className="text-gray-500">Timing:</span>
//                               <span className="ml-2 font-medium">{med.timing?.join(', ') || 'N/A'}</span>
//                             </div>
//                             <div>
//                               <span className="text-gray-500">Quantity:</span>
//                               <span className="ml-2 font-medium">{med.totalQuantity}</span>
//                             </div>
//                             <div>
//                               <span className="text-gray-500">Duration:</span>
//                               <span className="ml-2 font-medium">{med.durationDays} days</span>
//                             </div>
//                             <div>
//                               <span className="text-gray-500">Frequency:</span>
//                               <span className="ml-2 font-medium">{med.frequency || 'N/A'}</span>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>

//                   {/* Additional Information */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                     {prescription.diagnosis && (
//                       <div>
//                         <h5 className="text-sm font-medium text-gray-700 mb-1">Diagnosis</h5>
//                         <p className="text-gray-600 bg-blue-50 p-2 rounded">{prescription.diagnosis}</p>
//                       </div>
//                     )}
//                     {prescription.notes && (
//                       <div>
//                         <h5 className="text-sm font-medium text-gray-700 mb-1">Notes</h5>
//                         <p className="text-gray-600 bg-yellow-50 p-2 rounded">{prescription.notes}</p>
//                       </div>
//                     )}
//                     {prescription.followUpDate && (
//                       <div>
//                         <h5 className="text-sm font-medium text-gray-700 mb-1">Follow-up Date</h5>
//                         <p className="text-gray-600 bg-green-50 p-2 rounded">{formatDate(prescription.followUpDate)}</p>
//                       </div>
//                     )}
//                   </div>

//                   {/* Action Buttons */}
//                   <div className="flex justify-between items-center pt-4 border-t border-gray-200">
//                     <div className="text-sm text-gray-500">
//                       Prescribed by: <span className="font-medium">{prescription.doctorId?.name || 'Unknown Doctor'}</span>
//                     </div>
//                     <div className="flex space-x-2">
//                       <button 
//                         onClick={() => {
//                           // Handle view details
//                           window.location.href = `/doctor/prescriptions/${prescription._id}`;
//                         }}
//                         className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
//                       >
//                         View Details
//                       </button>
//                       {!prescription.fulfilled && (
//                         <button 
//                           onClick={() => {
//                             // Handle fulfill prescription
//                             alert('Fulfill prescription functionality to be implemented');
//                           }}
//                           className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
//                         >
//                           Mark as Fulfilled
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
//               <div className="text-6xl mb-4">📋</div>
//               <h3 className="text-xl font-semibold text-gray-700 mb-2">No prescriptions found</h3>
//               <p className="text-gray-600 mb-6">
//                 {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
//                   ? 'Try adjusting your search filters.' 
//                   : 'Start by creating your first prescription.'}
//               </p>
//               <Link href="/doctor/prescriptions/create">
//                 <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors">
//                   Create New Prescription
//                 </button>
//               </Link>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="bg-white border-t border-gray-200 mt-12">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//           <div className="text-center text-gray-500 text-sm">
//             <p>© {new Date().getFullYear()} MediCare Clinic. Prescription management system.</p>
//             <p className="mt-1">For support, contact: support@medicare.com</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  useGSAP(() => {
    // Header animation
    gsap.from(headerRef.current, {
      y: -50,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    });

    // Stats cards animation
    gsap.from('.stat-card', {
      y: 30,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6,
      delay: 0.3,
      ease: "power2.out"
    });

  }, { scope: containerRef });

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  // Fix: Reset opacity before animating and only animate once
  useGSAP(() => {
    if (!loading && prescriptions.length > 0 && !hasAnimatedRef.current) {
      // First, ensure all cards are visible
      gsap.set('.prescription-card', { opacity: 1, y: 0 });
      
      // Then animate them in
      gsap.from('.prescription-card', {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.5,
        ease: "power2.out"
      });
      
      hasAnimatedRef.current = true;
    }
  }, [loading, prescriptions]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/doctor/prescriptions/list');
      const data = await res.json();
      if (res.ok) {
        setPrescriptions(data.prescriptions);
      } else {
        setError(data.error || 'Failed to fetch prescriptions');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (fulfilled) => {
    return fulfilled 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getStatusIcon = (fulfilled) => {
    return fulfilled ? '✅' : '⏳';
  };

  const getPrescriptionStats = () => {
    const total = prescriptions.length;
    const fulfilled = prescriptions.filter(p => p.fulfilled).length;
    const pending = total - fulfilled;
    
    // Count today's prescriptions
    const today = new Date().toDateString();
    const todayCount = prescriptions.filter(p => {
      const prescriptionDate = new Date(p.date).toDateString();
      return prescriptionDate === today;
    }).length;

    return { total, fulfilled, pending, today: todayCount };
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      prescription.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.patientId?.mobile?.includes(searchTerm) ||
      prescription.medicines?.some(med => 
        med.medicineId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'fulfilled' && prescription.fulfilled) ||
      (statusFilter === 'pending' && !prescription.fulfilled);

    // Date filter
    const prescriptionDate = new Date(prescription.date);
    const today = new Date();
    const todayDate = today.toDateString();
    const prescriptionDateString = prescriptionDate.toDateString();
    
    let matchesDate = true;
    
    if (dateFilter === 'today') {
      matchesDate = prescriptionDateString === todayDate;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      matchesDate = prescriptionDate >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(today.getMonth() - 1);
      matchesDate = prescriptionDate >= monthAgo;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const stats = getPrescriptionStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div ref={headerRef} className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
              <p className="text-gray-600 mt-1">Manage and track patient prescriptions</p>
            </div>
            <Link href="/doctor/prescriptions/create">
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center">
                <span className="mr-2">➕</span>
                Create New Prescription
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card bg-white rounded-xl shadow-lg p-6 border border-blue-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white text-xl">📋</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Prescriptions</p>
              </div>
            </div>
          </div>

          <div className="stat-card bg-white rounded-xl shadow-lg p-6 border border-green-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white text-xl">✅</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.fulfilled}</p>
                <p className="text-sm text-gray-600">Fulfilled</p>
              </div>
            </div>
          </div>

          <div className="stat-card bg-white rounded-xl shadow-lg p-6 border border-yellow-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white text-xl">⏳</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </div>

          <div className="stat-card bg-white rounded-xl shadow-lg p-6 border border-purple-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white text-xl">📅</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
                <p className="text-sm text-gray-600">Today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-blue-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search by patient name, mobile, or medicine..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="pending">Pending</option>
              </select>
              <select
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
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

        {/* Prescriptions List */}
        <div ref={cardsRef} className="space-y-6">
          {filteredPrescriptions.length > 0 ? (
            filteredPrescriptions.map((prescription) => (
              <div 
                key={prescription._id} 
                className="prescription-card bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 opacity-100" // Added opacity-100 here
                style={{ opacity: 1 }} // Force opacity to 1
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {prescription.patientId?.name?.charAt(0) || 'P'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{prescription.patientId?.name || 'Unknown Patient'}</h3>
                        <p className="text-gray-600">
                          Age: {prescription.patientId?.age || 'N/A'} • 
                          Gender: {prescription.patientId?.gender || 'N/A'} • 
                          Mobile: {prescription.patientId?.mobile || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(prescription.fulfilled)}`}>
                        {getStatusIcon(prescription.fulfilled)} {prescription.fulfilled ? 'Fulfilled' : 'Pending'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(prescription.date)}
                      </span>
                    </div>
                  </div>

                  {/* Medicines List */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <span className="mr-2">💊</span>
                      Medicines ({prescription.medicines?.length || 0})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {prescription.medicines?.map((med, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3 opacity-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{med.medicineName || 'Unknown Medicine'}</p>
                              <p className="text-sm text-gray-600">
                                {med.brandName || 'N/A'} • {med.strength || 'N/A'}
                              </p>
                            </div>
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                              {med.dosePerTime}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Timing:</span>
                              <span className="ml-2 font-medium">{med.timing?.join(', ') || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Quantity:</span>
                              <span className="ml-2 font-medium">{med.totalQuantity}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Duration:</span>
                              <span className="ml-2 font-medium">{med.durationDays} days</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Frequency:</span>
                              <span className="ml-2 font-medium">{med.frequency || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {prescription.diagnosis && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Diagnosis</h5>
                        <p className="text-gray-600 bg-blue-50 p-2 rounded opacity-100">{prescription.diagnosis}</p>
                      </div>
                    )}
                    {prescription.notes && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Notes</h5>
                        <p className="text-gray-600 bg-yellow-50 p-2 rounded opacity-100">{prescription.notes}</p>
                      </div>
                    )}
                    {prescription.followUpDate && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Follow-up Date</h5>
                        <p className="text-gray-600 bg-green-50 p-2 rounded opacity-100">{formatDate(prescription.followUpDate)}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Prescribed by: <span className="font-medium">{prescription.doctorId?.name || 'Unknown Doctor'}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          // Handle view details
                          window.location.href = `/doctor/prescriptions/${prescription._id}`;
                        }}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors opacity-100"
                      >
                        View Details
                      </button>
                      {!prescription.fulfilled && (
                        <button 
                          onClick={() => {
                            // Handle fulfill prescription
                            alert('Fulfill prescription functionality to be implemented');
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors opacity-100"
                        >
                          Mark as Fulfilled
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100 opacity-100">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No prescriptions found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                  ? 'Try adjusting your search filters.' 
                  : 'Start by creating your first prescription.'}
              </p>
              <Link href="/doctor/prescriptions/create">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors opacity-100">
                  Create New Prescription
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12 opacity-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} MediCare Clinic. Prescription management system.</p>
            <p className="mt-1">For support, contact: support@medicare.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
