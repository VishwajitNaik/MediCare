// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// export default function MedicalDashboard() {
//   const [inventory, setInventory] = useState([]);
//   const [filteredInventory, setFilteredInventory] = useState([]);
//   const [topSelling, setTopSelling] = useState([]);
//   const [purchases, setPurchases] = useState([]);
//   const [patients, setPatients] = useState([]);
//   const [reorderDrafts, setReorderDrafts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterType, setFilterType] = useState('all'); // all, lowStock, expired
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const [patientModalOpen, setPatientModalOpen] = useState(false);
//   const [patientSearchTerm, setPatientSearchTerm] = useState('');
//   const [selectedPatient, setSelectedPatient] = useState(null);

//   useEffect(() => {
//     fetchInventory();
//     fetchTopSelling();
//     fetchPurchases();
//     fetchPatients();
//     fetchReorderDrafts();
//     checkScreenSize();
//     window.addEventListener('resize', checkScreenSize);
//     return () => window.removeEventListener('resize', checkScreenSize);
//   }, []);

//   useEffect(() => {
//     filterInventory();
//   }, [inventory, searchTerm, filterType]);

//   const checkScreenSize = () => {
//     // Show drawer on PC (>= 768px), hide on mobile
//     setDrawerOpen(window.innerWidth >= 768);
//   };

//   const fetchInventory = async () => {
//     try {
//       const res = await fetch('/api/medical/inventory/list');
//       const data = await res.json();
//       if (res.ok) {
//         setInventory(data.inventory || []);
//       } else {
//         setError(data.error || 'Failed to load inventory');
//       }
//     } catch (err) {
//       setError('Network error');
//     }
//   };

//   const fetchTopSelling = async () => {
//     try {
//       const res = await fetch('/api/medical/dashboard/top-selling');
//       const data = await res.json();
//       if (res.ok) {
//         setTopSelling(data.topSelling || []);
//       }
//     } catch (err) {
//       console.error('Failed to fetch top selling:', err);
//     }
//   };

//   const fetchPurchases = async () => {
//     try {
//       const res = await fetch('/api/medical/purchases/list');
//       const data = await res.json();
//       if (res.ok) {
//         setPurchases(data.purchases || []);
//       }
//     } catch (err) {
//       console.error('Failed to fetch purchases:', err);
//     }
//   };

//   const fetchPatients = async () => {
//     try {
//       const res = await fetch('/api/common/patients');
//       const data = await res.json();
//       if (res.ok) {
//         setPatients(data.patients || []);
//       }
//     } catch (err) {
//       console.error('Failed to fetch patients:', err);
//     }
//   };

//   const fetchReorderDrafts = async () => {
//     try {
//       const res = await fetch('/api/medical/reorders/list');
//       const data = await res.json();
//       if (res.ok) {
//         setReorderDrafts(data.reorderDrafts || []);
//       }
//     } catch (err) {
//       console.error('Failed to fetch reorder drafts:', err);
//     }
//     setLoading(false);
//   };

//   const filterInventory = () => {
//     let filtered = [...inventory];

//     // Apply search filter
//     if (searchTerm) {
//       filtered = filtered.filter(item =>
//         item.medicineId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         item.medicineId?.brandName?.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }

//     // Apply type filter
//     switch (filterType) {
//       case 'lowStock':
//         filtered = filtered.filter(item => item.isLowStock);
//         break;
//       case 'expired':
//         filtered = filtered.filter(item => item.isExpired);
//         break;
//       default:
//         break;
//     }

//     setFilteredInventory(filtered);
//   };

//   const getStockStatusColor = (item) => {
//     if (item.isExpired) return '#f44336';
//     if (item.isLowStock) return '#ff9800';
//     return '#4caf50';
//   };

//   const getStatusText = (item) => {
//     if (item.isExpired) return 'Expired';
//     if (item.isLowStock) return 'Low Stock';
//     return 'In Stock';
//   };

