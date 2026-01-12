// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';

// export default function ExpiryManagementPage() {
//   const [expiryData, setExpiryData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [activeTab, setActiveTab] = useState('near-expiry'); // expired, near-expiry, normal

//   useEffect(() => {
//     fetchExpiryData();
//   }, []);

//   const fetchExpiryData = async () => {
//     try {
//       const res = await fetch('/api/medical/expiry/list');
//       const data = await res.json();
//       if (res.ok) {
//         setExpiryData(data);
//       } else {
//         setError(data.error || 'Failed to load expiry data');
//       }
//     } catch (err) {
//       setError('Network error');
//     }
//     setLoading(false);
//   };

//   const getStatusBadge = (status, daysUntilExpiry) => {
//     if (status === 'EXPIRED') {
//       return { text: '🚨 EXPIRED', color: '#dc3545', bgColor: '#f8d7da' };
//     } else if (status === 'NEAR_EXPIRY') {
//       if (daysUntilExpiry <= 0) {
//         return { text: '⚠️ EXPIRING SOON', color: '#fd7e14', bgColor: '#fff3cd' };
//       } else {
//         return { text: `⏰ ${daysUntilExpiry} days left`, color: '#fd7e14', bgColor: '#fff3cd' };
//       }
//     }
//     return { text: '✅ NORMAL', color: '#28a745', bgColor: '#d4edda' };
//   };

//   const getActionSuggestions = (status, daysUntilExpiry) => {
//     if (status === 'EXPIRED') {
//       return [
//         { action: '🚫 Cannot be sold', description: 'Lock from sales immediately' },
//         { action: '↩️ Return to supplier', description: 'Contact supplier for return' },
//         { action: '🗑️ Dispose safely', description: 'Remove from inventory' }
//       ];
//     } else if (status === 'NEAR_EXPIRY' && daysUntilExpiry <= 7) {
//       return [
//         { action: '💰 Apply discount', description: 'Sell at reduced price (50-70% off)' },
//         { action: '📢 Promote sales', description: 'Push for quick clearance' },
//         { action: '↩️ Return to supplier', description: 'Exchange for fresh stock' }
//       ];
//     } else if (status === 'NEAR_EXPIRY') {
//       return [
//         { action: '📊 Monitor closely', description: 'Track daily until expiry' },
//         { action: '🏷️ Price adjustment', description: 'Consider slight discount' },
//         { action: '🔄 Plan replacement', description: 'Order fresh stock in advance' }
//       ];
//     }
//     return [];
//   };

//   const renderSupplierSection = (supplierName, supplierData, status) => {
//     if (!supplierData || !supplierData.items || supplierData.items.length === 0) {
//       return null;
//     }

//     return (
//       <div key={supplierName} style={{
//         background: 'white',
//         borderRadius: '10px',
//         padding: '20px',
//         marginBottom: '20px',
//         boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//         border: status === 'EXPIRED' ? '2px solid #dc3545' : status === 'NEAR_EXPIRY' ? '2px solid #fd7e14' : '1px solid #dee2e6'
//       }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
//           <div>
//             <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>
//               🏭 {supplierName}
//             </h3>
//             {supplierData.supplier?.contactNumber && (
//               <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
//                 📞 {supplierData.supplier.contactNumber}
//               </p>
//             )}
//           </div>
//           <div style={{
//             background: status === 'EXPIRED' ? '#dc3545' : status === 'NEAR_EXPIRY' ? '#fd7e14' : '#28a745',
//             color: 'white',
//             padding: '8px 15px',
//             borderRadius: '20px',
//             fontSize: '12px',
//             fontWeight: 'bold'
//           }}>
//             {supplierData.items.length} item{supplierData.items.length > 1 ? 's' : ''}
//           </div>
//         </div>

