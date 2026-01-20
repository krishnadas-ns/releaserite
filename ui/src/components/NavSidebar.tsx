import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Rocket,
  Server,
  Box,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield
} from "lucide-react";
import { getUserRole } from "@/lib/auth";

export function NavSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(getUserRole());
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      router.push("/login");
    }
  };

  const navGroups = [
    {
      title: "Main",
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/releases", label: "Releases", icon: Rocket },
        { href: "/services", label: "Services", icon: Server },
        { href: "/environments", label: "Environments", icon: Box },
      ],
    },
    ...(role === "admin"
      ? [
        {
          title: "Administration",
          items: [
            { href: "/users", label: "Users", icon: Users },
            { href: "/admin/roles", label: "Roles", icon: Shield },
          ],
        },
      ]
      : []),
  ];

  return (
    <aside
      className={`${isCollapsed ? "w-20" : "w-64"
        } bg-slate-900 text-slate-100 flex flex-col min-h-screen transition-all duration-300 ease-in-out relative`}
    >
      <div className="p-4 flex items-center h-16 mb-4">
        {!isCollapsed ? (
          <h1 className="text-xl font-semibold whitespace-nowrap overflow-hidden">ReleaseRite</h1>
        ) : (
          <div className="w-full flex justify-center">
            <Image
              src="/logo.svg"
              alt="ReleaseRite Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
          </div>
        )}
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-slate-800 text-slate-100 p-1 rounded-full hover:bg-slate-700 border border-slate-700 z-10"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            {!isCollapsed && group.title && (
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={`
                      flex items-center px-3 py-2.5 rounded-lg transition-colors
                      ${isActive ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-300"}
                      ${isCollapsed ? "justify-center" : "gap-3"}
                    `}
                  >
                    <item.icon size={20} />
                    {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 mt-auto">
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={`
            w-full flex items-center rounded-lg text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors p-3
            ${isCollapsed ? "justify-center" : "gap-3 px-3 py-2"}
          `}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

