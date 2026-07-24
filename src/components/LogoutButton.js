'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <button type="button" className="logout" onClick={handleLogout}>
        Log out
      </button>
    </form>
  );
}