//         <div style={{ marginBottom: '15px' }}>
//           {supplierData.items.map((item, index) => {
//             const badge = getStatusBadge(item.status, item.daysUntilExpiry);
//             const suggestions = getActionSuggestions(item.status, item.daysUntilExpiry);

//             return (
//               <div key={item._id} style={{
//                 background: index % 2 === 0 ? '#f8f9fa' : 'white',
//                 padding: '15px',
//                 borderRadius: '6px',
//                 marginBottom: '10px',
//                 border: `1px solid ${badge.color}20`
//               }}>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
//                   <div style={{ flex: 1 }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
//                       <h4 style={{ margin: 0, color: '#333' }}>
//                         {item.medicineId?.name || 'Unknown Medicine'}
//                       </h4>
//                       <span style={{
//                         background: badge.bgColor,
//                         color: badge.color,
//                         padding: '3px 8px',
//                         borderRadius: '12px',
//                         fontSize: '11px',
//                         fontWeight: 'bold'
//                       }}>
//                         {badge.text}
//                       </span>
//                     </div>
//                     <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
//                       {item.medicineId?.brandName} • {item.medicineId?.strength} • Batch: {item.batchNumber}
//                     </p>
//                     <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
//                       <span><strong>Stock:</strong> {item.availableStock} units</span>
//                       <span><strong>Expiry:</strong> {new Date(item.expiryDate).toLocaleDateString()}</span>
//                       <span><strong>Cost:</strong> ₹{item.costPrice?.toFixed(2) || '0.00'}</span>
//                     </div>
//                   </div>
//                 </div>

//                 {suggestions.length > 0 && (
//                   <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
//                     <h5 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '14px' }}>💡 Suggested Actions:</h5>
//                     <div style={{ display: 'grid', gap: '5px' }}>
//                       {suggestions.map((suggestion, idx) => (
//                         <div key={idx} style={{ fontSize: '13px', color: '#666' }}>
//                           <strong>{suggestion.action}:</strong> {suggestion.description}
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>

//         <div style={{ textAlign: 'center', paddingTop: '15px', borderTop: '1px solid #dee2e6' }}>
//           <button
//             style={{
//               background: status === 'EXPIRED' ? '#dc3545' : '#007bff',
//               color: 'white',
//               border: 'none',
//               padding: '8px 16px',
//               borderRadius: '4px',
//               cursor: 'pointer',
//               fontSize: '14px',
//               fontWeight: 'bold'
//             }}
//           >
//             📞 Contact {supplierName}
//           </button>
//         </div>
//       </div>
//     );
//   };

//   const getCurrentData = () => {
//     if (!expiryData) return {};

//     switch (activeTab) {
//       case 'expired':
//         return expiryData.expiredItems || {};
//       case 'near-expiry':
//         return expiryData.nearExpiryItems || {};
//       case 'normal':
//         return expiryData.normalItems || {};
//       default:
//         return expiryData.nearExpiryItems || {};
//     }
//   };

//   const getTabCount = (tab) => {
//     if (!expiryData) return 0;
//     const data = tab === 'expired' ? expiryData.expiredItems :
//                  tab === 'near-expiry' ? expiryData.nearExpiryItems :
//                  expiryData.normalItems;
//     if (!data) return 0;
//     return Object.values(data).reduce((total, supplier) => total + (supplier.items?.length || 0), 0);
//   };

//   return (
//     <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
//       <div style={{ marginBottom: '30px' }}>
//         <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>⏰ Expiry & Dead-Stock Management</h1>
//         <p style={{ margin: '0', color: '#666', fontSize: '16px' }}>
//           Automatically monitor and manage medicine expiry dates to prevent losses and ensure safety.
//         </p>
//       </div>

//       {error && <p style={{ color: 'red', padding: '10px', background: '#ffeaea', borderRadius: '4px' }}>{error}</p>}

