'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function PatientPrescriptions() {
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id: patientId } = useParams();

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    try {
      const [patientRes, prescriptionsRes] = await Promise.all([
        fetch(`/api/common/patients/${patientId}`),
        fetch(`/api/medical/prescriptions/fetch?patientId=${patientId}`),
      ]);

      const patientData = await patientRes.json();
      const prescriptionsData = await prescriptionsRes.json();

      if (patientRes.ok) setPatient(patientData.patient);
      if (prescriptionsRes.ok) setPrescriptions(prescriptionsData.prescriptions);
    } catch (err) {
      setError('Failed to load data');
    }
    setLoading(false);
  };

  const fulfillPrescription = async (prescriptionId) => {
    if (!confirm('Are you sure you want to fulfill this prescription? This will dispense the medicines to the patient.')) {
      return;
    }

    try {
      const res = await fetch('/api/medical/prescriptions/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescriptionId }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Prescription fulfilled successfully!');
        fetchData(); // Refresh the data
      } else {
        alert(data.error || 'Failed to fulfill prescription');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!patient) return <div>Patient not found</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Prescriptions for {patient.name}</h1>

      <div style={{ background: '#e8f5e8', padding: '15px', marginBottom: '20px', borderRadius: '4px' }}>
        <h3>Patient Information</h3>
        <p><strong>Name:</strong> {patient.name}</p>
        <p><strong>Mobile:</strong> {patient.mobile}</p>
        <p><strong>Age:</strong> {patient.age}, <strong>Gender:</strong> {patient.gender}</p>
      </div>

      <h2>Prescription History</h2>

      {prescriptions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3>No prescriptions found</h3>
          <p>This patient has no prescriptions yet.</p>
        </div>
      ) : (
        <div>
          {prescriptions.map((prescription) => (
            <div key={prescription._id} style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              background: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>
                    Prescription #{prescription._id.slice(-8)}
                  </h3>
                  <p style={{ margin: '0', color: '#666', fontSize: '0.9em' }}>
                    Date: {new Date(prescription.date).toLocaleDateString()}
                  </p>
                </div>
                <div style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  background: prescription.fulfilled ? '#d4edda' : '#fff3cd',
                  color: prescription.fulfilled ? '#155724' : '#856404',
                  fontSize: '0.8em',
                  fontWeight: 'bold'
                }}>
                  {prescription.fulfilled ? 'FULFILLED' : 'PENDING'}
                </div>
              </div>

              <div>
                <h4>Medicines:</h4>
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '4px' }}>
                  {prescription.medicines.map((med, index) => (
                    <div key={index} style={{
                      padding: '10px',
                      marginBottom: index < prescription.medicines.length - 1 ? '10px' : '0',
                      background: 'white',
                      borderRadius: '4px',
                      border: '1px solid #eee'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <strong>{med.medicine?.name || 'Unknown Medicine'}</strong>
                          <br />
                          <small style={{ color: '#666' }}>
                            {med.medicine?.brandName} ({med.medicine?.strength})
                          </small>
                          <br />
                          <small style={{ color: '#666' }}>
                            Dose: {med.dosePerTime} |
                            Timing: {med.timing?.join(', ') || 'Not specified'} |
                            Duration: {med.durationDays} days |
                            Quantity: {med.totalQuantity}
                          </small>
                        </div>
                        {prescription.fulfilled && (
                          <div style={{
                            padding: '5px 10px',
                            background: '#28a745',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '0.8em'
                          }}>
                            Served
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!prescription.fulfilled && (
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                  <button
                    onClick={() => fulfillPrescription(prescription._id)}
                    style={{
                      padding: '10px 20px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Fulfill Prescription
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '10px 20px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Patient
        </button>
      </div>
    </div>
  );
}
