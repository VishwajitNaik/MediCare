'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import gsap from 'gsap';
import SubscriptionPopup from '../../Components/SubscriptionPopup';

export default function MedicalDashboard() {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [patients, setPatients] = useState([]);
  const [reorderDrafts, setReorderDrafts] = useState([]);
  const [sales, setSales] = useState([]);
  const [dailyAccounting, setDailyAccounting] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionPopupOpen, setSubscriptionPopupOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [nearExpiryItems, setNearExpiryItems] = useState([]);
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  const drawerRef = useRef(null);
  const mainContentRef = useRef(null);
  const cardsRef = useRef([]);

  // CSV generation functions
  const generateLowStockCSV = () => {
    const lowStockItems = inventory.filter(item => item.isLowStock);
    const csvContent = [
      ['Medicine Name', 'Brand Name', 'Current Stock', 'Supplier', 'Price'],
      ...lowStockItems.map(item => [
        item.medicineId?.name || 'Unknown',
        item.medicineId?.brandName || 'Unknown',
        item.availableStock || 0,
        item.supplierId?.name || 'Unknown',
        item.sellingPrice || 0
      ])
    ];

    const csvString = csvContent.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'low_stock_inventory.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCsvModalOpen(false);
  };

  const generateExpiryCSV = () => {
    const expiredItems = inventory.filter(item => item.isExpired);
    const csvContent = [
      ['Medicine Name', 'Brand Name', 'Current Stock', 'Expiry Date', 'Supplier'],
      ...expiredItems.map(item => [
        item.medicineId?.name || 'Unknown',
        item.medicineId?.brandName || 'Unknown',
        item.availableStock || 0,
        item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'Unknown',
        item.supplierId?.name || 'Unknown'
      ])
    ];

    const csvString = csvContent.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'expired_inventory.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCsvModalOpen(false);
  };

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/medical/profile');
        if (!response.ok) {
          // Not authenticated as medical user, redirect to medical signin
          window.location.href = '/medical/signin';
          return;
        }
      } catch (error) {
        // Authentication failed, redirect to medical signin
        window.location.href = '/medical/signin';
        return;
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchTopSelling();
    fetchPurchases();
    fetchSales();
    fetchPatients();
    fetchReorderDrafts();
    checkScreenSize();
    checkSubscriptionStatus();

    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm, filterType]);

  useEffect(() => {
    // Animate cards on data load
    if (!loading && cardsRef.current.length > 0) {
      gsap.fromTo(cardsRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.6,
          ease: "power3.out"
        }
      );
    }
  }, [loading]);

  const checkScreenSize = () => {
    setDrawerOpen(window.innerWidth >= 768);
  };

  const animateDrawer = (open) => {
    if (drawerRef.current && mainContentRef.current) {
      if (open) {
        gsap.to(drawerRef.current, {
          width: 280,
          duration: 0.3,
          ease: "power2.out"
        });
        gsap.to(mainContentRef.current, {
          marginLeft: 280,
          duration: 0.3,
          ease: "power2.out"
        });
      } else {
        gsap.to(drawerRef.current, {
          width: 0,
          duration: 0.3,
          ease: "power2.in"
        });
        gsap.to(mainContentRef.current, {
          marginLeft: 0,
          duration: 0.3,
          ease: "power2.in"
        });
      }
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/medical/inventory/list');
      const data = await res.json();
      if (res.ok) {
        setInventory(data.inventory || []);
      } else {
        setError(data.error || 'Failed to load inventory');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const fetchTopSelling = async () => {
    try {
      const res = await fetch('/api/medical/dashboard/top-selling');
      const data = await res.json();
      if (res.ok) {
        setTopSelling(data.topSelling || []);
      }
    } catch (err) {
      console.error('Failed to fetch top selling:', err);
    }
  };

  const fetchPurchases = async () => {
    try {
      const res = await fetch('/api/medical/purchases/list');
      const data = await res.json();
      if (res.ok) {
        setPurchases(data.purchases || []);
        calculateDailyAccounting(data.purchases || []);
      }
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await fetch('/api/medical/sales/list');
      const data = await res.json();
      if (res.ok) {
        setSales(data.sales || []);
        calculateDailyAccounting(purchases, data.sales || []);
      }
    } catch (err) {
      console.error('Failed to fetch sales:', err);
    }
  };

  const calculateDailyAccounting = (purchasesData = purchases, salesData = sales) => {
    // Group by date
    const accountingMap = new Map();

    // Process purchases
    purchasesData.forEach(purchase => {
      const date = new Date(purchase.createdAt).toDateString();
      if (!accountingMap.has(date)) {
        accountingMap.set(date, {
          date,
          purchases: 0,
          sales: 0,
          cogs: 0,
          profit: 0
        });
      }
      accountingMap.get(date).purchases += purchase.totalAmount || 0;
    });

    // Process sales
    salesData.forEach(sale => {
      const date = new Date(sale.saleDate).toDateString();
      if (!accountingMap.has(date)) {
        accountingMap.set(date, {
          date,
          purchases: 0,
          sales: 0,
          cogs: 0,
          profit: 0
        });
      }
      const dayData = accountingMap.get(date);
      dayData.sales += sale.totalAmount || 0;

      // Calculate COGS from sale items
      sale.items?.forEach(item => {
        dayData.cogs += (item.purchasePrice || 0) * (item.quantity || 0);
      });

      dayData.profit = dayData.sales - dayData.cogs;
    });

    // Convert to array and sort by date (newest first)
    const accountingArray = Array.from(accountingMap.values())
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 7); // Last 7 days

    setDailyAccounting(accountingArray);
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/common/patients');
      const data = await res.json();
      if (res.ok) {
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  };

  const fetchReorderDrafts = async () => {
    try {
      const res = await fetch('/api/medical/reorders/list');
      const data = await res.json();
      if (res.ok) {
        setReorderDrafts(data.reorderDrafts || []);
      }
    } catch (err) {
      console.error('Failed to fetch reorder drafts:', err);
    }
    setLoading(false);
  };

  const checkSubscriptionStatus = async () => {
    try {
      const res = await fetch('/api/subscription/status');
      const data = await res.json();
      console.log('Subscription status response:', data); // Debug log

      if (res.status === 401 || data.error === 'Unauthorized') {
        // User is not authenticated, redirect to login
        console.log('User not authenticated, redirecting to login');
        window.location.href = '/auth/medical/signin';
        return;
      }

      if (data.success) {
        setSubscriptionStatus(data.subscription);
        setUser(data.user);

        // Show subscription popup if not active
        if (!data.subscription.isActive) {
          setSubscriptionPopupOpen(true);
        }
      } else {
        console.error('Subscription status failed:', data.error);
        // If it's an auth error, redirect to login
        if (data.code === 'authentication_error' || data.type === 'authentication_error') {
          window.location.href = '/auth/medical/signin';
        }
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      // On network errors, also redirect to login as a safety measure
      window.location.href = '/auth/medical/signin';
    }
  };

  const filterInventory = () => {
    let filtered = [...inventory];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.medicineId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.medicineId?.brandName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (filterType) {
      case 'lowStock':
        filtered = filtered.filter(item => item.isLowStock);
        break;
      case 'expired':
        filtered = filtered.filter(item => item.isExpired);
        break;
      default:
        break;
    }

    setFilteredInventory(filtered);
  };

  const chartData = inventory.slice(0, 10).map(item => ({
    name: item.medicineId?.name?.substring(0, 15) + '...' || 'Unknown',
    stock: item.availableStock,
    value: item.availableStock * (item.sellingPrice || 0)
  }));

  const statusChartData = [
    { name: 'In Stock', value: inventory.filter(item => !item.isExpired && !item.isLowStock).length, color: '#10b981' },
    { name: 'Low Stock', value: inventory.filter(item => item.isLowStock && !item.isExpired).length, color: '#f59e0b' },
    { name: 'Expired', value: inventory.filter(item => item.isExpired).length, color: '#ef4444' }
  ];

  const navigationItems = [
    { href: '/medical/patients', icon: '👥', label: 'Patient Service' },
    { href: '/medical/inventory', icon: '📦', label: 'Manage Inventory' },
    { href: '/medical/prescriptions', icon: '📋', label: 'Manage Prescriptions' },
    { href: '/medical/manage-patients', icon: '📝', label: 'Manage Patients' },
    { href: '/medical/medicines', icon: '💊', label: 'Manage Medicines' },
    { href: '/medical/suppliers', icon: '🏭', label: 'Manage Suppliers' },
    { href: '/medical/purchases/add', icon: '🛒', label: 'Record Purchases' },
    { href: '/medical/records', icon: '📊', label: 'Create Records' },
    { href: '/medical/expiry', icon: '⏰', label: 'Expiry Management' },
    { href: '/medical/reorders', icon: '🔄', label: 'Reorder Drafts' },
    { href: '/api/auth/logout', icon: '🚪', label: 'Logout', color: 'text-red-600 hover:text-red-700' }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed left-0 top-0 bottom-0 z-50 mt-20 overflow-hidden"
        style={{ width: drawerOpen ? '280px' : '0' }}
      >
        <div className="h-full bg-white border-r border-gray-200 shadow-lg overflow-y-auto">
          <div className="p-6 h-full">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-3xl">🏥</span>
                Medical Store
              </h2>
              <nav>
                <ul className="space-y-1">
                  {navigationItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm ${
                          item.color || 'text-gray-700'
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        ref={mainContentRef}
        className="flex-1 transition-all duration-300 min-h-screen"
        style={{ marginLeft: drawerOpen ? '280px' : '0' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white shadow-md border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setDrawerOpen(!drawerOpen);
                  animateDrawer(!drawerOpen);
                }}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
              >
                <span className="text-xl">☰</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-3xl">📦</span>
                Inventory Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPatientModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <span>👤</span>
                Quick Serve Medicine
              </button>
              <div className="text-lg font-semibold text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
                Total Items: <span className="text-blue-600">{inventory.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Controls */}
          <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search medicines by name or brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl">
                  🔍
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                📋 All ({inventory.length})
              </button>
              <button
                onClick={() => setFilterType('lowStock')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filterType === 'lowStock'
                    ? 'bg-yellow-500 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                📉 Low Stock ({inventory.filter(item => item.isLowStock).length})
              </button>
              <button
                onClick={() => setFilterType('expired')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filterType === 'expired'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                🚨 Expired ({inventory.filter(item => item.isExpired).length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              Error: {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Inventory List & Reorders */}
              <div className="lg:col-span-2 space-y-6">
                {/* Inventory Summary Card */}
                <div
                  ref={el => cardsRef.current[0] = el}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform transition-all duration-300 hover:shadow-xl"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <span className="text-2xl">💊</span>
                      Available Medicines
                      <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full">
                        {filteredInventory.length}
                      </span>
                    </h2>
                  </div>

                  {/* Alerts */}
                  {inventory.filter(item => item.isMedicineLowStock).length > 0 && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl animate-pulse">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                          <strong className="text-yellow-800">Low Stock Alert:</strong>
                          <p className="text-yellow-700 text-sm">
                            {inventory.filter(item => item.isMedicineLowStock).length} medicines need reordering.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {inventory.filter(item => item.isExpired).length > 0 && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl animate-pulse">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🚨</span>
                        <div>
                          <strong className="text-red-800">Expired Alert:</strong>
                          <p className="text-red-700 text-sm">
                            {inventory.filter(item => item.isExpired).length} items have expired.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Available Medicines Table */}
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Medicine
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Stock
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredInventory
                          .filter(item => !item.isExpired && !item.isLowStock)
                          .slice(0, 8)
                          .map((item, index) => (
                            <tr
                              key={item._id}
                              className="hover:bg-gray-50 transition-colors duration-150"
                            >
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{item.medicineId?.name || 'Unknown'}</div>
                                <div className="text-xs text-gray-500">{item.medicineId?.brandName || '-'}</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                  {item.availableStock}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-semibold text-gray-900">
                                ₹{item.sellingPrice?.toFixed(2) || '0.00'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  ✓ In Stock
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Low Stock & Expired Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {/* Low Stock */}
                    {inventory.filter(item => item.isLowStock).length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                          <span>⚠️</span>
                          Low Stock Items
                        </h3>
                        <div className="space-y-2">
                          {inventory
                            .filter(item => item.isLowStock)
                            .slice(0, 3)
                            .map(item => (
                              <div key={item._id} className="flex justify-between items-center p-2 bg-white rounded-lg">
                                <span className="font-medium text-sm">{item.medicineId?.name}</span>
                                <span className="font-bold text-yellow-600">{item.availableStock}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Expired Items */}
                    {inventory.filter(item => item.isExpired).length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                          <span>🚨</span>
                          Expired Items
                        </h3>
                        <div className="space-y-2">
                          {inventory
                            .filter(item => item.isExpired)
                            .slice(0, 3)
                            .map(item => (
                              <div key={item._id} className="flex justify-between items-center p-2 bg-white rounded-lg">
                                <span className="font-medium text-sm">{item.medicineId?.name}</span>
                                <span className="text-xs text-red-600">
                                  {new Date(item.expiryDate).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reorder Drafts Card */}
                <div
                  ref={el => cardsRef.current[1] = el}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform transition-all duration-300 hover:shadow-xl"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <span className="text-2xl">📋</span>
                      Pending Reorders
                      <span className="ml-2 px-3 py-1 bg-yellow-100 text-yellow-600 text-sm font-semibold rounded-full">
                        {reorderDrafts.length}
                      </span>
                    </h3>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setCsvModalOpen(true)}
                        className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-sm flex items-center gap-2"
                      >
                        <span>📄</span>
                        Generate CSV
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/medical/reorders/generate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                            });
                            const data = await response.json();
                            if (response.ok) {
                              alert(`✅ Reorder analysis completed!\n\n📊 Processed ${data.processedItems} inventory items\n🆕 Created ${data.reorderDraftsCreated} reorder suggestions\n\nCheck the reorders page for new suggestions.`);
                              fetchReorderDrafts(); // Refresh the list
                            } else {
                              alert(`❌ Error: ${data.error}`);
                            }
                          } catch (error) {
                            alert('❌ Network error occurred');
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm flex items-center gap-2"
                      >
                        <span>🔄</span>
                        Generate Reorders
                      </button>
                      <Link
                        href="/medical/reorders"
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
                      >
                        Manage Reorders
                      </Link>
                    </div>
                  </div>

                  {reorderDrafts.length > 0 ? (
                    <div className="space-y-3">
                      {reorderDrafts.slice(0, 5).map((draft, index) => (
                        <div
                          key={draft._id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-150"
                        >
                          <div>
                            <div className="font-semibold text-gray-900">{draft.medicineId?.name}</div>
                            <div className="text-sm text-gray-500">{draft.supplierId?.name}</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-blue-600">Qty: {draft.quantity}</span>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                              PENDING
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No pending reorder drafts
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Charts & Analytics */}
              <div className="space-y-6">
                {/* Stock Status Chart Card */}
                <div
                  ref={el => cardsRef.current[2] = el}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform transition-all duration-300 hover:shadow-xl"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    Stock Status
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Purchases Card */}
                <div
                  ref={el => cardsRef.current[3] = el}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform transition-all duration-300 hover:shadow-xl"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="text-2xl">🛒</span>
                    Recent Purchases
                  </h3>
                  <div className="space-y-4">
                    {purchases.slice(0, 4).map((purchase, index) => (
                      <div
                        key={purchase._id}
                        className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-all duration-200"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-gray-900">
                            {purchase.supplierId?.name || 'Unknown Supplier'}
                          </span>
                          <span className="font-bold text-blue-600">
                            ₹{purchase.totalAmount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>{purchase.items?.length || 0} items</span>
                          <span>{new Date(purchase.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Selling Card */}
                <div
                  ref={el => cardsRef.current[4] = el}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform transition-all duration-300 hover:shadow-xl"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    Top Selling This Week
                  </h3>
                  <div className="space-y-4">
                    {topSelling.slice(0, 5).map((item, index) => (
                      <div
                        key={item.medicineId}
                        className={`p-4 rounded-xl border ${
                          index < 3
                            ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded-lg text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-amber-700 text-white' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            #{index + 1}
                          </span>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{item.medicineName}</div>
                            <div className="text-xs text-gray-500">{item.brandName}</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-blue-600">{item.totalQuantity} units</span>
                          <span className="text-sm font-semibold text-gray-700">
                            ₹{item.totalRevenue?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Accounting Card */}
                <div
                  ref={el => cardsRef.current[6] = el}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform transition-all duration-300 hover:shadow-xl"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    Daily Accounting
                  </h3>
                  <div className="space-y-4">
                    {dailyAccounting.length > 0 ? (
                      dailyAccounting.map((day, index) => (
                        <div
                          key={day.date}
                          className={`p-4 rounded-xl border ${
                            day.profit >= 0
                              ? 'bg-green-50 border-green-200'
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <div className="font-bold text-gray-900">
                              {new Date(day.date).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className={`text-lg font-bold ${
                              day.profit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {day.profit >= 0 ? '+' : ''}₹{day.profit.toFixed(2)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600">Purchase</div>
                              <div className="font-semibold text-blue-600">
                                ₹{day.purchases.toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600">Sales</div>
                              <div className="font-semibold text-green-600">
                                ₹{day.sales.toFixed(2)}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-gray-600">COGS</div>
                              <div className="font-semibold text-orange-600">
                                ₹{day.cogs.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Inventory Value Change */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Inventory Change</span>
                              <span className={`font-semibold ${
                                day.purchases - day.cogs >= 0 ? 'text-blue-600' : 'text-red-600'
                              }`}>
                                {day.purchases - day.cogs >= 0 ? '+' : ''}₹{(day.purchases - day.cogs).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-4">📊</div>
                        <p>No accounting data available</p>
                        <p className="text-xs mt-2">Make some purchases and sales to see daily accounting</p>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {dailyAccounting.length > 0 && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                      <h4 className="font-semibold text-gray-800 mb-3">Last 7 Days Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Total Purchases</div>
                          <div className="font-bold text-blue-600">
                            ₹{dailyAccounting.reduce((sum, day) => sum + day.purchases, 0).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Total Sales</div>
                          <div className="font-bold text-green-600">
                            ₹{dailyAccounting.reduce((sum, day) => sum + day.sales, 0).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Total COGS</div>
                          <div className="font-bold text-orange-600">
                            ₹{dailyAccounting.reduce((sum, day) => sum + day.cogs, 0).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Total Profit</div>
                          <div className={`font-bold ${
                            dailyAccounting.reduce((sum, day) => sum + day.profit, 0) >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            ₹{dailyAccounting.reduce((sum, day) => sum + day.profit, 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Near Expiry Management Card */}
                <div
                  ref={el => cardsRef.current[8] = el}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform transition-all duration-300 hover:shadow-xl"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="text-2xl">⏰</span>
                    Near Expiry Management
                  </h3>
                  <div className="space-y-4">
                    {inventory.filter(item => item.expiryStatus === 'NEAR_EXPIRY').length > 0 ? (
                      inventory
                        .filter(item => item.expiryStatus === 'NEAR_EXPIRY')
                        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
                        .slice(0, 5)
                        .map((item, index) => (
                          <div
                            key={item._id}
                            className="p-4 border border-yellow-200 rounded-xl bg-yellow-50 hover:bg-yellow-100 transition-colors duration-200"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="font-semibold text-gray-900">{item.medicineId?.name}</div>
                                <div className="text-sm text-gray-600">
                                  Batch: {item.batchNumber} • Stock: {item.availableStock}
                                </div>
                                <div className="text-xs text-red-600 font-medium">
                                  Expires: {new Date(item.expiryDate).toLocaleDateString()} ({item.daysLeft} days left)
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-orange-600">
                                  {item.discountPercent}% OFF
                                </div>
                                <div className="text-sm text-gray-600">
                                  ₹{item.finalSellingPrice?.toFixed(2)}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200">
                                ✓ Apply Discount
                              </button>
                              <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200">
                                🔄 Return to Supplier
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-4">✅</div>
                        <p>No medicines nearing expiry</p>
                        <p className="text-xs mt-2">All stock is safely within expiry limits</p>
                      </div>
                    )}
                  </div>

                  {/* Expiry Summary */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-gray-800 mb-3">Expiry Status Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Near Expiry</div>
                        <div className="font-bold text-orange-600">
                          {inventory.filter(item => item.expiryStatus === 'NEAR_EXPIRY').length}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Expired</div>
                        <div className="font-bold text-red-600">
                          {inventory.filter(item => item.expiryStatus === 'EXPIRED').length}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-gray-600">Safe Stock</div>
                        <div className="font-bold text-green-600">
                          {inventory.filter(item => item.expiryStatus === 'SAFE').length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Levels Chart Card */}
                <div
                  ref={el => cardsRef.current[9] = el}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform transition-all duration-300 hover:shadow-xl"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="text-2xl">📈</span>
                    Stock Levels
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          fontSize={12}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="stock"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Patient Search Modal */}
      {patientModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <span className="text-3xl">👤</span>
                  Quick Serve Medicine
                </h2>
                <button
                  onClick={() => {
                    setPatientModalOpen(false);
                    setPatientSearchTerm('');
                    setSelectedPatient(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="🔍 Search patients by name or mobile..."
                    value={patientSearchTerm}
                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl">
                    🔍
                  </div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-3 mb-6">
                {patients
                  .filter(patient =>
                    patient.name?.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
                    patient.mobile?.includes(patientSearchTerm)
                  )
                  .slice(0, 10)
                  .map((patient) => (
                    <div
                      key={patient._id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedPatient?._id === patient._id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-900">{patient.name}</div>
                          <div className="text-sm text-gray-500">
                            Mobile: {patient.mobile} • Age: {patient.age} • {patient.gender}
                          </div>
                        </div>
                        {selectedPatient?._id === patient._id && (
                          <span className="text-2xl text-blue-600 animate-pulse">✓</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {selectedPatient && (
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      window.open(`/medical/patients/${selectedPatient._id}/serve-medicine`, '_blank');
                      setPatientModalOpen(false);
                      setPatientSearchTerm('');
                      setSelectedPatient(null);
                    }}
                    className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">💊</span>
                    Serve Medicine to {selectedPatient.name}
                  </button>
                  <button
                    onClick={() => {
                      window.open(`/medical/patients/${selectedPatient._id}`, '_blank');
                      setPatientModalOpen(false);
                      setPatientSearchTerm('');
                      setSelectedPatient(null);
                    }}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">📋</span>
                    View Details
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSV Selection Modal */}
      {csvModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <span className="text-3xl">📄</span>
                  Generate CSV Report
                </h2>
                <button
                  onClick={() => setCsvModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6 text-center">
                Choose the type of CSV report you want to generate:
              </p>

              <div className="space-y-4">
                <button
                  onClick={generateLowStockCSV}
                  className="w-full p-4 border-2 border-yellow-200 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-all duration-200 flex items-center gap-4"
                >
                  <div className="text-3xl">📉</div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Low Stock Report</div>
                    <div className="text-sm text-gray-600">
                      Export medicines that are running low on stock
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      {inventory.filter(item => item.isLowStock).length} items available
                    </div>
                  </div>
                </button>

                <button
                  onClick={generateExpiryCSV}
                  className="w-full p-4 border-2 border-red-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all duration-200 flex items-center gap-4"
                >
                  <div className="text-3xl">⏰</div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Expiry Report</div>
                    <div className="text-sm text-gray-600">
                      Export medicines that have expired
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      {inventory.filter(item => item.isExpired).length} items available
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Popup */}
      <SubscriptionPopup
        isOpen={subscriptionPopupOpen}
        onClose={() => setSubscriptionPopupOpen(false)}
        user={user}
      />
    </div>
  );
}
