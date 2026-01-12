import './globals.css';
import { Inter } from 'next/font/google';
import UniversalNavbar from './Components/UniversalNavbar.js';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'MediCare - Hospital Management System',
  description: 'Comprehensive hospital and medical store management solution',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UniversalNavbar />
        <div className="min-h-screen bg-gray-50 text-gray-800 pt-16">
          {children}
        </div>
      </body>
    </html>
  );
}
