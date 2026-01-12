'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function UniversalNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLandingPage = pathname === '/';
  const isMedicalPage = pathname?.startsWith('/medical');
  const isDoctorPage = pathname?.startsWith('/doctor');

  // Navigation links based on current page
  const getNavLinks = () => {
    if (isLandingPage) {
      return [
        { name: 'Home', href: '#', icon: '🏠' },
        { name: 'Services', href: '#services', icon: '🛠️' },
        { name: 'About', href: '#about', icon: 'ℹ️' },
        { name: 'Team', href: '#team', icon: '👥' },
        { name: 'Contact', href: '#contact', icon: '📞' },
      ];
    } else if (isMedicalPage) {
      return [
        { name: 'Dashboard', href: '/medical/dashboard', icon: '📊' },
        { name: 'Inventory', href: '/medical/inventory', icon: '📦' },
        { name: 'Patients', href: '/medical/patients', icon: '👥' },
        { name: 'Medicines', href: '/medical/medicines', icon: '💊' },
        { name: 'Prescriptions', href: '/medical/prescriptions', icon: '📋' },
        { name: 'Purchases', href: '/medical/purchases', icon: '🛒' },
        { name: 'Suppliers', href: '/medical/suppliers', icon: '🏭' },
        { name: 'Reports', href: '/medical/reports', icon: '📈' },
      ];
    } else if (isDoctorPage) {
      return [
        { name: 'Dashboard', href: '/doctor/dashboard', icon: '📊' },
        { name: 'Patients', href: '/doctor/patients', icon: '👥' },
        { name: 'Appointments', href: '/doctor/appointments', icon: '📅' },
        { name: 'Prescriptions', href: '/doctor/prescriptions', icon: '📋' },
        { name: 'Schedule', href: '/doctor/schedule', icon: '⏰' },
        { name: 'Reports', href: '/doctor/reports', icon: '📈' },
      ];
    }
    return [];
  };

  const getAuthButtons = () => {
    if (isLandingPage) {
      return (
        <>
          <Link href="/doctor/signin">
            <button className="px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors duration-200 font-medium">
              Doctor Login
            </button>
          </Link>
          <Link href="/medical/signin">
            <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium">
              Medical Login
            </button>
          </Link>
          <Link href="/medical/dashboard">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-md hover:shadow-lg">
              View Dashboard
            </button>
          </Link>
        </>
      );
    } else if (isMedicalPage) {
      return (
        <>
          <Link href="/medical/dashboard">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
              Dashboard
            </button>
          </Link>
          <Link href="/">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium">
              Home
            </button>
          </Link>
        </>
      );
    } else if (isDoctorPage) {
      return (
        <>
          <Link href="/doctor/dashboard">
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium">
              Dashboard
            </button>
          </Link>
          <Link href="/">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium">
              Home
            </button>
          </Link>
        </>
      );
    }
    return (
      <Link href="/">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
          Go Home
        </button>
      </Link>
    );
  };

  const navLinks = getNavLinks();

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-lg py-3' : 'bg-white shadow-sm py-3'
    }`}>
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">🏥</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-700">MediCare</h1>
              <p className="text-xs text-gray-600">
                {isMedicalPage ? 'Medical Store' : 
                 isDoctorPage ? 'Doctor Portal' : 
                 'Hospital Management'}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  pathname === link.href ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <span>{link.icon}</span>
                <span className="font-medium">{link.name}</span>
              </Link>
            ))}
            
            <div className="flex items-center space-x-4 pl-6 border-l border-gray-200">
              {getAuthButtons()}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 bg-white rounded-lg shadow-xl p-4 slide-in border border-gray-100">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 py-3 px-3 rounded-lg transition-colors duration-200 ${
                    pathname === link.href ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{link.icon}</span>
                  <span className="font-medium">{link.name}</span>
                </Link>
              ))}
              
              <div className="pt-4 border-t space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {getAuthButtons()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}