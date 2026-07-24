'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [{ href: '/admin/products', label: 'Products' }];

export default function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname.startsWith(link.href) ? 'active' : ''}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
