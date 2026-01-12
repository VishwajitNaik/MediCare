'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function ServeMedicine() {
  const [patient, setPatient] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [source, setSource] = useState('MEDICAL_DIRECT');
  const [selectedPrescription, setSelectedPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [doseSuggestions, setDoseSuggestions] = useState([]);
  const [showDoseModal, setShowDoseModal] = useState(false);

  const [medicineList, setMedicineList] = useState([]);
  const [currentMedicine, setCurrentMedicine] = useState({
    medicineId: '',
    medicineName: '',
    dosePerTime: '',
    timing: [],
    durationDays: '',
    actualQuantity: '',
    frequency: '',
    price: 0,
    totalPrice: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [patientHistory, setPatientHistory] = useState([]);

  const router = useRouter();
  const { id: patientId } = useParams();

  const headerRef = useRef(null);
  const medicineFormRef = useRef(null);
  const medicineListRef = useRef(null);
  const submitRef = useRef(null);

  // Initialize GSAP animations for header only
  useGSAP(() => {
    // Header animation
    gsap.from(headerRef.current, {
      y: -50,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    });

    // Form animation
    gsap.from(medicineFormRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      delay: 0.3,
      ease: "power2.out"
    });

    // Animate total amount when it changes
    gsap.to('.total-amount', {
      scale: 1.1,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: "power2.out"
    });

  }, { scope: headerRef });

  // Animate only newly added medicine items
  useEffect(() => {
    if (medicineList.length > 0) {
      const lastIndex = medicineList.length - 1;
      const newItem = document.querySelector(`.medicine-item-${lastIndex}`);
      if (newItem) {
        gsap.fromTo(newItem,
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
        );
      }
    }
  }, [medicineList]);

  useEffect(() => {
    fetchData();
    fetchPatientHistory();
  }, [patientId]);

  useEffect(() => {
    // Filter medicines based on search
    if (searchTerm) {
      const filtered = medicines.filter(medicine =>
        medicine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.genericName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMedicines(filtered);
    } else {
      setFilteredMedicines(medicines.slice(0, 50)); // Show first 50 for performance
    }
  }, [searchTerm, medicines]);

  useEffect(() => {
    // Calculate total amount
    const total = medicineList.reduce((sum, med) => sum + (med.totalPrice || 0), 0);
    setTotalAmount(total);
  }, [medicineList]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patientRes, medicinesRes, prescriptionsRes] = await Promise.all([
        fetch(`/api/common/patients/${patientId}`),
        fetch('/api/medical/medicines?limit=1000'),
        fetch(`/api/medical/prescriptions/fetch?patientId=${patientId}&status=ACTIVE`),
      ]);

      const patientData = await patientRes.json();
      const medicinesData = await medicinesRes.json();
      const prescriptionsData = await prescriptionsRes.json();

      if (patientRes.ok) setPatient(patientData.patient);
      if (medicinesRes.ok) setMedicines(medicinesData.medicines);
      if (prescriptionsRes.ok) setPrescriptions(prescriptionsData.prescriptions);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientHistory = async () => {
    try {
      const res = await fetch(`/api/medical/patient-medicines/history?patientId=${patientId}`);
      const data = await res.json();
      if (res.ok) {
        setPatientHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch patient history:', err);
    }
  };

  const getDoseSuggestions = (medicineId) => {
    const medicine = medicines.find(m => m._id === medicineId);
    if (!medicine) return [];

    const suggestions = [
      { label: '1 tablet', value: '1 tablet' },
      { label: '2 tablets', value: '2 tablets' },
    ];

    if (medicine.form === 'Syrup') {
      suggestions.push(
        { label: '5 ml', value: '5 ml' },
        { label: '10 ml', value: '10 ml' },
        { label: '15 ml', value: '15 ml' }
      );
    } else if (medicine.form === 'Injection') {
      suggestions.push(
        { label: '1 injection', value: '1 injection' },
        { label: '2 injections', value: '2 injections' }
      );
    }

    return suggestions;
  };

  const handleMedicineSelect = (medicineId) => {
    const medicine = medicines.find(m => m._id === medicineId);
    if (!medicine) return;

    // Check if medicine has inventory
    if (!medicine.availableStock || medicine.availableStock <= 0) {
      setError('This medicine is out of stock');
      return;
    }

    // Check if medicine has a valid price
    if (!medicine.sellingPrice || medicine.sellingPrice <= 0) {
      setError('This medicine does not have a valid selling price. Please check inventory.');
      return;
    }

    setCurrentMedicine({
      ...currentMedicine,
      medicineId,
      medicineName: medicine.name,
      price: medicine.sellingPrice || 0,
      dosePerTime: '',
      timing: [],
      durationDays: '7', // Default 7 days
      actualQuantity: '1',
      frequency: 'THREE_TIMES'
    });

    // Show dose suggestions
    setDoseSuggestions(getDoseSuggestions(medicineId));
    setShowDoseModal(true);
    setError(''); // Clear any previous errors
  };

  const addMedicineToList = () => {
    if (!currentMedicine.medicineId || !currentMedicine.dosePerTime ||
        currentMedicine.timing.length === 0 || !currentMedicine.durationDays ||
        !currentMedicine.actualQuantity) {
      setError('Please fill all medicine details');
      return;
    }

    // Check if medicine already added
    if (medicineList.some(m => m.medicineId === currentMedicine.medicineId)) {
      setError('This medicine is already added');
      return;
    }

    const quantity = parseInt(currentMedicine.actualQuantity);
    const price = currentMedicine.price || 0;
    const totalPrice = quantity * price;

    const newMedicine = { 
      ...currentMedicine, 
      totalPrice,
      key: `${currentMedicine.medicineId}-${Date.now()}` // Unique key
    };
    
    setMedicineList([...medicineList, newMedicine]);
    
    // Reset form
    setCurrentMedicine({
      medicineId: '',
      medicineName: '',
      dosePerTime: '',
      timing: [],
      durationDays: '',
      actualQuantity: '',
      frequency: '',
      price: 0,
      totalPrice: 0
    });
    setSearchTerm('');
    setError('');
    setSuccessMessage('Medicine added successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const removeMedicine = (index) => {
    // Simple fade out animation
    const item = document.querySelector(`.medicine-item-${index}`);
    if (item) {
      gsap.to(item, {
        opacity: 0,
        x: -50,
        duration: 0.3,
        onComplete: () => {
          setMedicineList(medicineList.filter((_, i) => i !== index));
        }
      });
    } else {
      // Fallback if animation fails
      setMedicineList(medicineList.filter((_, i) => i !== index));
    }
  };

  const handleCurrentTimingChange = (timingValue) => {
    setCurrentMedicine(prev => ({
      ...prev,
      timing: prev.timing.includes(timingValue)
        ? prev.timing.filter(t => t !== timingValue)
        : [...prev.timing, timingValue]
    }));
  };

  const calculateRequiredQuantity = (dosePerTime, timing, durationDays) => {
    // Simple calculation: dose * times per day * days
    const timesPerDay = timing.length;
    const doseMatch = dosePerTime.match(/(\d+)/);
    const dose = doseMatch ? parseInt(doseMatch[1]) : 1;
    return dose * timesPerDay * parseInt(durationDays || 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (medicineList.length === 0) {
      setError('Please add at least one medicine');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/medical/patient-medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          medicines: medicineList.map(med => ({
            medicineId: med.medicineId,
            dosePerTime: med.dosePerTime,
            timing: med.timing,
            durationDays: parseInt(med.durationDays),
            actualQuantity: parseInt(med.actualQuantity),
            frequency: med.frequency,
          })),
          source,
          prescriptionId: source === 'DOCTOR_PRESCRIPTION' ? selectedPrescription : undefined,
          notes,
          totalAmount,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Success animation
        gsap.fromTo(submitRef.current,
          { scale: 1 },
          {
            scale: 1.1,
            duration: 0.3,
            yoyo: true,
            repeat: 2,
            ease: "power2.out",
            onComplete: () => {
              alert(`✅ Medicines served successfully!\n\nTotal Amount: ₹${totalAmount.toFixed(2)}\nTotal Items: ${medicineList.length}\n\nPlease collect payment from patient.`);
              router.push(`/medical/patient-medicines/${data.patientMedicine.id}`);
            }
          }
        );
      } else {
        setError(data.error || 'Failed to serve medicines');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!patient && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-white flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Patient Not Found</h2>
          <p className="text-gray-600 mb-6">The requested patient could not be found.</p>
          <button
            onClick={() => router.push('/medical/patients')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 font-medium"
          >
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  const timingOptions = [
    { value: 'MORNING_BEFORE_FOOD', label: '🌅 Morning Before Food', icon: '☀️' },
    { value: 'MORNING_AFTER_FOOD', label: '🌅 Morning After Food', icon: '☀️' },
    { value: 'AFTERNOON_BEFORE_FOOD', label: '🌞 Afternoon Before Food', icon: '⛅' },
    { value: 'AFTERNOON_AFTER_FOOD', label: '🌞 Afternoon After Food', icon: '⛅' },
    { value: 'NIGHT_BEFORE_FOOD', label: '🌙 Night Before Food', icon: '🌙' },
    { value: 'NIGHT_AFTER_FOOD', label: '🌙 Night After Food', icon: '🌙' },
  ];

  const frequencyOptions = [
    { value: 'ONCE', label: 'Once a day' },
    { value: 'TWICE', label: 'Twice a day' },
    { value: 'THREE_TIMES', label: 'Three times a day' },
    { value: 'FOUR_TIMES', label: 'Four times a day' },
    { value: 'AS_NEEDED', label: 'As needed' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div ref={headerRef} className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Serve Medicine</h1>
              <p className="text-gray-600 mt-2">Dispense medication to patients efficiently</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Session ID</div>
              <div className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">SERVE-{Date.now().toString().slice(-8)}</div>
            </div>
          </div>

          {/* Patient Info Card */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">{patient.name}</h2>
                <div className="flex flex-wrap gap-4 text-white/90">
                  <span className="flex items-center">
                    <span className="mr-2">📱</span>
                    {patient.mobile}
                  </span>
                  <span className="flex items-center">
                    <span className="mr-2">🎂</span>
                    Age: {patient.age}
                  </span>
                  <span className="flex items-center">
                    <span className="mr-2">⚧️</span>
                    {patient.gender}
                  </span>
                  {patient.bloodGroup && (
                    <span className="flex items-center">
                      <span className="mr-2">💉</span>
                      Blood: {patient.bloodGroup}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <div className="text-sm opacity-80">Visit Date</div>
                <div className="text-lg font-bold">{new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Medicine Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Source Selection */}
            <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📋</span> Medicine Source
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSource('MEDICAL_DIRECT')}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    source === 'MEDICAL_DIRECT'
                      ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-white shadow-md'
                      : 'border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                      source === 'MEDICAL_DIRECT' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      💊
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900">Direct Sale</div>
                      <div className="text-sm text-gray-600">No prescription required</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSource('DOCTOR_PRESCRIPTION')}
                  disabled={prescriptions.length === 0}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    source === 'DOCTOR_PRESCRIPTION'
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-white shadow-md'
                      : prescriptions.length === 0
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                      source === 'DOCTOR_PRESCRIPTION' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      📋
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900">Doctor Prescription</div>
                      <div className="text-sm text-gray-600">
                        {prescriptions.length} active prescription{prescriptions.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {source === 'DOCTOR_PRESCRIPTION' && prescriptions.length > 0 && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Prescription *
                  </label>
                  <select
                    value={selectedPrescription}
                    onChange={(e) => setSelectedPrescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a prescription</option>
                    {prescriptions.map((prescription) => (
                      <option key={prescription._id} value={prescription._id}>
                        Dr. {prescription.doctor?.name || 'Unknown'} - {new Date(prescription.date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Medicine Form */}
            <div ref={medicineFormRef} className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-2">➕</span> Add Medicine
              </h3>

              {/* Search Medicine */}
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">🔍</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Search medicine by name, brand, or generic name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                
                {/* Medicine Search Results */}
                {searchTerm && filteredMedicines.length > 0 && (
                  <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredMedicines.map((medicine) => {
                      const hasStock = medicine.availableStock > 0;
                      const hasPrice = medicine.sellingPrice > 0;
                      const isAvailable = hasStock && hasPrice;

                      return (
                        <div
                          key={medicine._id}
                          onClick={() => isAvailable && handleMedicineSelect(medicine._id)}
                          className={`p-3 border-b last:border-b-0 transition-colors duration-150 ${
                            isAvailable
                              ? 'hover:bg-emerald-50 cursor-pointer'
                              : 'bg-gray-50 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{medicine.name}</div>
                              <div className="text-sm text-gray-600">
                                {medicine.brandName} • {medicine.strength}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Stock: {medicine.availableStock || 0} units • ₹{medicine.sellingPrice?.toFixed(2) || '0.00'}
                              </div>
                            </div>
                            <div className="text-right">
                              {!hasStock && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Out of Stock</span>
                              )}
                              {hasStock && !hasPrice && (
                                <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded">No Price</span>
                              )}
                              {hasStock && hasPrice && (
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Available</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Medicine Info */}
              {currentMedicine.medicineId && (
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-white rounded-lg border border-emerald-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-900">{currentMedicine.medicineName}</div>
                      <div className="text-sm text-gray-600">Selected for dispensing</div>
                    </div>
                    <div className="text-lg font-bold text-emerald-600">
                      ₹{currentMedicine.price?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              )}

              {/* Medicine Details Form */}
              <div className="space-y-6">
                {/* Dose and Frequency */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dose per Time *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 1 tablet, 5 ml"
                      value={currentMedicine.dosePerTime}
                      onChange={(e) => setCurrentMedicine({...currentMedicine, dosePerTime: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    {doseSuggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {doseSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.value}
                            type="button"
                            onClick={() => setCurrentMedicine({...currentMedicine, dosePerTime: suggestion.value})}
                            className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors duration-200"
                          >
                            {suggestion.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency *
                    </label>
                    <select
                      value={currentMedicine.frequency}
                      onChange={(e) => setCurrentMedicine({...currentMedicine, frequency: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Select frequency</option>
                      {frequencyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Timing */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Timing *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {timingOptions.map(({ value, label, icon }) => (
                      <label
                        key={value}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          currentMedicine.timing.includes(value)
                            ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-white shadow-sm'
                            : 'border-gray-200 hover:border-emerald-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={currentMedicine.timing.includes(value)}
                          onChange={() => handleCurrentTimingChange(value)}
                          className="hidden"
                        />
                        <div className={`w-6 h-6 rounded border flex items-center justify-center mr-3 ${
                          currentMedicine.timing.includes(value)
                            ? 'bg-emerald-600 border-emerald-600'
                            : 'border-gray-300'
                        }`}>
                          {currentMedicine.timing.includes(value) && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{icon} {label.split(' ')[0]}</div>
                          <div className="text-xs text-gray-600">{label.split(' ')[1]}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Duration and Quantity */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (days) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={currentMedicine.durationDays}
                        onChange={(e) => {
                          const days = e.target.value;
                          setCurrentMedicine({...currentMedicine, durationDays: days});
                          // Auto-calculate quantity
                          if (currentMedicine.dosePerTime && currentMedicine.timing.length > 0) {
                            const calculatedQty = calculateRequiredQuantity(
                              currentMedicine.dosePerTime,
                              currentMedicine.timing,
                              days
                            );
                            setCurrentMedicine(prev => ({
                              ...prev,
                              actualQuantity: calculatedQty.toString()
                            }));
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <div className="absolute right-3 top-3 text-gray-400">days</div>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {currentMedicine.durationDays} days = {
                        Math.ceil(parseInt(currentMedicine.durationDays || 0) / 7)
                      } weeks
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={currentMedicine.actualQuantity}
                        onChange={(e) => setCurrentMedicine({...currentMedicine, actualQuantity: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <div className="absolute right-3 top-3 text-gray-400">units</div>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Total: ₹{(currentMedicine.price * (currentMedicine.actualQuantity || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Add Medicine Button */}
                <button
                  type="button"
                  onClick={addMedicineToList}
                  disabled={!currentMedicine.medicineId || loading}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
                >
                  <span className="flex items-center justify-center">
                    <span className="mr-2">➕</span>
                    Add to Service List
                  </span>
                </button>
              </div>
            </div>

            {/* Medicine List */}
            {medicineList.length > 0 && (
              <div ref={medicineListRef} className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="mr-2">📝</span> Medicines to Serve ({medicineList.length})
                </h3>
                
                <div className="space-y-4">
                  {medicineList.map((med, index) => {
                    const medicineInfo = medicines.find(m => m._id === med.medicineId);
                    return (
                      <div 
                        key={med.key} 
                        className={`medicine-item medicine-item-${index} p-4 bg-gradient-to-r from-emerald-50 to-white rounded-xl border border-emerald-200 hover:shadow-md transition-all duration-200`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-white">💊</span>
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{medicineInfo?.name}</h4>
                                <div className="text-sm text-gray-600">
                                  {medicineInfo?.brandName} • {medicineInfo?.strength}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <div className="text-xs text-gray-500">Dose</div>
                                <div className="font-medium">{med.dosePerTime}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Timing</div>
                                <div className="font-medium">{med.timing.length} times/day</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Duration</div>
                                <div className="font-medium">{med.durationDays} days</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Quantity</div>
                                <div className="font-medium">{med.actualQuantity} units</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-emerald-600">
                              ₹{med.totalPrice?.toFixed(2) || '0.00'}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMedicine(index)}
                              className="mt-2 px-4 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-200 font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm opacity-80">Total Items</div>
                      <div className="text-2xl font-bold">{medicineList.length}</div>
                    </div>
                    <div>
                      <div className="text-sm opacity-80">Total Quantity</div>
                      <div className="text-2xl font-bold">
                        {medicineList.reduce((sum, med) => sum + parseInt(med.actualQuantity || 0), 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm opacity-80">Total Amount</div>
                      <div className="text-3xl font-bold total-amount">₹{totalAmount.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Summary & Submit */}
          <div className="space-y-6">
            {/* Patient History */}
            {patientHistory.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📊</span> Recent History
                </h3>
                <div className="space-y-3">
                  {patientHistory.slice(0, 3).map((history) => (
                    <div key={history._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(history.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {history.medicinesCount} items • ₹{history.totalAmount?.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📝</span> Additional Notes
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                placeholder="Add any special instructions, allergies, or notes..."
              />
            </div>

            {/* Submit Section */}
            <div ref={submitRef} className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-emerald-700">{successMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="text-sm text-gray-500 mb-2">Total Amount</div>
                <div className="text-4xl font-bold text-emerald-600">₹{totalAmount.toFixed(2)}</div>
                <div className="text-sm text-gray-600 mt-2">
                  {medicineList.length} item{medicineList.length !== 1 ? 's' : ''} • {medicineList.reduce((sum, med) => sum + parseInt(med.actualQuantity || 0), 0)} units
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || medicineList.length === 0}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg ${
                  medicineList.length === 0
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-2">💊</span>
                    Serve {medicineList.length} Medicine{medicineList.length !== 1 ? 's' : ''}
                  </span>
                )}
              </button>

              <div className="mt-4 text-center text-sm text-gray-500">
                <p>✅ Medicines will be deducted from inventory</p>
                <p>✅ Receipt will be generated automatically</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { useRouter, useParams } from 'next/navigation';
// import gsap from 'gsap';
// import { useGSAP } from '@gsap/react';

// export default function ServeMedicine() {
//   const [patient, setPatient] = useState(null);
//   const [medicines, setMedicines] = useState([]);
//   const [filteredMedicines, setFilteredMedicines] = useState([]);
//   const [prescriptions, setPrescriptions] = useState([]);
//   const [source, setSource] = useState('MEDICAL_DIRECT');
//   const [selectedPrescription, setSelectedPrescription] = useState('');
//   const [notes, setNotes] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [doseSuggestions, setDoseSuggestions] = useState([]);
//   const [showDoseModal, setShowDoseModal] = useState(false);

//   const [medicineList, setMedicineList] = useState([]);
//   const [currentMedicine, setCurrentMedicine] = useState({
//     medicineId: '',
//     medicineName: '',
//     dosePerTime: '',
//     timing: [],
//     durationDays: '',
//     actualQuantity: '',
//     frequency: '',
//     price: 0,
//     totalPrice: 0
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');
//   const [totalAmount, setTotalAmount] = useState(0);
//   const [patientHistory, setPatientHistory] = useState([]);

//   const router = useRouter();
//   const { id: patientId } = useParams();

//   const headerRef = useRef(null);
//   const medicineFormRef = useRef(null);
//   const medicineListRef = useRef(null);
//   const submitRef = useRef(null);

//   // Initialize GSAP animations
//   useGSAP(() => {
//     // Header animation
//     gsap.from(headerRef.current, {
//       y: -50,
//       opacity: 0,
//       duration: 0.8,
//       ease: "power3.out"
//     });

//     // Form animation
//     gsap.from(medicineFormRef.current, {
//       y: 30,
//       opacity: 0,
//       duration: 0.6,
//       delay: 0.3,
//       ease: "power2.out"
//     });

//     // Animate total amount when it changes
//     gsap.to('.total-amount', {
//       scale: 1.1,
//       duration: 0.3,
//       yoyo: true,
//       repeat: 1,
//       ease: "power2.out"
//     });

//   }, { scope: headerRef });

//   // Animate medicine list when it changes
//   useGSAP(() => {
//     if (medicineList.length > 0) {
//       gsap.from('.medicine-item', {
//         x: -20,
//         opacity: 0,
//         stagger: 0.1,
//         duration: 0.4,
//         ease: "power2.out"
//       });
//     }
//   }, [medicineList]);

//   useEffect(() => {
//     fetchData();
//     fetchPatientHistory();
//   }, [patientId]);

//   useEffect(() => {
//     // Filter medicines based on search
//     if (searchTerm) {
//       const filtered = medicines.filter(medicine =>
//         medicine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         medicine.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         medicine.genericName?.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//       setFilteredMedicines(filtered);
//     } else {
//       setFilteredMedicines(medicines.slice(0, 50)); // Show first 50 for performance
//     }
//   }, [searchTerm, medicines]);

//   useEffect(() => {
//     // Calculate total amount
//     const total = medicineList.reduce((sum, med) => sum + (med.totalPrice || 0), 0);
//     setTotalAmount(total);
//   }, [medicineList]);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const [patientRes, medicinesRes, prescriptionsRes] = await Promise.all([
//         fetch(`/api/common/patients/${patientId}`),
//         fetch('/api/medical/medicines?limit=1000'),
//         fetch(`/api/medical/prescriptions/fetch?patientId=${patientId}&status=ACTIVE`),
//       ]);

//       const patientData = await patientRes.json();
//       const medicinesData = await medicinesRes.json();
//       const prescriptionsData = await prescriptionsRes.json();

//       if (patientRes.ok) setPatient(patientData.patient);
//       if (medicinesRes.ok) setMedicines(medicinesData.medicines);
//       if (prescriptionsRes.ok) setPrescriptions(prescriptionsData.prescriptions);
//     } catch (err) {
//       setError('Failed to load data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchPatientHistory = async () => {
//     try {
//       const res = await fetch(`/api/medical/patient-medicines/history?patientId=${patientId}`);
//       const data = await res.json();
//       if (res.ok) {
//         setPatientHistory(data.history || []);
//       }
//     } catch (err) {
//       console.error('Failed to fetch patient history:', err);
//     }
//   };

//   const getDoseSuggestions = (medicineId) => {
//     const medicine = medicines.find(m => m._id === medicineId);
//     if (!medicine) return [];

//     const suggestions = [
//       { label: '1 tablet', value: '1 tablet' },
//       { label: '2 tablets', value: '2 tablets' },
//     ];

//     if (medicine.form === 'Syrup') {
//       suggestions.push(
//         { label: '5 ml', value: '5 ml' },
//         { label: '10 ml', value: '10 ml' },
//         { label: '15 ml', value: '15 ml' }
//       );
//     } else if (medicine.form === 'Injection') {
//       suggestions.push(
//         { label: '1 injection', value: '1 injection' },
//         { label: '2 injections', value: '2 injections' }
//       );
//     }

//     return suggestions;
//   };

//   const handleMedicineSelect = (medicineId) => {
//     const medicine = medicines.find(m => m._id === medicineId);
//     if (!medicine) return;

//     // Check if medicine has inventory
//     if (!medicine.availableStock || medicine.availableStock <= 0) {
//       setError('This medicine is out of stock');
//       return;
//     }

//     // Check if medicine has a valid price
//     if (!medicine.sellingPrice || medicine.sellingPrice <= 0) {
//       setError('This medicine does not have a valid selling price. Please check inventory.');
//       return;
//     }

//     setCurrentMedicine({
//       ...currentMedicine,
//       medicineId,
//       medicineName: medicine.name,
//       price: medicine.sellingPrice || 0,
//       dosePerTime: '',
//       timing: [],
//       durationDays: '7', // Default 7 days
//       actualQuantity: '1',
//       frequency: 'THREE_TIMES'
//     });

//     // Show dose suggestions
//     setDoseSuggestions(getDoseSuggestions(medicineId));
//     setShowDoseModal(true);
//     setError(''); // Clear any previous errors
//   };

//   const addMedicineToList = () => {
//     if (!currentMedicine.medicineId || !currentMedicine.dosePerTime ||
//         currentMedicine.timing.length === 0 || !currentMedicine.durationDays ||
//         !currentMedicine.actualQuantity) {
//       setError('Please fill all medicine details');
//       return;
//     }

//     // Check if medicine already added
//     if (medicineList.some(m => m.medicineId === currentMedicine.medicineId)) {
//       setError('This medicine is already added');
//       return;
//     }

//     const quantity = parseInt(currentMedicine.actualQuantity);
//     const price = currentMedicine.price || 0;
//     const totalPrice = quantity * price;

//     setMedicineList([...medicineList, { 
//       ...currentMedicine, 
//       totalPrice,
//       key: `${currentMedicine.medicineId}-${Date.now()}` // Unique key
//     }]);
    
//     // Reset form with animation
//     gsap.to(medicineFormRef.current, {
//       y: -20,
//       opacity: 0,
//       duration: 0.3,
//       onComplete: () => {
//         setCurrentMedicine({
//           medicineId: '',
//           medicineName: '',
//           dosePerTime: '',
//           timing: [],
//           durationDays: '',
//           actualQuantity: '',
//           frequency: '',
//           price: 0,
//           totalPrice: 0
//         });
//         setSearchTerm('');
//         gsap.fromTo(medicineFormRef.current,
//           { y: -20, opacity: 0 },
//           { y: 0, opacity: 1, duration: 0.3 }
//         );
//       }
//     });

//     setError('');
//     setSuccessMessage('Medicine added successfully!');
//     setTimeout(() => setSuccessMessage(''), 3000);
//   };

//   const removeMedicine = (index) => {
//     gsap.to(`.medicine-item-${index}`, {
//       x: -100,
//       opacity: 0,
//       duration: 0.3,
//       onComplete: () => {
//         setMedicineList(medicineList.filter((_, i) => i !== index));
//       }
//     });
//   };

//   const handleCurrentTimingChange = (timingValue) => {
//     setCurrentMedicine(prev => ({
//       ...prev,
//       timing: prev.timing.includes(timingValue)
//         ? prev.timing.filter(t => t !== timingValue)
//         : [...prev.timing, timingValue]
//     }));
//   };

//   const calculateRequiredQuantity = (dosePerTime, timing, durationDays) => {
//     // Simple calculation: dose * times per day * days
//     const timesPerDay = timing.length;
//     const doseMatch = dosePerTime.match(/(\d+)/);
//     const dose = doseMatch ? parseInt(doseMatch[1]) : 1;
//     return dose * timesPerDay * parseInt(durationDays || 1);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (medicineList.length === 0) {
//       setError('Please add at least one medicine');
//       return;
//     }

//     setLoading(true);
//     setError('');

//     try {
//       const res = await fetch('/api/medical/patient-medicines', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           patientId,
//           medicines: medicineList.map(med => ({
//             medicineId: med.medicineId,
//             dosePerTime: med.dosePerTime,
//             timing: med.timing,
//             durationDays: parseInt(med.durationDays),
//             actualQuantity: parseInt(med.actualQuantity),
//             frequency: med.frequency,
//           })),
//           source,
//           prescriptionId: source === 'DOCTOR_PRESCRIPTION' ? selectedPrescription : undefined,
//           notes,
//           totalAmount,
//         }),
//       });

//       const data = await res.json();
//       if (res.ok) {
//         // Success animation
//         gsap.fromTo(submitRef.current,
//           { scale: 1 },
//           {
//             scale: 1.1,
//             duration: 0.3,
//             yoyo: true,
//             repeat: 2,
//             ease: "power2.out",
//             onComplete: () => {
//               alert(`✅ Medicines served successfully!\n\nTotal Amount: ₹${totalAmount.toFixed(2)}\nTotal Items: ${medicineList.length}\n\nPlease collect payment from patient.`);
//               router.push(`/medical/patient-medicines/${data.patientMedicine.id}`);
//             }
//           }
//         );
//       } else {
//         setError(data.error || 'Failed to serve medicines');
//       }
//     } catch (err) {
//       setError('Network error. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!patient && loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-white flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading patient data...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!patient) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-white flex items-center justify-center">
//         <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
//           <div className="text-4xl mb-4">⚠️</div>
//           <h2 className="text-xl font-bold text-gray-900 mb-2">Patient Not Found</h2>
//           <p className="text-gray-600 mb-6">The requested patient could not be found.</p>
//           <button
//             onClick={() => router.push('/medical/patients')}
//             className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 font-medium"
//           >
//             Back to Patients
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const timingOptions = [
//     { value: 'MORNING_BEFORE_FOOD', label: '🌅 Morning Before Food', icon: '☀️' },
//     { value: 'MORNING_AFTER_FOOD', label: '🌅 Morning After Food', icon: '☀️' },
//     { value: 'AFTERNOON_BEFORE_FOOD', label: '🌞 Afternoon Before Food', icon: '⛅' },
//     { value: 'AFTERNOON_AFTER_FOOD', label: '🌞 Afternoon After Food', icon: '⛅' },
//     { value: 'NIGHT_BEFORE_FOOD', label: '🌙 Night Before Food', icon: '🌙' },
//     { value: 'NIGHT_AFTER_FOOD', label: '🌙 Night After Food', icon: '🌙' },
//   ];

//   const frequencyOptions = [
//     { value: 'ONCE', label: 'Once a day' },
//     { value: 'TWICE', label: 'Twice a day' },
//     { value: 'THREE_TIMES', label: 'Three times a day' },
//     { value: 'FOUR_TIMES', label: 'Four times a day' },
//     { value: 'AS_NEEDED', label: 'As needed' },
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-white">
//       <div className="container mx-auto px-4 py-8">
//         {/* Header */}
//         <div ref={headerRef} className="mb-8">
//           <div className="flex items-center justify-between mb-6">
//             <div>
//               <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Serve Medicine</h1>
//               <p className="text-gray-600 mt-2">Dispense medication to patients efficiently</p>
//             </div>
//             <div className="text-right">
//               <div className="text-sm text-gray-500">Session ID</div>
//               <div className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">SERVE-{Date.now().toString().slice(-8)}</div>
//             </div>
//           </div>

//           {/* Patient Info Card */}
//           <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
//             <div className="flex flex-col md:flex-row md:items-center justify-between">
//               <div>
//                 <h2 className="text-2xl font-bold mb-2">{patient.name}</h2>
//                 <div className="flex flex-wrap gap-4 text-white/90">
//                   <span className="flex items-center">
//                     <span className="mr-2">📱</span>
//                     {patient.mobile}
//                   </span>
//                   <span className="flex items-center">
//                     <span className="mr-2">🎂</span>
//                     Age: {patient.age}
//                   </span>
//                   <span className="flex items-center">
//                     <span className="mr-2">⚧️</span>
//                     {patient.gender}
//                   </span>
//                   {patient.bloodGroup && (
//                     <span className="flex items-center">
//                       <span className="mr-2">💉</span>
//                       Blood: {patient.bloodGroup}
//                     </span>
//                   )}
//                 </div>
//               </div>
//               <div className="mt-4 md:mt-0 text-right">
//                 <div className="text-sm opacity-80">Visit Date</div>
//                 <div className="text-lg font-bold">{new Date().toLocaleDateString('en-IN', {
//                   weekday: 'long',
//                   year: 'numeric',
//                   month: 'long',
//                   day: 'numeric'
//                 })}</div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="grid lg:grid-cols-3 gap-6">
//           {/* Left Column - Medicine Form */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Source Selection */}
//             <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
//               <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
//                 <span className="mr-2">📋</span> Medicine Source
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <button
//                   type="button"
//                   onClick={() => setSource('MEDICAL_DIRECT')}
//                   className={`p-4 rounded-xl border transition-all duration-200 ${
//                     source === 'MEDICAL_DIRECT'
//                       ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-white shadow-md'
//                       : 'border-gray-200 hover:border-emerald-300'
//                   }`}
//                 >
//                   <div className="flex items-center">
//                     <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
//                       source === 'MEDICAL_DIRECT' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'
//                     }`}>
//                       💊
//                     </div>
//                     <div className="text-left">
//                       <div className="font-bold text-gray-900">Direct Sale</div>
//                       <div className="text-sm text-gray-600">No prescription required</div>
//                     </div>
//                   </div>
//                 </button>

//                 <button
//                   type="button"
//                   onClick={() => setSource('DOCTOR_PRESCRIPTION')}
//                   disabled={prescriptions.length === 0}
//                   className={`p-4 rounded-xl border transition-all duration-200 ${
//                     source === 'DOCTOR_PRESCRIPTION'
//                       ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-white shadow-md'
//                       : prescriptions.length === 0
//                       ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
//                       : 'border-gray-200 hover:border-blue-300'
//                   }`}
//                 >
//                   <div className="flex items-center">
//                     <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
//                       source === 'DOCTOR_PRESCRIPTION' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
//                     }`}>
//                       📋
//                     </div>
//                     <div className="text-left">
//                       <div className="font-bold text-gray-900">Doctor Prescription</div>
//                       <div className="text-sm text-gray-600">
//                         {prescriptions.length} active prescription{prescriptions.length !== 1 ? 's' : ''}
//                       </div>
//                     </div>
//                   </div>
//                 </button>
//               </div>

//               {source === 'DOCTOR_PRESCRIPTION' && prescriptions.length > 0 && (
//                 <div className="mt-6">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Select Prescription *
//                   </label>
//                   <select
//                     value={selectedPrescription}
//                     onChange={(e) => setSelectedPrescription(e.target.value)}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   >
//                     <option value="">Choose a prescription</option>
//                     {prescriptions.map((prescription) => (
//                       <option key={prescription._id} value={prescription._id}>
//                         Dr. {prescription.doctor?.name || 'Unknown'} - {new Date(prescription.date).toLocaleDateString()}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               )}
//             </div>

//             {/* Medicine Form */}
//             <div ref={medicineFormRef} className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
//               <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
//                 <span className="mr-2">➕</span> Add Medicine
//               </h3>

//               {/* Search Medicine */}
//               <div className="mb-6">
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <span className="text-gray-400">🔍</span>
//                   </div>
//                   <input
//                     type="text"
//                     placeholder="Search medicine by name, brand, or generic name..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                   />
//                 </div>
                
//                 {/* Medicine Search Results */}
//                 {searchTerm && filteredMedicines.length > 0 && (
//                   <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
//                     {filteredMedicines.map((medicine) => {
//                       const hasStock = medicine.availableStock > 0;
//                       const hasPrice = medicine.sellingPrice > 0;
//                       const isAvailable = hasStock && hasPrice;

//                       return (
//                         <div
//                           key={medicine._id}
//                           onClick={() => isAvailable && handleMedicineSelect(medicine._id)}
//                           className={`p-3 border-b last:border-b-0 transition-colors duration-150 ${
//                             isAvailable
//                               ? 'hover:bg-emerald-50 cursor-pointer'
//                               : 'bg-gray-50 cursor-not-allowed opacity-60'
//                           }`}
//                         >
//                           <div className="flex justify-between items-start">
//                             <div className="flex-1">
//                               <div className="font-medium text-gray-900">{medicine.name}</div>
//                               <div className="text-sm text-gray-600">
//                                 {medicine.brandName} • {medicine.strength}
//                               </div>
//                               <div className="text-xs text-gray-500 mt-1">
//                                 Stock: {medicine.availableStock || 0} units • ₹{medicine.sellingPrice?.toFixed(2) || '0.00'}
//                               </div>
//                             </div>
//                             <div className="text-right">
//                               {!hasStock && (
//                                 <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Out of Stock</span>
//                               )}
//                               {hasStock && !hasPrice && (
//                                 <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded">No Price</span>
//                               )}
//                               {hasStock && hasPrice && (
//                                 <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Available</span>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>

//               {/* Selected Medicine Info */}
//               {currentMedicine.medicineId && (
//                 <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-white rounded-lg border border-emerald-200">
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <div className="font-bold text-gray-900">{currentMedicine.medicineName}</div>
//                       <div className="text-sm text-gray-600">Selected for dispensing</div>
//                     </div>
//                     <div className="text-lg font-bold text-emerald-600">
//                       ₹{currentMedicine.price?.toFixed(2) || '0.00'}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Medicine Details Form */}
//               <div className="space-y-6">
//                 {/* Dose and Frequency */}
//                 <div className="grid md:grid-cols-2 gap-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Dose per Time *
//                     </label>
//                     <input
//                       type="text"
//                       placeholder="e.g., 1 tablet, 5 ml"
//                       value={currentMedicine.dosePerTime}
//                       onChange={(e) => setCurrentMedicine({...currentMedicine, dosePerTime: e.target.value})}
//                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                     />
//                     {doseSuggestions.length > 0 && (
//                       <div className="mt-2 flex flex-wrap gap-2">
//                         {doseSuggestions.map((suggestion) => (
//                           <button
//                             key={suggestion.value}
//                             type="button"
//                             onClick={() => setCurrentMedicine({...currentMedicine, dosePerTime: suggestion.value})}
//                             className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors duration-200"
//                           >
//                             {suggestion.label}
//                           </button>
//                         ))}
//                       </div>
//                     )}
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Frequency *
//                     </label>
//                     <select
//                       value={currentMedicine.frequency}
//                       onChange={(e) => setCurrentMedicine({...currentMedicine, frequency: e.target.value})}
//                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                     >
//                       <option value="">Select frequency</option>
//                       {frequencyOptions.map((option) => (
//                         <option key={option.value} value={option.value}>
//                           {option.label}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>

//                 {/* Timing */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-3">
//                     Timing *
//                   </label>
//                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//                     {timingOptions.map(({ value, label, icon }) => (
//                       <label
//                         key={value}
//                         className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
//                           currentMedicine.timing.includes(value)
//                             ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-white shadow-sm'
//                             : 'border-gray-200 hover:border-emerald-300'
//                         }`}
//                       >
//                         <input
//                           type="checkbox"
//                           checked={currentMedicine.timing.includes(value)}
//                           onChange={() => handleCurrentTimingChange(value)}
//                           className="hidden"
//                         />
//                         <div className={`w-6 h-6 rounded border flex items-center justify-center mr-3 ${
//                           currentMedicine.timing.includes(value)
//                             ? 'bg-emerald-600 border-emerald-600'
//                             : 'border-gray-300'
//                         }`}>
//                           {currentMedicine.timing.includes(value) && (
//                             <span className="text-white text-xs">✓</span>
//                           )}
//                         </div>
//                         <div>
//                           <div className="font-medium text-gray-900 text-sm">{icon} {label.split(' ')[0]}</div>
//                           <div className="text-xs text-gray-600">{label.split(' ')[1]}</div>
//                         </div>
//                       </label>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Duration and Quantity */}
//                 <div className="grid md:grid-cols-2 gap-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Duration (days) *
//                     </label>
//                     <div className="relative">
//                       <input
//                         type="number"
//                         min="1"
//                         max="365"
//                         value={currentMedicine.durationDays}
//                         onChange={(e) => {
//                           const days = e.target.value;
//                           setCurrentMedicine({...currentMedicine, durationDays: days});
//                           // Auto-calculate quantity
//                           if (currentMedicine.dosePerTime && currentMedicine.timing.length > 0) {
//                             const calculatedQty = calculateRequiredQuantity(
//                               currentMedicine.dosePerTime,
//                               currentMedicine.timing,
//                               days
//                             );
//                             setCurrentMedicine(prev => ({
//                               ...prev,
//                               actualQuantity: calculatedQty.toString()
//                             }));
//                           }
//                         }}
//                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                       />
//                       <div className="absolute right-3 top-3 text-gray-400">days</div>
//                     </div>
//                     <div className="mt-1 text-sm text-gray-500">
//                       {currentMedicine.durationDays} days = {
//                         Math.ceil(parseInt(currentMedicine.durationDays || 0) / 7)
//                       } weeks
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Quantity *
//                     </label>
//                     <div className="relative">
//                       <input
//                         type="number"
//                         min="1"
//                         value={currentMedicine.actualQuantity}
//                         onChange={(e) => setCurrentMedicine({...currentMedicine, actualQuantity: e.target.value})}
//                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                       />
//                       <div className="absolute right-3 top-3 text-gray-400">units</div>
//                     </div>
//                     <div className="mt-1 text-sm text-gray-500">
//                       Total: ₹{(currentMedicine.price * (currentMedicine.actualQuantity || 0)).toFixed(2)}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Add Medicine Button */}
//                 <button
//                   type="button"
//                   onClick={addMedicineToList}
//                   disabled={!currentMedicine.medicineId || loading}
//                   className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
//                 >
//                   <span className="flex items-center justify-center">
//                     <span className="mr-2">➕</span>
//                     Add to Service List
//                   </span>
//                 </button>
//               </div>
//             </div>

//             {/* Medicine List */}
//             {medicineList.length > 0 && (
//               <div ref={medicineListRef} className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
//                 <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
//                   <span className="mr-2">📝</span> Medicines to Serve ({medicineList.length})
//                 </h3>
                
//                 <div className="space-y-4">
//                   {medicineList.map((med, index) => {
//                     const medicineInfo = medicines.find(m => m._id === med.medicineId);
//                     return (
//                       <div 
//                         key={med.key} 
//                         className={`medicine-item medicine-item-${index} p-4 bg-gradient-to-r from-emerald-50 to-white rounded-xl border border-emerald-200 hover:shadow-md transition-all duration-200`}
//                       >
//                         <div className="flex justify-between items-start">
//                           <div className="flex-1">
//                             <div className="flex items-center">
//                               <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center mr-3">
//                                 <span className="text-white">💊</span>
//                               </div>
//                               <div>
//                                 <h4 className="font-bold text-gray-900">{medicineInfo?.name}</h4>
//                                 <div className="text-sm text-gray-600">
//                                   {medicineInfo?.brandName} • {medicineInfo?.strength}
//                                 </div>
//                               </div>
//                             </div>
                            
//                             <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
//                               <div>
//                                 <div className="text-xs text-gray-500">Dose</div>
//                                 <div className="font-medium">{med.dosePerTime}</div>
//                               </div>
//                               <div>
//                                 <div className="text-xs text-gray-500">Timing</div>
//                                 <div className="font-medium">{med.timing.length} times/day</div>
//                               </div>
//                               <div>
//                                 <div className="text-xs text-gray-500">Duration</div>
//                                 <div className="font-medium">{med.durationDays} days</div>
//                               </div>
//                               <div>
//                                 <div className="text-xs text-gray-500">Quantity</div>
//                                 <div className="font-medium">{med.actualQuantity} units</div>
//                               </div>
//                             </div>
//                           </div>
                          
//                           <div className="text-right">
//                             <div className="text-2xl font-bold text-emerald-600">
//                               ₹{med.totalPrice?.toFixed(2) || '0.00'}
//                             </div>
//                             <button
//                               type="button"
//                               onClick={() => removeMedicine(index)}
//                               className="mt-2 px-4 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-200 font-medium"
//                             >
//                               Remove
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>

//                 {/* Summary */}
//                 <div className="mt-6 p-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-white">
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <div className="text-sm opacity-80">Total Items</div>
//                       <div className="text-2xl font-bold">{medicineList.length}</div>
//                     </div>
//                     <div>
//                       <div className="text-sm opacity-80">Total Quantity</div>
//                       <div className="text-2xl font-bold">
//                         {medicineList.reduce((sum, med) => sum + parseInt(med.actualQuantity || 0), 0)}
//                       </div>
//                     </div>
//                     <div>
//                       <div className="text-sm opacity-80">Total Amount</div>
//                       <div className="text-3xl font-bold total-amount">₹{totalAmount.toFixed(2)}</div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Right Column - Summary & Submit */}
//           <div className="space-y-6">
//             {/* Patient History */}
//             {patientHistory.length > 0 && (
//               <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
//                 <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
//                   <span className="mr-2">📊</span> Recent History
//                 </h3>
//                 <div className="space-y-3">
//                   {patientHistory.slice(0, 3).map((history) => (
//                     <div key={history._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
//                       <div className="text-sm font-medium text-gray-900">
//                         {new Date(history.createdAt).toLocaleDateString()}
//                       </div>
//                       <div className="text-sm text-gray-600">
//                         {history.medicinesCount} items • ₹{history.totalAmount?.toFixed(2)}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Notes */}
//             <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
//               <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
//                 <span className="mr-2">📝</span> Additional Notes
//               </h3>
//               <textarea
//                 value={notes}
//                 onChange={(e) => setNotes(e.target.value)}
//                 rows="6"
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
//                 placeholder="Add any special instructions, allergies, or notes..."
//               />
//             </div>

//             {/* Submit Section */}
//             <div ref={submitRef} className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
//               {error && (
//                 <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
//                   <div className="flex items-center">
//                     <div className="flex-shrink-0">
//                       <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                       </svg>
//                     </div>
//                     <div className="ml-3">
//                       <p className="text-sm text-red-700">{error}</p>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {successMessage && (
//                 <div className="mb-4 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded">
//                   <div className="flex items-center">
//                     <div className="flex-shrink-0">
//                       <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                       </svg>
//                     </div>
//                     <div className="ml-3">
//                       <p className="text-sm text-emerald-700">{successMessage}</p>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div className="text-center mb-6">
//                 <div className="text-sm text-gray-500 mb-2">Total Amount</div>
//                 <div className="text-4xl font-bold text-emerald-600">₹{totalAmount.toFixed(2)}</div>
//                 <div className="text-sm text-gray-600 mt-2">
//                   {medicineList.length} item{medicineList.length !== 1 ? 's' : ''} • {medicineList.reduce((sum, med) => sum + parseInt(med.actualQuantity || 0), 0)} units
//                 </div>
//               </div>

//               <button
//                 type="button"
//                 onClick={handleSubmit}
//                 disabled={loading || medicineList.length === 0}
//                 className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg ${
//                   medicineList.length === 0
//                     ? 'bg-gray-400 text-white cursor-not-allowed'
//                     : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white hover:shadow-xl'
//                 }`}
//               >
//                 {loading ? (
//                   <span className="flex items-center justify-center">
//                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                     </svg>
//                     Processing...
//                   </span>
//                 ) : (
//                   <span className="flex items-center justify-center">
//                     <span className="mr-2">💊</span>
//                     Serve {medicineList.length} Medicine{medicineList.length !== 1 ? 's' : ''}
//                   </span>
//                 )}
//               </button>

//               <div className="mt-4 text-center text-sm text-gray-500">
//                 <p>✅ Medicines will be deducted from inventory</p>
//                 <p>✅ Receipt will be generated automatically</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
