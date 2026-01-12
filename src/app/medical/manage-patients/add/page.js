// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function AddPatient() {
//   const [form, setForm] = useState({
//     name: '',
//     mobile: '',
//     age: '',
//     gender: '',
//     medicalHistory: '',
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const router = useRouter();

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       const res = await fetch('/api/common/patients', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           ...form,
//           age: parseInt(form.age),
//         }),
//       });

//       const data = await res.json();
//       if (res.ok) {
//         alert('Patient added successfully');
//         router.push('/medical/manage-patients');
//       } else {
//         setError(data.error || 'Failed to add patient');
//       }
//     } catch (err) {
//       setError('Network error');
//     }
//     setLoading(false);
//   };

//   return (
//     <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
//       <h1>Add New Patient</h1>
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//       <form onSubmit={handleSubmit}>
//         <input
//           type="text"
//           name="name"
//           placeholder="Patient Name"
//           value={form.name}
//           onChange={handleChange}
//           required
//           style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px' }}
//         />
//         <input
//           type="tel"
//           name="mobile"
//           placeholder="Mobile Number"
//           value={form.mobile}
//           onChange={handleChange}
//           required
//           style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px' }}
//         />
//         <input
//           type="number"
//           name="age"
//           placeholder="Age"
//           value={form.age}
//           onChange={handleChange}
//           required
//           min="1"
//           max="150"
//           style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px' }}
//         />
//         <select
//           name="gender"
//           value={form.gender}
//           onChange={handleChange}
//           required
//           style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px' }}
//         >
//           <option value="">Select Gender</option>
//           <option value="Male">Male</option>
//           <option value="Female">Female</option>
//           <option value="Other">Other</option>
//         </select>
//         <textarea
//           name="medicalHistory"
//           placeholder="Medical History (optional)"
//           value={form.medicalHistory}
//           onChange={handleChange}
//           rows="4"
//           style={{ display: 'block', margin: '10px 0', width: '100%', padding: '8px' }}
//         />
//         <button type="submit" disabled={loading} style={{ padding: '10px', width: '100%', marginTop: '20px' }}>
//           {loading ? 'Adding...' : 'Add Patient'}
//         </button>
//       </form>
//     </div>
//   );
// }


'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';

export default function AddPatient() {
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: '',
    medicalHistory: '',
    email: '',
    address: '',
    bloodGroup: '',
    allergies: '',
    height: '',
    weight: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const router = useRouter();

  const formRef = useRef(null);
  const successRef = useRef(null);
  const optionalFieldsRef = useRef(null);

  useEffect(() => {
    // Animate form entrance
    if (formRef.current) {
      gsap.fromTo(formRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, []);

  useEffect(() => {
    // Animate optional fields when shown
    if (showOptionalFields && optionalFieldsRef.current) {
      gsap.fromTo(optionalFieldsRef.current,
        { opacity: 0, height: 0 },
        { opacity: 1, height: 'auto', duration: 0.5, ease: "power2.out" }
      );
    }
  }, [showOptionalFields]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!form.name || !form.mobile || !form.age || !form.gender) {
      setError('Please fill all required fields');
      setLoading(false);
      
      // Shake form on error
      if (formRef.current) {
        gsap.to(formRef.current, {
          x: [-10, 10, -10, 10, 0],
          duration: 0.5,
          ease: "power2.out"
        });
      }
      return;
    }

    try {
      const res = await fetch('/api/common/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age) || 0,
          height: form.height ? parseInt(form.height) : undefined,
          weight: form.weight ? parseFloat(form.weight) : undefined,
          allergies: form.allergies ? form.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
          // Only send optional fields if they have values
          ...(form.email && { email: form.email }),
          ...(form.address && { address: form.address }),
          ...(form.bloodGroup && { bloodGroup: form.bloodGroup }),
          ...(form.height && { height: parseInt(form.height) }),
          ...(form.weight && { weight: parseFloat(form.weight) }),
          ...(form.allergies && { 
            allergies: form.allergies.split(',').map(a => a.trim()).filter(a => a) 
          }),
          ...(form.medicalHistory && { medicalHistory: form.medicalHistory }),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Show success animation
        setSuccess(true);
        if (successRef.current) {
          gsap.fromTo(successRef.current,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
          );
        }

        // Show confetti animation
        createConfetti();

        // Redirect after delay
        setTimeout(() => {
          router.push('/medical/manage-patients');
        }, 2000);
      } else {
        setError(data.error || 'Failed to add patient');
        
        // Shake form on error
        if (formRef.current) {
          gsap.to(formRef.current, {
            x: [-10, 10, -10, 10, 0],
            duration: 0.5,
            ease: "power2.out"
          });
        }
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const createConfetti = () => {
    const colors = ['#10b981', '#059669', '#d1fae5', '#22c55e', '#3b82f6'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'fixed z-50 text-2xl';
      confetti.innerHTML = '🎉';
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.top = '-50px';
      confetti.style.opacity = '0';
      
      document.body.appendChild(confetti);
      
      gsap.to(confetti, {
        y: window.innerHeight + 100,
        x: Math.random() * 200 - 100,
        rotation: Math.random() * 360,
        opacity: 1,
        duration: 1 + Math.random(),
        ease: "power2.out",
        onComplete: () => confetti.remove()
      });
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['MALE', 'FEMALE', 'OTHER'];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 flex items-center gap-3">
            <span className="text-4xl text-medical-primary">👤</span>
            Add New Patient
          </h1>
          <p className="text-gray-600">
            Register a new patient in your medical database. 
            <span className="text-medical-primary font-medium ml-2">
              * Required fields
            </span>
          </p>
        </div>

        {/* Main Form */}
        <div 
          ref={formRef}
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-medical-border hover-lift-medical"
        >
          <div className="bg-gradient-to-r from-medical-primary to-medical-dark p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">➕</span>
              Patient Registration
            </h2>
            <p className="text-white/90 mt-2">
              Fill in patient details for comprehensive medical care
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl animate-shake">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="font-bold">Registration Error</h3>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Required Information Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-xl text-medical-primary">📋</span>
                  Required Information
                </h3>
                <span className="text-sm text-gray-500">All fields are mandatory</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-medical-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter patient's full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="input-medical"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mobile Number <span className="text-medical-danger">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">📱</div>
                    <input
                      type="tel"
                      name="mobile"
                      placeholder="10-digit mobile number"
                      value={form.mobile}
                      onChange={handleChange}
                      required
                      pattern="[0-9]{10}"
                      className="input-medical pl-10"
                    />
                  </div>
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Age <span className="text-medical-danger">*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    placeholder="Age in years"
                    value={form.age}
                    onChange={handleChange}
                    required
                    min="0"
                    max="150"
                    className="input-medical"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gender <span className="text-medical-danger">*</span>
                  </label>
                  <div className="flex gap-2">
                    {genders.map(gender => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setForm({ ...form, gender })}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                          form.gender === gender
                            ? gender === 'MALE' ? 'bg-blue-600 text-white shadow-md' :
                              gender === 'FEMALE' ? 'bg-pink-600 text-white shadow-md' :
                              'bg-purple-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {gender === 'MALE' ? '👨 Male' : 
                         gender === 'FEMALE' ? '👩 Female' : '👤 Other'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Fields Toggle */}
            <div className="border-t border-b border-medical-border py-4">
              <button
                type="button"
                onClick={() => setShowOptionalFields(!showOptionalFields)}
                className="w-full flex items-center justify-between p-4 bg-medical-light hover:bg-medical-primary/10 rounded-xl transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    showOptionalFields ? 'bg-medical-primary text-white' : 'bg-white text-medical-primary border border-medical-primary'
                  }`}>
                    <span className="text-lg">➕</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Additional Information (Optional)
                    </h3>
                    <p className="text-sm text-gray-600">
                      Add contact details, medical info, and history
                    </p>
                  </div>
                </div>
                <span className={`transform transition-transform duration-300 ${
                  showOptionalFields ? 'rotate-180' : ''
                }`}>
                  ▼
                </span>
              </button>
            </div>

            {/* Optional Fields - Collapsible */}
            <div 
              ref={optionalFieldsRef}
              className={`space-y-6 overflow-hidden ${!showOptionalFields ? 'h-0' : ''}`}
            >
              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                  <span className="text-lg text-medical-info">📱</span>
                  Contact Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">✉️</div>
                      <input
                        type="email"
                        name="email"
                        placeholder="patient@example.com"
                        value={form.email}
                        onChange={handleChange}
                        className="input-medical pl-10"
                      />
                    </div>
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Group
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {bloodGroups.map(bg => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setForm({ ...form, bloodGroup: bg })}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            form.bloodGroup === bg
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      name="bloodGroup"
                      value={form.bloodGroup}
                      onChange={handleChange}
                      placeholder="Or type blood group"
                      className="input-medical text-sm"
                    />
                  </div>
                </div>

                {/* Address - Optional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    placeholder="Complete residential address (optional)"
                    value={form.address}
                    onChange={handleChange}
                    rows="2"
                    className="input-medical"
                  />
                </div>
              </div>

              {/* Medical Information - Optional */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                  <span className="text-lg text-medical-primary">🏥</span>
                  Medical Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Height */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height (cm)
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">📏</div>
                      <input
                        type="number"
                        name="height"
                        placeholder="Height in cm"
                        value={form.height}
                        onChange={handleChange}
                        min="50"
                        max="250"
                        className="input-medical pl-10"
                      />
                    </div>
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (kg)
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">⚖️</div>
                      <input
                        type="number"
                        name="weight"
                        placeholder="Weight in kg"
                        value={form.weight}
                        onChange={handleChange}
                        min="0"
                        max="300"
                        step="0.1"
                        className="input-medical pl-10"
                      />
                    </div>
                  </div>

                  {/* Allergies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allergies
                    </label>
                    <input
                      type="text"
                      name="allergies"
                      placeholder="Separate by commas (e.g., Penicillin, Nuts)"
                      value={form.allergies}
                      onChange={handleChange}
                      className="input-medical"
                    />
                  </div>
                </div>

                {/* Medical History - Optional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical History
                  </label>
                  <textarea
                    name="medicalHistory"
                    placeholder="Any existing medical conditions, surgeries, or chronic illnesses (optional)"
                    value={form.medicalHistory}
                    onChange={handleChange}
                    rows="3"
                    className="input-medical"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Include past illnesses, surgeries, chronic conditions, and family medical history
                  </p>
                </div>
              </div>
            </div>

            {/* Form Status */}
            <div className="bg-medical-light p-4 rounded-xl border border-medical-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-medical-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">ℹ️</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Form Status</h4>
                    <p className="text-sm text-gray-600">
                      {!form.name || !form.mobile || !form.age || !form.gender 
                        ? 'Complete required fields to proceed' 
                        : 'All required fields are complete. Optional fields can enhance patient care.'}
                    </p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg font-medium ${
                  form.name && form.mobile && form.age && form.gender
                    ? 'bg-medical-success text-white'
                    : 'bg-medical-warning text-white'
                }`}>
                  {form.name && form.mobile && form.age && form.gender ? 'Ready' : 'Incomplete'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-medical-border">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200 border border-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !form.name || !form.mobile || !form.age || !form.gender}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-medical-primary to-medical-dark hover:from-medical-dark hover:to-medical-primary text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Registering...
                  </>
                ) : (
                  <>
                    <span className="text-xl">✅</span>
                    Register Patient
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 border border-medical-border rounded-2xl p-6 bg-white">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl text-medical-primary">💡</span>
            Why Complete Patient Profiles Matter
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-medical-border">
              <div className="text-medical-primary text-xl mb-2">🏥</div>
              <h4 className="font-semibold text-gray-800 mb-2">Better Care</h4>
              <p className="text-sm text-gray-600">
                Complete profiles enable personalized treatment plans
              </p>
            </div>
            <div className="p-4 rounded-xl border border-medical-border">
              <div className="text-medical-success text-xl mb-2">⚠️</div>
              <h4 className="font-semibold text-gray-800 mb-2">Safety First</h4>
              <p className="text-sm text-gray-600">
                Allergy info prevents medication complications
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            ref={successRef}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-medical-success to-green-600 p-8 text-center">
              <div className="text-6xl mb-4 animate-float">🎉</div>
              <h3 className="text-2xl font-bold text-white mb-2">Patient Registered!</h3>
              <p className="text-white/90">
                {form.name} has been added to the database
              </p>
            </div>
            <div className="p-6 text-center">
              <div className="text-lg text-gray-600 mb-6">
                Redirecting to patient management...
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div className="bg-medical-success h-2 rounded-full animate-progress-bar"></div>
              </div>
              <p className="text-sm text-gray-500">
                You can now serve medicine or view the patient profile
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}