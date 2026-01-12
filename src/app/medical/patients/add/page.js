'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddPatient() {
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: '',
    medicalHistory: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/medical/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Patient added successfully');
        router.push('/medical/patients');
      } else {
        setError(data.error || 'Failed to add patient');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Add New Patient</h1>
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
        <button type="submit" disabled={loading} style={{ padding: '10px', width: '100%', marginTop: '20px' }}>
          {loading ? 'Adding...' : 'Add Patient'}
        </button>
      </form>
    </div>
  );
}
