'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';

export default function AddPurchase() {
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(1); // 1: Supplier, 2: Items, 3: Review

  // Purchase form data
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Purchase items
  const [purchaseItems, setPurchaseItems] = useState([]);

  // Current item being added
  const [currentItem, setCurrentItem] = useState({
    medicineId: '',
    batchNumber: '',
    expiryDate: '',
    quantity: '',
    purchasePrice: '',
  });

  const router = useRouter();
  const formRef = useRef(null);
  const successRef = useRef(null);
  const itemCardsRef = useRef([]);
  const stepRefs = useRef([]);

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
    // Animate step indicators
    if (stepRefs.current.length > 0) {
      gsap.fromTo(stepRefs.current,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          stagger: 0.2,
          duration: 0.4,
          ease: "back.out(1.2)"
        }
      );
    }
  }, [activeStep]);

  useEffect(() => {
    // Animate item cards
    if (itemCardsRef.current.length > 0) {
      gsap.fromTo(itemCardsRef.current,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.1,
          duration: 0.3,
          ease: "power2.out"
        }
      );
    }
  }, [purchaseItems]);

  const fetchData = async () => {
    try {
      const [suppliersRes, medicinesRes] = await Promise.all([
        fetch('/api/medical/suppliers'),
        fetch('/api/common/medicines'),
      ]);

      const suppliersData = await suppliersRes.json();
      const medicinesData = await medicinesRes.json();

      console.log('Suppliers response:', suppliersData);
      console.log('Medicines response:', medicinesData);

      if (suppliersRes.ok) {
        setSuppliers(suppliersData.suppliers || []);
      } else {
        console.error('Suppliers fetch failed:', suppliersData);
        setError('Failed to load suppliers: ' + (suppliersData.error || 'Unknown error'));
      }

      if (medicinesRes.ok) {
        setMedicines(medicinesData.medicines || []);
      } else {
        console.error('Medicines fetch failed:', medicinesData);
        setError('Failed to load medicines: ' + (medicinesData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error: Failed to load data');
    }
  };

  const handleMedicineChange = (medicineId) => {
    setCurrentItem(prev => ({ ...prev, medicineId }));
  };

  const addPurchaseItem = () => {
    const {
      medicineId,
      batchNumber,
      expiryDate,
      quantity,
      purchasePrice,
    } = currentItem;

    if (!medicineId || !batchNumber || !expiryDate || !quantity || !purchasePrice) {
      setError('Please fill all fields for the purchase item');
      
      // Shake error
      gsap.to(".error-shake", {
        x: [-5, 5, -5, 5, 0],
        duration: 0.5,
        ease: "power2.out"
      });
      return;
    }

    const quantityNum = parseInt(quantity);
    const priceNum = parseFloat(purchasePrice);

    if (quantityNum <= 0 || priceNum <= 0) {
      setError('Quantity and price must be positive numbers');
      return;
    }

    const medicine = medicines.find(m => m._id === medicineId);
    const sellingPrice = Math.round((priceNum * 1.3) * 100) / 100; // 30% markup
    const total = quantityNum * priceNum;
    
    const newItem = {
      ...currentItem,
      quantity: quantityNum,
      purchasePrice: priceNum,
      sellingPrice: sellingPrice,
      medicineName: medicine?.name || 'Unknown',
      brandName: medicine?.brandName || '',
      strength: medicine?.strength || '',
      total: total,
    };

    setPurchaseItems([...purchaseItems, newItem]);
    
    // Show success animation
    const successEl = document.createElement('div');
    successEl.className = 'fixed top-4 right-4 px-6 py-3 bg-hospital-success text-white rounded-xl shadow-lg z-50 animate-slideInRight';
    successEl.textContent = `✅ Added ${medicine?.name || 'Medicine'} (${quantityNum} units)`;
    document.body.appendChild(successEl);
    
    setTimeout(() => {
      gsap.to(successEl, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        onComplete: () => successEl.remove()
      });
    }, 2000);

    // Reset form
    setCurrentItem({
      medicineId: '',
      batchNumber: '',
      expiryDate: '',
      quantity: '',
      purchasePrice: '',
    });
    setError('');
    
    // Move to next step if first item
    if (purchaseItems.length === 0) {
      setActiveStep(3);
    }
  };

  const removePurchaseItem = (index) => {
    const item = purchaseItems[index];
    gsap.to(`#item-${index}`, {
      opacity: 0,
      x: -100,
      duration: 0.3,
      onComplete: () => {
        setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
        
        // Show removed notification
        const removedEl = document.createElement('div');
        removedEl.className = 'fixed top-4 right-4 px-6 py-3 bg-hospital-warning text-white rounded-xl shadow-lg z-50 animate-slideInRight';
        removedEl.textContent = `🗑️ Removed ${item.medicineName}`;
        document.body.appendChild(removedEl);
        
        setTimeout(() => {
          gsap.to(removedEl, {
            opacity: 0,
            y: -20,
            duration: 0.3,
            onComplete: () => removedEl.remove()
          });
        }, 2000);
      }
    });
  };

  const calculateTotal = () => {
    return purchaseItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    return calculateTotal() * 0.18; // 18% GST
  };

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateTax();
  };

  const getSelectedSupplier = () => {
    return suppliers.find(s => s._id === supplierId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!supplierId) {
      setError('Please select supplier');
      return;
    }

    // Generate temporary invoice number if not provided
    const finalInvoiceNumber = invoiceNumber || `TEMP-${Date.now()}`;

    if (purchaseItems.length === 0) {
      setError('Please add at least one medicine to purchase');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const purchaseData = {
        supplierId,
        invoiceNumber: finalInvoiceNumber,
        items: purchaseItems.map(item => ({
          medicineId: item.medicineId,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
        })),
      };

      const res = await fetch('/api/medical/purchases/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseData),
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
          router.push('/medical/dashboard');
        }, 3000);
      } else {
        setError(data.error || 'Failed to record purchase');
        
        // Shake form on error
        if (formRef.current) {
          gsap.to(formRef.current, {
            x: [-10, 10, -10, 10, 0],
            duration: 0.5,
            ease: "power2.out"
          });
        }
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const invoiceNum = `INV-${year}${month}${day}-${random}`;
    setInvoiceNumber(invoiceNum);
    console.log('Generated invoice number:', invoiceNum);

    // Show success message
    const successEl = document.createElement('div');
    successEl.className = 'fixed top-4 right-4 px-6 py-3 bg-hospital-success text-white rounded-xl shadow-lg z-50 animate-slideInRight';
    successEl.innerHTML = `<span class="mr-2">✅</span>Generated: ${invoiceNum}`;
    document.body.appendChild(successEl);

    setTimeout(() => {
      gsap.to(successEl, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        onComplete: () => successEl.remove()
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-hospital-blue-light to-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-3xl md:text-4xl font-bold text-hospital-gray-dark mb-3 flex items-center gap-3">
            <span className="text-4xl text-hospital-blue">🛒</span>
            Record Purchase from Supplier
          </h1>
          <p className="text-hospital-gray">
            Record medicines purchased from suppliers to track costs and update inventory automatically
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div 
                  ref={el => stepRefs.current[step-1] = el}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    activeStep >= step 
                      ? step === activeStep
                        ? 'bg-hospital-blue text-white shadow-lg scale-110'
                        : 'bg-hospital-blue text-white'
                      : 'bg-hospital-gray-light text-hospital-gray'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-24 h-1 transition-all duration-300 ${
                    activeStep > step ? 'bg-hospital-blue' : 'bg-hospital-gray-light'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-24 text-center">
            <div className={`font-semibold ${activeStep >= 1 ? 'text-hospital-blue' : 'text-hospital-gray'}`}>
              Supplier Details
            </div>
            <div className={`font-semibold ${activeStep >= 2 ? 'text-hospital-blue' : 'text-hospital-gray'}`}>
              Add Medicines
            </div>
            <div className={`font-semibold ${activeStep >= 3 ? 'text-hospital-blue' : 'text-hospital-gray'}`}>
              Review & Submit
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div 
          ref={formRef}
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-hospital-blue-light"
        >
          <div className="bg-gradient-to-r from-hospital-blue to-hospital-blue-dark p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">💰</span>
              Purchase Entry Form
            </h2>
            <p className="text-white/90 mt-2">
              Complete all steps to record a new purchase
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-hospital-danger-light border border-hospital-danger text-hospital-danger px-6 py-4 rounded-xl animate-shake error-shake">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="font-bold">Purchase Error</h3>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Supplier Details */}
            <div className={`space-y-6 ${activeStep !== 1 ? 'hidden' : ''}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-hospital-gray-dark flex items-center gap-2">
                  <span className="text-xl text-hospital-blue">🏭</span>
                  Supplier Information
                </h3>
                <span className="text-sm text-hospital-gray">Step 1 of 3</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supplier Selection */}
                <div>
                  <label className="block text-sm font-semibold text-hospital-gray-dark mb-2">
                    Select Supplier *
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => {
                      setSupplierId(e.target.value);
                      if (e.target.value) setActiveStep(2);
                    }}
                    className="select-hospital w-full"
                    required
                  >
                    <option value="">
                      {suppliers.length === 0 ? 'Loading suppliers...' : 'Choose a supplier...'}
                    </option>
                    {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name} - {supplier.companyName}
                      </option>
                    ))}
                  </select>
                  {suppliers.length === 0 && (
                    <p className="text-sm text-hospital-warning mt-2">
                      ⚠️ No suppliers found. Please add suppliers first in the Suppliers section.
                    </p>
                  )}
                  {supplierId && (
                    <div className="mt-2 p-3 bg-hospital-blue-light rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-hospital-blue rounded-full flex items-center justify-center">
                          <span className="text-white">🏭</span>
                        </div>
                        <div>
                          <div className="font-medium">{getSelectedSupplier()?.name}</div>
                          <div className="text-sm text-hospital-gray">{getSelectedSupplier()?.mobile}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Invoice Number */}
                <div>
                  <label className="block text-sm font-semibold text-hospital-gray-dark mb-2">
                    Invoice Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g., INV-2025-001"
                      className="input-hospital flex-1"
                    />
                    <button
                      type="button"
                      onClick={generateInvoiceNumber}
                      className="px-4 py-3 bg-hospital-success hover:bg-hospital-success-dark text-white font-medium rounded-xl transition-all duration-200"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="text-sm text-hospital-gray mt-2">
                    Optional: Get from supplier's bill, or auto-generate
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-hospital-blue-light">
                <div></div>
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  disabled={!supplierId}
                  className="px-6 py-3 bg-hospital-blue hover:bg-hospital-blue-dark text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next: Add Medicines
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Step 2: Add Medicines */}
            <div className={`space-y-6 ${activeStep !== 2 ? 'hidden' : ''}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-hospital-gray-dark flex items-center gap-2">
                  <span className="text-xl text-hospital-blue">💊</span>
                  Add Purchase Items
                </h3>
                <span className="text-sm text-hospital-gray">Step 2 of 3</span>
              </div>

              {/* Add Item Form */}
              <div className="border-2 border-dashed border-hospital-blue-light p-6 rounded-2xl">
                <h4 className="text-md font-semibold text-hospital-gray-dark mb-4">Add New Medicine</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                  {/* Medicine */}
                  <div>
                    <label className="block text-xs font-medium text-hospital-gray mb-2">
                      Medicine *
                    </label>
                    <select
                      value={currentItem.medicineId}
                      onChange={(e) => handleMedicineChange(e.target.value)}
                      className="select-hospital w-full text-sm"
                    >
                      <option value="">Select medicine</option>
                      {medicines.map((medicine) => (
                        <option key={medicine._id} value={medicine._id}>
                          {medicine.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Batch Number */}
                  <div>
                    <label className="block text-xs font-medium text-hospital-gray mb-2">
                      Batch Number *
                    </label>
                    <input
                      type="text"
                      value={currentItem.batchNumber}
                      onChange={(e) => setCurrentItem({...currentItem, batchNumber: e.target.value})}
                      placeholder="BT2025001"
                      className="input-hospital w-full text-sm"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="block text-xs font-medium text-hospital-gray mb-2">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      value={currentItem.expiryDate}
                      onChange={(e) => setCurrentItem({...currentItem, expiryDate: e.target.value})}
                      className="input-hospital w-full text-sm"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-xs font-medium text-hospital-gray mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})}
                      placeholder="100"
                      className="input-hospital w-full text-sm"
                    />
                  </div>

                  {/* Purchase Price */}
                  <div>
                    <label className="block text-xs font-medium text-hospital-gray mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={currentItem.purchasePrice}
                      onChange={(e) => setCurrentItem({...currentItem, purchasePrice: e.target.value})}
                      placeholder="5.50"
                      className="input-hospital w-full text-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addPurchaseItem}
                  className="px-6 py-3 bg-hospital-success hover:bg-hospital-success-dark text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2"
                >
                  <span className="text-xl">➕</span>
                  Add Medicine to Purchase
                </button>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-hospital-blue-light">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-6 py-3 bg-hospital-gray-light hover:bg-hospital-gray text-hospital-gray-dark font-semibold rounded-xl transition-all duration-200 flex items-center gap-2"
                >
                  <span>←</span>
                  Back to Supplier
                </button>
                <button
                  type="button"
                  onClick={() => purchaseItems.length > 0 && setActiveStep(3)}
                  disabled={purchaseItems.length === 0}
                  className="px-6 py-3 bg-hospital-blue hover:bg-hospital-blue-dark text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Review Purchase
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Step 3: Review & Submit */}
            <div className={`space-y-6 ${activeStep !== 3 ? 'hidden' : ''}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-hospital-gray-dark flex items-center gap-2">
                  <span className="text-xl text-hospital-blue">📋</span>
                  Review Purchase
                </h3>
                <span className="text-sm text-hospital-gray">Step 3 of 3</span>
              </div>

              {/* Purchase Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Supplier Info */}
                <div className="card-hospital">
                  <h4 className="text-md font-semibold text-hospital-gray-dark mb-4 flex items-center gap-2">
                    <span>🏭</span>
                    Supplier Details
                  </h4>
                  {getSelectedSupplier() && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-hospital-gray">Name:</span>
                        <span className="font-semibold">{getSelectedSupplier().name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-hospital-gray">Company:</span>
                        <span className="font-semibold">{getSelectedSupplier().companyName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-hospital-gray">Mobile:</span>
                        <span className="font-semibold">{getSelectedSupplier().mobile}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-hospital-gray">Invoice:</span>
                        <code className="font-semibold text-hospital-blue bg-hospital-blue-light px-2 py-1 rounded">
                          {invoiceNumber || 'TEMP-XXX'}
                        </code>
                      </div>
                    </div>
                  )}
                </div>

                {/* Purchase Items */}
                <div className="lg:col-span-2">
                  <div className="card-hospital">
                    <h4 className="text-md font-semibold text-hospital-gray-dark mb-4 flex items-center gap-2">
                      <span>💊</span>
                      Purchase Items ({purchaseItems.length})
                    </h4>
                    
                    {purchaseItems.length > 0 ? (
                      <div className="space-y-3">
                        {purchaseItems.map((item, index) => (
                          <div
                            key={index}
                            id={`item-${index}`}
                            ref={el => itemCardsRef.current[index] = el}
                            className="flex items-center justify-between p-4 bg-hospital-blue-light/30 rounded-xl border border-hospital-blue-light"
                          >
                            <div className="flex-1">
                              <div className="font-semibold text-hospital-gray-dark">{item.medicineName}</div>
                              <div className="text-sm text-hospital-gray flex items-center gap-3 mt-1">
                                <span>Batch: {item.batchNumber}</span>
                                <span>Exp: {new Date(item.expiryDate).toLocaleDateString()}</span>
                                <span>Qty: {item.quantity}</span>
                              </div>
                              <div className="text-sm text-hospital-gray-dark mt-2">
                                <span className="font-medium">Buy: ₹{item.purchasePrice.toFixed(2)}</span>
                                <span className="mx-2">→</span>
                                <span className="font-medium text-hospital-success">Sell: ₹{item.sellingPrice.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-bold text-hospital-blue">₹{item.total.toFixed(2)}</div>
                                <div className="text-xs text-hospital-gray">{item.quantity} × ₹{item.purchasePrice.toFixed(2)}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removePurchaseItem(index)}
                                className="p-2 bg-hospital-danger-light hover:bg-hospital-danger text-hospital-danger hover:text-white rounded-lg transition-all duration-200"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-hospital-gray">
                        No items added yet. Go back to add medicines.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              {purchaseItems.length > 0 && (
                <div className="card-hospital">
                  <h4 className="text-md font-semibold text-hospital-gray-dark mb-4">Purchase Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-hospital-gray">Subtotal:</span>
                      <span className="font-medium">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hospital-gray">GST (18%):</span>
                      <span className="font-medium">₹{calculateTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-3 border-t border-hospital-blue-light">
                      <span className="text-hospital-gray-dark">Grand Total:</span>
                      <span className="text-hospital-blue">₹{calculateGrandTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-hospital-gray pt-2">
                      <span>Total Items: {purchaseItems.length}</span>
                      <span>Total Quantity: {purchaseItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-hospital-blue-light">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-6 py-3 bg-hospital-gray-light hover:bg-hospital-gray text-hospital-gray-dark font-semibold rounded-xl transition-all duration-200 flex items-center gap-2"
                >
                  <span>←</span>
                  Back to Items
                </button>
                <button
                  type="submit"
                  disabled={loading || purchaseItems.length === 0}
                  className="px-8 py-3 bg-gradient-to-r from-hospital-blue to-hospital-green hover:from-hospital-blue-dark hover:to-hospital-green-dark text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing Purchase...
                    </>
                  ) : (
                    <>
                      <span className="text-xl">💰</span>
                      Record Purchase (₹{calculateGrandTotal().toFixed(2)})
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 card-hospital">
          <h3 className="text-lg font-bold text-hospital-gray-dark mb-4 flex items-center gap-2">
            <span className="text-2xl text-hospital-blue">💡</span>
            Purchase Guidelines
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-hospital-blue-light">
              <div className="text-hospital-blue text-xl mb-2">🏷️</div>
              <h4 className="font-semibold text-hospital-gray-dark mb-2">Batch Information</h4>
              <p className="text-sm text-hospital-gray">
                Enter accurate batch numbers for inventory tracking
              </p>
            </div>
            <div className="p-4 rounded-xl border border-hospital-blue-light">
              <div className="text-hospital-success text-xl mb-2">💊</div>
              <h4 className="font-semibold text-hospital-gray-dark mb-2">Auto Pricing</h4>
              <p className="text-sm text-hospital-gray">
                30% markup automatically applied for selling price
              </p>
            </div>
            <div className="p-4 rounded-xl border border-hospital-blue-light">
              <div className="text-hospital-warning text-xl mb-2">⚠️</div>
              <h4 className="font-semibold text-hospital-gray-dark mb-2">Expiry Check</h4>
              <p className="text-sm text-hospital-gray">
                Always check expiry dates before adding to inventory
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            ref={successRef}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-hospital-success to-hospital-green p-8 text-center">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <h3 className="text-2xl font-bold text-white mb-2">Purchase Recorded!</h3>
              <p className="text-white/90">
                Invoice: {invoiceNumber || 'TEMP-XXX'}
              </p>
            </div>
            <div className="p-6 text-center">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-hospital-gray">Supplier:</span>
                  <span className="font-semibold">{getSelectedSupplier()?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-hospital-gray">Total Items:</span>
                  <span className="font-semibold">{purchaseItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-hospital-gray">Grand Total:</span>
                  <span className="font-bold text-hospital-blue">₹{calculateGrandTotal().toFixed(2)}</span>
                </div>
              </div>
              <div className="text-lg text-hospital-gray-dark mb-4">
                Updating inventory...
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-hospital-success h-2 rounded-full animate-progress-bar"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
