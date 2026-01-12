'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Save, X, Plus, Trash2 } from 'lucide-react';

export default function DoctorAvailability() {
  const [availability, setAvailability] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [newLeave, setNewLeave] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    type: 'personal',
    isEmergency: false
  });
  const router = useRouter();

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/doctor/availability');
      const data = await response.json();

      if (response.ok && data.success) {
        setAvailability(data.data.availability);
        setLeaves(data.data.leaves);
      } else if (response.status === 401) {
        router.push('/doctor/signin');
      } else {
        setError(data.error || 'Failed to fetch availability');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveSchedule = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      console.log('Saving availability:', availability); // Debug log

      const response = await fetch('/api/doctor/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Availability schedule saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to save schedule');
        console.error('Save failed:', data); // Debug log
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Save error:', err); // Debug log
    } finally {
      setSaving(false);
    }
  };

  const updateDaySchedule = (dayIndex, field, value) => {
    const updated = [...availability];
    updated[dayIndex] = {
      ...updated[dayIndex],
      [field]: value
    };
    setAvailability(updated);
  };

  const addLeave = async (e) => {
    e.preventDefault();

    if (!newLeave.startDate || !newLeave.endDate || !newLeave.reason) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch('/api/doctor/availability/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeave)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || 'Leave request submitted successfully!');
        setShowLeaveForm(false);
        setNewLeave({
          startDate: '',
          endDate: '',
          reason: '',
          type: 'personal',
          isEmergency: false
        });
        fetchAvailability(); // Refresh leaves list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to submit leave request');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const cancelLeave = async (leaveId) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    try {
      const response = await fetch('/api/doctor/availability/leaves', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveId,
          cancellationReason: 'Cancelled by doctor'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Leave request cancelled successfully!');
        fetchAvailability();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to cancel leave');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Auto-Approved (Emergency)':
        return 'bg-purple-100 text-purple-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Pending Approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading your availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/doctor/dashboard">
                <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
                  ← Back to Dashboard
                </button>
              </Link>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">📅</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Availability</h1>
                <p className="text-gray-600">Set your weekly schedule and manage leave requests</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowLeaveForm(true)}
                className="px-4 py-2 bg-green-50 text-green-600 rounded-lg font-medium hover:bg-green-100 transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                Request Leave
              </button>
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  router.push('/doctor/signin');
                }}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8 rounded">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 font-medium">{success}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Schedule */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Calendar /> Weekly Schedule
              </h2>
              <p className="text-gray-600 text-sm">Set your working hours for each day</p>
            </div>
            <button
              onClick={saveSchedule}
              disabled={saving}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                saving
                  ? 'bg-blue-400 cursor-not-allowed text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>

          <div className="space-y-4">
            {availability.map((day) => (
              <div key={day.day} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={day.enabled}
                        onChange={(e) => updateDaySchedule(day.day, 'enabled', e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className={`font-medium ${day.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                        {day.dayName}
                      </span>
                    </label>
                  </div>

                  {day.enabled && (
                    <div className="flex-1 grid grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => updateDaySchedule(day.day, 'startTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">End Time</label>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => updateDaySchedule(day.day, 'endTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Lunch Start</label>
                        <input
                          type="time"
                          value={day.breakStart}
                          onChange={(e) => updateDaySchedule(day.day, 'breakStart', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Lunch End</label>
                        <input
                          type="time"
                          value={day.breakEnd}
                          onChange={(e) => updateDaySchedule(day.day, 'breakEnd', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Slot Duration (min)</label>
                        <select
                          value={day.slotDuration}
                          onChange={(e) => updateDaySchedule(day.day, 'slotDuration', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={10}>10 minutes</option>
                          <option value={15}>15 minutes</option>
                          <option value={20}>20 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={45}>45 minutes</option>
                          <option value={60}>60 minutes</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Management */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Leave Management</h2>
              <p className="text-gray-600 text-sm">Request and manage your leave days</p>
            </div>
          </div>

          {/* Leave Request Form */}
          {showLeaveForm && (
            <div className="bg-blue-50 p-6 rounded-lg mb-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900">Request New Leave</h3>
                <button
                  onClick={() => setShowLeaveForm(false)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={addLeave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={newLeave.startDate}
                      onChange={(e) => setNewLeave({...newLeave, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      min={newLeave.startDate || new Date().toISOString().split('T')[0]}
                      value={newLeave.endDate}
                      onChange={(e) => setNewLeave({...newLeave, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                  <select
                    value={newLeave.type}
                    onChange={(e) => setNewLeave({...newLeave, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="personal">Personal Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="emergency">Emergency Leave</option>
                    <option value="holiday">Holiday</option>
                    <option value="conference">Conference</option>
                    <option value="training">Training</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                  <textarea
                    required
                    rows={3}
                    value={newLeave.reason}
                    onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})}
                    placeholder="Please provide a reason for your leave request..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="emergency"
                    checked={newLeave.isEmergency}
                    onChange={(e) => setNewLeave({...newLeave, isEmergency: e.target.checked})}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="emergency" className="text-sm text-gray-700">
                    This is an emergency leave (will be auto-approved)
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLeaveForm(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      saving
                        ? 'bg-blue-400 cursor-not-allowed text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {saving ? 'Submitting...' : 'Submit Leave Request'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Leave History */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Leave History</h3>

            {leaves.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No leave requests found</p>
                <p className="text-sm">Click "Request Leave" to add your first leave</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaves.map((leave) => (
                  <div key={leave.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.approvalStatus)}`}>
                            {leave.approvalStatus}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Type:</span> {leave.type.replace('_', ' ')}
                          </div>
                          <div>
                            <span className="font-medium">Requested:</span> {new Date(leave.createdAt).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Reason:</span> {leave.reason}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {!leave.isApproved && leave.approvalStatus === 'Pending Approval' && (
                          <button
                            onClick={() => cancelLeave(leave.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel leave request"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} MediCare Clinic. Manage your availability securely.</p>
            <p className="mt-1">For support, contact: support@medicare.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