//   // Prepare chart data
//   const chartData = inventory.slice(0, 10).map(item => ({
//     name: item.medicineId?.name?.substring(0, 15) + '...' || 'Unknown',
//     stock: item.availableStock,
//     value: item.availableStock * (item.sellingPrice || 0)
//   }));

//   const statusChartData = [
//     { name: 'In Stock', value: inventory.filter(item => !item.isExpired && !item.isLowStock).length, color: '#4caf50' },
//     { name: 'Low Stock', value: inventory.filter(item => item.isLowStock && !item.isExpired).length, color: '#ff9800' },
//     { name: 'Expired', value: inventory.filter(item => item.isExpired).length, color: '#f44336' }
//   ];

//   const navigationItems = [
//     { href: '/medical/patients', icon: '👥', label: 'Patient Service' },
//     { href: '/medical/inventory', icon: '📦', label: 'Manage Inventory' },
//     { href: '/medical/prescriptions', icon: '📋', label: 'Manage Prescriptions' },
//     { href: '/medical/manage-patients', icon: '📝', label: 'Manage Patients' },
//     { href: '/medical/medicines', icon: '💊', label: 'Manage Medicines' },
//     { href: '/medical/suppliers', icon: '🏭', label: 'Manage Suppliers' },
//     { href: '/medical/purchases/add', icon: '🛒', label: 'Record Purchases' },
//     { href: '/medical/records', icon: '📊', label: 'Create Records' },
//     { href: '/medical/expiry', icon: '⏰', label: 'Expiry Management' },
//     { href: '/medical/reorders', icon: '🔄', label: 'Reorder Drafts' },
//     { href: '/api/auth/logout', icon: '🚪', label: 'Logout', color: 'red' }
//   ];

