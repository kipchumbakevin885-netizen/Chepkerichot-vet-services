"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PawPrint,
  PlusCircle,
  HeartPulse,
  CalendarHeart,
  Wheat,
  Syringe,
  Bug,
  Stethoscope,
  Bell,
  Building2,
  BarChart3,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/animals", label: "My Animals", icon: PawPrint },
  { href: "/animals/new", label: "Add Animal", icon: PlusCircle },
  { href: "/health", label: "Health Records", icon: HeartPulse },
  { href: "/breeding", label: "Breeding & Heat", icon: CalendarHeart },
  { href: "/feeding", label: "Feeding", icon: Wheat },
  { href: "/vaccinations", label: "Vaccinations", icon: Syringe },
  { href: "/deworming", label: "Deworming", icon: Bug },
  { href: "/treatments", label: "Treatments", icon: Stethoscope },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/veterinary", label: "Veterinary Services", icon: Building2 },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-white border-r border-green-100 min-h-screen">
        <div className="px-5 py-5 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Chepkerichot" className="h-9 w-9 object-contain" />
          <span className="font-semibold text-green-900 leading-tight text-sm">
            Chepkerichot
            <br />
            <span className="font-normal text-green-700/60 text-xs">Vet Sambai Services</span>
          </span>
        </div>
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  active ? "bg-green-100 text-green-900 font-medium" : "text-green-800/80 hover:bg-green-50"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-5 py-4 text-sm text-red-700 border-t border-green-100"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Mobile bottom navigation (subset of items) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-green-100 flex justify-around py-2 z-40">
        {NAV_ITEMS.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center text-[10px] gap-0.5 px-2 ${
                active ? "text-green-900 font-medium" : "text-green-700/60"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
