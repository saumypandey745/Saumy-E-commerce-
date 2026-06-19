import Link from 'next/link';
import { Menu, ShoppingCart, User } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-dark-900 glass fixed w-full z-20 top-0 left-0 border-b border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
        <Link href="/" className="text-2xl font-bold text-white">
          E‑Comm
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/products" className="text-gray-300 hover:text-white transition">
            <Menu size={24} />
          </Link>
          <Link href="/cart" className="text-gray-300 hover:text-white transition">
            <ShoppingCart size={24} />
          </Link>
          <Link href="/auth/login" className="text-gray-300 hover:text-white transition">
            <User size={24} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
