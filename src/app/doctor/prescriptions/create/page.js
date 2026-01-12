// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';

// export default function CreatePrescription() {
//   const [patients, setPatients] = useState([]);
//   const [medicines, setMedicines] = useState([]);
//   const [selectedPatient, setSelectedPatient] = useState('');
//   const [prescriptionMedicines, setPrescriptionMedicines] = useState([]);
//   const [currentMedicine, setCurrentMedicine] = useState({
//     medicineId: '',
//     dosePerTime: '',
//     timing: [],
//     durationDays: '',
//     totalQuantity: '',
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const router = useRouter();

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const [patientsRes, medicinesRes] = await Promise.all([
//         fetch('/api/doctor/patients/list'),
//         fetch('/api/common/medicines'),
//       ]);

//       const patientsData = await patientsRes.json();
//       const medicinesData = await medicinesRes.json();

//       if (patientsRes.ok) setPatients(patientsData.patients);
//       if (medicinesRes.ok) setMedicines(medicinesData.medicines);
//     } catch (err) {
//       setError('Failed to load data');
//     }
//   };

//   const addMedicine = () => {
//     if (!currentMedicine.medicineId || !currentMedicine.dosePerTime ||
//         currentMedicine.timing.length === 0 || !currentMedicine.durationDays ||
//         !currentMedicine.totalQuantity) {
//       setError('Please fill all medicine details');
//       return;
//     }

//     const medicine = medicines.find(m => m._id === currentMedicine.medicineId);
//     setPrescriptionMedicines([...prescriptionMedicines, {
//       medicine: currentMedicine.medicineId,
//       medicineName: medicine.name,
//       dosePerTime: currentMedicine.dosePerTime,
//       timing: currentMedicine.timing,
//       durationDays: parseInt(currentMedicine.durationDays),
//       totalQuantity: parseInt(currentMedicine.totalQuantity),
//     }]);

//     setCurrentMedicine({
//       medicineId: '',
//       dosePerTime: '',
//       timing: [],
//       durationDays: '',
//       totalQuantity: '',
//     });
//     setError('');
//   };

//   const removeMedicine = (index) => {
//     setPrescriptionMedicines(prescriptionMedicines.filter((_, i) => i !== index));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!selectedPatient || prescriptionMedicines.length === 0) {
//       setError('Please select a patient and add medicines');
//       return;
//     }

//     setLoading(true);
//     setError('');

//     try {
//       const res = await fetch('/api/doctor/prescriptions/create', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           patientId: selectedPatient,
//           medicines: prescriptionMedicines.map(m => ({
//             medicine: m.medicine,
//             dosePerTime: m.dosePerTime,
//             timing: m.timing,
//             durationDays: m.durationDays,
//             totalQuantity: m.totalQuantity,
//           })),
//         }),
//       });

//       const data = await res.json();
//       if (res.ok) {
//         router.push('/doctor/prescriptions');
//       } else {
//         setError(data.error || 'Failed to create prescription');
//       }
//     } catch (err) {
//       setError('Network error');
//     }
//     setLoading(false);
//   };

//   return (
//     <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
//       <h1>Create Prescription</h1>
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//       <form onSubmit={handleSubmit}>
//         <select
//           value={selectedPatient}
//           onChange={(e) => setSelectedPatient(e.target.value)}
//           required
//           style={{ display: 'block', margin: '10px 0', width: '100%' }}
//         >
//           <option value="">Select Patient</option>
//           {patients.map((patient) => (
//             <option key={patient._id} value={patient._id}>
//               {patient.name} (Age: {patient.age})
//             </option>
//           ))}
//         </select>

//         <h3>Add Medicines</h3>
//         <div style={{ border: '2px dashed #ccc', padding: '20px', marginBottom: '20px', borderRadius: '8px' }}>
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
//             <div>
//               <label>Medicine:</label>
//               <select
//                 value={currentMedicine.medicineId}
//                 onChange={(e) => setCurrentMedicine({...currentMedicine, medicineId: e.target.value})}
//                 style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
//               >
//                 <option value="">Select Medicine</option>
//                 {medicines.map((medicine) => (
//                   <option key={medicine._id} value={medicine._id}>
//                     {medicine.name} - {medicine.brandName} ({medicine.strength})
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label>Dose per Time:</label>
//               <input
//                 type="text"
//                 placeholder="e.g., 1 tablet, 5 ml"
//                 value={currentMedicine.dosePerTime}
//                 onChange={(e) => setCurrentMedicine({...currentMedicine, dosePerTime: e.target.value})}
//                 style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
//               />
//             </div>
//           </div>

//           <div style={{ marginBottom: '15px' }}>
//             <label>Timing:</label>
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '5px' }}>
//               {[
//                 { value: 'MORNING_BEFORE_FOOD', label: 'Morning Before' },
//                 { value: 'MORNING_AFTER_FOOD', label: 'Morning After' },
//                 { value: 'AFTERNOON_BEFORE_FOOD', label: 'Afternoon Before' },
//                 { value: 'AFTERNOON_AFTER_FOOD', label: 'Afternoon After' },
//                 { value: 'NIGHT_BEFORE_FOOD', label: 'Night Before' },
//                 { value: 'NIGHT_AFTER_FOOD', label: 'Night After' },
//               ].map(({ value, label }) => (
//                 <label key={value} style={{ display: 'flex', alignItems: 'center', fontSize: '0.9em' }}>
//                   <input
//                     type="checkbox"
//                     checked={currentMedicine.timing.includes(value)}
//                     onChange={(e) => {
//                       const newTiming = e.target.checked
//                         ? [...currentMedicine.timing, value]
//                         : currentMedicine.timing.filter(t => t !== value);
//                       setCurrentMedicine({...currentMedicine, timing: newTiming});
//                     }}
//                     style={{ marginRight: '5px' }}
//                   />
//                   {label}
//                 </label>
//               ))}
//             </div>
//           </div>

