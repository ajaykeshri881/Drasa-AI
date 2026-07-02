import { auth } from "@/features/auth/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, Settings, Settings2, AlertTriangle, ChevronLeft, CreditCard, Server, Megaphone } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Protect the admin routes
  if (!session || session.user?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex h-screen bg-background dark:bg-[#1A1918] text-foreground dark:text-[#E6E4DF] font-sans selection:bg-primary/30">
      {/* Admin Sidebar */}
      <aside className="w-[260px] flex-shrink-0 border-r border-border dark:border-[#33312E] bg-card dark:bg-[#1F1E1D] flex flex-col h-full">
        <div className="p-5 border-b border-border dark:border-[#33312E]">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground dark:text-[#8A8985] dark:hover:text-[#E6E4DF] transition-colors mb-4 text-sm font-medium">
            <ChevronLeft size={16} /> Back to Chat
          </Link>
          <h2 className="font-serif text-xl tracking-wide text-foreground dark:text-white">Admin Panel</h2>
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          <NavItem href="/admin/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" />
          <NavItem href="/admin/users" icon={<Users size={18} />} label="Users" />
          <NavItem href="/admin/payments" icon={<CreditCard size={18} />} label="Payments" />
          <NavItem href="/admin/queues" icon={<Server size={18} />} label="Queues" />
          <NavItem href="/admin/models" icon={<Settings size={18} />} label="Models" />
          <NavItem href="/admin/settings" icon={<Settings2 size={18} />} label="Settings" />
          <NavItem href="/admin/sponsors" icon={<Megaphone size={18} />} label="Sponsors" />
          <NavItem href="/admin/alerts" icon={<AlertTriangle size={18} />} label="Broadcasts" />
        </nav>
        
        <div className="p-4 border-t border-border dark:border-[#33312E] text-xs text-muted-foreground dark:text-[#73726E] text-center">
          Drasa AI Admin v1.0
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none opacity-50"></div>
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground/80 dark:text-[#D4D2CD] hover:bg-accent dark:hover:bg-[#2A2928] hover:text-foreground dark:hover:text-white transition-all text-sm font-medium group"
    >
      <span className="text-muted-foreground dark:text-[#8A8985] group-hover:text-primary dark:group-hover:text-[#C36A4F] transition-colors">
        {icon}
      </span>
      {label}
    </Link>
  );
}
