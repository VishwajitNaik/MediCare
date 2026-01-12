'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddSupplier() {
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    mobile: '',
    email: '',
    address: '',
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
      const res = await fetch('/api/medical/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Supplier added successfully');
        router.push('/medical/suppliers');
      } else {
        setError(data.error || 'Failed to add supplier');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Add New Supplier</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Contact Person Name"
          value={form.name}
          onChange={handleChange}
          required
          style={{ display: 'block', margin: '10px 0', width: '100%' }}
        />
        <input
          type="text"
          name="companyName"
          placeholder="Company Name"
          value={form.companyName}
          onChange={handleChange}
          required
          style={{ display: 'block', margin: '10px 0', width: '100%' }}
        />
        <input
          type="tel"
          name="mobile"
          placeholder="Mobile Number"
          value={form.mobile}
          onChange={handleChange}
          required
          style={{ display: 'block', margin: '10px 0', width: '100%' }}
        />
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          required
          style={{ display: 'block', margin: '10px 0', width: '100%' }}
        />
        <textarea
          name="address"
          placeholder="Full Address"
          value={form.address}
          onChange={handleChange}
          required
          rows="4"
          style={{ display: 'block', margin: '10px 0', width: '100%' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '10px', width: '100%', marginTop: '20px' }}>
          {loading ? 'Adding...' : 'Add Supplier'}
        </button>
      </form>
    </div>
  );
}
