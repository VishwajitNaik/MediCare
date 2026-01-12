'use client';

import { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Services() {
  const [activeTab, setActiveTab] = useState('inventory');
  const carouselRef = useRef(null);
  const carouselInnerRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Image data - replace with your actual app images
  const carouselImages = [
    {
      id: 1,
      src: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&auto=format&fit=crop',
      title: 'Inventory Dashboard',
      description: 'Real-time medicine tracking interface'
    },
    {
      id: 2,
      src: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w-800&auto=format&fit=crop',
      title: 'Patient Management',
      description: 'Comprehensive patient records system'
    },
    {
      id: 3,
      src: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&auto=format&fit=crop',
      title: 'Prescription Module',
      description: 'Digital prescription generation'
    },
    {
      id: 4,
      src: 'https://images.unsplash.com/photo-1550572017-f0d6c287a1b3?w=800&auto=format&fit=crop',
      title: 'Analytics Dashboard',
      description: 'Performance metrics and reports'
    },
    {
      id: 5,
      src: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&auto=format&fit=crop',
      title: 'Billing System',
      description: 'Integrated billing and invoicing'
    },
    {
      id: 6,
      src: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w-800&auto=format&fit=crop',
      title: 'Supplier Portal',
      description: 'Vendor and supplier management'
    }
  ];

  const services = [
    {
      id: 'inventory',
      title: '📦 Smart Inventory Management',
      description: 'Real-time tracking of medicines, automatic reordering, and expiry date monitoring.',
      features: [
        'Real-time stock updates',
        'Automatic low-stock alerts',
        'Batch & expiry tracking',
        'Supplier management'
      ]
    },
    {
      id: 'patient',
      title: '👥 Patient Management System',
      description: 'Complete patient records, prescription management, and appointment scheduling.',
      features: [
        'Digital patient records',
        'Prescription generation',
        'Appointment scheduling',
        'Billing & invoicing'
      ]
    },
    {
      id: 'pharmacy',
      title: '💊 Pharmacy Operations',
      description: 'Streamlined dispensing, billing, and inventory management for pharmacies.',
      features: [
        'Quick medicine search',
        'Barcode scanning',
        'Insurance integration',
        'Sales analytics'
      ]
    },
    {
      id: 'reporting',
      title: '📊 Advanced Analytics',
      description: 'Comprehensive reports and insights for better decision making.',
      features: [
        'Sales & revenue reports',
        'Stock movement analysis',
        'Patient statistics',
        'Performance metrics'
      ]
    }
  ];

  // Initialize GSAP carousel animations
  useGSAP(() => {
    if (!carouselInnerRef.current) return;

    // Create a scrolling animation for the carousel
    const slides = carouselInnerRef.current.children;
    const slideWidth = slides[0].offsetWidth + 32; // width + gap
    
    // Initial positioning
    gsap.set(carouselInnerRef.current, { x: 0 });

    // Animate carousel on scroll trigger
    ScrollTrigger.create({
      trigger: carouselRef.current,
      start: "top 80%",
      end: "bottom 20%",
      onEnter: () => {
        gsap.fromTo(carouselInnerRef.current,
          { x: 0 },
          {
            x: -(slideWidth * 3), // Move 3 slides
            duration: 2,
            ease: "power2.out"
          }
        );
      },
      onLeaveBack: () => {
        gsap.to(carouselInnerRef.current, {
          x: 0,
          duration: 1.5,
          ease: "power2.out"
        });
      }
    });

  }, { scope: carouselRef });

  // Handle manual slide navigation
  const goToSlide = (index) => {
    if (!carouselInnerRef.current) return;
    
    const slides = carouselInnerRef.current.children;
    const slideWidth = slides[0].offsetWidth + 32;
    const maxSlide = carouselImages.length - 1;
    
    let targetIndex = index;
    if (index < 0) targetIndex = maxSlide;
    if (index > maxSlide) targetIndex = 0;
    
    setCurrentSlide(targetIndex);
    
    gsap.to(carouselInnerRef.current, {
      x: -(slideWidth * targetIndex),
      duration: 0.8,
      ease: "power2.inOut"
    });
  };

  // Auto-rotate carousel
  useGSAP(() => {
    const interval = setInterval(() => {
      goToSlide(currentSlide + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSlide]);

  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16 fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Comprehensive <span className="text-emerald-600">Services</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to manage your medical store or hospital efficiently in one platform
          </p>
        </div>

        {/* Service Tabs - Updated with medical colors */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => setActiveTab(service.id)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === service.id
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg transform -translate-y-1'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {service.title.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Active Service Content - Updated with medical colors */}
          <div className="max-w-4xl mx-auto fade-in">
            {services
              .filter(service => service.id === activeTab)
              .map((service) => (
                <div key={service.id} className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl shadow-xl p-8 md:p-12 border border-emerald-100">
                  <div className="flex items-start space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-3xl text-white">{service.title.split(' ')[0]}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                        {service.title}
                      </h3>
                      <p className="text-lg text-gray-600 mb-8">
                        {service.description}
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                        {service.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* All Services Grid - Updated with medical colors */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          {services.map((service) => (
            <div 
              key={service.id}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200 group"
            >
              <div className="w-14 h-14 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">{service.title.split(' ')[0]}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {service.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {service.description}
              </p>
              <ul className="space-y-2">
                {service.features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* GSAP Image Carousel Section */}
        <div className="mt-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              See Our Platform <span className="text-emerald-600">In Action</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore the intuitive interfaces and powerful features of our medical management system
            </p>
          </div>

          <div 
            ref={carouselRef} 
            className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 md:p-8 border border-emerald-100"
          >
            {/* Carousel Navigation Buttons */}
            <div className="absolute top-1/2 left-4 right-4 transform -translate-y-1/2 z-20 flex justify-between pointer-events-none">
              <button
                onClick={() => goToSlide(currentSlide - 1)}
                className="bg-white/90 hover:bg-white text-emerald-700 w-12 h-12 rounded-full shadow-lg flex items-center justify-center pointer-events-auto transition-all duration-200 hover:scale-110 hover:shadow-xl"
                aria-label="Previous slide"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => goToSlide(currentSlide + 1)}
                className="bg-white/90 hover:bg-white text-emerald-700 w-12 h-12 rounded-full shadow-lg flex items-center justify-center pointer-events-auto transition-all duration-200 hover:scale-110 hover:shadow-xl"
                aria-label="Next slide"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Carousel Container */}
            <div 
              ref={carouselInnerRef}
              className="flex gap-8 pb-8 cursor-grab active:cursor-grabbing"
              style={{ willChange: 'transform' }}
            >
              {carouselImages.map((image) => (
                <div 
                  key={image.id}
                  className="flex-shrink-0 w-[300px] md:w-[400px] group"
                >
                  <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="relative h-64 md:h-72 overflow-hidden">
                      <img 
                        src={image.src} 
                        alt={image.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {image.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {image.description}
                      </p>
                      <div className="mt-4 flex items-center text-emerald-600 text-sm font-medium">
                        <span className="mr-2">✨</span>
                        Featured Interface
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center items-center space-x-3 mt-8">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-emerald-600 w-8' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Slide Counter */}
            <div className="text-center mt-6">
              <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                <span className="mr-2">📸</span>
                {currentSlide + 1} / {carouselImages.length}
              </div>
            </div>
          </div>

          {/* Carousel Instructions */}
          <div className="text-center mt-8 text-gray-600">
            <p className="flex items-center justify-center gap-2">
              <span className="text-emerald-600">💡</span>
              Drag to scroll • Click indicators to navigate • Auto-rotates every 5 seconds
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}