//   return (
//     <div style={{ display: 'flex', minHeight: '100vh' }}>
//       {/* Drawer */}
//       <div className='mt-20' style={{
//         width: drawerOpen ? '280px' : '0',
//         background: '#f8f9fa',
//         borderRight: '1px solid #dee2e6',
//         transition: 'width 0.3s ease',
//         overflow: 'hidden',
//         position: 'fixed',
//         left: 0,  
//         top: 0,
//         bottom: 0,
//         zIndex: 1000
//       }}>
//         <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
//           <div style={{ marginBottom: '30px' }}>
//             <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>🏥 Medical Store</h2>
//             <nav>
//               <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
//                 {navigationItems.map((item, index) => (
//                   <li key={index} style={{ marginBottom: '5px' }}>
//                     <Link
//                       href={item.href}
//                       style={{
//                         display: 'block',
//                         padding: '12px 15px',
//                         textDecoration: 'none',
//                         color: item.color || '#333',
//                         borderRadius: '6px',
//                         transition: 'background 0.2s',
//                         fontSize: '14px',
//                         fontWeight: '500'
//                       }}
//                       onMouseEnter={(e) => e.target.style.background = '#e9ecef'}
//                       onMouseLeave={(e) => e.target.style.background = 'transparent'}
//                     >
//                       {item.icon} {item.label}
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </nav>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div style={{
//         flex: 1,
//         marginLeft: drawerOpen ? '280px' : '0',
//         transition: 'margin-left 0.3s ease',
//         padding: '20px',
//         background: '#f8f9fa',
//         minHeight: '100vh'
//       }}>
//         {/* Header */}
//         <div style={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           marginBottom: '30px',
//           padding: '20px',
//           background: 'white',
//           borderRadius: '10px',
//           boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
//             <button
//               onClick={() => setDrawerOpen(!drawerOpen)}
//               style={{
//                 padding: '10px',
//                 background: '#007bff',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '6px',
//                 cursor: 'pointer',
//                 fontSize: '16px'
//               }}
//             >
//               ☰
//             </button>
//             <h1 style={{ margin: 0, color: '#333' }}>📦 Inventory Dashboard</h1>
//           </div>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
//             <button
//               onClick={() => setPatientModalOpen(true)}
//               style={{
//                 padding: '10px 15px',
//                 background: '#28a745',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '6px',
//                 cursor: 'pointer',
//                 fontSize: '14px',
//                 fontWeight: 'bold'
//               }}
//             >
//               👤 Quick Serve Medicine
//             </button>
//             <div style={{ fontSize: '18px', color: '#666' }}>
//               Total Items: {inventory.length}
//             </div>
//           </div>
//         </div>

//         {/* Controls */}
//         <div style={{
//           display: 'flex',
//           gap: '15px',
//           marginBottom: '20px',
//           flexWrap: 'wrap',
//           alignItems: 'center'
//         }}>
//           {/* Search */}
//           <input
//             type="text"
//             placeholder="🔍 Search medicines..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             style={{
//               padding: '10px 15px',
//               border: '1px solid #ddd',
//               borderRadius: '6px',
//               fontSize: '14px',
//               minWidth: '250px',
//               flex: 1
//             }}
//           />

//           {/* Filter Buttons */}
//           <div style={{ display: 'flex', gap: '10px' }}>
//             <button
//               onClick={() => setFilterType('all')}
//               style={{
//                 padding: '10px 15px',
//                 background: filterType === 'all' ? '#007bff' : '#f8f9fa',
//                 color: filterType === 'all' ? 'white' : '#333',
//                 border: '1px solid #ddd',
//                 borderRadius: '6px',
//                 cursor: 'pointer',
//                 fontSize: '14px'
//               }}
//             >
//               📋 All ({inventory.length})
//             </button>
//             <button
//               onClick={() => setFilterType('lowStock')}
//               style={{
//                 padding: '10px 15px',
//                 background: filterType === 'lowStock' ? '#ff9800' : '#f8f9fa',
//                 color: filterType === 'lowStock' ? 'white' : '#333',
//                 border: '1px solid #ddd',
//                 borderRadius: '6px',
//                 cursor: 'pointer',
//                 fontSize: '14px'
//               }}
//             >
//               📉 Low Stock ({inventory.filter(item => item.isLowStock).length})
//             </button>
//             <button
//               onClick={() => setFilterType('expired')}
//               style={{
//                 padding: '10px 15px',
//                 background: filterType === 'expired' ? '#f44336' : '#f8f9fa',
//                 color: filterType === 'expired' ? 'white' : '#333',
//                 border: '1px solid #ddd',
//                 borderRadius: '6px',
//                 cursor: 'pointer',
//                 fontSize: '14px'
//               }}
//             >
//               🚨 Expired ({inventory.filter(item => item.isExpired).length})
//             </button>
//           </div>
//         </div>

//         {loading ? (
//           <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
//         ) : error ? (
//           <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>Error: {error}</div>
//         ) : (
//           <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px' }}>
//             {/* Left Column - Inventory List */}
//             <div>
//               <div style={{
//                 background: 'white',
//                 borderRadius: '10px',
//                 padding: '20px',
//                 boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//                 marginBottom: '20px',
//                 maxWidth: '600px'
//               }}>
//                 <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
//                   💊 Available Medicines ({filteredInventory.length})
//                 </h2>

//                 {/* Alert Messages */}
//                 {inventory.filter(item => item.isLowStock).length > 0 && (
//                   <div style={{
//                     background: '#fff3cd',
//                     border: '1px solid #ffeaa7',
//                     borderRadius: '6px',
//                     padding: '10px',
//                     marginBottom: '15px',
//                     fontSize: '14px',
//                     color: '#856404'
//                   }}>
//                     ⚠️ <strong>Alert:</strong> {inventory.filter(item => item.isLowStock).length} items are running low on stock and need reordering.
//                   </div>
//                 )}

//                 {inventory.filter(item => item.isExpired).length > 0 && (
//                   <div style={{
//                     background: '#f8d7da',
//                     border: '1px solid #f5c6cb',
//                     borderRadius: '6px',
//                     padding: '10px',
//                     marginBottom: '15px',
//                     fontSize: '14px',
//                     color: '#721c24'
//                   }}>
//                     🚨 <strong>Alert:</strong> {inventory.filter(item => item.isExpired).length} items have expired and should be removed from inventory.
//                   </div>
//                 )}

//                 <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
//                   {filteredInventory.length > 0 ? (
//                     <div style={{ display: 'grid', gap: '15px' }}>
//                       {/* Available Medicines Table */}
//                       <div>
//                         <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '16px' }}>💊 Available Medicines</h3>
//                         <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
//                           <thead>
//                             <tr style={{ background: '#f8f9fa' }}>
//                               <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Medicine</th>
//                               <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Stock</th>
//                               <th style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Price</th>
//                               <th style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Status</th>
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {filteredInventory.filter(item => !item.isExpired && !item.isLowStock).slice(0, 10).map((item, index) => (
//                               <tr key={item._id} style={{ borderBottom: '1px solid #dee2e6', background: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
//                                 <td style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11px' }}>
//                                   {item.medicineId?.name || 'Unknown'}
//                                 </td>
//                                 <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 'bold', color: '#28a745' }}>
//                                   {item.availableStock}
//                                 </td>
//                                 <td style={{ padding: '4px 8px', textAlign: 'center', fontSize: '11px' }}>
//                                   ₹{item.sellingPrice?.toFixed(2) || '0.00'}
//                                 </td>
//                                 <td style={{ padding: '4px 8px', textAlign: 'center' }}>
//                                   <span style={{
//                                     padding: '1px 4px',
//                                     background: '#28a745',
//                                     color: 'white',
//                                     borderRadius: '2px',
//                                     fontSize: '9px',
//                                     fontWeight: 'bold'
//                                   }}>
//                                     OK
//                                   </span>
//                                 </td>
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       </div>

//                       {/* Low Stock Table */}
//                       {inventory.filter(item => item.isLowStock).length > 0 && (
//                         <div>
//                           <h3 style={{ margin: '0 0 10px 0', color: '#ff9800', fontSize: '16px' }}>⚠️ Low Stock Items</h3>
//                           <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
//                             <thead>
//                               <tr style={{ background: '#fff3cd' }}>
//                                 <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Medicine</th>
//                                 <th style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Stock</th>
//                                 <th style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Supplier</th>
//                               </tr>
//                             </thead>
//                             <tbody>
//                               {filteredInventory.filter(item => item.isLowStock).slice(0, 5).map((item, index) => (
//                                 <tr key={item._id} style={{ borderBottom: '1px solid #dee2e6', background: index % 2 === 0 ? 'white' : '#fefefe' }}>
//                                   <td style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11px' }}>
//                                     {item.medicineId?.name || 'Unknown'}
//                                   </td>
//                                   <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 'bold', color: '#ff9800' }}>
//                                     {item.availableStock}
//                                   </td>
//                                   <td style={{ padding: '4px 8px', textAlign: 'center', fontSize: '11px' }}>
//                                     {item.supplierId?.name || 'Unknown'}
//                                   </td>
//                                 </tr>
//                               ))}
//                             </tbody>
//                           </table>
//                         </div>
//                       )}

//                       {/* Expired Items Table */}
//                       {inventory.filter(item => item.isExpired).length > 0 && (
//                         <div>
//                           <h3 style={{ margin: '0 0 10px 0', color: '#f44336', fontSize: '16px' }}>🚨 Expired Items</h3>
//                           <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
//                             <thead>
//                               <tr style={{ background: '#f8d7da' }}>
//                                 <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Medicine</th>
//                                 <th style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Stock</th>
//                                 <th style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Expiry</th>
//                               </tr>
//                             </thead>
//                             <tbody>
//                               {filteredInventory.filter(item => item.isExpired).slice(0, 5).map((item, index) => (
//                                 <tr key={item._id} style={{ borderBottom: '1px solid #dee2e6', background: index % 2 === 0 ? 'white' : '#fefefe' }}>
//                                   <td style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11px' }}>
//                                     {item.medicineId?.name || 'Unknown'}
//                                   </td>
//                                   <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 'bold', color: '#f44336' }}>
//                                     {item.availableStock}
//                                   </td>
//                                   <td style={{ padding: '4px 8px', textAlign: 'center', fontSize: '10px', color: '#f44336' }}>
//                                     {new Date(item.expiryDate).toLocaleDateString()}
//                                   </td>
//                                 </tr>
//                               ))}
//                             </tbody>
//                           </table>
//                         </div>
//                       )}
//                     </div>
//                   ) : (
//                     <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
//                       No medicines found matching your criteria.
//                     </div>
//                   )}
//                 </div>

//                 {/* Reorder Drafts Section */}
//                 <div style={{
//                   background: 'white',
//                   borderRadius: '10px',
//                   padding: '15px',
//                   boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//                   marginBottom: '20px',
//                   maxWidth: '600px'
//                 }}>
//                   <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px' }}>📋 Pending Reorders ({reorderDrafts.length})</h3>
//                   {reorderDrafts.length > 0 ? (
//                     <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
//                       <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
//                         <thead>
//                           <tr style={{ background: '#f8f9fa' }}>
//                             <th style={{ padding: '4px 6px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Medicine</th>
//                             <th style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Supplier</th>
//                             <th style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Qty</th>
//                             <th style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Status</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {reorderDrafts.slice(0, 8).map((draft, index) => (
//                             <tr key={draft._id} style={{ borderBottom: '1px solid #dee2e6', background: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
//                               <td style={{ padding: '3px 6px', fontWeight: 'bold', fontSize: '10px' }}>
//                                 {draft.medicineId?.name || 'Unknown'}
//                               </td>
//                               <td style={{ padding: '3px 6px', textAlign: 'center', fontSize: '10px' }}>
//                                 {draft.supplierId?.name || 'Unknown'}
//                               </td>
//                               <td style={{ padding: '3px 6px', textAlign: 'center', fontWeight: 'bold', color: '#007bff' }}>
//                                 {draft.quantity}
//                               </td>
//                               <td style={{ padding: '3px 6px', textAlign: 'center' }}>
//                                 <span style={{
//                                   padding: '1px 3px',
//                                   background: '#ffc107',
//                                   color: 'white',
//                                   borderRadius: '2px',
//                                   fontSize: '8px',
//                                   fontWeight: 'bold'
//                                 }}>
//                                   PENDING
//                                 </span>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                       {reorderDrafts.length > 8 && (
//                         <div style={{ textAlign: 'center', padding: '8px', fontSize: '11px', color: '#666' }}>
//                           ... and {reorderDrafts.length - 8} more pending reorders
//                         </div>
//                       )}
//                     </div>
//                   ) : (
//                     <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontSize: '14px' }}>
//                       No pending reorder drafts
//                     </div>
//                   )}
//                   <div style={{ textAlign: 'center', marginTop: '10px' }}>
//                     <Link
//                       href="/medical/reorders"
//                       style={{
//                         padding: '6px 12px',
//                         background: '#007bff',
//                         color: 'white',
//                         textDecoration: 'none',
//                         borderRadius: '4px',
//                         fontSize: '12px',
//                         fontWeight: 'bold'
//                       }}
//                     >
//                       Manage Reorders
//                     </Link>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Right Column - Charts and Top Selling */}
//             <div>
//               {/* Stock Status Chart */}
//               <div style={{
//                 background: 'white',
//                 borderRadius: '10px',
//                 padding: '20px',
//                 boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//                 marginBottom: '20px'
//               }}>
//                 <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>📊 Stock Status</h3>
//                 <ResponsiveContainer width="100%" height={200}>
//                   <PieChart>
//                     <Pie
//                       data={statusChartData}
//                       cx="50%"
//                       cy="50%"
//                       outerRadius={60}
//                       dataKey="value"
//                       label={({ name, value }) => `${name}: ${value}`}
//                     >
//                       {statusChartData.map((entry, index) => (
//                         <Cell key={`cell-${index}`} fill={entry.color} />
//                       ))}
//                     </Pie>
//                     <Tooltip />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>

//               {/* Recent Purchases */}
//               <div style={{
//                 background: 'white',
//                 borderRadius: '10px',
//                 padding: '20px',
//                 boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//                 marginBottom: '20px'
//               }}>
//                 <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>🛒 Recent Purchases</h3>
//                 <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
//                   {purchases.length > 0 ? (
//                     <div style={{ display: 'grid', gap: '8px' }}>
//                       {purchases.slice(0, 5).map((purchase, index) => (
//                         <div
//                           key={purchase._id}
//                           style={{
//                             padding: '8px',
//                             border: '1px solid #e9ecef',
//                             borderRadius: '4px',
//                             background: 'white',
//                             fontSize: '12px'
//                           }}
//                         >
//                           <div style={{ fontWeight: 'bold', color: '#333' }}>
//                             {purchase.supplierId?.name || 'Unknown Supplier'}
//                           </div>
//                           <div style={{ color: '#666' }}>
//                             {purchase.items?.length || 0} items • ₹{purchase.totalAmount?.toFixed(2) || '0.00'}
//                           </div>
//                           <div style={{ color: '#666', fontSize: '11px' }}>
//                             {new Date(purchase.createdAt).toLocaleDateString()}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
//                       No recent purchases.
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Top Selling This Week */}
//               <div style={{
//                 background: 'white',
//                 borderRadius: '10px',
//                 padding: '20px',
//                 boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//                 marginBottom: '20px'
//               }}>
//                 <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>🏆 This Week Highly Served</h3>
//                 <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
//                   {topSelling.length > 0 ? (
//                     <div style={{ display: 'grid', gap: '10px' }}>
//                       {topSelling.map((item, index) => (
//                         <div
//                           key={item.medicineId}
//                           style={{
//                             display: 'flex',
//                             justifyContent: 'space-between',
//                             alignItems: 'center',
//                             padding: '10px',
//                             border: '1px solid #e9ecef',
//                             borderRadius: '6px',
//                             background: index < 3 ? '#fff3cd' : 'white'
//                           }}
//                         >
//                           <div>
//                             <div style={{ fontWeight: 'bold', color: '#333' }}>
//                               #{index + 1} {item.medicineName}
//                             </div>
//                             <div style={{ fontSize: '12px', color: '#666' }}>
//                               {item.brandName} • {item.strength}
//                             </div>
//                           </div>
//                           <div style={{ textAlign: 'right' }}>
//                             <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#007bff' }}>
//                               {item.totalQuantity} units
//                             </div>
//                             <div style={{ fontSize: '12px', color: '#666' }}>
//                               ₹{item.totalRevenue?.toFixed(2) || '0.00'}
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
//                       No sales data for this week.
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Stock Levels Chart */}
//               <div style={{
//                 background: 'white',
//                 borderRadius: '10px',
//                 padding: '20px',
//                 boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
//               }}>
//                 <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>📈 Top 10 Stock Levels</h3>
//                 <ResponsiveContainer width="100%" height={250}>
//                   <BarChart data={chartData}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis
//                       dataKey="name"
//                       angle={-45}
//                       textAnchor="end"
//                       height={80}
//                       fontSize={10}
//                     />
//                     <YAxis />
//                     <Tooltip />
//                     <Bar dataKey="stock" fill="#007bff" />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Patient Search Modal */}
//         {patientModalOpen && (
//           <div style={{
//             position: 'fixed',
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             background: 'rgba(0,0,0,0.5)',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             zIndex: 2000
//           }}>
//             <div style={{
//               background: 'white',
//               borderRadius: '10px',
//               padding: '20px',
//               width: '90%',
//               maxWidth: '600px',
//               maxHeight: '80vh',
//               overflow: 'hidden'
//             }}>
//               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//                 <h2 style={{ margin: 0, color: '#333' }}>👤 Quick Serve Medicine</h2>
//                 <button
//                   onClick={() => {
//                     setPatientModalOpen(false);
//                     setPatientSearchTerm('');
//                     setSelectedPatient(null);
//                   }}
//                   style={{
//                     padding: '5px 10px',
//                     background: '#6c757d',
//                     color: 'white',
//                     border: 'none',
//                     borderRadius: '4px',
//                     cursor: 'pointer',
//                     fontSize: '16px'
//                   }}
//                 >
//                   ✕
//                 </button>
//               </div>

//               <div style={{ marginBottom: '20px' }}>
//                 <input
//                   type="text"
//                   placeholder="🔍 Search patients by name or mobile..."
//                   value={patientSearchTerm}
//                   onChange={(e) => setPatientSearchTerm(e.target.value)}
//                   style={{
//                     width: '100%',
//                     padding: '10px 15px',
//                     border: '1px solid #ddd',
//                     borderRadius: '6px',
//                     fontSize: '14px',
//                     boxSizing: 'border-box'
//                   }}
//                 />
//               </div>

//               <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
//                 {patients
//                   .filter(patient =>
//                     patient.name?.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
//                     patient.mobile?.includes(patientSearchTerm)
//                   )
//                   .slice(0, 10)
//                   .map((patient) => (
//                     <div
//                       key={patient._id}
//                       style={{
//                         display: 'flex',
//                         justifyContent: 'space-between',
//                         alignItems: 'center',
//                         padding: '12px',
//                         border: '1px solid #e9ecef',
//                         borderRadius: '6px',
//                         marginBottom: '8px',
//                         background: selectedPatient?._id === patient._id ? '#e3f2fd' : 'white',
//                         cursor: 'pointer'
//                       }}
//                       onClick={() => setSelectedPatient(patient)}
//                     >
//                       <div>
//                         <div style={{ fontWeight: 'bold', color: '#333' }}>
//                           {patient.name}
//                         </div>
//                         <div style={{ fontSize: '12px', color: '#666' }}>
//                           Mobile: {patient.mobile} • Age: {patient.age} • {patient.gender}
//                         </div>
//                       </div>
//                       {selectedPatient?._id === patient._id && (
//                         <div style={{ color: '#007bff', fontSize: '18px' }}>✓</div>
//                       )}
//                     </div>
//                   ))}
//                 {patients.filter(patient =>
//                   patient.name?.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
//                   patient.mobile?.includes(patientSearchTerm)
//                 ).length === 0 && (
//                   <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
//                     No patients found.
//                   </div>
//                 )}
//               </div>

//               {selectedPatient && (
//                 <div style={{ display: 'flex', gap: '10px' }}>
//                   <button
//                     onClick={() => {
//                       window.open(`/medical/patients/${selectedPatient._id}/serve-medicine`, '_blank');
//                       setPatientModalOpen(false);
//                       setPatientSearchTerm('');
//                       setSelectedPatient(null);
//                     }}
//                     style={{
//                       flex: 1,
//                       padding: '12px',
//                       background: '#28a745',
//                       color: 'white',
//                       border: 'none',
//                       borderRadius: '6px',
//                       cursor: 'pointer',
//                       fontSize: '14px',
//                       fontWeight: 'bold'
//                     }}
//                   >
//                     💊 Serve Medicine to {selectedPatient.name}
//                   </button>
//                   <button
//                     onClick={() => {
//                       window.open(`/medical/patients/${selectedPatient._id}`, '_blank');
//                       setPatientModalOpen(false);
//                       setPatientSearchTerm('');
//                       setSelectedPatient(null);
//                     }}
//                     style={{
//                       flex: 1,
//                       padding: '12px',
//                       background: '#007bff',
//                       color: 'white',
//                       border: 'none',
//                       borderRadius: '6px',
//                       cursor: 'pointer',
//                       fontSize: '14px',
//                       fontWeight: 'bold'
//                     }}
//                   >
//                     📋 View Patient Details
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


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

  const drawerRef = useRef(null);
  const mainContentRef = useRef(null);
  const cardsRef = useRef([]);

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
                    <Link
                      href="/medical/reorders"
                      className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
                    >
                      Manage Reorders
                    </Link>
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

      {/* Subscription Popup */}
      <SubscriptionPopup
        isOpen={subscriptionPopupOpen}
        onClose={() => setSubscriptionPopupOpen(false)}
        user={user}
      />
    </div>
  );
}
