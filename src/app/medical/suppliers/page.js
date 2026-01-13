'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const suppliersRef = useRef([]);
  const statsRef = useRef([]);
  const modalRef = useRef(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    // Animate suppliers on load
    if (!loading && suppliersRef.current.length > 0) {
      gsap.fromTo(suppliersRef.current,
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
  }, [loading, suppliers]);

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
  }, [suppliers]);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/medical/suppliers');
      const data = await res.json();
      if (res.ok) {
        setSuppliers(data.suppliers);
      } else {
        setError(data.error || 'Failed to fetch suppliers');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  // Filter and search suppliers
  const filteredSuppliers = suppliers.filter(supplier => {
    // Debug: Check if supplier has the expected fields
    if (!supplier || typeof supplier !== 'object') {
      console.warn('Invalid supplier object:', supplier);
      return false;
    }

    // Ensure search term is trimmed and converted to lowercase
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch = search === '' ||
      (supplier.name && supplier.name.toLowerCase().includes(search)) ||
      (supplier.companyName && supplier.companyName.toLowerCase().includes(search)) ||
      (supplier.email && supplier.email.toLowerCase().includes(search)) ||
      (supplier.mobile && supplier.mobile.includes(search));

    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && supplier.isActive !== false) ||
      (filter === 'inactive' && supplier.isActive === false);

    return matchesSearch && matchesFilter;
  });

  // Calculate statistics
  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.isActive !== false).length,
    inactive: suppliers.filter(s => s.isActive === false).length,
    withEmail: suppliers.filter(s => s.email).length,
    withAddress: suppliers.filter(s => s.address).length,
  };

  const openQuickView = (supplier) => {
    setSelectedSupplier(supplier);
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
        onComplete: () => setSelectedSupplier(null)
      });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-hospital-blue-light to-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-hospital-blue mx-auto mb-4"></div>
        <p className="text-hospital-gray-dark text-lg">Loading suppliers database...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-b from-hospital-blue-light to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md border border-hospital-blue-light">
        <div className="text-6xl text-hospital-danger mb-4 text-center">⚠️</div>
        <h2 className="text-2xl font-bold text-hospital-gray-dark mb-2 text-center">Error Loading Suppliers</h2>
        <p className="text-hospital-gray mb-6 text-center">{error}</p>
        <button
          onClick={fetchSuppliers}
          className="w-full px-6 py-3 bg-hospital-blue hover:bg-hospital-blue-dark text-white font-semibold rounded-xl transition-all duration-200"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b to-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-hospital-gray-dark flex items-center gap-3">
              <span className="text-4xl text-hospital-blue">🏭</span>
              Supplier Management
            </h1>
            <p className="text-hospital-gray mt-2">Manage your pharmaceutical suppliers and vendors</p>
          </div>
          <Link href="/medical/suppliers/add">
            <button className="px-6 py-3 bg-hospital-blue hover:bg-hospital-blue-dark text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2">
              <span className="text-xl">➕</span>
              Add New Supplier
            </button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div 
            ref={el => statsRef.current[0] = el}
            className="bg-white rounded-2xl shadow-lg p-6 border border-hospital-blue-light"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-hospital-gray text-sm">Total Suppliers</p>
                <h3 className="text-3xl font-bold text-hospital-gray-dark mt-1">{stats.total}</h3>
              </div>
              <div className="w-12 h-12 bg-hospital-blue-light rounded-xl flex items-center justify-center">
                <span className="text-2xl text-hospital-blue">🏭</span>
              </div>
            </div>
          </div>

          <div 
            ref={el => statsRef.current[1] = el}
            className="bg-white rounded-2xl shadow-lg p-6 border border-hospital-blue-light"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-hospital-gray text-sm">Active</p>
                <h3 className="text-3xl font-bold text-hospital-gray-dark mt-1">{stats.active}</h3>
              </div>
              <div className="w-12 h-12 bg-hospital-success-light rounded-xl flex items-center justify-center">
                <span className="text-2xl text-hospital-success">✅</span>
              </div>
            </div>
          </div>

          <div 
            ref={el => statsRef.current[2] = el}
            className="bg-white rounded-2xl shadow-lg p-6 border border-hospital-blue-light"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-hospital-gray text-sm">Inactive</p>
                <h3 className="text-3xl font-bold text-hospital-gray-dark mt-1">{stats.inactive}</h3>
              </div>
              <div className="w-12 h-12 bg-hospital-warning-light rounded-xl flex items-center justify-center">
                <span className="text-2xl text-hospital-warning">⏸️</span>
              </div>
            </div>
          </div>

          <div 
            ref={el => statsRef.current[3] = el}
            className="bg-white rounded-2xl shadow-lg p-6 border border-hospital-blue-light"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-hospital-gray text-sm">With Email</p>
                <h3 className="text-3xl font-bold text-hospital-gray-dark mt-1">{stats.withEmail}</h3>
              </div>
              <div className="w-12 h-12 bg-hospital-blue-light rounded-xl flex items-center justify-center">
                <span className="text-2xl text-hospital-blue">✉️</span>
              </div>
            </div>
          </div>

          <div 
            ref={el => statsRef.current[4] = el}
            className="bg-white rounded-2xl shadow-lg p-6 border border-hospital-blue-light"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-hospital-gray text-sm">With Address</p>
                <h3 className="text-3xl font-bold text-hospital-gray-dark mt-1">{stats.withAddress}</h3>
              </div>
              <div className="w-12 h-12 bg-hospital-blue-light rounded-xl flex items-center justify-center">
                <span className="text-2xl text-hospital-blue">🏠</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-2xl shadow-lg border border-hospital-blue-light p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-hospital-gray-dark mb-2 flex items-center gap-2">
                <span className="text-xl text-hospital-blue">🔍</span>
                Search Suppliers
              </label>
              <input
                type="text"
                placeholder="Search by name, company, email, or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-hospital-blue-light rounded-xl focus:ring-2 focus:ring-hospital-blue focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-hospital-gray-dark mb-2 flex items-center gap-2">
                <span className="text-xl text-hospital-blue">📊</span>
                Filter by Status
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 ${
                    filter === 'all'
                      ? 'bg-hospital-blue text-white shadow-md'
                      : 'bg-hospital-blue-light text-hospital-gray-dark hover:bg-hospital-blue/10'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 ${
                    filter === 'active'
                      ? 'bg-hospital-success text-white shadow-md'
                      : 'bg-hospital-success-light text-hospital-gray-dark hover:bg-hospital-success/10'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilter('inactive')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 ${
                    filter === 'inactive'
                      ? 'bg-hospital-warning text-white shadow-md'
                      : 'bg-hospital-warning-light text-hospital-gray-dark hover:bg-hospital-warning/10'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div>
              <label className="block text-sm font-semibold text-hospital-gray-dark mb-2 flex items-center gap-2">
                <span className="text-xl text-hospital-blue">📋</span>
                Showing Results
              </label>
              <div className="flex items-center justify-between px-4 py-3 bg-hospital-blue-light rounded-xl">
                <span className="font-medium text-hospital-gray-dark">
                  {filteredSuppliers.length} suppliers
                </span>
                <span className="text-sm text-hospital-gray">
                  of {suppliers.length} total
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-hospital-blue-light overflow-hidden">
        <div className="p-6 border-b border-hospital-blue-light bg-hospital-blue-light">
          <h2 className="text-xl font-bold text-hospital-gray-dark flex items-center gap-2">
            <span className="text-2xl text-hospital-blue">📋</span>
            Supplier Database
            <span className="ml-2 px-3 py-1 bg-hospital-blue text-white text-sm font-semibold rounded-full">
              {filteredSuppliers.length} suppliers
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-hospital-blue-light">
            <thead className="bg-hospital-blue-light/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-hospital-gray-dark uppercase tracking-wider">
                  Supplier Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-hospital-gray-dark uppercase tracking-wider">
                  Company Information
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-hospital-gray-dark uppercase tracking-wider">
                  Contact Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-hospital-gray-dark uppercase tracking-wider">
                  Status & Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-hospital-blue-light">
              {filteredSuppliers.map((supplier, index) => (
                <tr 
                  key={supplier._id}
                  ref={el => suppliersRef.current[index] = el}
                  className="hover:bg-hospital-blue-light/10 transition-colors duration-150"
                >
                  {/* Supplier Details */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                        supplier.isActive === false ? 'bg-hospital-warning-light' : 'bg-hospital-blue-light'
                      }`}>
                        <span className={`text-xl ${
                          supplier.isActive === false ? 'text-hospital-warning' : 'text-hospital-blue'
                        }`}>
                          🏭
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-hospital-gray-dark">{supplier.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            supplier.isActive === false 
                              ? 'bg-hospital-warning-light text-hospital-warning' 
                              : 'bg-hospital-success-light text-hospital-success'
                          }`}>
                            {supplier.isActive === false ? 'Inactive' : 'Active'}
                          </span>
                          {supplier.type && (
                            <span className="px-2 py-1 bg-hospital-blue-light text-hospital-blue text-xs font-medium rounded-full">
                              {supplier.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Company Information */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="font-medium text-hospital-gray-dark">{supplier.companyName}</div>
                      {supplier.gstNumber && (
                        <div className="text-sm text-hospital-gray flex items-center gap-1">
                          <span>GST:</span>
                          <code className="bg-hospital-blue-light px-2 py-1 rounded text-hospital-blue font-medium">
                            {supplier.gstNumber}
                          </code>
                        </div>
                      )}
                      {supplier.drugLicense && (
                        <div className="text-sm text-hospital-gray flex items-center gap-1">
                          <span>License:</span>
                          <span className="font-medium">{supplier.drugLicense}</span>
                        </div>
                      )}
                      {supplier.specialization && (
                        <div className="text-sm text-hospital-gray mt-2 line-clamp-2">
                          {supplier.specialization}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Contact Details */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-hospital-gray">📱</span>
                        <span className="font-medium text-hospital-gray-dark">{supplier.mobile}</span>
                      </div>
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-hospital-gray">✉️</span>
                          <a 
                            href={`mailto:${supplier.email}`}
                            className="text-hospital-blue hover:text-hospital-blue-dark hover:underline transition-colors duration-200"
                          >
                            {supplier.email}
                          </a>
                        </div>
                      )}
                      {supplier.altMobile && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-hospital-gray">📞</span>
                          <span className="text-hospital-gray">{supplier.altMobile}</span>
                        </div>
                      )}
                      {supplier.address && (
                        <div className="flex items-start gap-2 text-sm mt-2">
                          <span className="text-hospital-gray mt-1">🏠</span>
                          <span className="text-hospital-gray line-clamp-2">{supplier.address}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status & Actions */}
                  <td className="px-6 py-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-hospital-gray">Status:</span>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          supplier.isActive === false 
                            ? 'bg-hospital-warning-light text-hospital-warning' 
                            : 'bg-hospital-success-light text-hospital-success'
                        }`}>
                          {supplier.isActive === false ? 'Inactive' : 'Active'}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => openQuickView(supplier)}
                          className="w-full px-4 py-2 bg-hospital-blue-light hover:bg-hospital-blue/20 text-hospital-blue font-medium rounded-lg transition-all duration-200 border border-hospital-blue/30 flex items-center justify-center gap-2"
                        >
                          <span>👁️</span>
                          View Details
                        </button>
                        <Link href={`/medical/suppliers/${supplier._id}`} className="w-full">
                          <button className="w-full px-4 py-2 bg-hospital-blue hover:bg-hospital-blue-dark text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                            <span>✏️</span>
                            Edit Supplier
                          </button>
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4 text-hospital-gray">🏭</div>
              <h3 className="text-xl font-semibold text-hospital-gray-dark mb-2">No Suppliers Found</h3>
              <p className="text-hospital-gray mb-6">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No suppliers in the database'}
              </p>
              {(searchTerm || filter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilter('all');
                  }}
                  className="px-6 py-2 bg-hospital-blue hover:bg-hospital-blue-dark text-white font-medium rounded-lg transition-all duration-200"
                >
                  Clear Filters
                </button>
              )}
              {!searchTerm && filter === 'all' && (
                <Link href="/medical/suppliers/add">
                  <button className="px-6 py-2 bg-hospital-blue hover:bg-hospital-blue-dark text-white font-medium rounded-lg transition-all duration-200">
                    Add First Supplier
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-hospital-blue to-hospital-blue-dark p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="text-3xl">🏭</span>
                  Supplier Profile
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
                {/* Contact Information */}
                <div className="bg-hospital-blue-light p-4 rounded-xl border border-hospital-blue-light">
                  <h4 className="text-lg font-semibold text-hospital-gray-dark mb-3 flex items-center gap-2">
                    <span className="text-xl">👤</span>
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-hospital-gray">Name:</span>
                      <span className="font-semibold text-hospital-gray-dark">{selectedSupplier.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hospital-gray">Mobile:</span>
                      <span className="font-semibold text-hospital-gray-dark">{selectedSupplier.mobile}</span>
                    </div>
                    {selectedSupplier.altMobile && (
                      <div className="flex justify-between">
                        <span className="text-hospital-gray">Alt Mobile:</span>
                        <span className="font-semibold text-hospital-gray-dark">{selectedSupplier.altMobile}</span>
                      </div>
                    )}
                    {selectedSupplier.email && (
                      <div className="flex justify-between">
                        <span className="text-hospital-gray">Email:</span>
                        <a 
                          href={`mailto:${selectedSupplier.email}`}
                          className="font-semibold text-hospital-blue hover:text-hospital-blue-dark hover:underline"
                        >
                          {selectedSupplier.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Information */}
                <div className="bg-hospital-blue-light p-4 rounded-xl border border-hospital-blue-light">
                  <h4 className="text-lg font-semibold text-hospital-gray-dark mb-3 flex items-center gap-2">
                    <span className="text-xl">🏢</span>
                    Company Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-hospital-gray">Company:</span>
                      <span className="font-semibold text-hospital-gray-dark">{selectedSupplier.companyName}</span>
                    </div>
                    {selectedSupplier.gstNumber && (
                      <div className="flex justify-between">
                        <span className="text-hospital-gray">GST Number:</span>
                        <code className="font-semibold text-hospital-blue bg-hospital-blue-light px-2 py-1 rounded">
                          {selectedSupplier.gstNumber}
                        </code>
                      </div>
                    )}
                    {selectedSupplier.drugLicense && (
                      <div className="flex justify-between">
                        <span className="text-hospital-gray">Drug License:</span>
                        <span className="font-semibold text-hospital-gray-dark">{selectedSupplier.drugLicense}</span>
                      </div>
                    )}
                    {selectedSupplier.type && (
                      <div className="flex justify-between">
                        <span className="text-hospital-gray">Supplier Type:</span>
                        <span className="font-semibold text-hospital-gray-dark">{selectedSupplier.type}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                {selectedSupplier.address && (
                  <div className="bg-hospital-blue-light p-4 rounded-xl border border-hospital-blue-light">
                    <h4 className="text-lg font-semibold text-hospital-gray-dark mb-2 flex items-center gap-2">
                      <span className="text-xl">🏠</span>
                      Address
                    </h4>
                    <p className="text-hospital-gray">{selectedSupplier.address}</p>
                  </div>
                )}

                {selectedSupplier.specialization && (
                  <div className="bg-hospital-blue-light p-4 rounded-xl border border-hospital-blue-light">
                    <h4 className="text-lg font-semibold text-hospital-gray-dark mb-2 flex items-center gap-2">
                      <span className="text-xl">🎯</span>
                      Specialization
                    </h4>
                    <p className="text-hospital-gray">{selectedSupplier.specialization}</p>
                  </div>
                )}

                {selectedSupplier.notes && (
                  <div className="bg-hospital-blue-light p-4 rounded-xl border border-hospital-blue-light">
                    <h4 className="text-lg font-semibold text-hospital-gray-dark mb-2 flex items-center gap-2">
                      <span className="text-xl">📝</span>
                      Additional Notes
                    </h4>
                    <p className="text-hospital-gray">{selectedSupplier.notes}</p>
                  </div>
                )}
              </div>

              {/* Status & Action Buttons */}
              <div className="mt-6 p-4 bg-hospital-blue-light rounded-xl border border-hospital-blue-light">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedSupplier.isActive === false ? 'bg-hospital-warning' : 'bg-hospital-success'
                    }`}></div>
                    <div>
                      <span className="font-semibold text-hospital-gray-dark">Current Status:</span>
                      <span className={`ml-2 font-bold ${
                        selectedSupplier.isActive === false ? 'text-hospital-warning' : 'text-hospital-success'
                      }`}>
                        {selectedSupplier.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-hospital-gray">
                    Last Updated: {new Date(selectedSupplier.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link href={`/medical/suppliers/${selectedSupplier._id}`} className="flex-1">
                    <button className="w-full px-6 py-3 bg-hospital-blue hover:bg-hospital-blue-dark text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2">
                      <span>✏️</span>
                      Edit Supplier
                    </button>
                  </Link>
                  <Link href={`/medical/purchases/add?supplier=${selectedSupplier._id}`} className="flex-1">
                    <button className="w-full px-6 py-3 bg-hospital-success hover:bg-hospital-success-dark text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2">
                      <span>🛒</span>
                      Place Order
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
