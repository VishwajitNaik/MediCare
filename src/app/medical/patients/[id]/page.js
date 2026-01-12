'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PatientDetails() {
  const params = useParams();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatientData();
  }, [params.id]);

  const fetchPatientData = async () => {
    try {
      const res = await fetch(`/api/medical/patients/${params.id}`);
      const data = await res.json();

      if (res.ok) {
        setPatient(data.patient);
        setHistory(data.history);
      } else {
        setError(data.error || 'Failed to fetch patient data');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Link href="/medical/patients" className="text-blue-600 hover:underline">
            Back to Patient Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patient Details</h1>
              <p className="mt-2 text-gray-600">Complete medical history and purchase records</p>
            </div>
            <Link
              href="/medical/patients"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Back to Search
            </Link>
          </div>
        </div>

        {/* Patient Info Card */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Patient Information</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="mt-1 text-lg font-medium text-gray-900">{patient.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Mobile</label>
                <p className="mt-1 text-lg font-medium text-gray-900">{patient.mobile}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Age</label>
                <p className="mt-1 text-lg font-medium text-gray-900">{patient.age} years</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Gender</label>
                <p className="mt-1 text-lg font-medium text-gray-900">{patient.gender}</p>
              </div>
            </div>
            {patient.medicalHistory && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500">Medical History</label>
                <p className="mt-1 text-gray-700">{patient.medicalHistory}</p>
              </div>
            )}
          </div>
        </div>

        {/* History Sections */}
        <div className="space-y-8">
          {/* Medicines Served History */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Medicines Served History</h2>
              <p className="mt-1 text-sm text-gray-600">All medicine dispensing records</p>
            </div>
            <div className="px-6 py-4">
              {history.medicines.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No medicine serving records found</p>
              ) : (
                <div className="space-y-4">
                  {history.medicines.map((record) => (
                    <div key={record._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Visit Date: {formatDate(record.visitDate)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Served by: {record.medicalId?.name || 'Medical Staff'}
                          </p>
                          {record.prescriptionId && (
                            <p className="text-sm text-blue-600">
                              From Prescription
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(record.totalAmount)}</p>
                          <p className="text-sm text-gray-600">{record.source.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {record.medicines.map((med, index) => (
                          <div key={index} className="bg-gray-50 rounded p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {med.medicineId?.name || 'Unknown Medicine'}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {med.dosePerTime} • {med.actualQuantity} units • {formatCurrency(med.totalPrice)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Duration: {med.durationDays} days • Start: {formatDate(med.startDate)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {record.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">Notes: {record.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Purchase History */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Purchase History</h2>
              <p className="mt-1 text-sm text-gray-600">All medicine purchase records</p>
            </div>
            <div className="px-6 py-4">
              {history.purchases.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No purchase records found</p>
              ) : (
                <div className="space-y-4">
                  {history.purchases.map((purchase) => (
                    <div key={purchase._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Bill #{purchase.billNumber}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Date: {formatDate(purchase.saleDate)} • Payment: {purchase.paymentMode}
                          </p>
                          {purchase.prescriptionId && (
                            <p className="text-sm text-blue-600">
                              From Prescription
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(purchase.totalAmount)}</p>
                          <p className="text-sm text-gray-600">Total Amount</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {purchase.items.map((item, index) => (
                          <div key={index} className="bg-gray-50 rounded p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {item.medicineId?.name || 'Unknown Medicine'}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Quantity: {item.quantity} • {formatCurrency(item.sellingPrice)} each
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">{formatCurrency(item.total)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prescription History */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Prescription History</h2>
              <p className="mt-1 text-sm text-gray-600">All prescriptions issued to this patient</p>
            </div>
            <div className="px-6 py-4">
              {history.prescriptions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No prescription records found</p>
              ) : (
                <div className="space-y-4">
                  {history.prescriptions.map((prescription) => (
                    <div key={prescription._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Prescription Date: {formatDate(prescription.date)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Doctor: {prescription.doctor?.name || 'Unknown'} • {prescription.doctor?.specialization || ''}
                          </p>
                          <p className="text-sm">
                            Status: <span className={prescription.fulfilled ? 'text-green-600' : 'text-orange-600'}>
                              {prescription.fulfilled ? 'Fulfilled' : 'Pending'}
                            </span>
                            {prescription.fulfilled && prescription.fulfilledAt && (
                              <> on {formatDate(prescription.fulfilledAt)}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {prescription.medicines.map((med, index) => (
                          <div key={index} className="bg-gray-50 rounded p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {med.medicine?.name || med.medicineName || 'Unknown Medicine'}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {med.dosePerTime} • Duration: {med.durationDays} days • Qty: {med.totalQuantity}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Timing: {med.timing?.join(', ') || 'Not specified'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
