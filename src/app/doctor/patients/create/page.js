'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import {
  FaUserPlus,
  FaArrowLeft,
  FaUser,
  FaPhone,
  FaBirthdayCake,
  FaVenusMars,
  FaHistory,
  FaSave,
  FaPlus,
  FaCheck,
  FaExclamationTriangle,
  FaIdCard,
  FaNotesMedical,
  FaAddressCard,
  FaAllergies,
  FaWeight,
  FaHeartbeat,
  FaTint // Changed from FaBloodType to FaTint (blood drop icon)
} from 'react-icons/fa';

export default function CreatePatient() {
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: '',
    medicalHistory: '',
    address: '',
    bloodGroup: '',
    allergies: '',
    weight: '',
    height: '',
    emergencyContact: '',
    occupation: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  
  const containerRef = useRef(null);
  const formRef = useRef(null);
  const inputRefs = useRef([]);

  // Initialize GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance animations
      gsap.from('.page-title', {
        duration: 0.8,
        y: -30,
        opacity: 0,
        ease: 'power3.out'
      });

      gsap.from('.form-card', {
        duration: 0.8,
        scale: 0.95,
        opacity: 0,
        y: 20,
        delay: 0.2,
        ease: 'power3.out'
      });

      // Input field animations with stagger
      gsap.from(inputRefs.current, {
        duration: 0.6,
        y: 20,
        opacity: 0,
        stagger: 0.05,
        delay: 0.4,
        ease: 'power2.out'
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setError('Name is required');
      return false;
    }
    
    if (!form.mobile.trim() || form.mobile.length < 10) {
      setError('Valid mobile number is required (minimum 10 digits)');
      return false;
    }
    
    if (!form.age || parseInt(form.age) < 0 || parseInt(form.age) > 150) {
      setError('Please enter a valid age (0-150)');
      return false;
    }
    
    if (!form.gender) {
      setError('Please select gender');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // Animate button loading state
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
      gsap.to(submitBtn, {
        scale: 0.95,
        duration: 0.2
      });
    }

    try {
      const res = await fetch('/api/doctor/patients/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age),
          weight: form.weight ? parseFloat(form.weight) : undefined,
          height: form.height ? parseFloat(form.height) : undefined,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        // Success animation
        setSuccess(true);
        
        gsap.to('.form-card', {
          duration: 0.6,
          scale: 0.95,
          opacity: 0.8,
          onComplete: () => {
            setTimeout(() => {
              router.push('/doctor/patients');
            }, 1500);
          }
        });

        // Confetti-like animation for success
        gsap.fromTo('.success-icon',
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' }
        );

      } else {
        setError(data.error || 'Failed to create patient');

        // If patient already exists, show the existing patient info
        if (data.code === 'PATIENT_EXISTS' && data.patient) {
          setError(`Patient already exists: ${data.patient.name} (Age: ${data.patient.age}, Gender: ${data.patient.gender}). All healthcare providers can access this patient.`);
        }

        // Error shake animation
        gsap.fromTo(formRef.current,
          { x: 0 },
          { x: [-10, 10, -10, 10, 0], duration: 0.4, ease: 'power1.out' }
        );
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
      
      if (submitBtn && !success) {
        gsap.to(submitBtn, {
          scale: 1,
          duration: 0.2
        });
      }
    }
  };

  const handleBack = () => {
    gsap.to('.form-card', {
      duration: 0.5,
      x: 100,
      opacity: 0,
      onComplete: () => {
        router.push('/doctor/patients');
      }
    });
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 transition-colors shadow-sm mb-4"
            >
              <FaArrowLeft />
              Back to Patients
            </button>
            <h1 className="page-title text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Create New Patient
            </h1>
            <p className="text-gray-600">
              Add a new patient to your medical records
            </p>
          </div>
          
          <div className="hidden md:block p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
            <FaUserPlus className="text-4xl text-white" />
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-2xl p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="success-icon h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
                <FaCheck className="text-3xl text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  Patient Created Successfully!
                </h3>
                <p className="text-green-700">
                  Redirecting to patients list...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <div ref={formRef} className="form-card bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <FaUser className="text-2xl text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Patient Information</h2>
                <p className="text-blue-100">Fill in all required fields marked with *</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="m-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-3">
                <FaExclamationTriangle className="text-red-500 text-xl" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaUser />
                  Basic Information
                </h3>
                
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-red-500">*</span> Full Name
                  </label>
                  <div ref={el => inputRefs.current[0] = el} className="relative">
                    <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter patient's full name"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-red-500">*</span> Mobile Number
                  </label>
                  <div ref={el => inputRefs.current[1] = el} className="relative">
                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="mobile"
                      value={form.mobile}
                      onChange={handleChange}
                      required
                      placeholder="Enter 10-digit mobile number"
                      pattern="[0-9]{10}"
                      maxLength="10"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Age & Gender Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-red-500">*</span> Age
                    </label>
                    <div ref={el => inputRefs.current[2] = el} className="relative">
                      <FaBirthdayCake className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        name="age"
                        value={form.age}
                        onChange={handleChange}
                        required
                        min="0"
                        max="150"
                        placeholder="Age"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-red-500">*</span> Gender
                    </label>
                    <div ref={el => inputRefs.current[3] = el} className="relative">
                      <FaVenusMars className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all duration-300"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Information Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaNotesMedical />
                  Medical Information
                </h3>

                {/* Blood Group */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Group
                  </label>
                  <div ref={el => inputRefs.current[4] = el} className="relative">
                    <FaTint className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      name="bloodGroup"
                      value={form.bloodGroup}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all duration-300"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                {/* Weight & Height Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (kg)
                    </label>
                    <div ref={el => inputRefs.current[5] = el} className="relative">
                      <FaWeight className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        name="weight"
                        value={form.weight}
                        onChange={handleChange}
                        placeholder="kg"
                        min="0"
                        step="0.1"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height (cm)
                    </label>
                    <div ref={el => inputRefs.current[6] = el} className="relative">
                      <FaHeartbeat className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        name="height"
                        value={form.height}
                        onChange={handleChange}
                        placeholder="cm"
                        min="0"
                        step="0.1"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Allergies */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergies
                  </label>
                  <div ref={el => inputRefs.current[7] = el} className="relative">
                    <FaAllergies className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="allergies"
                      value={form.allergies}
                      onChange={handleChange}
                      placeholder="List any known allergies"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="mt-8 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaAddressCard />
                Additional Information
              </h3>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <div ref={el => inputRefs.current[8] = el} className="relative">
                  <FaIdCard className="absolute left-3 top-3 text-gray-400" />
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter patient's address"
                    rows="3"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-300"
                  />
                </div>
              </div>

              {/* Medical History */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical History
                </label>
                <div ref={el => inputRefs.current[9] = el} className="relative">
                  <FaHistory className="absolute left-3 top-3 text-gray-400" />
                  <textarea
                    name="medicalHistory"
                    value={form.medicalHistory}
                    onChange={handleChange}
                    placeholder="Enter past medical history, surgeries, chronic conditions, etc."
                    rows="4"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-300"
                  />
                </div>
              </div>

              {/* Emergency Contact & Occupation Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact
                  </label>
                  <input
                    type="tel"
                    name="emergencyContact"
                    value={form.emergencyContact}
                    onChange={handleChange}
                    placeholder="Emergency contact number"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Occupation
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={form.occupation}
                    onChange={handleChange}
                    placeholder="Patient's occupation"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-12 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="px-8 py-4 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 flex-1"
                disabled={loading}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading || success}
                className="submit-btn px-8 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating Patient...
                  </>
                ) : success ? (
                  <>
                    <FaCheck />
                    Patient Created!
                  </>
                ) : (
                  <>
                    <FaSave />
                    Create Patient
                  </>
                )}
              </button>
            </div>

            {/* Form Help Text */}
            <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-700">
                <FaExclamationTriangle className="inline mr-2" />
                Fields marked with <span className="text-red-500">*</span> are required. 
                All information provided will be kept confidential and secure.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} MediCare Clinic. All patient data is encrypted and secure.</p>
          <p className="mt-1">Form will automatically validate all inputs before submission.</p>
        </div>
      </div>
    </div>
  );
}
