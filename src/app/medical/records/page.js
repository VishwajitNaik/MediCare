// 'use client';

// import Link from 'next/link';

// export default function RecordsPage() {
//   const recordTypes = [
//     {
//       title: 'Add New Medicine',
//       description: 'Register a new medicine in the inventory',
//       icon: '💊',
//       href: '/medical/medicines/add',
//       color: '#28a745'
//     },
//     {
//       title: 'Add New Supplier',
//       description: 'Register a new medicine supplier',
//       icon: '🏭',
//       href: '/medical/suppliers/add',
//       color: '#007bff'
//     },
//     {
//       title: 'Add New Patient',
//       description: 'Register a new patient in the system',
//       icon: '👤',
//       href: '/medical/patients/add',
//       color: '#17a2b8'
//     },
//     {
//       title: 'Record Purchase',
//       description: 'Record a new medicine purchase from supplier',
//       icon: '🛒',
//       href: '/medical/purchases/add',
//       color: '#ffc107'
//     },
//     {
//       title: 'Add Inventory Stock',
//       description: 'Add or adjust medicine stock quantities',
//       icon: '📦',
//       href: '/medical/inventory/add',
//       color: '#6f42c1'
//     },
//     {
//       title: 'Create Prescription',
//       description: 'Create a new prescription for a patient',
//       icon: '📋',
//       href: '/medical/prescriptions',
//       color: '#dc3545'
//     }
//   ];

//   return (
//     <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
//       <div style={{ marginBottom: '30px' }}>
//         <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>📊 Create Records</h1>
//         <p style={{ margin: '0', color: '#666', fontSize: '16px' }}>
//           Quick access to create and manage various types of records in your medical store.
//         </p>
//       </div>

//       <div style={{
//         display: 'grid',
//         gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
//         gap: '20px',
//         marginBottom: '40px'
//       }}>
//         {recordTypes.map((record, index) => (
//           <Link
//             key={index}
//             href={record.href}
//             style={{
//               display: 'block',
//               textDecoration: 'none',
//               background: 'white',
//               border: '1px solid #dee2e6',
//               borderRadius: '10px',
//               padding: '25px',
//               boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//               transition: 'transform 0.2s, box-shadow 0.2s',
//               cursor: 'pointer'
//             }}
//             onMouseEnter={(e) => {
//               e.target.style.transform = 'translateY(-2px)';
//               e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
//             }}
//             onMouseLeave={(e) => {
//               e.target.style.transform = 'translateY(0)';
//               e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
//             }}
//           >
//             <div style={{ textAlign: 'center', marginBottom: '15px' }}>
//               <div style={{
//                 fontSize: '48px',
//                 marginBottom: '10px',
//                 display: 'inline-block'
//               }}>
//                 {record.icon}
//               </div>
//             </div>

//             <h3 style={{
//               margin: '0 0 10px 0',
//               color: '#333',
//               textAlign: 'center',
//               fontSize: '18px'
//             }}>
//               {record.title}
//             </h3>

//             <p style={{
//               margin: '0',
//               color: '#666',
//               textAlign: 'center',
//               fontSize: '14px',
//               lineHeight: '1.4'
//             }}>
//               {record.description}
//             </p>

//             <div style={{
//               marginTop: '15px',
//               textAlign: 'center'
//             }}>
//               <span style={{
//                 display: 'inline-block',
//                 padding: '6px 12px',
//                 background: record.color,
//                 color: 'white',
//                 borderRadius: '4px',
//                 fontSize: '12px',
//                 fontWeight: 'bold'
//               }}>
//                 Create →
//               </span>
//             </div>
//           </Link>
//         ))}
//       </div>

//       <div style={{
//         background: '#e8f5e8',
//         border: '1px solid #c3e6c3',
//         borderRadius: '8px',
//         padding: '20px',
//         textAlign: 'center'
//       }}>
//         <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>💡 Quick Tips</h3>
//         <ul style={{
//           margin: '0',
//           paddingLeft: '20px',
//           textAlign: 'left',
//           display: 'inline-block'
//         }}>
//           <li style={{ marginBottom: '8px' }}>Use the dashboard to monitor inventory levels and reorder alerts</li>
//           <li style={{ marginBottom: '8px' }}>Regularly update medicine stock to maintain accurate inventory</li>
//           <li style={{ marginBottom: '8px' }}>Generate PDF order lists from the reorders page for suppliers</li>
//           <li>Keep patient records up-to-date for better service tracking</li>
//         </ul>
//       </div>

