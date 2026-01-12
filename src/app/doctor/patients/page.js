// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import Link from 'next/link';
// import gsap from 'gsap';
// import {
//   FaUserPlus,
//   FaSearch,
//   FaFilter,
//   FaEdit,
//   FaEye,
//   FaTrash,
//   FaUserInjured,
//   FaPhone,
//   FaCalendar,
//   FaVenusMars,
//   FaBirthdayCake,
//   FaHistory,
//   FaArrowRight,
//   FaSort,
//   FaPlus,
//   FaRegHospital
// } from 'react-icons/fa';

// export default function DoctorPatients() {
//   const [patients, setPatients] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterGender, setFilterGender] = useState('all');
//   const [sortBy, setSortBy] = useState('name');
//   const [expandedPatient, setExpandedPatient] = useState(null);
  
//   const containerRef = useRef(null);
//   const patientCardsRef = useRef([]);
//   const searchBarRef = useRef(null);

//   // Initialize GSAP animations
//   useEffect(() => {
//     const ctx = gsap.context(() => {
//       // Entrance animations
//       gsap.from('.page-title', {
//         duration: 0.8,
//         y: -30,
//         opacity: 0,
//         ease: 'power3.out'
//       });

//       gsap.from('.stats-card', {
//         duration: 0.6,
//         y: 40,
//         opacity: 0,
//         stagger: 0.1,
//         delay: 0.2,
//         ease: 'power3.out'
//       });

//       gsap.from(searchBarRef.current, {
//         duration: 0.6,
//         y: 20,
//         opacity: 0,
//         delay: 0.4,
//         ease: 'power3.out'
//       });

//       // Animate patient cards on load
//       if (patientCardsRef.current.length > 0) {
//         gsap.from(patientCardsRef.current, {
//           duration: 0.6,
//           y: 40,
//           opacity: 0,
//           stagger: 0.1,
//           delay: 0.6,
//           ease: 'power3.out'
//         });
//       }

//     }, containerRef);

//     return () => ctx.revert();
//   }, [patients]);

//   // Load all patients on initial mount
//   useEffect(() => {
//     fetchPatients();
//   }, []);

//   const fetchPatients = async (searchQuery = '') => {
//     try {
//       setLoading(true);
//       setError('');

//       console.log('Fetching patients with query:', searchQuery);
      
//       // Always use the medical patients API for consistency
//       const url = searchQuery.trim()
//         ? `/api/medical/patients?q=${encodeURIComponent(searchQuery.trim())}`
//         : '/api/medical/patients';

//       console.log('Fetching from URL:', url);
      
//       const res = await fetch(url);
//       const data = await res.json();

//       console.log('API Response:', data);

//       if (res.ok) {
//         setPatients(data.patients || []);
//         console.log('Fetched patients:', data.patients?.length || 0);
//       } else {
//         setError(data.error || 'Failed to fetch patients');
//       }
//     } catch (err) {
//       setError('Network error. Please try again.');
//       console.error('Error fetching patients:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearch = () => {
//     if (searchTerm.trim()) {
//       fetchPatients(searchTerm);
//     } else {
//       // If search is empty, load all patients
//       fetchPatients();
//     }
//   };

//   const handleLoadAllPatients = () => {
//     fetchPatients(); // Empty query loads all
//     setSearchTerm(''); // Clear search to show all
//   };

//   const handlePatientClick = (patientId) => {
//     if (expandedPatient === patientId) {
//       setExpandedPatient(null);
//     } else {
//       setExpandedPatient(patientId);
      
//       // Animate the expanded card
//       const card = patientCardsRef.current.find(ref => ref?.dataset?.id === patientId);
//       if (card) {
//         gsap.fromTo(card.querySelector('.expand-content'),
//           { height: 0, opacity: 0 },
//           { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' }
//         );
//       }
//     }
//   };

//   const handleDeletePatient = async (patientId, e) => {
//     e.stopPropagation();
    
//     if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
//       return;
//     }

//     try {
//       const res = await fetch(`/api/doctor/patients/${patientId}`, {
//         method: 'DELETE',
//       });

