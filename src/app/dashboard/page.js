'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch stats');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Hospital Management Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', margin: '20px 0' }}>
        <div style={{ border: '1px solid #ccc', padding: '20px', textAlign: 'center' }}>
          <h2>{stats.totalPatients}</h2>
          <p>Total Patients</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '20px', textAlign: 'center' }}>
          <h2>{stats.totalPrescriptions}</h2>
          <p>Total Prescriptions</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '20px', textAlign: 'center' }}>
          <h2>{stats.totalDoctors}</h2>
          <p>Total Doctors</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '20px', textAlign: 'center' }}>
          <h2>{stats.totalMedicalStaff}</h2>
          <p>Medical Staff</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '20px', textAlign: 'center' }}>
          <h2>{stats.pendingPrescriptions}</h2>
          <p>Pending Prescriptions</p>
        </div>
      </div>
      <nav>
        <h3>Quick Links</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ margin: '10px 0' }}>
            <Link href="/doctor/patients" style={{ textDecoration: 'none', color: 'blue' }}>
              View Patients
            </Link>
          </li>
          <li style={{ margin: '10px 0' }}>
            <Link href="/medical/prescriptions" style={{ textDecoration: 'none', color: 'blue' }}>
              View Pending Prescriptions
            </Link>
          </li>
          <li style={{ margin: '10px 0' }}>
            <Link href="/medical/inventory" style={{ textDecoration: 'none', color: 'blue' }}>
              View Inventory
            </Link>
          </li>
          <li style={{ margin: '10px 0' }}>
            <Link href="/api/auth/logout" style={{ textDecoration: 'none', color: 'red' }}>
              Logout
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