//       {loading ? (
//         <div style={{ textAlign: 'center', padding: '50px' }}>Loading expiry data...</div>
//       ) : expiryData ? (
//         <>
//           {/* Summary Cards */}
//           <div style={{
//             display: 'grid',
//             gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
//             gap: '20px',
//             marginBottom: '30px'
//           }}>
//             <div style={{
//               background: '#dc3545',
//               color: 'white',
//               padding: '20px',
//               borderRadius: '10px',
//               textAlign: 'center'
//             }}>
//               <div style={{ fontSize: '32px', marginBottom: '5px' }}>🚨</div>
//               <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{expiryData.summary?.totalExpired || 0}</div>
//               <div style={{ fontSize: '14px' }}>Expired Items</div>
//             </div>

//             <div style={{
//               background: '#fd7e14',
//               color: 'white',
//               padding: '20px',
//               borderRadius: '10px',
//               textAlign: 'center'
//             }}>
//               <div style={{ fontSize: '32px', marginBottom: '5px' }}>⏰</div>
//               <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{expiryData.summary?.totalNearExpiry || 0}</div>
//               <div style={{ fontSize: '14px' }}>Near Expiry (&lt; 30 days)</div>
//             </div>

//             <div style={{
//               background: '#28a745',
//               color: 'white',
//               padding: '20px',
//               borderRadius: '10px',
//               textAlign: 'center'
//             }}>
//               <div style={{ fontSize: '32px', marginBottom: '5px' }}>✅</div>
//               <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{expiryData.summary?.totalNormal || 0}</div>
//               <div style={{ fontSize: '14px' }}>Safe Stock</div>
//             </div>
//           </div>

//           {/* Tab Navigation */}
//           <div style={{
//             display: 'flex',
//             background: '#f8f9fa',
//             borderRadius: '8px',
//             padding: '5px',
//             marginBottom: '30px'
//           }}>
//             {[
//               { key: 'near-expiry', label: 'Near Expiry', icon: '⏰' },
//               { key: 'expired', label: 'Expired', icon: '🚨' },
//               { key: 'normal', label: 'Safe Stock', icon: '✅' }
//             ].map(tab => (
//               <button
//                 key={tab.key}
//                 onClick={() => setActiveTab(tab.key)}
//                 style={{
//                   flex: 1,
//                   padding: '12px',
//                   background: activeTab === tab.key ? 'white' : 'transparent',
//                   color: activeTab === tab.key ? '#333' : '#666',
//                   border: 'none',
//                   borderRadius: '6px',
//                   cursor: 'pointer',
//                   fontSize: '14px',
//                   fontWeight: 'bold',
//                   boxShadow: activeTab === tab.key ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
//                   transition: 'all 0.2s'
//                 }}
//               >
//                 {tab.icon} {tab.label} ({getTabCount(tab.key)})
//               </button>
//             ))}
//           </div>

//           {/* Content */}
//           <div>
//             {Object.keys(getCurrentData()).length > 0 ? (
//               Object.entries(getCurrentData()).map(([supplierName, supplierData]) => {
//                 return renderSupplierSection(supplierName, supplierData, activeTab.toUpperCase().replace('-', '_'));
//               })
//             ) : (
//               <div style={{
//                 textAlign: 'center',
//                 padding: '60px',
//                 background: 'white',
//                 borderRadius: '10px',
//                 boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
//               }}>
//                 <div style={{ fontSize: '48px', marginBottom: '20px' }}>
//                   {activeTab === 'expired' ? '🚨' : activeTab === 'near-expiry' ? '⏰' : '✅'}
//                 </div>
//                 <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
//                   {activeTab === 'expired' ? 'No Expired Items' :
//                    activeTab === 'near-expiry' ? 'No Near-Expiry Items' :
//                    'All Items Are Safe'}
//                 </h3>
//                 <p style={{ margin: '0', color: '#666' }}>
//                   {activeTab === 'expired' ? 'Great! All your medicines are within expiry dates.' :
//                    activeTab === 'near-expiry' ? 'Excellent inventory management! No items expiring soon.' :
//                    'Your inventory is well-maintained with safe expiry dates.'}
//                 </p>
//               </div>
//             )}
//           </div>
//         </>
//       ) : null}

