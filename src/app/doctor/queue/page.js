'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PatientQueue() {
  const [queue, setQueue] = useState([]);
  const [summary, setSummary] = useState({
    waiting: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    total: 0
  });
  const [current, setCurrent] = useState(null);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchMode, setSearchMode] = useState(true); // Start with search mode
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: 'Male',
    priority: 'NORMAL',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchUserInfo();
    fetchQueue();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserInfo = async () => {
    try {
      // Try to get user profile from API using JWT token in cookies
      const res = await fetch('/api/auth/profile');
      if (res.ok) {
        const userData = await res.json();
        console.log('User info loaded from API:', userData);
        setUser(userData);
      } else {
        console.log('Failed to get user profile, trying localStorage fallback');
        // Fallback to localStorage if API fails
        const userInfo = localStorage.getItem('user');
        if (userInfo) {
          const parsedUser = JSON.parse(userInfo);
          console.log('User info loaded from localStorage:', parsedUser);
          setUser(parsedUser);
        } else {
          console.log('No user info found anywhere');
          setError('User not logged in. Please log in again.');
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      // Try localStorage as fallback
      try {
        const userInfo = localStorage.getItem('user');
        if (userInfo) {
          const parsedUser = JSON.parse(userInfo);
          console.log('User info loaded from localStorage (fallback):', parsedUser);
          setUser(parsedUser);
        } else {
          setError('User not logged in. Please refresh the page.');
        }
      } catch (localStorageError) {
        console.error('localStorage fallback also failed:', localStorageError);
        setError('Failed to load user information. Please refresh the page.');
      }
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/doctor/queue/list');
      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue);
        setSummary(data.summary);
        setCurrent(data.current);
        setNext(data.next);
      }
    } catch (err) {
      console.error('Error fetching queue:', err);
    }
    setLoading(false);
  };

  const handleSearch = async (term) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(`/api/common/patients?search=${encodeURIComponent(term)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.patients || []);
      }
    } catch (error) {
      console.error('Patient search error:', error);
      setSearchResults([]);
    }
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchMode(false);
  };

  const addSelectedPatientToQueue = async (e) => {
    e.preventDefault(); // Prevent any form submission
    console.log('Add to queue button clicked');
    console.log('Selected patient:', selectedPatient);
    console.log('User:', user);
    console.log('Selected patient exists:', !!selectedPatient);
    console.log('User exists:', !!user);
    console.log('User ID:', user?.id);
    console.log('Selected patient ID:', selectedPatient?._id);

    if (!selectedPatient) {
      console.log('ERROR: selectedPatient is null/undefined');
      setError('Please select a patient first');
      return;
    }

    if (!user) {
      console.log('ERROR: user is null/undefined');
      setError('User not logged in. Please refresh the page.');
      return;
    }

    if (!user.id) {
      console.log('ERROR: user.id is missing');
      setError('User ID not found. Please refresh the page.');
      return;
    }

    if (!selectedPatient._id) {
      console.log('ERROR: selectedPatient._id is missing');
      setError('Patient ID not found. Please select the patient again.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      console.log('Making API call with data:', {
        patientId: selectedPatient._id,
        doctorId: user.id,
        priority: formData.priority || 'NORMAL',
        notes: formData.notes || ''
      });

      const res = await fetch('/api/doctor/queue/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient._id, // Use existing patient ID
          doctorId: user.id, // Doctor's ID
          priority: formData.priority || 'NORMAL',
          notes: formData.notes || ''
        }),
      });

      const data = await res.json();
      console.log('API response:', data);

      if (res.ok) {
        setShowAddForm(false);
        setSelectedPatient(null);
        setSearchMode(true);
        setSearchTerm('');
        setSearchResults([]);
        setFormData({
          name: '',
          mobile: '',
          age: '',
          gender: 'Male',
          priority: 'NORMAL',
          notes: ''
        });
        await fetchQueue(); // Refresh queue
        console.log('Patient added to queue successfully');
      } else {
        setError(data.error || 'Failed to add patient to queue');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error');
    }
    setSaving(false);
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/doctor/queue/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientData: {
            name: formData.name,
            mobile: formData.mobile,
            age: formData.age,
            gender: formData.gender
          },
          doctorId: user.id,
          priority: formData.priority,
          notes: formData.notes
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowAddForm(false);
        setFormData({
          name: '',
          mobile: '',
          age: '',
          gender: 'Male',
          priority: 'NORMAL',
          notes: ''
        });
        await fetchQueue(); // Refresh queue
      } else {
        setError(data.error || 'Failed to add patient');
      }
    } catch (err) {
      setError('Network error');
    }
    setSaving(false);
  };

  const handleCallPatient = async (queueId) => {
    try {
      const res = await fetch(`/api/doctor/queue/${queueId}/call`, {
        method: 'PUT',
      });

      if (res.ok) {
        await fetchQueue(); // Refresh queue
      }
    } catch (err) {
      console.error('Error calling patient:', err);
    }
  };

  const handleCompleteVisit = async (queueId) => {
    try {
      const res = await fetch(`/api/doctor/queue/${queueId}/complete`, {
        method: 'PUT',
      });

      if (res.ok) {
        await fetchQueue(); // Refresh queue
      }
    } catch (err) {
      console.error('Error completing visit:', err);
    }
  };

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'WAITING': return '#ffc107';
      case 'IN_PROGRESS': return '#007bff';
      case 'COMPLETED': return '#28a745';
      case 'CANCELLED': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'EMERGENCY': return '#dc3545';
      case 'URGENT': return '#fd7e14';
      case 'NORMAL': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>Loading patient queue...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>Patient Queue Management</h1>
          <small style={{ color: '#666' }}>
            User: {user ? `${user.name || 'Unknown'} (${user.role})` : 'Not logged in'} |
            Patient Selected: {selectedPatient ? 'Yes' : 'No'}
          </small>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '12px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          + Add Walk-in Patient
        </button>
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

      {/* Add Patient Form */}
      {showAddForm && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Add Walk-in Patient to Queue</h3>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>

          {!selectedPatient ? (
            // Search Mode
            <div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Search Existing Patient:
                </label>
                <input
                  type="text"
                  placeholder="Search by name or mobile number..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>Search Results:</h4>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {searchResults.slice(0, 5).map((patient) => (
                      <div key={patient._id} style={{
                        backgroundColor: 'white',
                        padding: '15px',
                        borderRadius: '6px',
                        border: '1px solid #dee2e6',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <strong>{patient.name}</strong>
                          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                            Age: {patient.age} | Gender: {patient.gender} | Mobile: ****{patient.mobile.slice(-4)}
                          </div>
                        </div>
                        <button
                          onClick={() => selectPatient(patient)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Add to Queue
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <p style={{ color: '#666', marginBottom: '15px' }}>
                  Patient not found? <strong>Create New Patient</strong>
                </p>
                <button
                  onClick={() => setSearchMode(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  ➕ Create New Patient
                </button>
              </div>
            </div>
          ) : (
            // Selected Patient Confirmation
            <div>
              <h4>Selected Patient:</h4>
              <div style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #dee2e6',
                marginBottom: '20px'
              }}>
                <strong>{selectedPatient.name}</strong>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  Age: {selectedPatient.age} | Gender: {selectedPatient.gender} | Mobile: ****{selectedPatient.mobile.slice(-4)}
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Priority:</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  style={{
                    width: '200px',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">Urgent</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notes:</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Any special notes or symptoms..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={addSelectedPatientToQueue}
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  {saving ? 'Adding...' : '✅ Add to Queue'}
                </button>
                <button
                  onClick={() => {
                    setSelectedPatient(null);
                    setSearchMode(true);
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Back to Search
                </button>
              </div>
            </div>
          )}

          {/* Create New Patient Form */}
          {!searchMode && !selectedPatient && (
            <div>
              <h4>Create New Patient:</h4>
              <form onSubmit={handleAddPatient}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mobile:</label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
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
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
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
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Priority:</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="URGENT">Urgent</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notes:</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Any special notes or symptoms..."
                  />
                </div>
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    {saving ? 'Creating...' : '✅ Create & Add to Queue'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchMode(true)}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    Back to Search
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Queue Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #ffeaa7'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>{summary.waiting}</div>
          <div>Waiting</div>
        </div>
        <div style={{
          backgroundColor: '#cce5ff',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #99d6ff'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0056b3' }}>{summary.inProgress}</div>
          <div>In Progress</div>
        </div>
        <div style={{
          backgroundColor: '#d1ecf1',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #9acccd'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0c5460' }}>{summary.completed}</div>
          <div>Completed</div>
        </div>
        <div style={{
          backgroundColor: '#f8d7da',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #f1aeb5'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>{summary.cancelled}</div>
          <div>Cancelled</div>
        </div>
      </div>

      {/* Current Patient */}
      {current && (
        <div style={{
          backgroundColor: '#cce5ff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '2px solid #007bff'
        }}>
          <h2>🔵 Currently Seeing</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>{current.patient?.name}</h3>
              <p>Token: {current.tokenNumber} | Age: {current.patient?.age} | Mobile: ****{current.patient?.mobile?.slice(-4)}</p>
              <p>Waiting Time: {formatTime(current.waitingTime)}</p>
              {current.notes && <p><strong>Notes:</strong> {current.notes}</p>}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => router.push(`/doctor/prescriptions/create?patientId=${current.patient?._id}`)}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                💊 Create Prescription
              </button>
              <button
                onClick={() => handleCompleteVisit(current._id)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                ✅ Visit Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next Patient */}
      {next && (
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ffeaa7'
        }}>
          <h3>🟡 Next Patient: {next.patient?.name} (Token: {next.tokenNumber})</h3>
          <button
            onClick={() => handleCallPatient(next._id)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              marginTop: '10px'
            }}
          >
            📢 Call Next Patient
          </button>
        </div>
      )}

      {/* Queue List */}
      <div style={{ display: 'grid', gap: '10px' }}>
        {queue.map((item) => (
          <div key={item._id} style={{
            backgroundColor: 'white',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '15px',
            borderLeft: `4px solid ${getStatusColor(item.status)}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <h4 style={{ margin: 0 }}>{item.patient?.name}</h4>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: getPriorityColor(item.priority),
                    color: 'white'
                  }}>
                    {item.priority}
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: getStatusColor(item.status),
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    {item.status}
                  </span>
                </div>
                <p style={{ margin: '5px 0', color: '#666' }}>
                  Token: {item.tokenNumber} | Queue: #{item.queueNumber} |
                  Age: {item.patient?.age} | Mobile: ****{item.patient?.mobile?.slice(-4)} |
                  Added: {new Date(item.addedAt).toLocaleTimeString()}
                </p>
                <p style={{ margin: '5px 0', color: '#666' }}>
                  Waiting: {formatTime(item.waitingTime)} |
                  Added by: {item.addedByName}
                </p>
                {item.notes && <p style={{ margin: '5px 0', color: '#666' }}><strong>Notes:</strong> {item.notes}</p>}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {item.status === 'WAITING' && (
                  <button
                    onClick={() => handleCallPatient(item._id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Call
                  </button>
                )}
                {item.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleCompleteVisit(item._id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {queue.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          No patients in queue today. Click "Add Walk-in Patient" to add the first patient.
        </div>
      )}
    </div>
  );
}
