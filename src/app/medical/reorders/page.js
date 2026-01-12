'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ReorderDraftsPage() {
  const [reorderDrafts, setReorderDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReorderDrafts();
  }, []);

  const fetchReorderDrafts = async () => {
    try {
      const res = await fetch('/api/medical/reorders/all');
      const data = await res.json();
      if (res.ok) {
        setReorderDrafts(data.reorderDrafts || []);
      } else {
        setError(data.error || 'Failed to load reorder drafts');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleAction = async (draftId, action) => {
    try {
      const res = await fetch(`/api/medical/reorders/process/${draftId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchReorderDrafts(); // Refresh the list
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#ff9800';
      case 'ORDERED': return '#4caf50';
      case 'IGNORED': return '#757575';
      default: return '#666';
    }
  };

  const getReasonBadge = (reason) => {
    switch (reason) {
      case 'FAST_MOVING': return { text: '🚀 FAST MOVING', color: '#ff5722' };
      case 'LOW_STOCK': return { text: '📉 LOW STOCK', color: '#ff9800' };
      case 'EXPIRING_SOON': return { text: '⏰ EXPIRING', color: '#ff9800' };
      default: return { text: reason, color: '#666' };
    }
  };

  const generateOrderPDF = () => {
    const availableDrafts = reorderDrafts.filter(draft => draft.status !== 'IGNORED');

    if (availableDrafts.length === 0) {
      alert('No reorder drafts available to generate PDF for.');
      return;
    }

    // Group by supplier
    const groupedBySupplier = availableDrafts.reduce((acc, draft) => {
      const supplierName = draft.supplierId?.name || 'Unknown Supplier';
      if (!acc[supplierName]) {
        acc[supplierName] = {
          supplier: draft.supplierId,
          items: []
        };
      }
      acc[supplierName].items.push(draft);
      return acc;
    }, {});

    // Calculate delivery date (7 days from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    const formattedDeliveryDate = deliveryDate.toLocaleDateString();

    // Create PDF for each supplier
    Object.entries(groupedBySupplier).forEach(([supplierName, supplierData]) => {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text('🏥 Medical Store Order Request', 20, 20);

      doc.setFontSize(14);
      doc.text(`Supplier: ${supplierName}`, 20, 35);
      doc.text(`Order Date: ${new Date().toLocaleDateString()}`, 20, 45);
      doc.text(`Required Delivery By: ${formattedDeliveryDate}`, 20, 55);

      // Medicine table
      doc.setFontSize(12);
      doc.text('Required Medicines:', 20, 70);

      // Table headers
      const tableStartY = 80;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('S.No', 20, tableStartY);
      doc.text('Medicine Name', 35, tableStartY);
      doc.text('Brand', 100, tableStartY);
      doc.text('Qty', 140, tableStartY);
      doc.text('Strength', 160, tableStartY);
      doc.text('Reason', 185, tableStartY);

      // Header line
      doc.line(20, tableStartY + 2, 250, tableStartY + 2);

      // Table data
      let yPosition = tableStartY + 8;
      doc.setFont(undefined, 'normal');

      supplierData.items.forEach((item, index) => {
        if (yPosition > 250) { // Add new page if needed
          doc.addPage();
          yPosition = 20;
        }

        doc.text(`${index + 1}`, 20, yPosition);
        doc.text(item.medicineId?.name || 'Unknown Medicine', 35, yPosition);
        doc.text(item.medicineId?.brandName || 'N/A', 100, yPosition);
        doc.text(item.suggestedQuantity.toString(), 140, yPosition);
        doc.text(item.medicineId?.strength || 'N/A', 160, yPosition);
        doc.text(item.reason, 185, yPosition);

        // Row line
        doc.line(20, yPosition + 2, 250, yPosition + 2);
        yPosition += 8;
      });

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.text('Please deliver the above medicines by the specified date.', 20, pageHeight - 30);
      doc.text('Contact: Medical Store Management', 20, pageHeight - 20);

      // Save PDF
      const fileName = `Order_${supplierName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    });

    alert(`Generated ${Object.keys(groupedBySupplier).length} order PDF(s) for suppliers.`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>🔄 Reorder Drafts Management</h1>
        <button
          onClick={generateOrderPDF}
          style={{
            padding: '12px 20px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          📄 Generate Order PDFs
        </button>
      </div>

      <div style={{ background: '#e8f5e8', padding: '15px', marginBottom: '20px', borderRadius: '4px' }}>
        <h3>📋 Complete Reorder History</h3>
        <p>View all reorder drafts, including pending, ordered, and ignored suggestions.</p>
        <p style={{ fontSize: '14px', marginTop: '10px', color: '#2e7d32' }}>
          💡 <strong>PDF Generation:</strong> Generate order PDFs grouped by supplier with medicine names, required quantities, and delivery deadlines.
        </p>
      </div>

      {error && <p style={{ color: 'red', padding: '10px', background: '#ffeaea', borderRadius: '4px' }}>{error}</p>}

      {loading ? (
        <div>Loading reorder drafts...</div>
      ) : reorderDrafts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No reorder drafts found.</p>
          <p>Generate reorders from the dashboard to create suggestions.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {reorderDrafts.map((draft) => (
            <div key={draft._id} style={{
              border: '2px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              background: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>
                    {draft.medicineId?.name || 'Unknown Medicine'}
                  </h3>
                  <p style={{ margin: '0', color: '#666', fontSize: '0.9em' }}>
                    {draft.medicineId?.brandName} ({draft.medicineId?.strength})
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{
                    background: getReasonBadge(draft.reason).color,
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8em',
                    fontWeight: 'bold'
                  }}>
                    {getReasonBadge(draft.reason).text}
                  </div>
                  <div style={{
                    background: getStatusColor(draft.status),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8em',
                    fontWeight: 'bold'
                  }}>
                    {draft.status}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <strong>Current Stock:</strong><br />
                  <span style={{ color: draft.currentStock <= 10 ? '#d32f2f' : '#2e7d32' }}>
                    {draft.currentStock} units
                  </span>
                </div>
                <div>
                  <strong>Days Left:</strong><br />
                  <span style={{ color: draft.daysLeft <= 3 ? '#d32f2f' : '#2e7d32' }}>
                    {draft.daysLeft.toFixed(1)} days
                  </span>
                </div>
                <div>
                  <strong>Daily Consumption:</strong><br />
                  {draft.avgDailyConsumption.toFixed(1)} units/day
                </div>
                <div>
                  <strong>Suggested Order:</strong><br />
                  <span style={{ color: '#1976d2', fontWeight: 'bold' }}>
                    {draft.suggestedQuantity} units
                  </span>
                </div>
                <div>
                  <strong>Supplier:</strong><br />
                  {draft.supplierId?.name || 'Not specified'}
                </div>
                <div>
                  <strong>Created:</strong><br />
                  {new Date(draft.createdAt).toLocaleDateString()}
                </div>
              </div>

              {draft.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button
                    onClick={() => handleAction(draft._id, 'order')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    🛒 Order Now
                  </button>
                  <button
                    onClick={() => handleAction(draft._id, 'ignore')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#757575',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🙅‍♂️ Ignore
                  </button>
                </div>
              )}

              {draft.status === 'ORDERED' && (
                <div style={{
                  padding: '10px',
                  background: '#e8f5e8',
                  borderRadius: '4px',
                  marginTop: '15px',
                  textAlign: 'center'
                }}>
                  ✅ Purchase order created and linked to this suggestion
                </div>
              )}

              {draft.status === 'IGNORED' && (
                <div style={{
                  padding: '10px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  marginTop: '15px',
                  textAlign: 'center',
                  color: '#666'
                }}>
                  ⏭️ This suggestion was ignored
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <a
          href="/medical/dashboard"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: '#2196f3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
