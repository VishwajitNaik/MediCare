// 'use client';

// import Link from 'next/link';
// import Navbar from './Components/Navbar';
// import Hero from './Components/Hero';
// import our_team from './Components/our_team';
// import contact from './Components/contact';
// import services from './Components/services';
// import aboutUs from './Components/aboutUs';
// import drawer from './Components/drawer';


// export default function Home() {
//   return (
//     <div style={{ padding: '20px', textAlign: 'center' }}>
//       <h1>Hospital Management System</h1>
//       <p>Welcome to the Hospital Management System</p>
//       <div style={{ margin: '20px 0' }}>
//         <h2>Doctor Portal</h2>
//         <Link href="/doctor/signin">
//           <button style={{ padding: '10px 20px', margin: '10px' }}>Doctor Login</button>
//         </Link>
//         <Link href="/doctor/signup">
//           <button style={{ padding: '10px 20px', margin: '10px' }}>Doctor Signup</button>
//         </Link>
//       </div>
//       <div style={{ margin: '20px 0' }}>
//         <h2>Medical Staff Portal</h2>
//         <Link href="/medical/signin">
//           <button style={{ padding: '10px 20px', margin: '10px' }}>Medical Login</button>
//         </Link>
//         <Link href="/medical/signup">
//           <button style={{ padding: '10px 20px', margin: '10px' }}>Medical Signup</button>
//         </Link>
//       </div>
//       <div style={{ margin: '20px 0' }}>
//         <Link href="/dashboard">
//           <button style={{ padding: '10px 20px', margin: '10px' }}>View Dashboard</button>
//         </Link>
//       </div>
//     </div>
//   );
// }


// import Navbar from './Components/Navbar';
// import Hero from './Components/Hero';
// import Services from './Components/services';
// import AboutUs from './Components/aboutUs';
// import OurTeam from './Components/our_team';
// import Contact from './Components/contact';
// import Drawer from './Components/drawer';

// export default function Home() {
//   return (
//     <>
//       <Navbar />
//       <Hero />
//       <Services />
//       <AboutUs />
//       <OurTeam />
//       <Contact />
//       <Drawer />
      
//       {/* Footer */}
//       <footer className="bg-gray-900 text-white py-12">
//         <div className="container mx-auto px-4 md:px-8">
//           <div className="grid md:grid-cols-4 gap-8">
//             <div>
//               <div className="flex items-center space-x-2 mb-6">
//                 <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
//                   <span className="text-white font-bold">🏥</span>
//                 </div>
//                 <div>
//                   <h2 className="text-2xl font-bold">MediCare</h2>
//                   <p className="text-sm text-gray-400">Hospital Management</p>
//                 </div>
//               </div>
//               <p className="text-gray-400 text-sm">
//                 Revolutionizing healthcare management with cutting-edge technology and innovation.
//               </p>
//             </div>
            
//             <div>
//               <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
//               <ul className="space-y-3">
//                 <li><a href="#services" className="text-gray-400 hover:text-white transition-colors duration-200">Services</a></li>
//                 <li><a href="#about" className="text-gray-400 hover:text-white transition-colors duration-200">About Us</a></li>
//                 <li><a href="#team" className="text-gray-400 hover:text-white transition-colors duration-200">Our Team</a></li>
//                 <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors duration-200">Contact</a></li>
//               </ul>
//             </div>
            
//             <div>
//               <h3 className="text-lg font-semibold mb-6">Platform</h3>
//               <ul className="space-y-3">
//                 <li><a href="/medical/signin" className="text-gray-400 hover:text-white transition-colors duration-200">Medical Login</a></li>
//                 <li><a href="/medical/signup" className="text-gray-400 hover:text-white transition-colors duration-200">Medical Sign Up</a></li>
//                 <li><a href="/doctor/signin" className="text-gray-400 hover:text-white transition-colors duration-200">Doctor Login</a></li>
//                 <li><a href="/doctor/signup" className="text-gray-400 hover:text-white transition-colors duration-200">Doctor Sign Up</a></li>
//                 <li><a href="/medical/dashboard" className="text-gray-400 hover:text-white transition-colors duration-200">Dashboard Demo</a></li>
//               </ul>
//             </div>
            
//             <div>
//               <h3 className="text-lg font-semibold mb-6">Contact Info</h3>
//               <ul className="space-y-3 text-gray-400">
//                 <li className="flex items-center space-x-2">
//                   <span>📍</span>
//                   <span>123 Healthcare Street, Mumbai</span>
//                 </li>
//                 <li className="flex items-center space-x-2">
//                   <span>📞</span>
//                   <span>+91 98765 43210</span>
//                 </li>
//                 <li className="flex items-center space-x-2">
//                   <span>✉️</span>
//                   <span>info@medicare.com</span>
//                 </li>
//               </ul>
//             </div>
//           </div>
          
//           <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
//             <p>© 2024 MediCare Hospital Management System. All rights reserved.</p>
//           </div>
//         </div>
//       </footer>
//     </>
//   );
// }

import Hero from './Components/Hero';
import Services from './Components/services';
import AboutUs from './Components/aboutUs';
import OurTeam from './Components/our_team';
import Contact from './Components/contact';
import Drawer from './Components/drawer';

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <AboutUs />
      <OurTeam />
      <Contact />
      <Drawer />
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">🏥</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">MediCare</h2>
                  <p className="text-sm text-gray-400">Hospital Management</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Revolutionizing healthcare management with cutting-edge technology and innovation.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
              <ul className="space-y-3">
                <li><a href="#services" className="text-gray-400 hover:text-white transition-colors duration-200">Services</a></li>
                <li><a href="#about" className="text-gray-400 hover:text-white transition-colors duration-200">About Us</a></li>
                <li><a href="#team" className="text-gray-400 hover:text-white transition-colors duration-200">Our Team</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors duration-200">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Platform Access</h3>
              <ul className="space-y-3">
                <li><a href="/patient/signin" className="text-green-400 hover:text-green-300 transition-colors duration-200 font-medium">👤 Patient Login</a></li>
                <li><a href="/patient/signup" className="text-green-400 hover:text-green-300 transition-colors duration-200">📝 Patient Sign Up</a></li>
                <li><a href="/doctor/signin" className="text-blue-400 hover:text-blue-300 transition-colors duration-200">👨‍⚕️ Doctor Login</a></li>
                <li><a href="/doctor/signup" className="text-blue-400 hover:text-blue-300 transition-colors duration-200">📋 Doctor Sign Up</a></li>
                <li><a href="/medical/signin" className="text-purple-400 hover:text-purple-300 transition-colors duration-200">🏥 Medical Login</a></li>
                <li><a href="/medical/signup" className="text-purple-400 hover:text-purple-300 transition-colors duration-200">💼 Medical Sign Up</a></li>
                <li><a href="/patient/dashboard" className="text-green-400 hover:text-green-300 transition-colors duration-200">📊 Patient Dashboard</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Contact Info</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center space-x-2">
                  <span>📍</span>
                  <span>123 Healthcare Street, Mumbai</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span>📞</span>
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span>✉️</span>
                  <span>info@medicare.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>© 2024 MediCare Hospital Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