//         console.log('Delete response:', res);
//       if (res.ok) {
//         // Animate removal
//         const card = patientCardsRef.current.find(ref => ref?.dataset?.id === patientId);
//         if (card) {
//           gsap.to(card, {
//             duration: 0.3,
//             opacity: 0,
//             x: -100,
//             onComplete: () => {
//               setPatients(prev => prev.filter(p => p._id !== patientId));
//             }
//           });
//         } else {
//           setPatients(prev => prev.filter(p => p._id !== patientId));
//         }
//       } else {
//         const data = await res.json();
//         alert(data.error || 'Failed to delete patient');
//       }
//     } catch (err) {
//       alert('Network error. Please try again.');
//     }
//   };

//   // Filter and sort patients
//   const filteredAndSortedPatients = patients
//     .filter(patient => {
//       if (!patient || !patient.name) return false;
      
//       const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                            (patient.mobile && patient.mobile.includes(searchTerm));
//       const matchesGender = filterGender === 'all' || 
//                            (patient.gender && patient.gender.toLowerCase() === filterGender.toLowerCase());
//       return matchesSearch && matchesGender;
//     })
//     .sort((a, b) => {
//       switch (sortBy) {
//         case 'name':
//           return a.name.localeCompare(b.name);
//         case 'age':
//           return (parseInt(b.age) || 0) - (parseInt(a.age) || 0);
//         case 'recent':
//           return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
//         default:
//           return 0;
//       }
//     });

//   // Calculate stats
//   const stats = {
//     total: patients.length,
//     male: patients.filter(p => p.gender && p.gender.toLowerCase() === 'male').length,
//     female: patients.filter(p => p.gender && p.gender.toLowerCase() === 'female').length,
//     recent: patients.filter(p => {
//       const created = new Date(p.createdAt || Date.now());
//       const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
//       return created > weekAgo;
//     }).length,
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600 text-lg">Loading patients...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="bg-red-100 p-4 rounded-xl mb-4">
//             <p className="text-red-600 font-semibold">Error: {error}</p>
//           </div>
//           <button
//             onClick={() => fetchPatients()}
//             className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6 lg:p-8">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
//           <div>
//             <h1 className="page-title text-3xl md:text-4xl font-bold text-gray-900 mb-2">
//               Patient Management
//             </h1>
//             <p className="text-gray-600">
//               Manage all your patients' records and medical history
//             </p>
//           </div>
          
//           <Link href="/doctor/patients/create">
//             <button className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2">
//               <FaUserPlus className="text-xl" />
//               Add New Patient
//             </button>
//           </Link>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//           {[
//             { label: 'Total Patients', value: stats.total, icon: FaUserInjured, color: 'from-blue-500 to-cyan-500' },
//             { label: 'Male Patients', value: stats.male, icon: FaVenusMars, color: 'from-blue-500 to-indigo-500' },
//             { label: 'Female Patients', value: stats.female, icon: FaVenusMars, color: 'from-pink-500 to-rose-500' },
//             { label: 'New This Week', value: stats.recent, icon: FaCalendar, color: 'from-green-500 to-emerald-500' },
//           ].map((stat, index) => (
//             <div
//               key={index}
//               className="stats-card bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300"
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
//                   <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
//                 </div>
//                 <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
//                   <stat.icon className="text-white text-2xl" />
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Search and Filters */}
//         <div ref={searchBarRef} className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
//           <div className="flex flex-col md:flex-row gap-4 items-end">
//             {/* Search */}
//             <div className="flex-1 relative">
//               <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search patients by name or mobile..."
//                 className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
//               />
//             </div>

//             {/* Search Button */}
//             <button
//               onClick={handleSearch}
//               disabled={loading}
//               className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//             >
//               <FaSearch />
//               {loading ? 'Searching...' : 'Search'}
//             </button>

//             {/* Load All Button */}
//             <button
//               onClick={handleLoadAllPatients}
//               disabled={loading}
//               className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//             >
//               <FaUserInjured />
//               Load All Patients
//             </button>
//           </div>

//           {/* Additional Filters Row */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
//             {/* Filter by Gender */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 <FaFilter className="inline mr-2" />
//                 Filter by Gender
//               </label>
//               <select
//                 className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 value={filterGender}
//                 onChange={(e) => setFilterGender(e.target.value)}
//               >
//                 <option value="all">All Genders</option>
//                 <option value="male">Male</option>
//                 <option value="female">Female</option>
//                 <option value="other">Other</option>
//               </select>
//             </div>