//       <div style={{ marginTop: '40px', textAlign: 'center' }}>
//         <Link
//           href="/medical/dashboard"
//           style={{
//             display: 'inline-block',
//             padding: '12px 24px',
//             background: '#007bff',
//             color: 'white',
//             textDecoration: 'none',
//             borderRadius: '6px',
//             fontSize: '16px',
//             fontWeight: 'bold',
//             boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
//             transition: 'background 0.2s'
//           }}
//           onMouseEnter={(e) => e.target.style.background = '#0056b3'}
//           onMouseLeave={(e) => e.target.style.background = '#007bff'}
//         >
//           ← Back to Dashboard
//         </Link>
//       </div>
//     </div>
//   );
// }

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

export default function ExpiryManagementPage() {
  const [expiryData, setExpiryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('near-expiry');
  const [selectedItem, setSelectedItem] = useState(null);

  const cardsRef = useRef([]);
  const statsRef = useRef([]);
  const tabRefs = useRef([]);
  const modalRef = useRef(null);

  useEffect(() => {
    fetchExpiryData();
  }, []);

  useEffect(() => {
    // Animate cards on data load
    if (!loading && cardsRef.current.length > 0) {
      gsap.fromTo(cardsRef.current,
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
  }, [loading, expiryData, activeTab]);

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
  }, [expiryData]);

  useEffect(() => {
    // Animate tab changes
    if (tabRefs.current.length > 0) {
      gsap.fromTo(tabRefs.current,
        { scale: 0.95 },
        {
          scale: 1,
          stagger: 0.05,
          duration: 0.3,
          ease: "power2.out"
        }
      );
    }
  }, [activeTab]);

  const fetchExpiryData = async () => {
    try {
      const res = await fetch('/api/medical/expiry/list');
      const data = await res.json();
      if (res.ok) {
        setExpiryData(data);
      } else {
        setError(data.error || 'Failed to load expiry data');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const getStatusBadge = (status, daysUntilExpiry) => {
    if (status === 'EXPIRED') {
      return { 
        text: '🚨 EXPIRED', 
        color: 'hospital-danger', 
        bgColor: 'hospital-danger-light',
        icon: '🚨'
      };
    } else if (status === 'NEAR_EXPIRY') {
      return { 
        text: daysUntilExpiry <= 0 ? '⚠️ EXPIRING TODAY' : `⏰ ${daysUntilExpiry} days left`,
        color: 'hospital-warning', 
        bgColor: 'hospital-warning-light',
        icon: '⏰'
      };
    }
    return { 
      text: '✅ SAFE', 
      color: 'hospital-success', 
      bgColor: 'hospital-success-light',
      icon: '✅'
    };
  };

  const getActionSuggestions = (status, daysUntilExpiry) => {
    if (status === 'EXPIRED') {
      return [
        { action: '🚫 Lock Sales', description: 'Immediately prevent sales', icon: '🚫' },
        { action: '↩️ Return', description: 'Contact supplier for return', icon: '↩️' },
        { action: '🗑️ Dispose', description: 'Safely remove from inventory', icon: '🗑️' }
      ];
    } else if (status === 'NEAR_EXPIRY' && daysUntilExpiry <= 7) {
      return [
        { action: '💰 50% Off', description: 'Urgent clearance sale', icon: '💰' },
        { action: '📢 Promote', description: 'Highlight in promotions', icon: '📢' },
        { action: '🔄 Exchange', description: 'Request fresh stock', icon: '🔄' }
      ];
    } else if (status === 'NEAR_EXPIRY') {
      return [
        { action: '📊 Monitor', description: 'Track daily movement', icon: '📊' },
        { action: '🏷️ Adjust Price', description: 'Apply 10-20% discount', icon: '🏷️' },
        { action: '📦 Reorder', description: 'Plan replacement stock', icon: '📦' }
      ];
    }
    return [];
  };

  const openItemModal = (item, supplierName) => {
    setSelectedItem({ ...item, supplierName });
    if (modalRef.current) {
      gsap.fromTo(modalRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.2)" }
      );
    }
  };

  const closeItemModal = () => {
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.2,
        onComplete: () => setSelectedItem(null)
      });
    }
  };

  const handleContactSupplier = (supplierName, contactNumber) => {
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 px-6 py-3 bg-hospital-blue text-white rounded-xl shadow-lg z-50 animate-slideInRight';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-xl">📞</span>
        <div>
          <div class="font-bold">Contacting ${supplierName}</div>
          <div class="text-sm opacity-90">${contactNumber || 'No contact number available'}</div>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      gsap.to(notification, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        onComplete: () => notification.remove()
      });
    }, 3000);
  };

  const getCurrentData = () => {
    if (!expiryData) return {};

    switch (activeTab) {
      case 'expired':
        return expiryData.expiredItems || {};
      case 'near-expiry':
        return expiryData.nearExpiryItems || {};
      case 'normal':
        return expiryData.normalItems || {};
      default:
        return expiryData.nearExpiryItems || {};
    }
  };

  const getTabCount = (tab) => {
    if (!expiryData) return 0;
    const data = tab === 'expired' ? expiryData.expiredItems :
                 tab === 'near-expiry' ? expiryData.nearExpiryItems :
                 expiryData.normalItems;
    if (!data) return 0;
    return Object.values(data).reduce((total, supplier) => total + (supplier.items?.length || 0), 0);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-hospital-blue-light to-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-hospital-blue mx-auto mb-4"></div>
        <p className="text-hospital-gray-dark text-lg">Loading expiry management data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-b from-hospital-blue-light to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md border border-hospital-blue-light">
        <div className="text-6xl text-hospital-danger mb-4 text-center">⚠️</div>
        <h2 className="text-2xl font-bold text-hospital-gray-dark mb-2 text-center">Error Loading Data</h2>
        <p className="text-hospital-gray mb-6 text-center">{error}</p>
        <button
          onClick={fetchExpiryData}
          className="w-full px-6 py-3 bg-hospital-blue hover:bg-hospital-blue-dark text-white font-semibold rounded-xl transition-all duration-200"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-hospital-blue-light to-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-hospital-gray-dark mb-3 flex items-center gap-3">
          <span className="text-4xl text-hospital-blue">⏰</span>
          Expiry & Dead-Stock Management
        </h1>
        <p className="text-hospital-gray text-lg">
          Monitor and manage medicine expiry dates to prevent losses and ensure patient safety
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
          ref={el => statsRef.current[0] = el}
          className="bg-gradient-to-r from-hospital-danger to-red-600 rounded-2xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold mb-1">{expiryData?.summary?.totalExpired || 0}</div>
              <div className="text-lg font-semibold">Expired Items</div>
            </div>
            <div className="text-5xl animate-pulse">🚨</div>
          </div>
        </div>

        <div 
          ref={el => statsRef.current[1] = el}
          className="bg-gradient-to-r from-hospital-warning to-orange-600 rounded-2xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold mb-1">{expiryData?.summary?.totalNearExpiry || 0}</div>
              <div className="text-lg font-semibold">Near Expiry</div>
              <div className="text-sm opacity-90">(&lt; 30 days)</div>
            </div>
            <div className="text-5xl animate-pulse">⏰</div>
          </div>
        </div>

        <div 
          ref={el => statsRef.current[2] = el}
          className="bg-gradient-to-r from-hospital-success to-green-600 rounded-2xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold mb-1">{expiryData?.summary?.totalNormal || 0}</div>
              <div className="text-lg font-semibold">Safe Stock</div>
              <div className="text-sm opacity-90">(&gt; 30 days)</div>
            </div>
            <div className="text-5xl">✅</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-hospital-blue-light p-2 mb-8">
        <div className="flex gap-2">
          {[
            { key: 'near-expiry', label: 'Near Expiry', icon: '⏰', color: 'hospital-warning' },
            { key: 'expired', label: 'Expired', icon: '🚨', color: 'hospital-danger' },
            { key: 'normal', label: 'Safe Stock', icon: '✅', color: 'hospital-success' }
          ].map((tab, index) => (
            <button
              key={tab.key}
              ref={el => tabRefs.current[index] = el}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
                activeTab === tab.key
                  ? `bg-${tab.color} text-white shadow-lg`
                  : 'bg-hospital-blue-light text-hospital-gray-dark hover:bg-hospital-blue/20'
              }`}
            >
              <span className="text-2xl">{tab.icon}</span>
              <div className="text-left">
                <div>{tab.label}</div>
                <div className="text-sm font-normal opacity-90">
                  {getTabCount(tab.key)} items
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {Object.keys(getCurrentData()).length > 0 ? (
          Object.entries(getCurrentData()).map(([supplierName, supplierData], supplierIndex) => (
            <div
              key={supplierName}
              ref={el => cardsRef.current[supplierIndex] = el}
              className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 ${
                activeTab === 'expired' ? 'border-hospital-danger' :
                activeTab === 'near-expiry' ? 'border-hospital-warning' :
                'border-hospital-success'
              }`}
            >
              {/* Supplier Header */}
              <div className="bg-gradient-to-r from-hospital-blue-light to-hospital-green-light p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-3xl">🏭</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-hospital-gray-dark">{supplierName}</h3>
                      {supplierData.supplier?.contactNumber && (
                        <p className="text-hospital-gray flex items-center gap-2 mt-1">
                          <span>📞</span>
                          {supplierData.supplier.contactNumber}
                        </p>
                      )}
                      <p className="text-sm text-hospital-gray mt-2">
                        {supplierData.items?.length || 0} item(s) requiring attention
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleContactSupplier(supplierName, supplierData.supplier?.contactNumber)}
                    className="px-6 py-3 bg-hospital-blue hover:bg-hospital-blue-dark text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <span>📞</span>
                    Contact Supplier
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="p-6">
                <div className="space-y-4">
                  {supplierData.items?.map((item, itemIndex) => {
                    const badge = getStatusBadge(item.status, item.daysUntilExpiry);
                    const suggestions = getActionSuggestions(item.status, item.daysUntilExpiry);
                    const daysLeft = item.daysUntilExpiry;

                    return (
                      <div
                        key={item._id}
                        className={`p-5 rounded-xl border ${
                          itemIndex % 2 === 0 ? 'bg-hospital-off-white' : 'bg-white'
                        } ${badge.color === 'hospital-danger' ? 'border-hospital-danger/30' :
                          badge.color === 'hospital-warning' ? 'border-hospital-warning/30' :
                          'border-hospital-success/30'
                        } hover:shadow-md transition-all duration-200`}
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          {/* Left Column - Medicine Info */}
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                badge.color === 'hospital-danger' ? 'bg-hospital-danger-light' :
                                badge.color === 'hospital-warning' ? 'bg-hospital-warning-light' :
                                'bg-hospital-success-light'
                              }`}>
                                <span className={`text-2xl ${
                                  badge.color === 'hospital-danger' ? 'text-hospital-danger' :
                                  badge.color === 'hospital-warning' ? 'text-hospital-warning' :
                                  'text-hospital-success'
                                }`}>
                                  {badge.icon}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                  <h4 className="text-lg font-bold text-hospital-gray-dark">
                                    {item.medicineId?.name || 'Unknown Medicine'}
                                  </h4>
                                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                    badge.color === 'hospital-danger' ? 'bg-hospital-danger-light text-hospital-danger' :
                                    badge.color === 'hospital-warning' ? 'bg-hospital-warning-light text-hospital-warning' :
                                    'bg-hospital-success-light text-hospital-success'
                                  }`}>
                                    {badge.text}
                                  </span>
                                </div>
                                <p className="text-hospital-gray mb-3">
                                  {item.medicineId?.brandName} • {item.medicineId?.strength} • Batch: {item.batchNumber}
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div className="bg-white p-3 rounded-lg border border-hospital-blue-light">
                                    <div className="text-sm text-hospital-gray">Available Stock</div>
                                    <div className="text-lg font-bold text-hospital-blue">{item.availableStock} units</div>
                                  </div>
                                  <div className="bg-white p-3 rounded-lg border border-hospital-blue-light">
                                    <div className="text-sm text-hospital-gray">Expiry Date</div>
                                    <div className={`text-lg font-bold ${
                                      daysLeft <= 7 ? 'text-hospital-danger' :
                                      daysLeft <= 30 ? 'text-hospital-warning' :
                                      'text-hospital-success'
                                    }`}>
                                      {new Date(item.expiryDate).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="bg-white p-3 rounded-lg border border-hospital-blue-light">
                                    <div className="text-sm text-hospital-gray">Cost Price</div>
                                    <div className="text-lg font-bold text-hospital-gray-dark">₹{item.costPrice?.toFixed(2) || '0.00'}</div>
                                  </div>
                                  <div className="bg-white p-3 rounded-lg border border-hospital-blue-light">
                                    <div className="text-sm text-hospital-gray">Total Value</div>
                                    <div className="text-lg font-bold text-hospital-blue">
                                      ₹{((item.availableStock || 0) * (item.costPrice || 0)).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right Column - Actions */}
                          <div className="md:w-80 space-y-4">
                            {suggestions.length > 0 && (
                              <div className="bg-gradient-to-r from-hospital-blue-light/50 to-hospital-green-light/50 p-4 rounded-xl">
                                <h5 className="font-semibold text-hospital-gray-dark mb-3 flex items-center gap-2">
                                  <span>💡</span>
                                  Recommended Actions
                                </h5>
                                <div className="space-y-3">
                                  {suggestions.map((suggestion, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-hospital-blue-light">
                                      <div className="text-2xl">{suggestion.icon}</div>
                                      <div className="flex-1">
                                        <div className="font-medium text-hospital-gray-dark">{suggestion.action}</div>
                                        <div className="text-sm text-hospital-gray">{suggestion.description}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button
                                onClick={() => openItemModal(item, supplierName)}
                                className="flex-1 px-4 py-2 bg-hospital-blue-light hover:bg-hospital-blue/20 text-hospital-blue font-medium rounded-lg transition-all duration-200 border border-hospital-blue/30"
                              >
                                👁️ Details
                              </button>
                              <button
                                onClick={() => handleContactSupplier(supplierName, supplierData.supplier?.contactNumber)}
                                className="flex-1 px-4 py-2 bg-hospital-warning hover:bg-hospital-warning-dark text-white font-medium rounded-lg transition-all duration-200"
                              >
                                📞 Contact
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center animate-fadeIn">
            <div className="text-6xl mb-6">
              {activeTab === 'expired' ? '🚨' : activeTab === 'near-expiry' ? '⏰' : '✅'}
            </div>
            <h3 className="text-2xl font-bold text-hospital-gray-dark mb-4">
              {activeTab === 'expired' ? 'No Expired Items Found' :
               activeTab === 'near-expiry' ? 'Excellent Inventory Management!' :
               'All Items Are Safe and Well-Maintained'}
            </h3>
            <p className="text-hospital-gray text-lg max-w-2xl mx-auto">
              {activeTab === 'expired' ? 'Great job! All your medicines are within their expiry dates.' :
               activeTab === 'near-expiry' ? 'Your inventory is well-maintained with no items expiring soon.' :
               'Continue with your excellent inventory management practices.'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-hospital-blue-light">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-hospital-gray">
            <p className="font-medium">📊 Expiry Management Tips:</p>
            <p className="text-sm">• Check expiry dates daily • Rotate stock (FIFO) • Set expiry alerts • Maintain supplier contacts</p>
          </div>
          <Link
            href="/medical/dashboard"
            className="px-6 py-3 bg-hospital-blue hover:bg-hospital-blue-dark text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-hospital-blue to-hospital-blue-dark p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="text-3xl">💊</span>
                  Medicine Details
                </h3>
                <button
                  onClick={closeItemModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                >
                  <span className="text-2xl text-white">✕</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Medicine Information */}
                <div className="bg-hospital-blue-light p-4 rounded-xl border border-hospital-blue-light">
                  <h4 className="text-lg font-semibold text-hospital-gray-dark mb-3 flex items-center gap-2">
                    <span className="text-xl">💊</span>
                    Medicine Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-hospital-gray">Name:</span>
                      <span className="font-semibold text-hospital-gray-dark">{selectedItem.medicineId?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hospital-gray">Brand:</span>
                      <span className="font-semibold text-hospital-gray-dark">{selectedItem.medicineId?.brandName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hospital-gray">Strength:</span>
                      <span className="font-semibold text-hospital-gray-dark">{selectedItem.medicineId?.strength}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hospital-gray">Batch No:</span>
                      <code className="font-semibold text-hospital-blue bg-hospital-blue-light px-2 py-1 rounded">
                        {selectedItem.batchNumber}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Expiry Information */}
                <div className="bg-hospital-blue-light p-4 rounded-xl border border-hospital-blue-light">
                  <h4 className="text-lg font-semibold text-hospital-gray-dark mb-3 flex items-center gap-2">
                    <span className="text-xl">⏰</span>
                    Expiry Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-hospital-gray">Expiry Date:</span>
                      <span className="font-semibold text-hospital-gray-dark">
                        {new Date(selectedItem.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hospital-gray">Days Left:</span>
                      <span className={`font-bold ${
                        selectedItem.daysUntilExpiry <= 0 ? 'text-hospital-danger' :
                        selectedItem.daysUntilExpiry <= 7 ? 'text-hospital-warning' :
                        'text-hospital-success'
                      }`}>
                        {selectedItem.daysUntilExpiry <= 0 ? 'Expired' : `${selectedItem.daysUntilExpiry} days`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hospital-gray">Stock Available:</span>
                      <span className="font-bold text-hospital-blue">{selectedItem.availableStock} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hospital-gray">Total Value:</span>
                      <span className="font-bold text-hospital-green">
                        ₹{((selectedItem.availableStock || 0) * (selectedItem.costPrice || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div className="bg-hospital-blue-light p-4 rounded-xl border border-hospital-blue-light mb-6">
                <h4 className="text-lg font-semibold text-hospital-gray-dark mb-3 flex items-center gap-2">
                  <span className="text-xl">🏭</span>
                  Supplier Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-hospital-gray text-sm">Supplier Name</div>
                    <div className="font-semibold text-hospital-gray-dark">{selectedItem.supplierName}</div>
                  </div>
                  <div>
                    <div className="text-hospital-gray text-sm">Contact</div>
                    <div className="font-semibold text-hospital-gray-dark">
                      {selectedItem.supplier?.contactNumber || 'Not available'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleContactSupplier(selectedItem.supplierName, selectedItem.supplier?.contactNumber)}
                  className="flex-1 px-6 py-3 bg-hospital-blue hover:bg-hospital-blue-dark text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>📞</span>
                  Contact Supplier
                </button>
                <button
                  onClick={closeItemModal}
                  className="flex-1 px-6 py-3 bg-hospital-gray-light hover:bg-hospital-gray text-hospital-gray-dark font-semibold rounded-xl transition-all duration-200"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}