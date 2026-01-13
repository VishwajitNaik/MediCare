'use client';

import { useState, useEffect } from 'react';

export default function MultiplePurchasePanel({ onSave, onClose }) {
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Multiple purchase items
  const [purchaseItems, setPurchaseItems] = useState([]);

  // Current item being added
  const [currentItem, setCurrentItem] = useState({
    medicineId: '',
    batchNumber: '',
    expiryDate: '',
    quantity: '',
    purchasePrice: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [suppliersRes, medicinesRes] = await Promise.all([
        fetch('/api/medical/suppliers'),
        fetch('/api/common/medicines'),
      ]);

      const suppliersData = await suppliersRes.json();
      const medicinesData = await medicinesRes.json();

      if (suppliersRes.ok) {
        setSuppliers(suppliersData.suppliers || []);
      }

      if (medicinesRes.ok) {
        setMedicines(medicinesData.medicines || []);
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

    // Reset form
    setCurrentItem({
      medicineId: '',
      batchNumber: '',
      expiryDate: '',
      quantity: '',
      purchasePrice: '',
    });
    setError('');
  };

  const removePurchaseItem = (index) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
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

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const invoiceNum = `MULTI-${year}${month}${day}-${random}`;
    setInvoiceNumber(invoiceNum);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!supplierId) {
      setError('Please select supplier');
      return;
    }

    if (purchaseItems.length === 0) {
      setError('Please add at least one medicine to purchase');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const finalInvoiceNumber = invoiceNumber || `MULTI-${Date.now()}`;

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
        onSave(data.purchase);
      } else {
        setError(data.error || 'Failed to record purchase');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div style={{
      border: "2px solid #28a745",
      borderRadius: "10px",
      padding: "20px",
      marginBottom: "20px",
      backgroundColor: "#f8fff8",
      maxWidth: "1200px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h3 style={{ margin: 0, color: "#155724" }}>
          🛒 Multiple Medicine Purchase
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#666"
          }}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            color: "#721c24",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "15px"
          }}>
            {error}
          </div>
        )}

        {/* Supplier and Invoice Section */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "15px", marginBottom: "20px" }}>
          {/* Supplier Selection */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Select Supplier *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px"
              }}
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
          </div>

          {/* Invoice Number */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Invoice Number
            </label>
            <div style={{ display: "flex", gap: "5px" }}>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="AUTO-GENERATED"
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
              <button
                type="button"
                onClick={generateInvoiceNumber}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
                title="Generate invoice number"
              >
                🔄
              </button>
            </div>
          </div>
        </div>

        {/* Add Medicine Section */}
        <div style={{
          border: "2px dashed #28a745",
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "20px",
          backgroundColor: "#f8fff8"
        }}>
          <h4 style={{ margin: "0 0 15px 0", color: "#155724" }}>Add Medicine to Purchase</h4>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "15px" }}>
            {/* Medicine */}
            <div>
              <label style={{ display: "block", marginBottom: "3px", fontSize: "12px", fontWeight: "bold" }}>
                Medicine *
              </label>
              <select
                value={currentItem.medicineId}
                onChange={(e) => handleMedicineChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "12px"
                }}
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
              <label style={{ display: "block", marginBottom: "3px", fontSize: "12px", fontWeight: "bold" }}>
                Batch Number *
              </label>
              <input
                type="text"
                value={currentItem.batchNumber}
                onChange={(e) => setCurrentItem({...currentItem, batchNumber: e.target.value})}
                placeholder="BT2025001"
                style={{
                  width: "100%",
                  padding: "6px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "12px"
                }}
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label style={{ display: "block", marginBottom: "3px", fontSize: "12px", fontWeight: "bold" }}>
                Expiry Date *
              </label>
              <input
                type="date"
                value={currentItem.expiryDate}
                onChange={(e) => setCurrentItem({...currentItem, expiryDate: e.target.value})}
                style={{
                  width: "100%",
                  padding: "6px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "12px"
                }}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Quantity */}
            <div>
              <label style={{ display: "block", marginBottom: "3px", fontSize: "12px", fontWeight: "bold" }}>
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={currentItem.quantity}
                onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})}
                placeholder="100"
                style={{
                  width: "100%",
                  padding: "6px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "12px"
                }}
              />
            </div>

            {/* Purchase Price */}
            <div>
              <label style={{ display: "block", marginBottom: "3px", fontSize: "12px", fontWeight: "bold" }}>
                Price (₹) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={currentItem.purchasePrice}
                onChange={(e) => setCurrentItem({...currentItem, purchasePrice: e.target.value})}
                placeholder="5.50"
                style={{
                  width: "100%",
                  padding: "6px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "12px"
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={addPurchaseItem}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold"
            }}
          >
            ➕ Add Medicine
          </button>
        </div>

        {/* Purchase Items List */}
        {purchaseItems.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 15px 0", color: "#155724" }}>
              📋 Purchase Items ({purchaseItems.length})
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "10px" }}>
              {purchaseItems.map((item, index) => (
                <div key={index} style={{
                  padding: "10px",
                  backgroundColor: "white",
                  borderRadius: "6px",
                  border: "1px solid #dee2e6"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div style={{ fontWeight: "bold", color: "#007bff" }}>
                      {item.medicineName}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePurchaseItem(index)}
                      style={{
                        padding: "2px 6px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                    Batch: {item.batchNumber} | Exp: {new Date(item.expiryDate).toLocaleDateString()} | Qty: {item.quantity}
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: "bold", color: "#28a745" }}>
                    ₹{item.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {purchaseItems.length > 0 && (
          <div style={{
            padding: "15px",
            backgroundColor: "#e8f5e8",
            borderRadius: "8px",
            marginBottom: "20px"
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#28a745" }}>
                  ₹{calculateTotal().toFixed(2)}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>Subtotal</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#28a745" }}>
                  ₹{calculateTax().toFixed(2)}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>GST (18%)</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#28a745" }}>
                  ₹{calculateGrandTotal().toFixed(2)}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>Grand Total</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#28a745" }}>
                  {purchaseItems.length}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>Medicines</div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div style={{ textAlign: "center" }}>
          <button
            type="submit"
            disabled={loading || purchaseItems.length === 0 || !supplierId}
            style={{
              padding: "12px 24px",
              backgroundColor: (purchaseItems.length > 0 && supplierId && !loading) ? "#28a745" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: (purchaseItems.length > 0 && supplierId && !loading) ? "pointer" : "not-allowed",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            {loading ? "⏳ Creating Purchase..." : `💾 Create Purchase (${purchaseItems.length} items)`}
          </button>
        </div>

        {/* Tips */}
        <div style={{
          marginTop: "15px",
          padding: "10px",
          backgroundColor: "#e8f5e8",
          borderRadius: "4px",
          fontSize: "12px"
        }}>
          <strong>💡 Tips:</strong><br/>
          • Add multiple medicines to create a bulk purchase order<br/>
          • Each medicine can have different batch numbers, expiry dates, and prices<br/>
          • Auto-generates invoice number if not provided<br/>
          • Automatically updates inventory stock after purchase
        </div>
      </form>
    </div>
  );
}
