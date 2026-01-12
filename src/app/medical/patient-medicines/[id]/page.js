'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function PatientMedicineDetail() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    try {
      const res = await fetch(`/api/medical/patient-medicines/${id}`);
      const data = await res.json();
      if (res.ok) {
        setRecord(data.patientMedicine);
      } else {
        setError(data.error || 'Failed to load record');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const updatePaymentStatus = async (paymentStatus, paymentMode) => {
    if (!confirm(`Mark payment as ${paymentStatus}?`)) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/medical/patient-medicines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus, paymentMode }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Payment marked as ${paymentStatus}!`);
        setRecord(data.patientMedicine);
      } else {
        alert(data.error || 'Failed to update payment status');
      }
    } catch (err) {
      alert('Network error');
    }
    setUpdating(false);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!record) return <div>Record not found</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Patient Medicine Record</h1>

      {/* Patient Info */}
      <div style={{ background: '#e8f5e8', padding: '15px', marginBottom: '20px', borderRadius: '4px' }}>
        <h2>Patient: {record.patientId?.name}</h2>
        <p>Mobile: {record.patientId?.mobile} | Age: {record.patientId?.age} | Gender: {record.patientId?.gender}</p>
        <p><strong>Visit Date: {new Date(record.visitDate).toLocaleString()}</strong></p>
        <p><strong>Source: {record.source}</strong></p>
        {record.prescriptionId && <p><strong>Prescription ID: {record.prescriptionId}</strong></p>}
      </div>

      {/* Payment Status */}
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
        <h3>Payment Information</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
          <div>
            <strong>Status:</strong>
            <span style={{
              display: 'inline-block',
              padding: '4px 8px',
              marginLeft: '10px',
              borderRadius: '4px',
              background: record.paymentStatus === 'PAID' ? '#d4edda' : '#fff3cd',
              color: record.paymentStatus === 'PAID' ? '#155724' : '#856404'
            }}>
              {record.paymentStatus}
            </span>
          </div>
          {record.paymentMode && <div><strong>Mode:</strong> {record.paymentMode}</div>}
          {record.paymentCompletedAt && (
            <div><strong>Completed:</strong> {new Date(record.paymentCompletedAt).toLocaleString()}</div>
          )}
        </div>

        {record.paymentStatus !== 'PAID' && (
          <div style={{ marginTop: '15px' }}>
            <strong>Mark Payment as Completed:</strong>
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => updatePaymentStatus('PAID', 'CASH')}
                disabled={updating}
                style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                💰 Cash
              </button>
              <button
                onClick={() => updatePaymentStatus('PAID', 'UPI')}
                disabled={updating}
                style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                📱 UPI
              </button>
              <button
                onClick={() => updatePaymentStatus('PAID', 'CARD')}
                disabled={updating}
                style={{ padding: '8px 16px', background: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                💳 Card
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Medicines */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Medicines Dispensed</h3>
        <div style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
          {record.medicines.map((med, index) => (
            <div key={index} style={{
              padding: '15px',
              borderBottom: index < record.medicines.length - 1 ? '1px solid #eee' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <strong>{med.medicineId?.name}</strong>
                  <br />
                  <small style={{ color: '#666' }}>
                    {med.medicineId?.brandName} ({med.medicineId?.strength})
                  </small>
                  <br />
                  <small style={{ color: '#666' }}>
                    Dose: {med.dosePerTime} |
                    Timing: {med.timing?.join(', ')} |
                    Duration: {med.durationDays} days |
                    Quantity: {med.actualQuantity} |
                    Price: ₹{med.unitPrice} each
                  </small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>₹{med.totalPrice}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '15px',
          background: '#e8f5e8',
          borderRadius: '4px',
          marginTop: '10px',
          textAlign: 'right'
        }}>
          <strong>Total Amount: ₹{record.totalAmount}</strong>
        </div>
      </div>

      {/* Notes */}
      {record.notes && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Notes</h3>
          <p style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>{record.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: '10px 20px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>

        <button
          onClick={() => window.print()}
          style={{
            padding: '10px 20px',
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🖨️ Print Receipt
        </button>
      </div>
    </div>
  );
}
