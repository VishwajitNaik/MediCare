'use client';

import { useState, useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function AboutUs() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const carouselRef = useRef(null);
  const carouselItemsRef = useRef([]);
  const imageCarouselRef = useRef(null);
  const statsRef = useRef(null);
  
  // Carousel achievements data
  const medicalAchievements = [
    {
      id: 1,
      title: "🏥 Hospital Partnerships",
      description: "Integrated with 500+ leading hospitals across India",
      color: "from-emerald-500 to-teal-600",
      icon: "🏨",
      stat: "500+"
    },
    {
      id: 2,
      title: "💊 Pharmacy Networks",
      description: "Serving 10,000+ medical stores nationwide",
      color: "from-teal-500 to-emerald-600", 
      icon: "📦",
      stat: "10K+"
    },
    {
      id: 3,
      title: "👨‍⚕️ Doctor Community",
      description: "Trusted by 50,000+ healthcare professionals",
      color: "from-emerald-600 to-green-600",
      icon: "👨‍⚕️",
      stat: "50K+"
    },
    {
      id: 4,
      title: "📈 Growth Metrics",
      description: "99.9% system uptime with 24/7 support",
      color: "from-green-500 to-emerald-500",
      icon: "📊",
      stat: "99.9%"
    },
    {
      id: 5,
      title: "🔒 Security Standards",
      description: "HIPAA & GDPR compliant data protection",
      color: "from-teal-600 to-emerald-700",
      icon: "🔐",
      stat: "100%"
    }
  ];

  // Medical images for right side carousel (replace with your actual images)
  const medicalImages = [
    {
      id: 1,
      src: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&auto=format&fit=crop",
      title: "Hospital Management",
      description: "Advanced hospital administration system"
    },
    {
      id: 2,
      src: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&auto=format&fit=crop",
      title: "Pharmacy Operations",
      description: "Streamlined pharmacy workflow"
    },
    {
      id: 3,
      src: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&auto=format&fit=crop",
      title: "Patient Care",
      description: "Comprehensive patient management"
    },
    {
      id: 4,
      src: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&auto=format&fit=crop",
      title: "Digital Records",
      description: "Secure electronic health records"
    }
  ];

  // Stats data for the empty section
  const companyStats = [
    {
      id: 1,
      icon: "🎯",
      value: "5000",
      suffix: "+",
      label: "Happy Clients",
      color: "bg-gradient-to-r from-emerald-500 to-teal-500"
    },
    {
      id: 2,
      icon: "🚀",
      value: "100",
      suffix: "%",
      label: "Uptime",
      color: "bg-gradient-to-r from-teal-500 to-emerald-500"
    },
    {
      id: 3,
      icon: "👥",
      value: "50",
      suffix: "+",
      label: "Countries",
      color: "bg-gradient-to-r from-emerald-600 to-green-500"
    },
    {
      id: 4,
      icon: "💯",
      value: "24",
      suffix: "/7",
      label: "Support",
      color: "bg-gradient-to-r from-green-500 to-emerald-600"
    }
  ];

  // Auto-rotate achievement carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % medicalAchievements.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [medicalAchievements.length]);

  // Auto-rotate image carousel (slower interval)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % medicalImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [medicalImages.length]);

  // GSAP animations for achievement carousel
  useGSAP(() => {
    // Animate active slide
    if (carouselItemsRef.current[activeSlide]) {
      gsap.fromTo(
        carouselItemsRef.current[activeSlide],
        { 
          scale: 0.95,
          opacity: 0.8,
          y: 20
        },
        { 
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out"
        }
      );
    }

    // Animate other slides
    medicalAchievements.forEach((_, index) => {
      if (index !== activeSlide && carouselItemsRef.current[index]) {
        gsap.to(carouselItemsRef.current[index], {
          scale: 0.9,
          opacity: 0.6,
          duration: 0.5,
          ease: "power2.out"
        });
      }
    });

  }, { dependencies: [activeSlide], scope: carouselRef });

  // GSAP animations for stats section
  useGSAP(() => {
    if (!statsRef.current) return;

    // Animate stats on scroll
    ScrollTrigger.create({
      trigger: statsRef.current,
      start: "top 80%",
      onEnter: () => {
        gsap.from(statsRef.current.children, {
          y: 50,
          opacity: 0,
          stagger: 0.2,
          duration: 1,
          ease: "power2.out"
        });
      }
    });
  }, { scope: statsRef });

  // GSAP animations for image carousel
  useGSAP(() => {
    if (!imageCarouselRef.current) return;

    const images = imageCarouselRef.current.children;
    
    // Animate current image
    if (images[activeImage]) {
      gsap.fromTo(images[activeImage],
        { 
          scale: 1.05,
          opacity: 0,
          rotateY: -10
        },
        { 
          scale: 1,
          opacity: 1,
          rotateY: 0,
          duration: 1,
          ease: "power2.out"
        }
      );
    }

    // Hide other images
    medicalImages.forEach((_, index) => {
      if (index !== activeImage && images[index]) {
        gsap.to(images[index], {
          opacity: 0,
          scale: 0.95,
          duration: 0.5,
          ease: "power2.out"
        });
      }
    });

  }, { dependencies: [activeImage], scope: imageCarouselRef });

  const handleAchievementClick = (index) => {
    setActiveSlide(index);
  };

  const handleImageClick = (index) => {
    setActiveImage(index);
  };

  return (
    <section id="about" className="py-20 bg-gradient-to-b from-emerald-50/50 to-white">
      <div className="container mx-auto px-4 md:px-8">
        {/* Stats Section - Fills the empty space */}
        <div 
          ref={statsRef}
          className="mb-20 bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-emerald-100"
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 rounded-full text-lg font-semibold mb-6 shadow-sm">
              <span className="mr-3">🏆</span> Trusted by Medical Professionals Worldwide
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our numbers speak for themselves
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Delivering exceptional value to healthcare providers across the globe
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {companyStats.map((stat) => (
              <div 
                key={stat.id}
                className="group relative bg-gradient-to-br from-white to-emerald-50 rounded-2xl p-8 border border-emerald-100 hover:border-emerald-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
              >
                {/* Background glow effect */}
                <div className={`absolute inset-0 ${stat.color} rounded-2xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500`} />
                
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="text-3xl">{stat.icon}</span>
                  </div>
                  
                  <div className="flex items-baseline justify-center mb-3">
                    <span className="text-5xl font-bold text-gray-900">{stat.value}</span>
                    <span className="text-3xl font-bold text-emerald-600 ml-2">{stat.suffix}</span>
                  </div>
                  
                  <div className="text-lg font-semibold text-gray-700">
                    {stat.label}
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-500">
                    <div className="flex items-center justify-center">
                      <span className="mr-2">📈</span>
                      Continuously growing
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats bottom note */}
          <div className="mt-12 pt-8 border-t border-emerald-100 text-center">
            <p className="text-gray-600 flex items-center justify-center gap-2">
              <span className="text-emerald-600">✅</span>
              Verified metrics from real healthcare institutions • Updated monthly
            </p>
          </div>
        </div>

        {/* Main Content with Image Carousel */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-6">
                <span className="mr-2">🏥</span> About Our Journey
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                About <span className="text-emerald-600">MediCare</span>
              </h2>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We are a leading provider of hospital and medical store management solutions, 
                dedicated to revolutionizing healthcare operations through technology.
              </p>
            </div>

            {/* Values Section */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl text-emerald-600">🎯</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Our Mission</h3>
                  <p className="text-gray-600">
                    To empower healthcare providers with intuitive, efficient, and reliable management 
                    tools that improve patient care and operational excellence.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl text-emerald-600">👁️</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Our Vision</h3>
                  <p className="text-gray-600">
                    To become the global standard for healthcare management systems, 
                    connecting every stakeholder in the healthcare ecosystem seamlessly.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-100">
                  <span className="text-2xl text-emerald-600">💎</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Our Values</h3>
                  <p className="text-gray-600">
                    Innovation, Reliability, Customer-Centricity, and Excellence in everything we do.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-6">
              <button className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center">
                <span className="mr-3">📋</span> Download Company Profile
                <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
              </button>
            </div>
          </div>

          {/* Right Column - Image Carousel */}
          <div 
            ref={imageCarouselRef}
            className="relative h-[600px] md:h-[700px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white"
          >
            {/* Images with overlay */}
            {medicalImages.map((image, index) => (
              <div
                key={image.id}
                className={`absolute inset-0 transition-all duration-500 ${
                  index === activeImage ? 'z-20' : 'z-10'
                }`}
                style={{
                  opacity: index === activeImage ? 1 : 0,
                  pointerEvents: index === activeImage ? 'auto' : 'none'
                }}
              >
                <img 
                  src={image.src}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Image overlay with content */}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/80 via-emerald-900/40 to-transparent flex flex-col justify-end p-8">
                  <div className="max-w-lg">
                    <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold mb-4">
                      <span className="mr-2">📸</span> Featured Implementation
                    </div>
                    
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                      {image.title}
                    </h3>
                    
                    <p className="text-white/90 text-lg mb-6">
                      {image.description}
                    </p>
                    
                    <button className="px-6 py-3 bg-white text-emerald-700 rounded-lg hover:bg-emerald-50 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl">
                      View Case Study →
                    </button>
                  </div>
                </div>

                {/* Image indicator dots */}
                <div className="absolute bottom-8 right-8 flex space-x-2">
                  {medicalImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleImageClick(idx)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        idx === activeImage 
                          ? 'bg-white w-8' 
                          : 'bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Image navigation buttons */}
            <div className="absolute top-1/2 left-4 right-4 transform -translate-y-1/2 z-30 flex justify-between pointer-events-none">
              <button
                onClick={() => setActiveImage(prev => prev > 0 ? prev - 1 : medicalImages.length - 1)}
                className="bg-white/90 hover:bg-white text-emerald-700 w-12 h-12 rounded-full shadow-xl flex items-center justify-center pointer-events-auto transition-all duration-200 hover:scale-110"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setActiveImage(prev => (prev + 1) % medicalImages.length)}
                className="bg-white/90 hover:bg-white text-emerald-700 w-12 h-12 rounded-full shadow-xl flex items-center justify-center pointer-events-auto transition-all duration-200 hover:scale-110"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Image counter */}
            <div className="absolute top-8 right-8 z-30">
              <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                <span>{activeImage + 1}</span>
                <span className="mx-2 text-white/60">/</span>
                <span>{medicalImages.length}</span>
              </div>
            </div>

            {/* Auto-rotate indicator */}
            <div className="absolute bottom-8 left-8 z-30">
              <div className="bg-black/50 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm">
                <span className="mr-2">🔄</span> Auto-rotates every 5s
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Carousel at Bottom */}
        <div className="mt-20">
          <div 
            ref={carouselRef}
            className="relative"
          >
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Our <span className="text-emerald-600">Key Achievements</span>
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Milestones that define our journey in revolutionizing healthcare management
              </p>
            </div>

            {/* Fixed Carousel Container */}
            <div className="relative overflow-hidden h-64 md:h-56 px-4">
              <div className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ 
                  transform: `translateX(-${activeSlide * (100 / 3)}%)`,
                  width: `${medicalAchievements.length * (100 / 3)}%`
                }}
              >
                {medicalAchievements.map((achievement, index) => (
                  <div
                    key={achievement.id}
                    ref={el => carouselItemsRef.current[index] = el}
                    onClick={() => handleAchievementClick(index)}
                    className="flex-shrink-0 w-1/3 px-4 cursor-pointer transition-all duration-300"
                  >
                    <div className={`bg-gradient-to-r ${achievement.color} rounded-2xl p-6 h-full shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ${
                      index === activeSlide ? 'ring-4 ring-white/50 ring-offset-2 ring-offset-emerald-100' : 'opacity-90'
                    }`}>
                      <div className="flex flex-col h-full">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">{achievement.icon}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-white">
                              {achievement.title}
                            </h4>
                          </div>
                        </div>
                        
                        <p className="text-white/90 text-sm mb-4 flex-1">
                          {achievement.description}
                        </p>
                        
                        <div className="pt-4 border-t border-white/20">
                          <div className="text-3xl font-bold text-white text-center">
                            {achievement.stat}
                          </div>
                          <div className="text-white/80 text-sm text-center mt-1">
                            Achievement
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Left fade gradient */}
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-emerald-50/90 to-transparent pointer-events-none"></div>
              
              {/* Right fade gradient */}
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-emerald-50/90 to-transparent pointer-events-none"></div>
            </div>

            {/* Carousel Navigation - Simplified */}
            <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8 mt-12 px-4">
              {/* Mobile: Show current slide info */}
              <div className="md:hidden text-emerald-600 font-semibold text-lg">
                <span>{activeSlide + 1}</span>
                <span className="mx-2 text-gray-400">/</span>
                <span>{medicalAchievements.length}</span>
              </div>
              
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setActiveSlide(prev => prev > 0 ? prev - 1 : medicalAchievements.length - 1)}
                  className="w-12 h-12 bg-white border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-50 transition-all duration-200 hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous achievement"
                  disabled={activeSlide === 0}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Desktop indicators */}
                <div className="hidden md:flex space-x-2">
                  {medicalAchievements.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAchievementClick(idx)}
                      className={`w-8 h-2 rounded-full transition-all duration-300 ${
                        idx === activeSlide 
                          ? 'bg-emerald-600' 
                          : 'bg-gray-300 hover:bg-emerald-400'
                      }`}
                      aria-label={`Go to achievement ${idx + 1}`}
                    />
                  ))}
                </div>
                
                {/* Mobile indicators */}
                <div className="flex md:hidden space-x-2">
                  {medicalAchievements.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full ${
                        idx === activeSlide 
                          ? 'bg-emerald-600' 
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                <button
                  onClick={() => setActiveSlide(prev => (prev + 1) % medicalAchievements.length)}
                  className="w-12 h-12 bg-white border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-50 transition-all duration-200 hover:scale-110 shadow-lg"
                  aria-label="Next achievement"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Desktop: Show current slide info */}
              <div className="hidden md:block text-emerald-600 font-semibold text-lg">
                <span className="text-2xl">{activeSlide + 1}</span>
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-600">{medicalAchievements.length}</span>
              </div>
            </div>
            
            {/* Auto-rotate indicator */}
            <div className="text-center mt-6 text-sm text-gray-500">
              <span className="inline-flex items-center">
                <span className="mr-2">🔄</span>
                Auto-rotates every 4 seconds
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}