import LogoutButton from '@/components/LogoutButton';
import SidebarNav from '@/components/SidebarNav';

export default function DashboardLayout({ children }) {
  return (
    <div className="admin-body admin-shell">
      <aside className="admin-sidebar">
        <h1>ZAZ Admin</h1>
        <SidebarNav />
        <LogoutButton />
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