//             {/* Sort Options */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 <FaSort className="inline mr-2" />
//                 Sort By
//               </label>
//               <select
//                 className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 value={sortBy}
//                 onChange={(e) => setSortBy(e.target.value)}
//               >
//                 <option value="name">Name (A-Z)</option>
//                 <option value="age">Age (High to Low)</option>
//                 <option value="recent">Recently Added</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Patient Count */}
//         <div className="flex items-center justify-between mb-6">
//           <h2 className="text-2xl font-bold text-gray-900">
//             Patients ({filteredAndSortedPatients.length})
//           </h2>
//           {searchTerm && (
//             <button
//               onClick={() => {
//                 setSearchTerm('');
//                 fetchPatients();
//               }}
//               className="text-sm text-blue-600 hover:text-blue-700"
//             >
//               Clear search
//             </button>
//           )}
//         </div>

//         {/* Debug Info */}
//         <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
//           <p>Showing {filteredAndSortedPatients.length} patients (Total in database: {patients.length})</p>
//           <p>Search term: "{searchTerm}" | Filter: {filterGender} | Sort: {sortBy}</p>
//         </div>

//         {/* Patients Grid */}
//         {filteredAndSortedPatients.length === 0 ? (
//           <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
//             <FaUserInjured className="text-6xl text-gray-300 mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-gray-700 mb-2">
//               {searchTerm ? `No patients found for "${searchTerm}"` : 'No patients found'}
//             </h3>
//             <p className="text-gray-600 mb-6">
//               {searchTerm ? 'Try a different search term or load all patients' : 'Start by adding your first patient'}
//             </p>
//             <div className="flex gap-4 justify-center">
//               <button
//                 onClick={handleLoadAllPatients}
//                 className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all duration-300"
//               >
//                 Load All Patients
//               </button>
//               <Link href="/doctor/patients/create">
//                 <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
//                   <FaPlus className="inline mr-2" />
//                   Add Patient
//                 </button>
//               </Link>
//             </div>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {filteredAndSortedPatients.map((patient, index) => (
//               <div
//                 key={patient._id}
//                 ref={el => patientCardsRef.current[index] = el}
//                 data-id={patient._id}
//                 className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer ${
//                   expandedPatient === patient._id ? 'ring-2 ring-blue-500' : ''
//                 }`}
//                 onClick={() => handlePatientClick(patient._id)}
//               >
//                 {/* Patient Header */}
//                 <div className="p-6">
//                   <div className="flex items-start justify-between mb-4">
//                     <div className="flex items-center gap-4">
//                       <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
//                         {patient.name ? patient.name.charAt(0) : '?'}
//                       </div>
//                       <div>
//                         <h3 className="text-xl font-bold text-gray-900">{patient.name || 'Unknown Name'}</h3>
//                         <p className="text-gray-600 text-sm">ID: {patient._id ? patient._id.slice(-6) : 'N/A'}</p>
//                       </div>
//                     </div>
//                     <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                       patient.gender?.toLowerCase() === 'male'
//                         ? 'bg-blue-100 text-blue-800'
//                         : patient.gender?.toLowerCase() === 'female'
//                         ? 'bg-pink-100 text-pink-800'
//                         : 'bg-gray-100 text-gray-800'
//                     }`}>
//                       {patient.gender?.toUpperCase() || 'OTHER'}
//                     </span>
//                   </div>

//                   {/* Quick Info */}
//                   <div className="grid grid-cols-2 gap-3 mb-4">
//                     <div className="flex items-center gap-2 text-gray-600">
//                       <FaBirthdayCake />
//                       <span className="font-medium">{patient.age || 'N/A'} years</span>
//                     </div>
//                     <div className="flex items-center gap-2 text-gray-600">
//                       <FaPhone />
//                       <span className="font-medium">{patient.mobile || 'N/A'}</span>
//                     </div>
//                   </div>

//                   {/* Expandable Content */}
//                   <div className="expand-content overflow-hidden">
//                     {expandedPatient === patient._id && (
//                       <div className="mt-4 pt-4 border-t border-gray-200">
//                         <div className="space-y-3">
//                           <div className="flex items-start gap-2">
//                             <FaHistory className="text-gray-400 mt-1" />
//                             <div>
//                               <p className="text-sm font-medium text-gray-700">Medical History</p>
//                               <p className="text-gray-600 text-sm">
//                                 {patient.medicalHistory || 'No medical history recorded'}
//                               </p>
//                             </div>
//                           </div>
                          
