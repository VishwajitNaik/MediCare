'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Drawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/medical/dashboard' },
    { icon: '📦', label: 'Inventory', href: '/medical/inventory' },
    { icon: '👥', label: 'Patients', href: '/medical/patients' },
    { icon: '💊', label: 'Medicines', href: '/medical/medicines' },
    { icon: '📋', label: 'Prescriptions', href: '/medical/prescriptions' },
    { icon: '🛒', label: 'Purchases', href: '/medical/purchases' },
    { icon: '🏭', label: 'Suppliers', href: '/medical/suppliers' },
    { icon: '🔄', label: 'Reorders', href: '/medical/reorders' },
    { icon: '📈', label: 'Reports', href: '/medical/reports' },
    { icon: '⚙️', label: 'Settings', href: '/medical/settings' },
  ];

  const quickActions = [
    { icon: '➕', label: 'Add Medicine', href: '/medical/medicines/add' },
    { icon: '👤', label: 'New Patient', href: '/medical/patients/add' },
    { icon: '📝', label: 'New Prescription', href: '/medical/prescriptions/add' },
  ];

  if (!isMobile) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white text-2xl hover:bg-blue-700 transition-all duration-300 hover:scale-110"
      >
        ☰
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 left-0 bottom-0 w-80 bg-white z-50 transform transition-transform duration-300 ease-out shadow-2xl ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">🏥</span>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">MediCare</h2>
                <p className="text-xs text-gray-500">Medical Store</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Quick Actions
          </h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200"
              >
                <span className="text-xl">{action.icon}</span>
                <span className="font-medium text-gray-700">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Main Menu */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Main Menu
          </h3>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium text-gray-700">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <div className="space-y-3">
            <Link
              href="/api/auth/logout"
              className="flex items-center justify-center space-x-2 p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
            >
              <span>🚪</span>
              <span className="font-semibold">Logout</span>
            </Link>
            <div className="text-center text-sm text-gray-500">
              © 2024 MediCare. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}