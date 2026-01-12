// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';

// export default function AddInventory() {
//   const [medicines, setMedicines] = useState([]);
//   const [suppliers, setSuppliers] = useState([]);
//   const [form, setForm] = useState({
//     medicineId: '',
//     supplierId: '',
//     batchNumber: '',
//     expiryDate: '',
//     purchasePrice: '',
//     sellingPrice: '',
//     totalStock: '',
//     reorderLevel: '10',
//   });

//   // Purchase data for auto-filling
//   const [purchaseData, setPurchaseData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const router = useRouter();

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const [medicinesRes, suppliersRes, purchasesRes] = await Promise.all([
//         fetch('/api/medical/medicines'),
//         fetch('/api/medical/suppliers'),
//         fetch('/api/medical/purchases/list'), // Fetch purchases for auto-fill
//       ]);

//       const medicinesData = await medicinesRes.json();
//       const suppliersData = await suppliersRes.json();
//       const purchasesData = await purchasesRes.json();

//       if (medicinesRes.ok) setMedicines(medicinesData.medicines || []);
//       if (suppliersRes.ok) setSuppliers(suppliersData.suppliers || []);
//       if (purchasesRes.ok) setPurchaseData(purchasesData.purchases || []);
//     } catch (err) {
//       setError('Failed to load data');
//     }
//   };

//   // Auto-fill from purchase data when medicine is selected
//   const handleMedicineChange = (medicineId) => {
//     setForm(prev => ({ ...prev, medicineId }));

//     // Find existing purchase for this medicine
//     const existingPurchase = purchaseData.find(purchase =>
//       purchase.items.some(item => item.medicineId === medicineId)
//     );

//     if (existingPurchase) {
//       // Find the specific item in the purchase
//       const purchaseItem = existingPurchase.items.find(item => item.medicineId === medicineId);

//       if (purchaseItem) {
//         setForm(prev => ({
//           ...prev,
//           supplierId: existingPurchase.supplierId,
//           batchNumber: purchaseItem.batchNumber || '',
//           expiryDate: purchaseItem.expiryDate ?
//             new Date(purchaseItem.expiryDate).toISOString().split('T')[0] : '',
//           purchasePrice: purchaseItem.purchasePrice?.toString() || '',
//           totalStock: purchaseItem.quantity?.toString() || '', // Auto-fill total stock from purchase
//         }));
//       }
//     } else {
//       // Clear auto-filled fields if no purchase found
//       setForm(prev => ({
//         ...prev,
//         supplierId: '',
//         batchNumber: '',
//         expiryDate: '',
//         purchasePrice: '',
//         totalStock: '',
//       }));
//     }
//   };

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       const res = await fetch('/api/medical/inventory/add', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           ...form,
//           purchasePrice: parseFloat(form.purchasePrice),
//           sellingPrice: parseFloat(form.sellingPrice),
//           totalStock: parseInt(form.totalStock),
//           reorderLevel: parseInt(form.reorderLevel),
//         }),
//       });

//       const data = await res.json();
//       if (res.ok) {
//         alert('Inventory added successfully');
//         router.push('/medical/inventory');
//       } else {
//         setError(data.error || 'Failed to add inventory');
//       }
//     } catch (err) {
//       setError('Network error');
//     }
//     setLoading(false);
//   };

//   return (
//     <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
//       <h1>Add Inventory</h1>
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//       <form onSubmit={handleSubmit}>
//         <select
//           name="medicineId"
//           value={form.medicineId}
//           onChange={(e) => handleMedicineChange(e.target.value)}
//           required
//           style={{ display: 'block', margin: '10px 0', width: '100%' }}
//         >
//           <option value="">Select Medicine (auto-fills from purchases)</option>
//           {medicines.map((medicine) => (
//             <option key={medicine._id} value={medicine._id}>
//               {medicine.name} - {medicine.brandName} ({medicine.strength})
//             </option>
//           ))}
//         </select>

//         <select
//           name="supplierId"
//           value={form.supplierId}
//           onChange={handleChange}
//           required
//           style={{ display: 'block', margin: '10px 0', width: '100%' }}
//         >
//           <option value="">Select Supplier</option>
//           {suppliers.map((supplier) => (
//             <option key={supplier._id} value={supplier._id}>
//               {supplier.name} - {supplier.companyName}
//             </option>
//           ))}
//         </select>



//         <input
//           type="text"
//           name="batchNumber"
//           placeholder="Batch Number"
//           value={form.batchNumber}
//           onChange={handleChange}
//           required
//           style={{ display: 'block', margin: '10px 0', width: '100%' }}
//         />

//         <input
//           type="date"
//           name="expiryDate"
//           placeholder="Expiry Date"
//           value={form.expiryDate}
//           onChange={handleChange}
//           required
//           min={new Date().toISOString().split('T')[0]}
//           style={{ display: 'block', margin: '10px 0', width: '100%' }}
//         />

//         <input
//           type="number"
//           name="purchasePrice"
//           placeholder="Purchase Price per unit"
//           value={form.purchasePrice}
//           onChange={handleChange}
//           required
//           min="0"
//           step="0.01"
//           style={{ display: 'block', margin: '10px 0', width: '100%' }}
//         />

//         <input
//           type="number"
//           name="sellingPrice"
//           placeholder="Selling Price per unit"
//           value={form.sellingPrice}
//           onChange={handleChange}
//           required
//           min="0"
//           step="0.01"
//           style={{ display: 'block', margin: '10px 0', width: '100%' }}
//         />

//         <input
//           type="number"
//           name="totalStock"
//           placeholder="Total Stock Quantity"
//           value={form.totalStock}
//           onChange={handleChange}
//           required
//           min="1"
//           style={{ display: 'block', margin: '10px 0', width: '100%' }}
//         />

//         <input
//           type="number"
//           name="reorderLevel"
//           placeholder="Reorder Level (default: 10)"
//           value={form.reorderLevel}
//           onChange={handleChange}
//           min="1"
//           style={{ display: 'block', margin: '10px 0', width: '100%' }}
//         />

//         <button type="submit" disabled={loading} style={{ padding: '10px', width: '100%', marginTop: '20px' }}>
//           {loading ? 'Adding...' : 'Add Inventory'}
//         </button>
//       </form>
//     </div>
//   );
// }


'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';

export default function AddInventory() {
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({
    medicineId: '',
    supplierId: '',
    batchNumber: '',
    expiryDate: '',
    purchasePrice: '',
    sellingPrice: '',
    totalStock: '',
    reorderLevel: '10',
  });

  const [purchaseData, setPurchaseData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const formRef = useRef(null);
  const cardsRef = useRef([]);
  const successRef = useRef(null);

  useEffect(() => {
    fetchData();
    
    // Animate form entrance
    if (formRef.current) {
      gsap.fromTo(formRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, []);

  useEffect(() => {
    // Animate cards
    if (cardsRef.current.length > 0) {
      gsap.fromTo(cardsRef.current,
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          stagger: 0.1,
          duration: 0.4,
          ease: "back.out(1.2)"
        }
      );
    }
  }, [medicines, suppliers]);

  const fetchData = async () => {
    try {
      const [medicinesRes, suppliersRes, purchasesRes] = await Promise.all([
        fetch('/api/medical/medicines'),
        fetch('/api/medical/suppliers'),
        fetch('/api/medical/purchases/list'),
      ]);

      const medicinesData = await medicinesRes.json();
      const suppliersData = await suppliersRes.json();
      const purchasesData = await purchasesRes.json();

      if (medicinesRes.ok) setMedicines(medicinesData.medicines || []);
      if (suppliersRes.ok) setSuppliers(suppliersData.suppliers || []);
      if (purchasesRes.ok) setPurchaseData(purchasesData.purchases || []);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  const handleMedicineChange = (medicineId) => {
    setForm(prev => ({ ...prev, medicineId }));

    // Find existing purchase for this medicine
    const existingPurchase = purchaseData.find(purchase =>
      purchase.items.some(item => item.medicineId === medicineId)
    );

    if (existingPurchase) {
      const purchaseItem = existingPurchase.items.find(item => item.medicineId === medicineId);

      if (purchaseItem) {
        // Animate auto-fill
        gsap.to(".auto-fill-highlight", {
          backgroundColor: "#dbeafe",
          duration: 0.3,
          repeat: 2,
          yoyo: true
        });

        setForm(prev => ({
          ...prev,
          supplierId: existingPurchase.supplierId,
          batchNumber: purchaseItem.batchNumber || '',
          expiryDate: purchaseItem.expiryDate ?
            new Date(purchaseItem.expiryDate).toISOString().split('T')[0] : '',
          purchasePrice: purchaseItem.purchasePrice?.toString() || '',
          totalStock: purchaseItem.quantity?.toString() || '',
        }));

        // Show auto-fill notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 px-6 py-3 bg-blue-500 text-white rounded-xl shadow-lg z-50 animate-slideInRight';
        notification.textContent = '✨ Fields auto-filled from recent purchase';
        document.body.appendChild(notification);
        
        setTimeout(() => {
          gsap.to(notification, {
            opacity: 0,
            y: -20,
            duration: 0.3,
            onComplete: () => notification.remove()
          });
        }, 3000);
      }
    } else {
      setForm(prev => ({
        ...prev,
        supplierId: '',
        batchNumber: '',
        expiryDate: '',
        purchasePrice: '',
        totalStock: '',
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/medical/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          purchasePrice: parseFloat(form.purchasePrice),
          sellingPrice: parseFloat(form.sellingPrice),
          totalStock: parseInt(form.totalStock),
          reorderLevel: parseInt(form.reorderLevel),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Show success animation
        setSuccess(true);
        if (successRef.current) {
          gsap.fromTo(successRef.current,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
          );
        }

        // Redirect after delay
        setTimeout(() => {
          router.push('/medical/inventory');
        }, 2000);
      } else {
        setError(data.error || 'Failed to add inventory');
        
        // Shake form on error
        gsap.to(formRef.current, {
          x: [-10, 10, -10, 10, 0],
          duration: 0.5,
          ease: "power2.out"
        });
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const calculateMargin = () => {
    const purchase = parseFloat(form.purchasePrice);
    const selling = parseFloat(form.sellingPrice);
    if (purchase > 0 && selling > 0) {
      const margin = ((selling - purchase) / purchase) * 100;
      return margin.toFixed(2);
    }
    return 0;
  };

  const getSelectedMedicine = () => {
    return medicines.find(m => m._id === form.medicineId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center animate-fadeInUp">
          <h1 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            <span className="text-5xl">📦</span>
            Add New Inventory
          </h1>
          <p className="text-gray-600 text-lg">
            Add medical inventory items with auto-fill from purchase records
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div 
            ref={el => cardsRef.current[0] = el}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💊</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{medicines.length}</h3>
                <p className="text-gray-600 text-sm">Total Medicines</p>
              </div>
            </div>
          </div>

          <div 
            ref={el => cardsRef.current[1] = el}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏭</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{suppliers.length}</h3>
                <p className="text-gray-600 text-sm">Active Suppliers</p>
              </div>
            </div>
          </div>

          <div 
            ref={el => cardsRef.current[2] = el}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{purchaseData.length}</h3>
                <p className="text-gray-600 text-sm">Purchase Records</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div 
          ref={formRef}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-300"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">➕</span>
              Inventory Entry Form
            </h2>
            <p className="text-blue-100 mt-2">
              Fill in the details below. Medicine selection auto-fills from recent purchases.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl animate-shake">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="font-bold">Error</h3>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Medicine Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-xl">💊</span>
                Select Medicine
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Auto-fills from purchases
                </span>
              </label>
              <select
                name="medicineId"
                value={form.medicineId}
                onChange={(e) => handleMedicineChange(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Choose a medicine...</option>
                {medicines.map((medicine) => (
                  <option key={medicine._id} value={medicine._id}>
                    {medicine.name} - {medicine.brandName} ({medicine.strength})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Supplier Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-xl">🏭</span>
                  Supplier
                </label>
                <select
                  name="supplierId"
                  value={form.supplierId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 auto-fill-highlight"
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name} ({supplier.companyName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-xl">🔢</span>
                  Batch Number
                </label>
                <input
                  type="text"
                  name="batchNumber"
                  placeholder="Enter batch number"
                  value={form.batchNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 auto-fill-highlight"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  placeholder="Expiry Date"
                  value={form.expiryDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 auto-fill-highlight"
                />
              </div>

              {/* Total Stock */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  Total Stock Quantity
                </label>
                <input
                  type="number"
                  name="totalStock"
                  placeholder="Enter quantity"
                  value={form.totalStock}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 auto-fill-highlight"
                />
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">💰</span>
                Pricing Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Purchase Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Purchase Price (₹)
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</div>
                    <input
                      type="number"
                      name="purchasePrice"
                      placeholder="0.00"
                      value={form.purchasePrice}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Selling Price (₹)
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</div>
                    <input
                      type="number"
                      name="sellingPrice"
                      placeholder="0.00"
                      value={form.sellingPrice}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Margin Display */}
              {form.purchasePrice && form.sellingPrice && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl border border-green-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-600">Margin</div>
                      <div className="text-2xl font-bold text-green-700">
                        {calculateMargin()}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Profit per unit</div>
                      <div className="text-xl font-bold text-green-700">
                        ₹{(parseFloat(form.sellingPrice) - parseFloat(form.purchasePrice)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reorder Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                Reorder Level
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Low stock alert trigger
                </span>
              </label>
              <input
                type="number"
                name="reorderLevel"
                placeholder="Default: 10 units"
                value={form.reorderLevel}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <p className="text-sm text-gray-500 mt-2">
                System will alert when stock falls below this level
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Adding Inventory...
                  </>
                ) : (
                  <>
                    <span className="text-2xl">✅</span>
                    Add to Inventory
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            Quick Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-blue-600 text-2xl mb-2">🔍</div>
              <h4 className="font-semibold text-gray-800 mb-2">Auto-Fill Feature</h4>
              <p className="text-sm text-gray-600">
                Select a medicine to auto-fill details from recent purchases
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-green-600 text-2xl mb-2">💰</div>
              <h4 className="font-semibold text-gray-800 mb-2">Profit Margin</h4>
              <p className="text-sm text-gray-600">
                Margin automatically calculated as you enter prices
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-yellow-600 text-2xl mb-2">⚠️</div>
              <h4 className="font-semibold text-gray-800 mb-2">Reorder Alerts</h4>
              <p className="text-sm text-gray-600">
                Set reorder level to get automatic low stock alerts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            ref={successRef}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <h3 className="text-2xl font-bold text-white mb-2">Success!</h3>
              <p className="text-green-100">Inventory item added successfully</p>
            </div>
            <div className="p-6 text-center">
              <div className="text-lg text-gray-600 mb-6">
                Redirecting to inventory management...
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full animate-progressBar"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}