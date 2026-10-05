import React from "react";
import Link from "next/link";
import { ShoppingBag, ShieldCheck, Truck, Clock, RefreshCw } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Props Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800 text-sm">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-indigo-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">Fast Nationwide Delivery</p>
              <p className="text-xs text-slate-400">Standard & express shipping</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">100% Authentic Products</p>
              <p className="text-xs text-slate-400">Guaranteed genuine stock</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-indigo-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">24/7 Dedicated Support</p>
              <p className="text-xs text-slate-400">Always here to help you</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-indigo-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">Hassle-Free Returns</p>
              <p className="text-xs text-slate-400">7-day return policy</p>
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-10">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white tracking-tight mb-4">
              <ShoppingBag className="w-6 h-6 text-indigo-400" />
              <span>ShopNest</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your trusted online destination for quality electronics, accessories, and everyday essentials.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/products" className="hover:text-indigo-400 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-indigo-400 transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-indigo-400 transition-colors">
                  My Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Customer Care</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/profile" className="hover:text-indigo-400 transition-colors">
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-indigo-400 transition-colors">
                  Track Orders
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-400 transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Security & Trust</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Protected with enterprise-grade JWT token security, encrypted password hashing, and real-time inventory verification.
            </p>
            <div className="text-xs text-indigo-400 font-mono">Currency: BDT (Bangladeshi Taka)</div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} ShopNest E-Commerce. All rights reserved.</p>
          <p>Powered by Next.js 14 & Go REST API</p>
        </div>
      </div>
    </footer>
  );
}
