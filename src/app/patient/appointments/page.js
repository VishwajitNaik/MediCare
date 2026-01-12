'use client';

import { useState, useEffect, useRef } from 'react'; // Added useRef
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PatientAppointments() {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentStats, setAppointmentStats] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('book');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [doctorAvailableDays, setDoctorAvailableDays] = useState([]); // New state for doctor's available days
  const [doctorSchedule, setDoctorSchedule] = useState(null); // New state for doctor's schedule
  const [bookingForm, setBookingForm] = useState({
    appointmentDate: '',
    appointmentTime: '',
    appointmentType: 'new',
    reason: '',
    notes: ''
  });
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const router = useRouter();
  
  // Add ref to keep input focus
  const searchInputRef = useRef(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'book') {
      fetchDoctors();
    } else {
      fetchAppointments();
    }
  }, [activeTab]);

  // Fetch doctors when filter or search changes
  useEffect(() => {
    if (activeTab === 'book') {
      fetchDoctors();
    }
  }, [filterSpecialty, debouncedSearchQuery]);

  // Keep search input focused after re-render
  useEffect(() => {
    if (searchInputRef.current && activeTab === 'book') {
      searchInputRef.current.focus();
    }
  }, [loading, activeTab]);

  // Fetch doctor's schedule when doctor is selected
  useEffect(() => {
    if (selectedDoctor) {
      fetchDoctorSchedule();
    } else {
      setDoctorSchedule(null);
      setDoctorAvailableDays([]);
    }
  }, [selectedDoctor]);

  // Generate available dates based on doctor's schedule
  useEffect(() => {
    if (selectedDoctor && doctorSchedule) {
      generateAvailableDates();
    } else {
      setAvailableDates([]);
      setBookingForm(prev => ({ ...prev, appointmentDate: '' }));
    }
  }, [selectedDoctor, doctorSchedule]);

  // Fetch available slots when doctor and date are selected
  useEffect(() => {
    if (selectedDoctor && bookingForm.appointmentDate) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDoctor, bookingForm.appointmentDate]);

  // New function to fetch doctor's schedule
  const fetchDoctorSchedule = async () => {
    try {
      const response = await fetch(`/api/doctors/${selectedDoctor.id}/schedule`);
      const data = await response.json();

      if (response.ok && data.success) {
        setDoctorSchedule(data.data.schedule);
        setDoctorAvailableDays(data.data.availableDays || []);
      } else {
        setDoctorSchedule(null);
        setDoctorAvailableDays([]);
        setError('Failed to fetch doctor schedule');
      }
    } catch (err) {
      setDoctorSchedule(null);
      setDoctorAvailableDays([]);
      setError('Failed to fetch doctor schedule');
    }
  };

  // Generate available dates for the next week based on doctor's available days
  const generateAvailableDates = () => {
    if (!doctorAvailableDays.length) {
      setAvailableDates([]);
      return;
    }

    const today = new Date();
    const availableDatesList = [];

    // Generate dates for the next 7 days
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Get day name (Monday, Tuesday, etc.)
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

      // Check if this day is in doctor's available days
      if (doctorAvailableDays.includes(dayName)) {
        const dateString = date.toISOString().split('T')[0];
        const formattedDate = date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });

        availableDatesList.push({
          date: dateString,
          display: formattedDate,
          day: dayName
        });
      }
    }

    setAvailableDates(availableDatesList);
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await fetch(`/api/appointments/availability?doctorId=${selectedDoctor.id}&date=${bookingForm.appointmentDate}`);
      const data = await response.json();

      if (response.ok && data.available) {
        setAvailableSlots(data.slots);
      } else {
        setAvailableSlots([]);
        setError(data.reason || 'No slots available for this date');
      }
    } catch (err) {
      setAvailableSlots([]);
      setError('Failed to fetch available slots');
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (filterSpecialty !== 'all') params.append('specialty', filterSpecialty);
      if (debouncedSearchQuery.trim()) params.append('search', debouncedSearchQuery.trim());

      const response = await fetch(`/api/auth/patient/doctors?${params}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setDoctors(data.data.doctors);
        setSpecialties(data.data.specialties);
      } else if (response.status === 401) {
        router.push('/patient/signin');
      } else {
        setError(data.error || 'Failed to fetch doctors');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/auth/patient/appointments');
      const data = await response.json();

      if (response.ok && data.success) {
        setAppointments(data.data.appointments);
        setAppointmentStats(data.data.stats);
      } else if (response.status === 401) {
        router.push('/patient/signin');
      } else {
        setError(data.error || 'Failed to fetch appointments');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();

    if (!selectedDoctor || !bookingForm.appointmentDate || !bookingForm.appointmentTime) {
      setError('Please select a doctor, date, and time slot');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          date: bookingForm.appointmentDate, // YYYY-MM-DD format
          slotTime: bookingForm.appointmentTime,
          reason: bookingForm.reason,
          type: bookingForm.appointmentType
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Appointment booked successfully! Your token number is ${data.appointment.tokenNumber}`);
        setSelectedDoctor(null);
        setSelectedDate(null);
        setAvailableSlots([]);
        setBookingForm({
          appointmentDate: '',
          appointmentTime: '',
          appointmentType: 'new',
          reason: '',
          notes: ''
        });
        setActiveTab('history');
        fetchAppointments();
      } else {
        setError(data.error || 'Failed to book appointment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailableTimeSlots = () => {
    return [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
      '16:00', '16:30', '17:00', '17:30', '18:00'
    ];
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading && !selectedDoctor && !doctors.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/patient/dashboard">
                <button className="flex items-center text-green-600 hover:text-green-700 font-medium">
                  ← Back to Dashboard
                </button>
              </Link>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">📅</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
                <p className="text-gray-600">Book appointments and manage your healthcare schedule</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  router.push('/patient/signin');
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
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('book')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'book'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Book Appointment
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 My Appointments ({appointmentStats?.total || 0})
            </button>
          </div>
        </div>

        {/* Error Message */}
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

        {/* Book Appointment Tab */}
        {activeTab === 'book' && !selectedDoctor && (
          <div>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search doctors by name, specialty, or hospital..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="md:w-64">
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={filterSpecialty}
                    onChange={(e) => setFilterSpecialty(e.target.value)}
                  >
                    <option value="all">All Specialties</option>
                    {specialties.map(specialty => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Loading indicator for search */}
              {loading && doctors.length > 0 && (
                <div className="mt-3 flex items-center text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                  Searching...
                </div>
              )}
            </div>

            {/* Doctors Grid */}
            {!loading || doctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {doctor.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{doctor.name}</h3>
                          <p className="text-sm text-gray-600">{doctor.specialty}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">⭐ {doctor.rating}</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Hospital:</span>
                        <span className="font-medium">{doctor.hospital}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Experience:</span>
                        <span className="font-medium">{doctor.experience} years</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Next Available:</span>
                        <span className="font-medium text-green-600">{doctor.nextAvailable}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Consultation Fee:</span>
                        <span className="font-medium text-green-600">₹{doctor.consultationFee}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedDoctor(doctor)}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Book Appointment
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              // Show loading skeleton while initially loading
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-pulse">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="space-y-2 mb-4">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="flex justify-between">
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      ))}
                    </div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            )}

            {doctors.length === 0 && !loading && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
                <div className="text-6xl mb-4">👨‍⚕️</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No doctors found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or specialty filter.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterSpecialty('all');
                    if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Appointment Booking Form */}
        {selectedDoctor && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Book Appointment</h2>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Selected Doctor</h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {selectedDoctor.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-blue-900">{selectedDoctor.name}</p>
                  <p className="text-sm text-blue-700">{selectedDoctor.specialty} • {selectedDoctor.hospital}</p>
                  {/* Show doctor's available days */}
                  {doctorAvailableDays.length > 0 && (
                    <p className="text-sm text-blue-600 mt-1">
                      Available on: {doctorAvailableDays.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date Selection - Only show available dates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Date *
                  </label>
                  {availableDates.length > 0 ? (
                    <select
                      required
                      value={bookingForm.appointmentDate}
                      onChange={(e) => setBookingForm({...bookingForm, appointmentDate: e.target.value})}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select a date</option>
                      {availableDates.map(date => (
                        <option key={date.date} value={date.date}>
                          {date.display} ({date.day})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-700">
                        No available dates in the next week. Please check back later.
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Only showing dates when doctor is available (next 7 days)
                  </p>
                </div>

                {/* Time Slot Selection - Only show available slots */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Time *
                  </label>
                  {bookingForm.appointmentDate ? (
                    availableSlots.length > 0 ? (
                      <select
                        required
                        value={bookingForm.appointmentTime}
                        onChange={(e) => setBookingForm({...bookingForm, appointmentTime: e.target.value})}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select time slot</option>
                        {availableSlots.map(slot => (
                          <option key={slot.time} value={slot.time}>
                            {slot.display} {slot.available ? '' : '(Booked)'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-700">
                          No available time slots for this date.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50">
                      <p className="text-gray-500">Select a date first to see available times</p>
                    </div>
                  )}
                  {availableSlots.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {availableSlots.length} slot(s) available
                    </p>
                  )}
                </div>
              </div>

              {/* Show next available dates info */}
              {doctorAvailableDays.length > 0 && availableDates.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Next Available Dates:</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableDates.slice(0, 3).map(date => (
                      <span
                        key={date.date}
                        className={`px-3 py-1 rounded-full text-sm ${
                          bookingForm.appointmentDate === date.date
                            ? 'bg-green-600 text-white'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {date.display}
                      </span>
                    ))}
                    {availableDates.length > 3 && (
                      <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                        +{availableDates.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Type
                </label>
                <select
                  value={bookingForm.appointmentType}
                  onChange={(e) => setBookingForm({...bookingForm, appointmentType: e.target.value})}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="new">General Consultation</option>
                  <option value="follow-up">Follow-up Visit</option>
                  <option value="emergency">Emergency</option>
                  <option value="review">Regular Checkup</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptoms (Optional)
                </label>
                <textarea
                  rows={3}
                  value={bookingForm.symptoms}
                  onChange={(e) => setBookingForm({...bookingForm, symptoms: e.target.value})}
                  placeholder="Describe your symptoms or reason for visit..."
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                  placeholder="Any special requests or additional information..."
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Appointments History Tab */}
        {activeTab === 'history' && (
          <div>
            {/* Stats Cards */}
            {appointmentStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{appointmentStats.total}</p>
                    <p className="text-sm text-gray-600">Total Appointments</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{appointmentStats.confirmed}</p>
                    <p className="text-sm text-gray-600">Confirmed</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-600">{appointmentStats.pending}</p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">₹{appointmentStats.totalFees}</p>
                    <p className="text-sm text-gray-600">Total Fees</p>
                  </div>
                </div>
              </div>
            )}

            {/* Next Appointment */}
            {appointmentStats?.nextAppointment && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📅</span>
                  <div>
                    <h3 className="font-semibold text-green-900">Next Appointment</h3>
                    <p className="text-green-800">
                      {appointmentStats.nextAppointment.doctorName} ({appointmentStats.nextAppointment.specialty})
                    </p>
                    <p className="text-green-700 text-sm">
                      {appointmentStats.nextAppointment.dateFormatted} at {appointmentStats.nextAppointment.timeFormatted}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Appointments List */}
            <div className="space-y-6">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {appointment.doctor.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{appointment.doctor.name}</h3>
                          <p className="text-gray-600">{appointment.doctor.specialty} • {appointment.doctor.hospital}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Date & Time</h4>
                        <p className="text-gray-900">{appointment.appointmentDateFormatted}</p>
                        <p className="text-gray-600">{appointment.slotTimeFormatted}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Type</h4>
                        <p className="text-gray-900 capitalize">{appointment.type.replace('-', ' ')}</p>
                        <p className="text-gray-600">₹{appointment.fee}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Location</h4>
                        <p className="text-gray-900">{appointment.clinicAddress || appointment.doctor.clinicAddress}</p>
                      </div>
                    </div>

                    {appointment.symptoms && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Symptoms</h4>
                        <p className="text-gray-600 bg-gray-50 p-3 rounded">{appointment.symptoms}</p>
                      </div>
                    )}

                    {appointment.notes && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
                        <p className="text-gray-600 bg-blue-50 p-3 rounded">{appointment.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        Booked on {appointment.createdAtFormatted}
                      </p>

                      <div className="flex space-x-2">
                        {appointment.status === 'PENDING' && (
                          <button className="px-3 py-1 bg-red-50 text-red-600 rounded text-sm font-medium hover:bg-red-100">
                            Cancel
                          </button>
                        )}
                        <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm font-medium hover:bg-blue-100">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {appointments.length === 0 && !loading && (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No appointments yet</h3>
                  <p className="text-gray-600 mb-6">
                    You haven't booked any appointments. Book your first appointment with a doctor.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('book');
                      // Focus on search input when switching to book tab
                      setTimeout(() => {
                        if (searchInputRef.current) {
                          searchInputRef.current.focus();
                        }
                      }, 100);
                    }}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Book Your First Appointment
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} MediCare Clinic. Your appointments are managed securely.</p>
            <p className="mt-1">For appointment concerns, contact: appointments@medicare.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
