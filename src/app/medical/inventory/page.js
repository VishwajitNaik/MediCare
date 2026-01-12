// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';

// export default function Inventory() {
//   const [inventory, setInventory] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [editingItem, setEditingItem] = useState(null);
//   const [editForm, setEditForm] = useState({
//     batchNumber: '',
//     expiryDate: '',
//     purchasePrice: '',
//     sellingPrice: '',
//     reorderLevel: '',
//   });

//   useEffect(() => {
//     fetchInventory();
//   }, []);

//   const fetchInventory = async () => {
//     try {
//       const res = await fetch('/api/medical/inventory/list');
//       const data = await res.json();
//       if (res.ok) {
//         setInventory(data.inventory);
//       } else {
//         setError(data.error || 'Failed to load inventory');
//       }
//     } catch (err) {
//       setError('Network error');
//     }
//     setLoading(false);
//   };

//   const handleEdit = (item) => {
//     setEditingItem(item._id);
//     setEditForm({
//       batchNumber: item.batchNumber,
//       expiryDate: new Date(item.expiryDate).toISOString().split('T')[0], // Format for date input
//       purchasePrice: item.purchasePrice.toString(),
//       sellingPrice: item.sellingPrice.toString(),
//       reorderLevel: item.reorderLevel.toString(),
//     });
//   };

//   const handleEditSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await fetch(`/api/medical/inventory/${editingItem}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           batchNumber: editForm.batchNumber,
//           expiryDate: editForm.expiryDate,
//           purchasePrice: parseFloat(editForm.purchasePrice),
//           sellingPrice: parseFloat(editForm.sellingPrice),
//           reorderLevel: parseInt(editForm.reorderLevel),
//         }),
//       });

//       if (res.ok) {
//         alert('Inventory updated successfully');
//         setEditingItem(null);
//         fetchInventory(); // Refresh the list
//       } else {
//         const data = await res.json();
//         alert(data.error || 'Failed to update inventory');
//       }
//     } catch (err) {
//       alert('Network error');
//     }
//   };

//   const closeModal = () => {
//     setEditingItem(null);
//     setEditForm({
//       batchNumber: '',
//       expiryDate: '',
//       purchasePrice: '',
//       sellingPrice: '',
//       reorderLevel: '',
//     });
//   };

//   const handleDelete = async (id, availableStock) => {
//     if (availableStock > 0) {
//       alert('Cannot delete inventory with available stock. Please ensure all stock is dispensed first.');
//       return;
//     }

//     if (confirm('Are you sure you want to delete this inventory item?')) {
//       try {
//         const res = await fetch(`/api/medical/inventory/${id}`, {
//           method: 'DELETE',
//         });

//         if (res.ok) {
//           alert('Inventory deleted successfully');
//           fetchInventory(); // Refresh the list
//         } else {
//           const data = await res.json();
//           alert(data.error || 'Failed to delete inventory');
//         }
//       } catch (err) {
//         alert('Network error');
//       }
//     }
//   };



//   if (loading) return <div>Loading...</div>;
//   if (error) return <div>Error: {error}</div>;

//   return (
//     <div style={{ padding: '20px' }}>
//       <h1>Inventory Management</h1>
//       <Link href="/medical/inventory/add">
//         <button style={{ padding: '10px', marginBottom: '20px' }}>Add New Inventory</button>
//       </Link>