//                           {patient.address && (
//                             <div className="flex items-start gap-2">
//                               <FaRegHospital className="text-gray-400 mt-1" />
//                               <div>
//                                 <p className="text-sm font-medium text-gray-700">Address</p>
//                                 <p className="text-gray-600 text-sm">{patient.address}</p>
//                               </div>
//                             </div>
//                           )}
//                         </div>

//                         {/* Action Buttons */}
//                         <div className="flex gap-2 mt-6">
//                           <Link href={`/doctor/patients/${patient._id}`}>
//                             <button
//                               onClick={(e) => e.stopPropagation()}
//                               className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
//                             >
//                               <FaEdit />
//                               Edit
//                             </button>
//                           </Link>
                          
//                           <Link href={`/doctor/patients/${patient._id}/view`}>
//                             <button
//                               onClick={(e) => e.stopPropagation()}
//                               className="flex-1 px-4 py-2 bg-green-50 text-green-600 rounded-lg font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
//                             >
//                               <FaEye />
//                               View
//                             </button>
//                           </Link>
                          
//                           <button
//                             onClick={(e) => handleDeletePatient(patient._id, e)}
//                             className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
//                           >
//                             <FaTrash />
//                             Delete
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   {/* Expand/Collapse Button */}
//                   <div className="flex justify-between items-center mt-4">
//                     <span className="text-sm text-gray-500">
//                       Last updated: {new Date(patient.updatedAt || Date.now()).toLocaleDateString()}
//                     </span>
//                     <button
//                       className={`p-2 rounded-lg transition-colors ${
//                         expandedPatient === patient._id 
//                           ? 'bg-blue-100 text-blue-600' 
//                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                       }`}
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handlePatientClick(patient._id);
//                       }}
//                     >
//                       <FaArrowRight className={`transition-transform duration-300 ${
//                         expandedPatient === patient._id ? 'rotate-90' : ''
//                       }`} />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Footer */}
//         <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
//           <p>Showing {filteredAndSortedPatients.length} of {patients.length} patients</p>
//           <p className="mt-1">© {new Date().getFullYear()} MediCare Clinic. All rights reserved.</p>
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import {
  FaUserPlus,
  FaSearch,
  FaFilter,
  FaEdit,
  FaEye,
  FaTrash,
  FaUserInjured,
  FaPhone,
  FaCalendar,
  FaVenusMars,
  FaBirthdayCake,
  FaHistory,
  FaArrowRight,
  FaSort,
  FaPlus,
  FaRegHospital
} from 'react-icons/fa';