//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
//             <div>
//               <label>Duration (days):</label>
//               <input
//                 type="number"
//                 min="1"
//                 max="365"
//                 value={currentMedicine.durationDays}
//                 onChange={(e) => setCurrentMedicine({...currentMedicine, durationDays: e.target.value})}
//                 style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
//               />
//             </div>

//             <div>
//               <label>Total Quantity:</label>
//               <input
//                 type="number"
//                 min="1"
//                 value={currentMedicine.totalQuantity}
//                 onChange={(e) => setCurrentMedicine({...currentMedicine, totalQuantity: e.target.value})}
//                 style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
//               />
//             </div>
//           </div>

//           <button
//             type="button"
//             onClick={addMedicine}
//             style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
//           >
//             Add Medicine
//           </button>
//         </div>

//         {prescriptionMedicines.length > 0 && (
//           <div style={{ marginBottom: '20px' }}>
//             <h3>Prescription Medicines</h3>
//             <div style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
//               {prescriptionMedicines.map((med, index) => (
//                 <div key={index} style={{
//                   padding: '15px',
//                   borderBottom: index < prescriptionMedicines.length - 1 ? '1px solid #eee' : 'none',
//                   display: 'flex',
//                   justifyContent: 'space-between',
//                   alignItems: 'center'
//                 }}>
//                   <div>
//                     <strong>{med.medicineName}</strong>
//                     <br />
//                     <small>
//                       {med.dosePerTime} | {med.timing.join(', ')} | {med.durationDays} days | Qty: {med.totalQuantity}
//                     </small>
//                   </div>
//                   <button
//                     type="button"
//                     onClick={() => removeMedicine(index)}
//                     style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
//                   >
//                     Remove
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         <button type="submit" disabled={loading} style={{ padding: '10px', width: '100%' }}>
//           {loading ? 'Creating...' : 'Create Prescription'}
//         </button>
//       </form>
//     </div>
//   );
// }

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function CreatePrescription() {
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [prescriptionMedicines, setPrescriptionMedicines] = useState([]);
  const [currentMedicine, setCurrentMedicine] = useState({
    medicineId: '',
    dosePerTime: '',
    timing: [],
    durationDays: '7',
    totalQuantity: '1',
    frequency: 'THREE_TIMES'
  });
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [doseSuggestions, setDoseSuggestions] = useState([]);

  const router = useRouter();
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const formRef = useRef(null);
  const medicineListRef = useRef(null);

  // Initialize GSAP animations
  useGSAP(() => {
    // Header animation
    gsap.from(headerRef.current, {
      y: -50,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    });

    // Form animation
    gsap.from(formRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      delay: 0.3,
      ease: "power2.out"
    });

  }, { scope: containerRef });

  // Animate medicine list when it changes
  useGSAP(() => {
    if (prescriptionMedicines.length > 0) {
      const lastIndex = prescriptionMedicines.length - 1;
      const newItem = document.querySelector(`.medicine-item-${lastIndex}`);
      if (newItem) {
        gsap.fromTo(newItem,
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
        );
      }
    }
  }, [prescriptionMedicines]);

  useEffect(() => {
    fetchData();

    // Check for patientId in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    if (patientId) {
      setSelectedPatient(patientId);
    }
  }, []);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patientsRes, medicinesRes] = await Promise.all([
        fetch('/api/doctor/patients/list'),
        fetch('/api/common/medicines'),
      ]);

      const patientsData = await patientsRes.json();
      const medicinesData = await medicinesRes.json();

      if (patientsRes.ok) setPatients(patientsData.patients || []);
      if (medicinesRes.ok) setMedicines(medicinesData.medicines || []);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
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

    setCurrentMedicine({
      ...currentMedicine,
      medicineId,
      dosePerTime: '',
      timing: [],
      durationDays: '7',
      totalQuantity: '1',
      frequency: 'THREE_TIMES'
    });

    // Show dose suggestions
    setDoseSuggestions(getDoseSuggestions(medicineId));
  };

  const calculateRequiredQuantity = (dosePerTime, timing, durationDays) => {
    // Simple calculation: dose * times per day * days
    const timesPerDay = timing.length;
    const doseMatch = dosePerTime.match(/(\d+)/);
    const dose = doseMatch ? parseInt(doseMatch[1]) : 1;
    return dose * timesPerDay * parseInt(durationDays || 1);
  };

  const addMedicine = () => {
    if (!currentMedicine.medicineId || !currentMedicine.dosePerTime ||
        currentMedicine.timing.length === 0 || !currentMedicine.durationDays ||
        !currentMedicine.totalQuantity) {
      setError('Please fill all medicine details');
      return;
    }

    const medicine = medicines.find(m => m._id === currentMedicine.medicineId);
    const newMedicine = {
      medicine: currentMedicine.medicineId,
      medicineName: medicine.name,
      brandName: medicine.brandName,
      strength: medicine.strength,
      dosePerTime: currentMedicine.dosePerTime,
      timing: currentMedicine.timing,
      durationDays: parseInt(currentMedicine.durationDays),
      totalQuantity: parseInt(currentMedicine.totalQuantity),
      frequency: currentMedicine.frequency,
      key: `${currentMedicine.medicineId}-${Date.now()}`
    };

    setPrescriptionMedicines([...prescriptionMedicines, newMedicine]);

    setCurrentMedicine({
      medicineId: '',
      dosePerTime: '',
      timing: [],
      durationDays: '7',
      totalQuantity: '1',
      frequency: 'THREE_TIMES'
    });
    setSearchTerm('');
    setDoseSuggestions([]);
    setError('');
    setSuccessMessage('Medicine added successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const removeMedicine = (index) => {
    const item = document.querySelector(`.medicine-item-${index}`);
    if (item) {
      gsap.to(item, {
        opacity: 0,
        x: -50,
        duration: 0.3,
        onComplete: () => {
          setPrescriptionMedicines(prescriptionMedicines.filter((_, i) => i !== index));
        }
      });
    } else {
      setPrescriptionMedicines(prescriptionMedicines.filter((_, i) => i !== index));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient || prescriptionMedicines.length === 0) {
      setError('Please select a patient and add medicines');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/doctor/prescriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient,
          medicines: prescriptionMedicines.map(m => ({
            medicine: m.medicine,
            dosePerTime: m.dosePerTime,
            timing: m.timing,
            durationDays: m.durationDays,
            totalQuantity: m.totalQuantity,
            frequency: m.frequency,
          })),
          diagnosis,
          notes,
          followUpDate,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Success animation
        gsap.to('.submit-button', {
          scale: 1.1,
          duration: 0.3,
          yoyo: true,
          repeat: 2,
          ease: "power2.out",
          onComplete: () => {
            alert('✅ Prescription created successfully!');
            router.push('/doctor/prescriptions');
          }
        });
      } else {
        setError(data.error || 'Failed to create prescription');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

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
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div ref={headerRef} className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Create Prescription</h1>
              <p className="text-gray-600 mt-1">Create a new prescription for your patient</p>
            </div>
            <button
              onClick={() => router.push('/doctor/prescriptions')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium flex items-center"
            >
              <span className="mr-2">←</span>
              Back to Prescriptions
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div ref={formRef} className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
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

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700 font-medium">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Patient Selection */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">👤</span>
                Select Patient
              </h2>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Patient</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.name} (Age: {patient.age}) - {patient.mobile}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Medicine Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💊</span>
                Add Medicine
              </h2>

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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Medicine Search Results */}
                {searchTerm && filteredMedicines.length > 0 && (
                  <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredMedicines.map((medicine) => (
                      <div
                        key={medicine._id}
                        onClick={() => handleMedicineSelect(medicine._id)}
                        className="p-3 border-b last:border-b-0 hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{medicine.name}</div>
                            <div className="text-sm text-gray-600">
                              {medicine.brandName} • {medicine.strength} • {medicine.form}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Stock: {medicine.availableStock || 0} units
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Select</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Medicine Details */}
              {currentMedicine.medicineId && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-900">
                        {medicines.find(m => m._id === currentMedicine.medicineId)?.name}
                      </div>
                      <div className="text-sm text-gray-600">Selected for prescription</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentMedicine({
                          medicineId: '',
                          dosePerTime: '',
                          timing: [],
                          durationDays: '7',
                          totalQuantity: '1',
                          frequency: 'THREE_TIMES'
                        });
                        setSearchTerm('');
                        setDoseSuggestions([]);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Medicine Details Form */}
              {currentMedicine.medicineId && (
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {doseSuggestions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {doseSuggestions.map((suggestion) => (
                            <button
                              key={suggestion.value}
                              type="button"
                              onClick={() => setCurrentMedicine({...currentMedicine, dosePerTime: suggestion.value})}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors duration-200"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                              ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-white shadow-sm'
                              : 'border-gray-200 hover:border-blue-300'
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
                              ? 'bg-blue-600 border-blue-600'
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
                                totalQuantity: calculatedQty.toString()
                              }));
                            }
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="absolute right-3 top-3 text-gray-400">days</div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Quantity *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={currentMedicine.totalQuantity}
                          onChange={(e) => setCurrentMedicine({...currentMedicine, totalQuantity: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="absolute right-3 top-3 text-gray-400">units</div>
                      </div>
                    </div>
                  </div>

                  {/* Add Medicine Button */}
                  <button
                    type="button"
                    onClick={addMedicine}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
                  >
                    <span className="flex items-center justify-center">
                      <span className="mr-2">➕</span>
                      Add to Prescription
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Prescription Medicines List */}
            {prescriptionMedicines.length > 0 && (
              <div ref={medicineListRef} className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📝</span>
                  Prescription Medicines ({prescriptionMedicines.length})
                </h2>
                
                <div className="space-y-4">
                  {prescriptionMedicines.map((med, index) => (
                    <div 
                      key={med.key} 
                      className={`medicine-item medicine-item-${index} p-4 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-200 hover:shadow-md transition-all duration-200`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                              <span className="text-white">💊</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900">{med.medicineName}</h4>
                              <div className="text-sm text-gray-600">
                                {med.brandName} • {med.strength}
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
                              <div className="font-medium">{med.totalQuantity} units</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => removeMedicine(index)}
                            className="px-4 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-200 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="mb-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis
                </label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Enter diagnosis..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Additional notes or instructions..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Date (Optional)
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.push('/doctor/prescriptions')}
                className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-bold text-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedPatient || prescriptionMedicines.length === 0}
                className="submit-button flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-2">📋</span>
                    Create Prescription
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} MediCare Clinic. Prescription management system.</p>
            <p className="mt-1">Ensure all prescription details are accurate before submission.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
