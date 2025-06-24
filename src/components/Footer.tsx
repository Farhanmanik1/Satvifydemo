"use client";
import Link from "next/link";
import { FaInstagram, FaFacebook, FaWhatsapp, FaYoutube } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8 mt-10 shadow-inner">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Nav Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li><Link href="/customer" className="hover:underline">Home</Link></li>
              <li><Link href="/customer/menu" className="hover:underline">Menu</Link></li>
              <li><Link href="/customer/orders" className="hover:underline">My Orders</Link></li>
              <li><Link href="/customer/profile" className="hover:underline">Profile</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="text-lg font-bold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link href="/faqs" className="hover:underline">FAQs</Link></li>
              <li><Link href="/returns" className="hover:underline">Returns & Refunds</Link></li>
              <li><Link href="/track-order" className="hover:underline">Track Order</Link></li>
              <li><Link href="/delivery-info" className="hover:underline">Delivery Info</Link></li>
            </ul>
          </div>

          {/* Legal Pages */}
          <div>
            <h3 className="text-lg font-bold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/terms-of-use" className="hover:underline">Terms of Use</Link></li>
              <li><Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact & Socials</h3>
            <p className="mb-2">Email: <a href="mailto:support@satvify1.com" className="hover:underline">support@satvify1.com</a></p>
            <p className="mb-4">Phone: <a href="tel:+911234567890" className="hover:underline">+91 12345 67890</a></p>
            <div className="flex gap-4 text-2xl">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500"><FaInstagram /></a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500"><FaFacebook /></a>
              <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="hover:text-green-500"><FaWhatsapp /></a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-red-500"><FaYoutube /></a>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-700 pt-8 mb-8 text-center">
          <h3 className="text-lg font-bold mb-4">Subscribe to our Newsletter</h3>
          <p className="mb-4 text-gray-400">Get the latest updates on new products and upcoming offers.</p>
          <form className="flex justify-center max-w-md mx-auto">
            <input type="email" placeholder="Enter your email" className="w-full rounded-l-lg px-4 py-2 text-white placeholder-white bg-gray-800 focus:outline-none" />
            <button type="submit" className="bg-blue-600 text-white font-bold px-6 py-2 rounded-r-lg hover:bg-blue-700">Subscribe</button>
          </form>
        </div>

        {/* Business Info & Trust Badges */}
        <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
          <div className="mb-4">
            <p><strong>Registered Address:</strong> 123 Foodie Lane, Gourmet City, 123456</p>
            <p><strong>GSTIN:</strong> 29ABCDE1234F1Z5 | <strong>FSSAI No:</strong> 12345678901234</p>
          </div>
          <div className="flex justify-center items-center gap-4 mb-4">
            <span className="font-semibold">SSL Secured</span>
            <img src="https://www.razorpay.com/assets/images/razorpay-logo.svg" alt="Razorpay" className="h-6 bg-white p-1 rounded" />
            <img src="https://www.vectorlogo.zone/logos/visa/visa-ar21.svg" alt="Visa" className="h-6" />
            <img src="https://www.vectorlogo.zone/logos/upi/upi-ar21.svg" alt="UPI" className="h-6" />
          </div>
          <p>Satvify1 &copy; {new Date().getFullYear()}. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
} 