// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';

// export default function Medicines() {
//   const [medicines, setMedicines] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     fetchMedicines();
//   }, []);

//   const fetchMedicines = async () => {
//     try {
//       const res = await fetch('/api/medical/medicines');
//       const data = await res.json();
//       if (res.ok) {
//         setMedicines(data.medicines);
//       } else {
//         setError(data.error || 'Failed to fetch medicines');
//       }
//     } catch (err) {
//       setError('Network error');
//     }
//     setLoading(false);
//   };

//   if (loading) return <div>Loading...</div>;
//   if (error) return <div>Error: {error}</div>;

//   return (
//     <div style={{ padding: '20px' }}>
//       <h1>Medicine Management</h1>
//       <Link href="/medical/medicines/add">
//         <button style={{ padding: '10px', marginBottom: '20px' }}>Add New Medicine</button>
//       </Link>
//       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//         <thead>
//           <tr style={{ borderBottom: '1px solid #ccc' }}>
//             <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
//             <th style={{ textAlign: 'left', padding: '10px' }}>Brand</th>
//             <th style={{ textAlign: 'left', padding: '10px' }}>Form</th>
//             <th style={{ textAlign: 'left', padding: '10px' }}>Strength</th>
//             <th style={{ textAlign: 'left', padding: '10px' }}>Unit</th>
//             <th style={{ textAlign: 'left', padding: '10px' }}>Category</th>
//             <th style={{ textAlign: 'left', padding: '10px' }}>Rx Required</th>
//           </tr>
//         </thead>
//         <tbody>
//           {medicines.map((medicine) => (
//             <tr key={medicine._id} style={{ borderBottom: '1px solid #eee' }}>
//               <td style={{ padding: '10px' }}>{medicine.name}</td>
//               <td style={{ padding: '10px' }}>{medicine.brandName}</td>
//               <td style={{ padding: '10px' }}>{medicine.dosageForm}</td>
//               <td style={{ padding: '10px' }}>{medicine.strength}</td>
//               <td style={{ padding: '10px' }}>{medicine.unit}</td>
//               <td style={{ padding: '10px' }}>{medicine.category}</td>
//               <td style={{ padding: '10px' }}>{medicine.prescriptionRequired ? 'Yes' : 'No'}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       {medicines.length === 0 && <p>No medicines found</p>}
//     </div>
//   );
// }


