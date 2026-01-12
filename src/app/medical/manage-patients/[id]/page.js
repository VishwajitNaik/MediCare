'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditPatient() {
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: '',
    medicalHistory: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      const res = await fetch(`/api/common/patients/${id}`);
      const data = await res.json();
      if (res.ok) {
        setForm({
          name: data.patient.name,
          mobile: data.patient.mobile,
          age: data.patient.age,
          gender: data.patient.gender,
          medicalHistory: data.patient.medicalHistory || '',
        });
      } else {
        setError(data.error || 'Failed to fetch patient');
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
      const res = await fetch(`/api/medical/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Patient updated successfully');
        router.push('/medical/manage-patients');
      } else {
        setError(data.error || 'Failed to update patient');
      }
    } catch (err) {
      setError('Network error');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this patient?')) return;

    try {
      const res = await fetch(`/api/medical/patients/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('Patient deleted successfully');
        router.push('/medical/manage-patients');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete patient');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Edit Patient</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Patient Name"
          value={form.name}
          onChange={handleChange}
          required
          style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px' }}
        />
        <input
          type="tel"
          name="mobile"
          placeholder="Mobile Number"
          value={form.mobile}
          onChange={handleChange}
          required
          style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px' }}
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={form.age}
          onChange={handleChange}
          required
          min="1"
          max="150"
          style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px' }}
        />
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          required
          style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px' }}
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <textarea
          name="medicalHistory"
          placeholder="Medical History (optional)"
          value={form.medicalHistory}
          onChange={handleChange}
          rows="4"
          style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px' }}
        />
        <button type="submit" disabled={saving} style={{ padding: '10px', width: '100%', marginBottom: '10px' }}>
          {saving ? 'Saving...' : 'Update Patient'}
        </button>
      </form>
      <button onClick={handleDelete} style={{ padding: '10px', width: '100%', background: 'red', color: 'white' }}>
        Delete Patient
      </button>
    </div>
  );
}