// Helper function to safely extract string ID from MongoDB ObjectId
const getPatientId = (patient) => {
  if (!patient || !patient._id) return null;
  
  if (typeof patient._id === 'string') return patient._id;
  
  if (typeof patient._id === 'object' && patient._id.toString) {
    return patient._id.toString();
  }
  
  if (typeof patient._id === 'object' && patient._id.$oid) {
    return patient._id.$oid;
  }
  
  return JSON.stringify(patient._id);
};

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [expandedPatient, setExpandedPatient] = useState(null);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  
  const containerRef = useRef(null);
  const patientCardsRef = useRef([]);
  const searchBarRef = useRef(null);

  // Initialize GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance animations with clear completion
      gsap.from('.page-title', {
        duration: 0.8,
        y: -30,
        opacity: 0,
        ease: 'power3.out'
      });

      gsap.from('.stats-card', {
        duration: 0.6,
        y: 40,
        opacity: 0,
        stagger: 0.1,
        delay: 0.2,
        ease: 'power3.out'
      });

      gsap.from(searchBarRef.current, {
        duration: 0.6,
        y: 20,
        opacity: 0,
        delay: 0.4,
        ease: 'power3.out'
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Animate patient cards when they're loaded
  useEffect(() => {
    // Clear any previous animations
    patientCardsRef.current.forEach(ref => {
      if (ref) {
        gsap.killTweensOf(ref);
        // Ensure full opacity
        gsap.set(ref, { opacity: 1, y: 0 });
      }
    });

    // Reset ref array
    patientCardsRef.current = [];
    
    // Reset animation state
    setAnimationCompleted(false);

    // Filter out null refs before animating
    const animateCards = () => {
      const validCards = patientCardsRef.current.filter(ref => ref !== null);
      
      if (validCards.length > 0) {
        gsap.fromTo(validCards,
          {
            y: 40,
            opacity: 0
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.08,
            delay: 0.1,
            ease: 'power3.out',
            onComplete: () => {
              // Ensure all cards have full opacity after animation
              validCards.forEach(card => {
                gsap.set(card, { opacity: 1 });
              });
              setAnimationCompleted(true);
            }
          }
        );
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(animateCards, 100);
    
    return () => {
      clearTimeout(timeoutId);
      // Clean up animations on unmount
      patientCardsRef.current.forEach(ref => {
        if (ref) {
          gsap.killTweensOf(ref);
        }
      });
    };
  }, [patients]); // Run when patients data changes

  // Load all patients on initial mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async (searchQuery = '') => {
    try {
      setLoading(true);
      setError('');

      const url = searchQuery.trim()
        ? `/api/medical/patients?q=${encodeURIComponent(searchQuery.trim())}`
        : '/api/medical/patients';

      const res = await fetch(url);
      const text = await res.text();
      
      try {
        const data = JSON.parse(text);

        if (res.ok) {
          const processedPatients = (data.patients || []).map(patient => {
            const processed = { ...patient };
            processed._id = getPatientId(patient);
            
            if (patient.createdBy) {
              processed.createdBy = typeof patient.createdBy === 'object' 
                ? (patient.createdBy.toString ? patient.createdBy.toString() : JSON.stringify(patient.createdBy))
                : patient.createdBy;
            }
            
            return processed;
          });
          
          setPatients(processedPatients);
        } else {
          setError(data.error || 'Failed to fetch patients');
        }
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        setError('Invalid response from server');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      fetchPatients(searchTerm);
    } else {
      fetchPatients();
    }
  };

  const handleLoadAllPatients = () => {
    fetchPatients();
    setSearchTerm('');
  };

  const handlePatientClick = (patientId) => {
    if (expandedPatient === patientId) {
      setExpandedPatient(null);
    } else {
      setExpandedPatient(patientId);
      
      const card = patientCardsRef.current.find(ref => ref !== null && ref.dataset?.id === patientId);
      if (card) {
        gsap.fromTo(card.querySelector('.expand-content'),
          { height: 0, opacity: 0 },
          { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
      }
    }
  };

  const handleDeletePatient = async (patientId, e) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/doctor/patients/${patientId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const card = patientCardsRef.current.find(ref => ref !== null && ref.dataset?.id === patientId);
        if (card) {
          gsap.to(card, {
            duration: 0.3,
            opacity: 0,
            x: -100,
            onComplete: () => {
              setPatients(prev => prev.filter(p => getPatientId(p) !== patientId));
            }
          });
        } else {
          setPatients(prev => prev.filter(p => getPatientId(p) !== patientId));
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete patient');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  // Filter and sort patients
  const filteredAndSortedPatients = patients
    .filter(patient => {
      if (!patient || !patient.name) return false;
      
      const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (patient.mobile && patient.mobile.includes(searchTerm));
      const matchesGender = filterGender === 'all' || 
                           (patient.gender && patient.gender.toLowerCase() === filterGender.toLowerCase());
      return matchesSearch && matchesGender;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'age':
          return (parseInt(b.age) || 0) - (parseInt(a.age) || 0);
        case 'recent':
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        default:
          return 0;
      }
    });

  // Calculate stats
  const stats = {
    total: patients.length,
    male: patients.filter(p => p.gender && p.gender.toLowerCase() === 'male').length,
    female: patients.filter(p => p.gender && p.gender.toLowerCase() === 'female').length,
    recent: patients.filter(p => {
      const created = p.createdAt ? new Date(p.createdAt) : new Date();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return created > weekAgo;
    }).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading patients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-xl mb-4">
            <p className="text-red-600 font-semibold">Error: {error}</p>
          </div>
          <button
            onClick={() => fetchPatients()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="page-title text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Patient Management
            </h1>
            <p className="text-gray-600">
              Manage all your patients' records and medical history
            </p>
          </div>
          
          <Link href="/doctor/patients/create">
            <button className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2">
              <FaUserPlus className="text-xl" />
              Add New Patient
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Patients', value: stats.total, icon: FaUserInjured, color: 'from-blue-500 to-cyan-500' },
            { label: 'Male Patients', value: stats.male, icon: FaVenusMars, color: 'from-blue-500 to-indigo-500' },
            { label: 'Female Patients', value: stats.female, icon: FaVenusMars, color: 'from-pink-500 to-rose-500' },
            { label: 'New This Week', value: stats.recent, icon: FaCalendar, color: 'from-green-500 to-emerald-500' },
          ].map((stat, index) => (
            <div
              key={index}
              className="stats-card bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="text-white text-2xl" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div ref={searchBarRef} className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients by name or mobile..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FaSearch />
              {loading ? 'Searching...' : 'Search'}
            </button>

            <button
              onClick={handleLoadAllPatients}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FaUserInjured />
              Load All Patients
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaFilter className="inline mr-2" />
                Filter by Gender
              </label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaSort className="inline mr-2" />
                Sort By
              </label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Name (A-Z)</option>
                <option value="age">Age (High to Low)</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patient Count */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Patients ({filteredAndSortedPatients.length})
          </h2>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                fetchPatients();
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Patients Grid */}
        {filteredAndSortedPatients.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
            <FaUserInjured className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? `No patients found for "${searchTerm}"` : 'No patients found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try a different search term or load all patients' : 'Start by adding your first patient'}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleLoadAllPatients}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all duration-300"
              >
                Load All Patients
              </button>
              <Link href="/doctor/patients/create">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
                  <FaPlus className="inline mr-2" />
                  Add Patient
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedPatients.map((patient, index) => {
              const patientId = getPatientId(patient);
              
              return (
                <div
                  key={patientId || index}
                  ref={el => {
                    if (el) {
                      patientCardsRef.current[index] = el;
                      // Ensure full opacity if animation is completed
                      if (animationCompleted) {
                        gsap.set(el, { opacity: 1 });
                      }
                    }
                  }}
                  data-id={patientId}
                  className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer ${
                    expandedPatient === patientId ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handlePatientClick(patientId)}
                  style={{ 
                    // Force opacity to 1 if animation completed
                    ...(animationCompleted ? { opacity: 1 } : {})
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                          {patient.name ? patient.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{patient.name || 'Unknown Name'}</h3>
                          <p className="text-gray-600 text-sm">ID: {patientId ? patientId.slice(-6) : 'N/A'}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        patient.gender?.toLowerCase() === 'male'
                          ? 'bg-blue-100 text-blue-800'
                          : patient.gender?.toLowerCase() === 'female'
                          ? 'bg-pink-100 text-pink-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {patient.gender?.toUpperCase() || 'OTHER'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaBirthdayCake />
                        <span className="font-medium">{patient.age || 'N/A'} years</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaPhone />
                        <span className="font-medium">{patient.mobile || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="expand-content overflow-hidden">
                      {expandedPatient === patientId && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <FaHistory className="text-gray-400 mt-1" />
                              <div>
                                <p className="text-sm font-medium text-gray-700">Medical History</p>
                                <p className="text-gray-600 text-sm">
                                  {patient.medicalHistory || 'No medical history recorded'}
                                </p>
                              </div>
                            </div>
                            
                            {patient.address && (
                              <div className="flex items-start gap-2">
                                <FaRegHospital className="text-gray-400 mt-1" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Address</p>
                                  <p className="text-gray-600 text-sm">{patient.address}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 mt-6">
                            <Link href={`/doctor/patients/${patientId}`}>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                              >
                                <FaEdit />
                                Edit
                              </button>
                            </Link>
                            
                            <Link href={`/doctor/patients/${patientId}`}>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 px-4 py-2 bg-green-50 text-green-600 rounded-lg font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                              >
                                <FaEye />
                                View
                              </button>
                            </Link>
                            
                            <button
                              onClick={(e) => handleDeletePatient(patientId, e)}
                              className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                            >
                              <FaTrash />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-500">
                        {patient.createdAt ? (
                          <>Created: {new Date(patient.createdAt).toLocaleDateString()}</>
                        ) : (
                          <>No date info</>
                        )}
                      </span>
                      <button
                        className={`p-2 rounded-lg transition-colors ${
                          expandedPatient === patientId 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePatientClick(patientId);
                        }}
                      >
                        <FaArrowRight className={`transition-transform duration-300 ${
                          expandedPatient === patientId ? 'rotate-90' : ''
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>Showing {filteredAndSortedPatients.length} of {patients.length} patients</p>
          <p className="mt-1">© {new Date().getFullYear()} MediCare Clinic. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