'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, prescription, non-prescription
  const [categoryFilter, setCategoryFilter] = useState('all');

  const tableRef = useRef(null);
  const cardsRef = useRef([]);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    // Animate table rows on data load
    if (!loading && tableRef.current) {
      const rows = tableRef.current.querySelectorAll('tbody tr');
      gsap.fromTo(rows,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.03,
          duration: 0.4,
          ease: "power2.out"
        }
      );
    }
  }, [loading, filteredMedicines]);

  useEffect(() => {
    // Animate search input on focus
    if (searchRef.current) {
      searchRef.current.addEventListener('focus', () => {
        gsap.to(searchRef.current, {
          scale: 1.02,
          duration: 0.2,
          ease: "power2.out"
        });
      });
      
      searchRef.current.addEventListener('blur', () => {
        gsap.to(searchRef.current, {
          scale: 1,
          duration: 0.2,
          ease: "power2.out"
        });
      });
    }
  }, []);

  useEffect(() => {
    filterMedicines();
  }, [medicines, searchTerm, filter, categoryFilter]);

  const fetchMedicines = async () => {
    try {
      const res = await fetch('/api/medical/medicines');
      const data = await res.json();
      if (res.ok) {
        setMedicines(data.medicines);
      } else {
        setError(data.error || 'Failed to fetch medicines');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const filterMedicines = () => {
    let filtered = [...medicines];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(medicine =>
        medicine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply prescription filter
    if (filter === 'prescription') {
      filtered = filtered.filter(medicine => medicine.prescriptionRequired);
    } else if (filter === 'non-prescription') {
      filtered = filtered.filter(medicine => !medicine.prescriptionRequired);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(medicine => medicine.category === categoryFilter);
    }

    setFilteredMedicines(filtered);
  };

  const getCategories = () => {
    const categories = [...new Set(medicines.map(m => m.category).filter(Boolean))];
    return categories;
  };

  const getStatusBadgeColor = (requiresPrescription) => {
    return requiresPrescription ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  };

  const getStatusText = (requiresPrescription) => {
    return requiresPrescription ? 'Rx Required' : 'OTC';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Antibiotic': 'bg-blue-100 text-blue-800',
      'Analgesic': 'bg-purple-100 text-purple-800',
      'Antihypertensive': 'bg-green-100 text-green-800',
      'Antidiabetic': 'bg-yellow-100 text-yellow-800',
      'Respiratory': 'bg-indigo-100 text-indigo-800',
      'Cardiovascular': 'bg-pink-100 text-pink-800',
      'Gastrointestinal': 'bg-orange-100 text-orange-800',
      'Dermatological': 'bg-teal-100 text-teal-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Loading medicines database...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
        <div className="text-6xl text-red-500 mb-4 text-center">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Error Loading Medicines</h2>
        <p className="text-gray-600 mb-6 text-center">{error}</p>
        <button
          onClick={fetchMedicines}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-4xl">💊</span>
              Medicine Management
            </h1>
            <p className="text-gray-600 mt-2">Manage your medicine database and inventory</p>
          </div>
          <Link href="/medical/medicines/add">
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2">
              <span className="text-xl">➕</span>
              Add New Medicine
            </button>
          </Link>
        </div>

        {/* Medicine Management Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            Medicine Management Actions:
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link href="/medical/medicines/add">
              <button className="w-full p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all duration-200 hover:shadow-md hover:transform hover:scale-105 flex flex-col items-center gap-2">
                <span className="text-3xl">➕</span>
                <span className="text-sm font-semibold text-blue-700">Add Medicine</span>
              </button>
            </Link>

            <button className="w-full p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all duration-200 hover:shadow-md hover:transform hover:scale-105 flex flex-col items-center gap-2">
              <span className="text-3xl">🔍</span>
              <span className="text-sm font-semibold text-gray-700">Search Medicines</span>
            </button>

            <Link href="/medical/inventory">
              <button className="w-full p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all duration-200 hover:shadow-md hover:transform hover:scale-105 flex flex-col items-center gap-2">
                <span className="text-3xl">📦</span>
                <span className="text-sm font-semibold text-purple-700">Check Inventory</span>
              </button>
            </Link>

            <Link href="/medical/inventory?filter=lowStock">
              <button className="w-full p-4 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-xl transition-all duration-200 hover:shadow-md hover:transform hover:scale-105 flex flex-col items-center gap-2">
                <span className="text-3xl">⚠️</span>
                <span className="text-sm font-semibold text-yellow-700">Low Stock</span>
              </button>
            </Link>

            <Link href="/medical/purchases/add">
              <button className="w-full p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-all duration-200 hover:shadow-md hover:transform hover:scale-105 flex flex-col items-center gap-2">
                <span className="text-3xl">🛒</span>
                <span className="text-sm font-semibold text-green-700">Purchase Stock</span>
              </button>
            </Link>

            <Link href="/medical/expiry">
              <button className="w-full p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all duration-200 hover:shadow-md hover:transform hover:scale-105 flex flex-col items-center gap-2">
                <span className="text-3xl">💀</span>
                <span className="text-sm font-semibold text-red-700">Expired Medicines</span>
              </button>
            </Link>
          </div>
          <p className="text-gray-500 text-sm mt-4 text-center">
            💡 Click any button above to perform medicine management tasks!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div 
            ref={el => cardsRef.current[0] = el}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover-lift"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Medicines</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{medicines.length}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💊</span>
              </div>
            </div>
          </div>

          <div 
            ref={el => cardsRef.current[1] = el}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover-lift"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Prescription Only</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">
                  {medicines.filter(m => m.prescriptionRequired).length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </div>

          <div 
            ref={el => cardsRef.current[2] = el}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover-lift"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Over-the-Counter</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">
                  {medicines.filter(m => !m.prescriptionRequired).length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
            </div>
          </div>

          <div 
            ref={el => cardsRef.current[3] = el}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover-lift"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Categories</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{getCategories().length}</h3>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏷️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-xl">🔍</span>
                Search Medicines
              </label>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search by name, brand, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Prescription Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-xl">📋</span>
                Prescription Filter
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
                  onClick={() => setFilter('prescription')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 ${
                    filter === 'prescription'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Rx Only
                </button>
                <button
                  onClick={() => setFilter('non-prescription')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 ${
                    filter === 'non-prescription'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  OTC
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-xl">🏷️</span>
                Category Filter
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Categories</option>
                {getCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Medicine Database
              <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full">
                {filteredMedicines.length} items
              </span>
            </h2>
            <div className="text-gray-600 text-sm">
              Showing {filteredMedicines.length} of {medicines.length} medicines
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table ref={tableRef} className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Medicine Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Form & Strength
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Prescription
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Unit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredMedicines.map((medicine) => (
                <tr 
                  key={medicine._id}
                  className="hover:bg-blue-50 transition-colors duration-150"
                >
                  {/* Medicine Details */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">💊</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{medicine.name}</div>
                        <div className="text-sm text-gray-500">{medicine.brandName}</div>
                        {medicine.description && (
                          <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {medicine.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Form & Strength */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                        {medicine.dosageForm}
                      </span>
                      <div className="font-semibold text-gray-900">{medicine.strength}</div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor(medicine.category)}`}>
                      {medicine.category || 'Uncategorized'}
                    </span>
                  </td>

                  {/* Prescription Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(medicine.prescriptionRequired)}`}>
                      {medicine.prescriptionRequired ? '📝 Rx Required' : '🛒 OTC'}
                    </span>
                  </td>

                  {/* Unit */}
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{medicine.unit}</div>
                    <div className="text-xs text-gray-500">
                      Packaging: {medicine.packaging || 'Standard'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMedicines.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No medicines found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                  setCategoryFilter('all');
                  // Animate reset
                  gsap.to('.filter-button', {
                    backgroundColor: '#f3f4f6',
                    duration: 0.3
                  });
                }}
                className="px-6 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-all duration-200"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Table Footer */}
        {filteredMedicines.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{filteredMedicines.length}</span> medicines listed
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
                >
                  <span>⬆️</span>
                  Back to Top
                </button>
                <Link href="/medical/medicines/add">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2">
                    <span>➕</span>
                    Add Another
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      {getCategories().length > 0 && (
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Medicine Categories Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {getCategories().map(category => {
              const count = medicines.filter(m => m.category === category).length;
              return (
                <div
                  key={category}
                  className="p-3 border border-gray-200 rounded-xl hover:border-blue-300 transition-all duration-200"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm truncate">{category}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(count / medicines.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