//       <div style={{ marginTop: '40px', textAlign: 'center' }}>
//         <Link
//           href="/medical/dashboard"
//           style={{
//             display: 'inline-block',
//             padding: '12px 24px',
//             background: '#007bff',
//             color: 'white',
//             textDecoration: 'none',
//             borderRadius: '6px',
//             fontSize: '16px',
//             fontWeight: 'bold',
//             boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
//             transition: 'background 0.2s'
//           }}
//           onMouseEnter={(e) => e.target.style.background = '#0056b3'}
//           onMouseLeave={(e) => e.target.style.background = '#007bff'}
//         >
//           ← Back to Dashboard
//         </Link>
//       </div>
//     </div>
//   );
// }

'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function RecordsPage() {
  const cardsRef = useRef([]);
  const tipsRef = useRef(null);
  const headerRef = useRef(null);
  
  const recordTypes = [
    {
      title: 'Add New Medicine',
      description: 'Register a new medicine in the inventory',
      icon: '💊',
      href: '/medical/medicines/add',
      color: 'hospital-success',
      gradient: 'from-hospital-success to-hospital-green',
      stats: 'Database Expansion',
      count: '+150+'
    },
    {
      title: 'Add New Supplier',
      description: 'Register a new medicine supplier',
      icon: '🏭',
      href: '/medical/suppliers/add',
      color: 'hospital-blue',
      gradient: 'from-hospital-blue to-hospital-blue-dark',
      stats: 'Vendor Network',
      count: '50+'
    },
    {
      title: 'Add New Patient',
      description: 'Register a new patient in the system',
      icon: '👤',
      href: '/medical/patients/add',
      color: 'hospital-info',
      gradient: 'from-cyan-500 to-blue-500',
      stats: 'Patient Registry',
      count: '1000+'
    },
    {
      title: 'Record Purchase',
      description: 'Record a new medicine purchase from supplier',
      icon: '🛒',
      href: '/medical/purchases/add',
      color: 'hospital-warning',
      gradient: 'from-hospital-warning to-orange-500',
      stats: 'Inventory Update',
      count: 'Daily'
    },
    {
      title: 'Add Inventory Stock',
      description: 'Add or adjust medicine stock quantities',
      icon: '📦',
      href: '/medical/inventory/add',
      color: 'purple-600',
      gradient: 'from-purple-600 to-purple-800',
      stats: 'Stock Management',
      count: 'Real-time'
    },
    {
      title: 'Create Prescription',
      description: 'Create a new prescription for a patient',
      icon: '📋',
      href: '/medical/prescriptions',
      color: 'hospital-danger',
      gradient: 'from-hospital-danger to-red-600',
      stats: 'Medical Orders',
      count: 'Prescribe'
    }
  ];

  useEffect(() => {
    // Animate header
    if (headerRef.current) {
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }

    // Animate cards with staggered delay
    if (cardsRef.current.length > 0) {
      gsap.fromTo(cardsRef.current,
        { 
          opacity: 0,
          scale: 0.8,
          y: 30
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.5,
          ease: "back.out(1.2)",
          delay: 0.3
        }
      );
    }

    // Animate tips section
    if (tipsRef.current) {
      gsap.fromTo(tipsRef.current,
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6, 
          ease: "power2.out",
          delay: 0.8
        }
      );
    }
  }, []);

  const handleCardHover = (index) => {
    const card = cardsRef.current[index];
    if (card) {
      gsap.to(card, {
        scale: 1.05,
        y: -10,
        duration: 0.3,
        ease: "power2.out",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)"
      });
      
      // Animate icon
      const icon = card.querySelector('.card-icon');
      if (icon) {
        gsap.to(icon, {
          scale: 1.2,
          rotation: 5,
          duration: 0.3,
          ease: "back.out(1.7)"
        });
      }
    }
  };

  const handleCardLeave = (index) => {
    const card = cardsRef.current[index];
    if (card) {
      gsap.to(card, {
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
      });
      
      // Reset icon
      const icon = card.querySelector('.card-icon');
      if (icon) {
        gsap.to(icon, {
          scale: 1,
          rotation: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-hospital-blue-light to-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div 
          ref={headerRef}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-hospital-gray-dark mb-3 flex items-center justify-center gap-3">
            <span className="text-4xl text-hospital-blue">📊</span>
            Create Records
          </h1>
          <p className="text-hospital-gray text-lg max-w-2xl mx-auto">
            Quick access to create and manage various types of records in your medical store management system.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-hospital-blue-light shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-hospital-blue-light rounded-lg flex items-center justify-center">
                <span className="text-xl text-hospital-blue">💊</span>
              </div>
              <div>
                <div className="text-sm text-hospital-gray">Medicines</div>
                <div className="text-xl font-bold text-hospital-gray-dark">150+</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-hospital-blue-light shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-hospital-success-light rounded-lg flex items-center justify-center">
                <span className="text-xl text-hospital-success">👥</span>
              </div>
              <div>
                <div className="text-sm text-hospital-gray">Patients</div>
                <div className="text-xl font-bold text-hospital-gray-dark">1000+</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-hospital-blue-light shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-hospital-warning-light rounded-lg flex items-center justify-center">
                <span className="text-xl text-hospital-warning">🏭</span>
              </div>
              <div>
                <div className="text-sm text-hospital-gray">Suppliers</div>
                <div className="text-xl font-bold text-hospital-gray-dark">50+</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-hospital-blue-light shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-hospital-danger-light rounded-lg flex items-center justify-center">
                <span className="text-xl text-hospital-danger">📦</span>
              </div>
              <div>
                <div className="text-sm text-hospital-gray">Inventory Items</div>
                <div className="text-xl font-bold text-hospital-gray-dark">500+</div>
              </div>
            </div>
          </div>
        </div>

        {/* Record Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {recordTypes.map((record, index) => (
            <Link
              key={index}
              href={record.href}
              ref={el => cardsRef.current[index] = el}
              onMouseEnter={() => handleCardHover(index)}
              onMouseLeave={() => handleCardLeave(index)}
              className="block group"
            >
              <div className="h-full bg-white rounded-2xl shadow-lg border border-hospital-blue-light overflow-hidden transition-all duration-300 hover:shadow-xl">
                {/* Card Header with Gradient */}
                <div className={`h-2 bg-gradient-to-r ${record.gradient}`}></div>
                
                {/* Card Content */}
                <div className="p-6">
                  {/* Icon */}
                  <div className="mb-4 text-center">
                    <div className="card-icon inline-block text-5xl mb-3 transition-all duration-300">
                      {record.icon}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-hospital-gray-dark mb-3 text-center">
                    {record.title}
                  </h3>

                  {/* Description */}
                  <p className="text-hospital-gray text-center mb-4">
                    {record.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <span className="text-sm text-hospital-gray">{record.stats}:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold bg-${record.color}-light text-${record.color}`}>
                      {record.count}
                    </span>
                  </div>

                  {/* Action Button */}
                  <div className="text-center">
                    <button className={`px-6 py-2 bg-gradient-to-r ${record.gradient} text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center gap-2 mx-auto`}>
                      <span className="text-lg">+</span>
                      Create Record
                    </button>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 py-3 border-t border-hospital-blue-light bg-hospital-blue-light/30">
                  <div className="flex items-center justify-center gap-2 text-sm text-hospital-gray">
                    <span>Quick Access</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Tips Section */}
        <div 
          ref={tipsRef}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-hospital-blue-light to-hospital-green-light rounded-2xl p-6 border border-hospital-blue-light shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-hospital-blue rounded-xl flex items-center justify-center">
                <span className="text-2xl text-white">💡</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-hospital-gray-dark mb-3">
                  Quick Tips & Best Practices
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-hospital-success-light rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-hospital-success text-sm">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-hospital-gray-dark">Dashboard Monitoring</h4>
                      <p className="text-sm text-hospital-gray">
                        Use the dashboard to monitor inventory levels and reorder alerts
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-hospital-success-light rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-hospital-success text-sm">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-hospital-gray-dark">Stock Updates</h4>
                      <p className="text-sm text-hospital-gray">
                        Regularly update medicine stock to maintain accurate inventory
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-hospital-success-light rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-hospital-success text-sm">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-hospital-gray-dark">Supplier Orders</h4>
                      <p className="text-sm text-hospital-gray">
                        Generate PDF order lists from the reorders page for suppliers
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-hospital-success-light rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-hospital-success text-sm">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-hospital-gray-dark">Patient Records</h4>
                      <p className="text-sm text-hospital-gray">
                        Keep patient records up-to-date for better service tracking
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Accessed (Simulated) */}
        <div className="mb-8 animate-fadeIn">
          <h3 className="text-xl font-bold text-hospital-gray-dark mb-4 flex items-center gap-2">
            <span className="text-2xl text-hospital-blue">🕐</span>
            Recently Accessed
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-hospital-blue-light shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-hospital-blue-light rounded-lg flex items-center justify-center">
                  <span className="text-xl text-hospital-blue">💊</span>
                </div>
                <div>
                  <div className="font-medium text-hospital-gray-dark">Add Medicine</div>
                  <div className="text-sm text-hospital-gray">2 hours ago</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-hospital-blue-light shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-hospital-success-light rounded-lg flex items-center justify-center">
                  <span className="text-xl text-hospital-success">📦</span>
                </div>
                <div>
                  <div className="font-medium text-hospital-gray-dark">Inventory Stock</div>
                  <div className="text-sm text-hospital-gray">Yesterday</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-hospital-blue-light shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-hospital-warning-light rounded-lg flex items-center justify-center">
                  <span className="text-xl text-hospital-warning">🛒</span>
                </div>
                <div>
                  <div className="font-medium text-hospital-gray-dark">Record Purchase</div>
                  <div className="text-sm text-hospital-gray">3 days ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-hospital-blue-light">
          <div className="text-center sm:text-left">
            <h4 className="font-semibold text-hospital-gray-dark mb-1">Need Help?</h4>
            <p className="text-sm text-hospital-gray">
              Check the documentation or contact support
            </p>
          </div>
          
          <div className="flex gap-3">
            <Link
              href="/medical/dashboard"
              className="px-6 py-3 bg-hospital-blue-light hover:bg-hospital-blue text-hospital-blue hover:text-white font-semibold rounded-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2 group"
              onMouseEnter={(e) => {
                gsap.to(e.currentTarget.querySelector('.arrow'), {
                  x: -5,
                  duration: 0.2
                });
              }}
              onMouseLeave={(e) => {
                gsap.to(e.currentTarget.querySelector('.arrow'), {
                  x: 0,
                  duration: 0.2
                });
              }}
            >
              <span className="arrow">←</span>
              Back to Dashboard
            </Link>
            
            <Link
              href="/medical/inventory"
              className="px-6 py-3 bg-gradient-to-r from-hospital-blue to-hospital-blue-dark hover:from-hospital-blue-dark hover:to-hospital-blue text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2"
            >
              View Inventory
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Floating Action Button for Quick Add */}
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative group">
            <button
              onClick={() => {
                // Scroll to top smoothly
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Add animation
                gsap.to(window, { scrollTo: 0, duration: 0.8, ease: "power2.out" });
              }}
              className="w-14 h-14 bg-gradient-to-r from-hospital-blue to-hospital-green rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group-hover:scale-110"
            >
              <span className="text-2xl text-white">⬆️</span>
            </button>
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-hospital-gray-dark text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
              Scroll to Top
            </div>
          </div>
        </div>
      </div>

      {/* Background Animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .card-icon {
          animation: float 3s ease-in-out infinite;
          animation-delay: ${Math.random() * 2}s;
        }
      `}</style>
    </div>
  );
}