//       {/* Low Stock Alerts */}
//       {inventory.some(item => item.isLowStock) && (
//         <div style={{ background: '#ffe6e6', padding: '15px', marginBottom: '20px', border: '1px solid #ff9999', borderRadius: '4px' }}>
//           <h3 style={{ color: '#cc0000', margin: '0 0 10px 0' }}>⚠️ Low Stock Alerts</h3>
//           <ul style={{ margin: 0, paddingLeft: '20px' }}>
//             {inventory.filter(item => item.isLowStock).map(item => (
//               <li key={item._id} style={{ color: '#cc0000' }}>
//                 {item.medicineId?.name} - Only {item.availableStock} left (Reorder at {item.reorderLevel})
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Expired Items Alert */}
//       {inventory.some(item => item.isExpired) && (
//         <div style={{ background: '#ffcccc', padding: '15px', marginBottom: '20px', border: '1px solid #ff6666', borderRadius: '4px' }}>
//           <h3 style={{ color: '#990000', margin: '0 0 10px 0' }}>🚨 Expired Items</h3>
//           <ul style={{ margin: 0, paddingLeft: '20px' }}>
//             {inventory.filter(item => item.isExpired).map(item => (
//               <li key={item._id} style={{ color: '#990000' }}>
//                 {item.medicineId?.name} - Batch {item.batchNumber} expired on {new Date(item.expiryDate).toLocaleDateString()}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//         <thead>
//           <tr style={{ borderBottom: '2px solid #333', background: '#f5f5f5' }}>
//             <th style={{ textAlign: 'left', padding: '12px', fontWeight: 'bold' }}>Medicine</th>
//             <th style={{ textAlign: 'left', padding: '12px', fontWeight: 'bold' }}>Batch</th>
//             <th style={{ textAlign: 'left', padding: '12px', fontWeight: 'bold' }}>Expiry</th>
//             <th style={{ textAlign: 'left', padding: '12px', fontWeight: 'bold' }}>Stock</th>
//             <th style={{ textAlign: 'left', padding: '12px', fontWeight: 'bold' }}>Available</th>
//             <th style={{ textAlign: 'left', padding: '12px', fontWeight: 'bold' }}>Supplier</th>
//             <th style={{ textAlign: 'left', padding: '12px', fontWeight: 'bold' }}>Prices</th>
//             <th style={{ textAlign: 'left', padding: '12px', fontWeight: 'bold' }}>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {inventory.map((item) => (
//             <tr
//               key={item._id}
//               style={{
//                 borderBottom: '1px solid #eee',
//                 background: item.isLowStock ? '#fff2f2' : item.isExpired ? '#ffeaea' : 'transparent'
//               }}
//             >
//               <td style={{ padding: '12px' }}>
//                 <div style={{ fontWeight: 'bold' }}>{item.medicineId?.name}</div>
//                 <div style={{ fontSize: '0.9em', color: '#666' }}>
//                   {item.medicineId?.brandName} ({item.medicineId?.strength})
//                 </div>
//               </td>
//               <td style={{ padding: '12px' }}>{item.batchNumber}</td>
//               <td style={{ padding: '12px' }}>
//                 <span style={{
//                   color: item.isExpired ? '#cc0000' : new Date(item.expiryDate) < new Date(Date.now() + 30*24*60*60*1000) ? '#ff6600' : '#009900'
//                 }}>
//                   {new Date(item.expiryDate).toLocaleDateString()}
//                 </span>
//               </td>
//               <td style={{ padding: '12px' }}>{item.totalStock}</td>
//               <td style={{ padding: '12px' }}>
//                 <span style={{ fontWeight: item.isLowStock ? 'bold' : 'normal', color: item.isLowStock ? '#cc0000' : 'inherit' }}>
//                   {item.availableStock}
//                 </span>
//                 {item.isLowStock && <div style={{ fontSize: '0.8em', color: '#cc0000' }}>Low Stock!</div>}
//               </td>
//               <td style={{ padding: '12px' }}>
//                 {item.supplierId?.name}
//                 <div style={{ fontSize: '0.9em', color: '#666' }}>{item.supplierId?.companyName}</div>
//               </td>
//      <td style={{ padding: '12px' }}>
//   <div>Buy: ₹{Number(item.purchasePrice).toFixed(2)}</div>
//   <div>Sell: ₹{Number(item.sellingPrice).toFixed(2)}</div>
// </td>

//               <td style={{ padding: '12px' }}>
//                 <button
//                   onClick={() => handleEdit(item)}
//                   style={{ marginRight: '5px', padding: '5px 10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '3px' }}
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => handleDelete(item._id, item.availableStock)}
//                   style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
//                 >
//                   Delete
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       {inventory.length === 0 && <p>No inventory items</p>}

