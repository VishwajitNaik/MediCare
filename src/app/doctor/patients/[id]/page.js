'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function PatientDetails() {
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    medicalHistory: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    fetchPatientData();
    fetchUserRole();
  }, [id]);

  const fetchUserRole = async () => {
    try {
      // Try to get user info from localStorage first
      const userInfo = localStorage.getItem('user');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        setUserRole(user.role);
      } else {
        // Fallback: make API call to get current user
        const res = await fetch('/api/auth/profile');
        if (res.ok) {
          const user = await res.json();
          setUserRole(user.role);
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      // Default to doctor if can't determine
      setUserRole('DOCTOR');
    }
  };

  const fetchPatientData = async () => {
    try {
      // Fetch patient details
      const patientRes = await fetch(`/api/doctor/patients/${id}`);
      const patientData = await patientRes.json();

      if (patientRes.ok) {
        setPatient(patientData.patient);
        setForm({
          name: patientData.patient.name,
          age: patientData.patient.age,
          gender: patientData.patient.gender,
          medicalHistory: patientData.patient.medicalHistory || '',
        });
      }

      // Fetch prescriptions
      const prescriptionsRes = await fetch(`/api/medical/prescriptions/fetch?patientId=${id}`);
      if (prescriptionsRes.ok) {
        const prescriptionsData = await prescriptionsRes.json();
        setPrescriptions(prescriptionsData.prescriptions || []);
      }

      // Fetch visit history (from patient medicines)
      const visitsRes = await fetch(`/api/medical/patients/${id}`);
      if (visitsRes.ok) {
        const visitsData = await visitsRes.json();
        setVisits(visitsData.history?.medicines || []);
      }

    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/doctor/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPatient({ ...patient, ...form, age: parseInt(form.age) });
        setEditing(false);
        await fetchPatientData(); // Refresh data
      } else {
        setError(data.error || 'Failed to update patient');
      }
    } catch (err) {
      setError('Network error');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) return;

    try {
      const res = await fetch(`/api/doctor/patients/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/doctor/patients');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete patient');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>Loading patient details...</div>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
        Error: {error}
      </div>
    );
  }

  const tabStyle = (tabName) => ({
    padding: '12px 24px',
    backgroundColor: activeTab === tabName ? '#007bff' : '#f8f9fa',
    color: activeTab === tabName ? 'white' : '#333',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginRight: '4px'
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>
            {patient?.name}
          </h1>
          <p style={{ margin: '5px 0', color: '#666' }}>
            Age: {patient?.age} | Gender: {patient?.gender} | Mobile: ****{patient?.mobile?.slice(-4)}
          </p>
        </div>
        <div>
          {userRole === 'MEDICAL' && (
            <>
              <button
                onClick={() => setEditing(!editing)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: editing ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                {editing ? 'Cancel Edit' : 'Edit Patient'}
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete Patient
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Edit Form - Only for Medical Staff */}
      {editing && userRole === 'MEDICAL' && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <h3>Edit Patient Information</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Age:</label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Gender:</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Medical History:</label>
              <textarea
                name="medicalHistory"
                value={form.medicalHistory}
                onChange={handleChange}
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
                placeholder="Enter detailed medical history, allergies, chronic conditions, etc."
              />
            </div>
            <div style={{ marginTop: '15px' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  marginRight: '10px'
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid #dee2e6', marginBottom: '20px' }}>
        <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button style={tabStyle('prescriptions')} onClick={() => setActiveTab('prescriptions')}>
          Prescriptions ({prescriptions.length})
        </button>
        <button style={tabStyle('visits')} onClick={() => setActiveTab('visits')}>
          Visit History ({visits.length})
        </button>
      </div>

      {/* Tab Content */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '0 8px 8px 8px',
        padding: '20px',
        minHeight: '400px'
      }}>
        {activeTab === 'overview' && (
          <div>
            <h2>Patient Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div>
                <h3>Basic Information</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Name:</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{patient?.name}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Age:</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{patient?.age} years</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Gender:</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{patient?.gender}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Mobile:</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{patient?.mobile}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Patient ID:</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{patient?._id}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3>Medical History</h3>
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '8px',
                  minHeight: '150px',
                  border: '1px solid #dee2e6'
                }}>
                  {patient?.medicalHistory ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{patient.medicalHistory}</div>
                  ) : (
                    <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
                      No medical history recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '30px' }}>
              <h3>Quick Statistics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div style={{
                  backgroundColor: '#e3f2fd',
                  padding: '15px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #bbdefb'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>{prescriptions.length}</div>
                  <div style={{ color: '#666' }}>Total Prescriptions</div>
                </div>
                <div style={{
                  backgroundColor: '#f3e5f5',
                  padding: '15px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #ce93d8'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7b1fa2' }}>{visits.length}</div>
                  <div style={{ color: '#666' }}>Total Visits</div>
                </div>
                <div style={{
                  backgroundColor: '#e8f5e8',
                  padding: '15px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #c8e6c9'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>
                    {prescriptions.filter(p => p.status === 'FULLY_FULFILLED').length}
                  </div>
                  <div style={{ color: '#666' }}>Completed Prescriptions</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div>
            <h2>Prescription History</h2>
            {prescriptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                No prescriptions found for this patient.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {prescriptions.map((prescription, index) => (
                  <div key={prescription._id} style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0 }}>Prescription #{index + 1}</h3>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: prescription.status === 'FULLY_FULFILLED' ? '#d4edda' :
                                       prescription.status === 'PARTIALLY_FULFILLED' ? '#fff3cd' : '#e2e3e5',
                        color: prescription.status === 'FULLY_FULFILLED' ? '#155724' :
                               prescription.status === 'PARTIALLY_FULFILLED' ? '#856404' : '#383d41'
                      }}>
                        {prescription.status}
                      </span>
                    </div>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      Date: {new Date(prescription.date).toLocaleDateString()}
                    </p>
                    <div>
                      <h4>Medicines:</h4>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {prescription.medicines?.map((med, medIndex) => (
                          <div key={medIndex} style={{
                            backgroundColor: 'white',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #e9ecef'
                          }}>
                            <strong>{med.medicineName}</strong>
                            <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                              Dose: {med.dosePerTime} | Duration: {med.durationDays} days | Timing: {med.timing?.join(', ')}
                              <br />
                              Status: {med.remainingQty === 0 ? 'Fully Dispensed' : `${med.dispensedQty} given, ${med.remainingQty} remaining`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'visits' && (
          <div>
            <h2>Visit History</h2>
            {visits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                No visit history found for this patient.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {visits.map((visit, index) => (
                  <div key={index} style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0 }}>Visit #{visits.length - index}</h3>
                      <span style={{ color: '#666', fontSize: '14px' }}>
                        {new Date(visit.visitDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      <div>
                        <h4>Medicines Dispensed:</h4>
                        <div style={{ display: 'grid', gap: '5px' }}>
                          {visit.medicines?.map((med, medIndex) => (
                            <div key={medIndex} style={{
                              backgroundColor: 'white',
                              padding: '6px 8px',
                              borderRadius: '4px',
                              fontSize: '14px',
                              border: '1px solid #e9ecef'
                            }}>
                              {med.medicineId?.name || 'Unknown Medicine'} - {med.actualQuantity} units
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4>Visit Details:</h4>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          <div>Total Amount: ₹{visit.totalAmount}</div>
                          <div>Served by: {visit.medicalId?.name || 'Medical Staff'}</div>
                          <div>Source: {visit.source?.replace('_', ' ') || 'Direct'}</div>
                          {visit.notes && <div>Notes: {visit.notes}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
