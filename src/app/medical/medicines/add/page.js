// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function AddMedicine() {
//   const [form, setForm] = useState({
//     name: '',
//     brandName: '',
//     dosageForm: '',
//     strength: '',
//     unit: '',
//     category: 'GENERAL',
//     prescriptionRequired: true,
//     isActive: true,
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const router = useRouter();

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setForm({
//       ...form,
//       [name]: type === 'checkbox' ? checked : value,
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       const res = await fetch('/api/medical/medicines', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(form),
//       });

//       const data = await res.json();
//       if (res.ok) {
//         alert('Medicine added successfully');
//         router.push('/medical/medicines');
//       } else {
//         setError(data.error || 'Failed to add medicine');
//       }
//     } catch (err) {
//       setError('Network error');
//     }
//     setLoading(false);
//   };

//   return (
//     <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
//       <h1>Add New Medicine</h1>
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//       <form onSubmit={handleSubmit}>
//         <input
//           type="text"
//           name="name"
//           placeholder="Medicine Name"
//           value={form.name}
//           onChange={handleChange}
//           required
//           style={{ display: 'block', margin: '10px 0', width: '100%' }}
//         />
//         <input
//           type="text"
//           name="brandName"
//           placeholder="Brand Name"
//           value={form.brandName}
//           onChange={handleChange}
//           required
//           style={{ display: 'block', margin: '10px 0', width: '100%' }}
//         />
//         <select
//           name="dosageForm"
//           value={form.dosageForm}
//           onChange={handleChange}
//           required
//           style={{ display: 'block', margin: '10px 0', width: '100%' }}
//         >
//           <option value="">Select Dosage Form</option>
//           <option value="TABLET">Tablet</option>
//           <option value="SYRUP">Syrup</option>
//           <option value="CAPSULE">Capsule</option>
//           <option value="INJECTION">Injection</option>
//           <option value="DROPS">Drops</option>
//           <option value="CREAM">Cream</option>
//         </select>
//         <input
//           type="text"
//           name="strength"
//           placeholder="Strength (e.g., 500 mg, 5 ml)"
//           value={form.strength}
//           onChange={handleChange}
//           required
//           style={{ display: 'block', margin: '10px 0', width: '100%' }}
//         />
//         <select
//           name="unit"
//           value={form.unit}
//           onChange={handleChange}
//           required
//           style={{ display: 'block', margin: '10px 0', width: '100%' }}
//         >
//           <option value="">Select Unit</option>
//           <option value="TABLET">Tablet</option>
//           <option value="ML">ML</option>
//           <option value="CAPSULE">Capsule</option>
//         </select>
//         <input
//           type="text"
//           name="category"
//           placeholder="Category (e.g., GENERAL, ANTIBIOTIC)"
//           value={form.category}
//           onChange={handleChange}
//           style={{ display: 'block', margin: '10px 0', width: '100%' }}
//         />
//         <label style={{ display: 'block', margin: '10px 0' }}>
//           <input
//             type="checkbox"
//             name="prescriptionRequired"
//             checked={form.prescriptionRequired}
//             onChange={handleChange}
//           />
//           Prescription Required
//         </label>
//         <label style={{ display: 'block', margin: '10px 0' }}>
//           <input
//             type="checkbox"
//             name="isActive"
//             checked={form.isActive}
//             onChange={handleChange}
//           />
//           Active Medicine
//         </label>
//         <button type="submit" disabled={loading} style={{ padding: '10px', width: '100%' }}>
//           {loading ? 'Adding...' : 'Add Medicine'}
//         </button>
//       </form>
//     </div>
//   );
// }

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';

export default function AddMedicine() {
  const [form, setForm] = useState({
    name: '',
    brandName: '',
    dosageForm: '',
    strength: '',
    unit: '',
    category: 'GENERAL',
    prescriptionRequired: true,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const formRef = useRef(null);
  const successRef = useRef(null);

  useEffect(() => {
    // Animate form entrance
    if (formRef.current) {
      gsap.fromTo(formRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/medical/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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

        // Redirect after delay
        setTimeout(() => {
          router.push('/medical/medicines');
        }, 2000);
      } else {
        setError(data.error || 'Failed to add medicine');
        
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

  const dosageForms = [
    { value: 'TABLET', label: 'Tablet', icon: '💊' },
    { value: 'SYRUP', label: 'Syrup', icon: '🧴' },
    { value: 'CAPSULE', label: 'Capsule', icon: '💊' },
    { value: 'INJECTION', label: 'Injection', icon: '💉' },
    { value: 'DROPS', label: 'Drops', icon: '💧' },
    { value: 'CREAM', label: 'Cream', icon: '🧴' },
    { value: 'OINTMENT', label: 'Ointment', icon: '🧴' },
    { value: 'POWDER', label: 'Powder', icon: '🥄' },
    { value: 'INHALER', label: 'Inhaler', icon: '💨' },
  ];

  const units = [
    { value: 'TABLET', label: 'Tablet', icon: '💊' },
    { value: 'ML', label: 'Milliliter', icon: '🧪' },
    { value: 'CAPSULE', label: 'Capsule', icon: '💊' },
    { value: 'MG', label: 'Milligram', icon: '⚖️' },
    { value: 'GM', label: 'Gram', icon: '⚖️' },
    { value: 'PIECE', label: 'Piece', icon: '📦' },
    { value: 'VIAL', label: 'Vial', icon: '💉' },
    { value: 'AMPOULE', label: 'Ampoule', icon: '💉' },
  ];

  const categories = [
    'GENERAL', 'ANTIBIOTIC', 'ANALGESIC', 'ANTIHYPERTENSIVE', 
    'ANTIDIABETIC', 'RESPIRATORY', 'CARDIAC', 'GASTROINTESTINAL',
    'DERMATOLOGICAL', 'PSYCHIATRIC', 'NEUROLOGICAL', 'HORMONAL'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
            <span className="text-5xl">💊</span>
            Add New Medicine
          </h1>
          <p className="text-gray-600 text-lg text-center">
            Add a new medicine to your pharmacy database
          </p>
        </div>

        {/* Main Form */}
        <div 
          ref={formRef}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-300"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">➕</span>
              Medicine Information
            </h2>
            <p className="text-blue-100 mt-2">
              Fill in the details below to add a new medicine to your inventory
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl animate-shake">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="font-bold">Error</h3>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Medicine Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-xl">💊</span>
                  Medicine Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Paracetamol"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Brand Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-xl">🏷️</span>
                  Brand Name
                </label>
                <input
                  type="text"
                  name="brandName"
                  placeholder="e.g., Crocin"
                  value={form.brandName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Dosage & Strength */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Dosage Form */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-xl">🧪</span>
                  Dosage Form
                </label>
                <select
                  name="dosageForm"
                  value={form.dosageForm}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select Dosage Form</option>
                  {dosageForms.map((formOption) => (
                    <option key={formOption.value} value={formOption.value}>
                      {formOption.icon} {formOption.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Strength */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-xl">⚖️</span>
                  Strength
                </label>
                <input
                  type="text"
                  name="strength"
                  placeholder="e.g., 500 mg, 5 ml"
                  value={form.strength}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  Unit
                </label>
                <select
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select Unit</option>
                  {units.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.icon} {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-xl">🏷️</span>
                Category
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      form.category === cat
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Or enter custom category"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 mt-3"
              />
            </div>

            {/* Checkbox Options */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                Medicine Settings
              </h3>
              
              <div className="space-y-4">
                {/* Prescription Required */}
                <label className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-blue-300 transition-all duration-200">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="prescriptionRequired"
                      checked={form.prescriptionRequired}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                      form.prescriptionRequired 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-300'
                    }`}>
                      {form.prescriptionRequired && (
                        <span className="text-white text-sm">✓</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">Prescription Required</div>
                    <div className="text-sm text-gray-500">
                      This medicine requires a doctor's prescription
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    form.prescriptionRequired 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {form.prescriptionRequired ? 'RX Only' : 'OTC'}
                  </div>
                </label>

                {/* Active Medicine */}
                <label className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-blue-300 transition-all duration-200">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                      form.isActive 
                        ? 'bg-green-600 border-green-600' 
                        : 'border-gray-300'
                    }`}>
                      {form.isActive && (
                        <span className="text-white text-sm">✓</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">Active Medicine</div>
                    <div className="text-sm text-gray-500">
                      This medicine is currently available and active
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    form.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {form.isActive ? 'Active' : 'Inactive'}
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Adding Medicine...
                  </>
                ) : (
                  <>
                    <span className="text-2xl">✅</span>
                    Add Medicine to Database
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Quick Help */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            Quick Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-blue-600 text-2xl mb-2">💊</div>
              <h4 className="font-semibold text-gray-800 mb-2">Complete Information</h4>
              <p className="text-sm text-gray-600">
                Fill all fields for better inventory management
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-green-600 text-2xl mb-2">📋</div>
              <h4 className="font-semibold text-gray-800 mb-2">Prescription Status</h4>
              <p className="text-sm text-gray-600">
                Mark prescription required for controlled medicines
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-yellow-600 text-2xl mb-2">⚖️</div>
              <h4 className="font-semibold text-gray-800 mb-2">Strength & Units</h4>
              <p className="text-sm text-gray-600">
                Use consistent strength and unit formats
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            ref={successRef}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
              <div className="text-6xl mb-4 animate-bounce-slow">🎉</div>
              <h3 className="text-2xl font-bold text-white mb-2">Success!</h3>
              <p className="text-green-100">Medicine added successfully</p>
            </div>
            <div className="p-6 text-center">
              <div className="text-lg text-gray-600 mb-6">
                Redirecting to medicine list...
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full animate-progress-bar"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}