//       {/* Edit Modal */}
//       {editingItem && (
//         <div style={{
//           position: 'fixed',
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//           background: 'rgba(0,0,0,0.5)',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           zIndex: 1000
//         }}>
//           <div style={{
//             background: 'white',
//             padding: '20px',
//             borderRadius: '8px',
//             width: '400px',
//             maxWidth: '90%'
//           }}>
//             <h3>Edit Inventory Item</h3>
//             <form onSubmit={handleEditSubmit}>
//               <div style={{ marginBottom: '15px' }}>
//                 <label>Batch Number:</label>
//                 <input
//                   type="text"
//                   value={editForm.batchNumber}
//                   onChange={(e) => setEditForm({...editForm, batchNumber: e.target.value})}
//                   required
//                   style={{ width: '100%', padding: '8px', marginTop: '5px' }}
//                 />
//               </div>

//               <div style={{ marginBottom: '15px' }}>
//                 <label>Expiry Date:</label>
//                 <input
//                   type="date"
//                   value={editForm.expiryDate}
//                   onChange={(e) => setEditForm({...editForm, expiryDate: e.target.value})}
//                   required
//                   style={{ width: '100%', padding: '8px', marginTop: '5px' }}
//                 />
//               </div>

//               <div style={{ marginBottom: '15px' }}>
//                 <label>Purchase Price:</label>
//                 <input
//                   type="number"
//                   step="0.01"
//                   value={editForm.purchasePrice}
//                   onChange={(e) => setEditForm({...editForm, purchasePrice: e.target.value})}
//                   required
//                   style={{ width: '100%', padding: '8px', marginTop: '5px' }}
//                 />
//               </div>

//               <div style={{ marginBottom: '15px' }}>
//                 <label>Selling Price:</label>
//                 <input
//                   type="number"
//                   step="0.01"
//                   value={editForm.sellingPrice}
//                   onChange={(e) => setEditForm({...editForm, sellingPrice: e.target.value})}
//                   required
//                   style={{ width: '100%', padding: '8px', marginTop: '5px' }}
//                 />
//               </div>

//               <div style={{ marginBottom: '20px' }}>
//                 <label>Reorder Level:</label>
//                 <input
//                   type="number"
//                   min="1"
//                   value={editForm.reorderLevel}
//                   onChange={(e) => setEditForm({...editForm, reorderLevel: e.target.value})}
//                   required
//                   style={{ width: '100%', padding: '8px', marginTop: '5px' }}
//                 />
//               </div>

//               <div style={{ display: 'flex', gap: '10px' }}>
//                 <button
//                   type="submit"
//                   style={{
//                     flex: 1,
//                     padding: '10px',
//                     background: '#28a745',
//                     color: 'white',
//                     border: 'none',
//                     borderRadius: '4px'
//                   }}
//                 >
//                   Update
//                 </button>
//                 <button
//                   type="button"
//                   onClick={closeModal}
//                   style={{
//                     flex: 1,
//                     padding: '10px',
//                     background: '#6c757d',
//                     color: 'white',
//                     border: 'none',
//                     borderRadius: '4px'
//                   }}
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    batchNumber: '',
    expiryDate: '',
    purchasePrice: '',
    sellingPrice: '',
    reorderLevel: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, lowStock, expired, normal

  const tableRef = useRef(null);
  const alertRefs = useRef([]);
  const modalRef = useRef(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    // Animate table rows on data load
    if (!loading && tableRef.current) {
      const rows = tableRef.current.querySelectorAll('tbody tr');
      gsap.fromTo(rows,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.05,
          duration: 0.4,
          ease: "power2.out"
        }
      );
    }
  }, [loading, inventory]);

  useEffect(() => {
    // Animate alerts
    if (alertRefs.current.length > 0) {
      gsap.fromTo(alertRefs.current,
        { scale: 0.9, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          stagger: 0.2,
          duration: 0.5,
          ease: "back.out(1.7)"
        }
      );
    }
  }, [inventory]);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/medical/inventory/list');
      const data = await res.json();
      if (res.ok) {
        setInventory(data.inventory);
      } else {
        setError(data.error || 'Failed to load inventory');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleEdit = (item) => {
    setEditingItem(item._id);
    setEditForm({
      batchNumber: item.batchNumber,
      expiryDate: new Date(item.expiryDate).toISOString().split('T')[0],
      purchasePrice: item.purchasePrice.toString(),
      sellingPrice: item.sellingPrice.toString(),
      reorderLevel: item.reorderLevel.toString(),
    });
    
    // Animate modal open
    if (modalRef.current) {
      gsap.fromTo(modalRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.2)" }
      );
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/medical/inventory/${editingItem}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchNumber: editForm.batchNumber,
          expiryDate: editForm.expiryDate,
          purchasePrice: parseFloat(editForm.purchasePrice),
          sellingPrice: parseFloat(editForm.sellingPrice),
          reorderLevel: parseInt(editForm.reorderLevel),
        }),
      });

      if (res.ok) {
        // Show success animation
        const successEl = document.createElement('div');
        successEl.className = 'fixed top-4 right-4 px-6 py-3 bg-green-500 text-white rounded-xl shadow-lg z-50 animate-slideInRight';
        successEl.textContent = '✅ Inventory updated successfully';
        document.body.appendChild(successEl);
        
        setTimeout(() => {
          gsap.to(successEl, {
            opacity: 0,
            y: -20,
            duration: 0.3,
            onComplete: () => successEl.remove()
          });
        }, 3000);

        setEditingItem(null);
        fetchInventory();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update inventory');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const closeModal = () => {
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          setEditingItem(null);
          setEditForm({
            batchNumber: '',
            expiryDate: '',
            purchasePrice: '',
            sellingPrice: '',
            reorderLevel: '',
          });
        }
      });
    }
  };

  const handleDelete = async (id, availableStock) => {
    if (availableStock > 0) {
      // Show warning animation
      const warningEl = document.createElement('div');
      warningEl.className = 'fixed top-4 right-4 px-6 py-3 bg-yellow-500 text-white rounded-xl shadow-lg z-50 animate-slideInRight';
      warningEl.textContent = '⚠️ Cannot delete inventory with available stock';
      document.body.appendChild(warningEl);
      
      setTimeout(() => {
        gsap.to(warningEl, {
          opacity: 0,
          y: -20,
          duration: 0.3,
          onComplete: () => warningEl.remove()
        });
      }, 3000);
      return;
    }

    if (confirm('Are you sure you want to delete this inventory item?')) {
      try {
        const res = await fetch(`/api/medical/inventory/${id}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          // Show delete animation for the row
          const row = document.querySelector(`[data-id="${id}"]`);
          if (row) {
            gsap.to(row, {
              opacity: 0,
              x: -100,
              duration: 0.3,
              onComplete: () => {
                fetchInventory();
              }
            });
          }
          
          // Success message
          const successEl = document.createElement('div');
          successEl.className = 'fixed top-4 right-4 px-6 py-3 bg-green-500 text-white rounded-xl shadow-lg z-50 animate-slideInRight';
          successEl.textContent = '✅ Inventory deleted successfully';
          document.body.appendChild(successEl);
          
          setTimeout(() => {
            gsap.to(successEl, {
              opacity: 0,
              y: -20,
              duration: 0.3,
              onComplete: () => successEl.remove()
            });
          }, 3000);
        } else {
          const data = await res.json();
          alert(data.error || 'Failed to delete inventory');
        }
      } catch (err) {
        alert('Network error');
      }
    }
  };

  // Filter inventory based on search and filter type
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.medicineId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplierId?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'lowStock' && item.isMedicineLowStock) ||
      (filter === 'expired' && item.isExpired) ||
      (filter === 'normal' && !item.isMedicineLowStock && !item.isExpired);

    return matchesSearch && matchesFilter;
  });

  // Get counts for filter badges
  const lowStockCount = inventory.filter(item => item.isMedicineLowStock).length;
  const expiredCount = inventory.filter(item => item.isExpired).length;
  const normalCount = inventory.filter(item => !item.isMedicineLowStock && !item.isExpired).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Loading inventory...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl m-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <h3 className="font-bold">Error Loading Inventory</h3>
          <p>{error}</p>
        </div>
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
              <span className="text-4xl">📦</span>
              Inventory Management
            </h1>
            <p className="text-gray-600 mt-2">Manage and monitor your medical inventory</p>
          </div>
          <Link href="/medical/inventory/add">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2">
              <span className="text-xl">➕</span>
              Add New Inventory
            </button>
          </Link>
        </div>

        {/* Search and Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search by medicine, batch, or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl">
              🔍
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Items <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">{inventory.length}</span>
            </button>
            <button
              onClick={() => setFilter('normal')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === 'normal'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              In Stock <span className="ml-1 px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">{normalCount}</span>
            </button>
            <button
              onClick={() => setFilter('lowStock')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === 'lowStock'
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Low Stock <span className="ml-1 px-2 py-1 bg-yellow-100 text-yellow-600 text-xs rounded-full">{lowStockCount}</span>
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === 'expired'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Expired <span className="ml-1 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">{expiredCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="space-y-4 mb-8">
        {/* Low Stock Alert */}
        {inventory.filter(item => item.isMedicineLowStock).length > 0 && (
          <div
            ref={el => alertRefs.current[0] = el}
            className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-5 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-800 mb-1">Low Stock Alerts (Medicine Level)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {inventory.filter(item => item.isMedicineLowStock).slice(0, 6).map(item => (
                    <div key={item._id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <span className="font-medium text-sm truncate">{item.medicineId?.name}</span>
                      <span className="font-bold text-yellow-600 ml-2">Total: {item.medicineTotalStock} left</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expired Items Alert */}
        {expiredCount > 0 && (
          <div 
            ref={el => alertRefs.current[1] = el}
            className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-5 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🚨</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-800 mb-1">Expired Items</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {inventory.filter(item => item.isExpired).slice(0, 6).map(item => (
                    <div key={item._id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div>
                        <span className="font-medium text-sm">{item.medicineId?.name}</span>
                        <div className="text-xs text-gray-500">Batch: {item.batchNumber}</div>
                      </div>
                      <span className="text-red-600 text-sm font-semibold">
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table ref={tableRef} className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Medicine Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Batch Info
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Stock Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredInventory.map((item, index) => (
                <tr 
                  key={item._id}
                  data-id={item._id}
                  className={`hover:bg-gray-50 transition-all duration-150 ${
                    item.isExpired ? 'bg-red-50' :
                    item.isMedicineLowStock ? 'bg-yellow-50' :
                    ''
                  }`}
                >
                  {/* Medicine Details */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        item.isExpired ? 'bg-red-500' :
                        item.isMedicineLowStock ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}></div>
                      <div>
                        <div className="font-semibold text-gray-900">{item.medicineId?.name}</div>
                        <div className="text-sm text-gray-500">
                          {item.medicineId?.brandName} • {item.medicineId?.strength}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Batch Info */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">#{item.batchNumber}</div>
                      <div className={`text-sm font-medium ${
                        item.isExpired ? 'text-red-600' : 
                        new Date(item.expiryDate) < new Date(Date.now() + 30*24*60*60*1000) ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {new Date(item.expiryDate).toLocaleDateString()}
                        {item.isExpired && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">EXPIRED</span>}
                      </div>
                    </div>
                  </td>

                  {/* Stock Status */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-semibold">{item.totalStock}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Available:</span>
                        <span className={`font-bold ${
                          item.isLowStock ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {item.availableStock}
                        </span>
                        {item.isMedicineLowStock && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full animate-pulse">
                            ⚠️ Low Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Supplier */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{item.supplierId?.name}</div>
                      <div className="text-sm text-gray-500">{item.supplierId?.companyName}</div>
                    </div>
                  </td>

                  {/* Pricing */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Buy:</span>
                        <span className="font-semibold text-blue-600">
                          ₹{Number(item.purchasePrice).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Sell:</span>
                        <span className="font-semibold text-green-600">
                          ₹{Number(item.sellingPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                      >
                        <span>✏️</span>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item._id, item.availableStock)}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                      >
                        <span>🗑️</span>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No inventory items found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">✏️</span>
                Edit Inventory Item
              </h3>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Number
                </label>
                <input
                  type="text"
                  value={editForm.batchNumber}
                  onChange={(e) => setEditForm({...editForm, batchNumber: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter batch number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={editForm.expiryDate}
                  onChange={(e) => setEditForm({...editForm, expiryDate: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.purchasePrice}
                    onChange={(e) => setEditForm({...editForm, purchasePrice: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.sellingPrice}
                    onChange={(e) => setEditForm({...editForm, sellingPrice: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reorder Level
                </label>
                <input
                  type="number"
                  min="1"
                  value={editForm.reorderLevel}
                  onChange={(e) => setEditForm({...editForm, reorderLevel: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Minimum stock level"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Update Item
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
