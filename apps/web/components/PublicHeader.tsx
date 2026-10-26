"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { RaksHexLogo } from "@/components/common/RaksHexLogo";

const links = [
  { title: "Budget Lock", href: "/features#budget-lock" },
  { title: "Self-Repair", href: "/features#self-repair" },
  { title: "Our stage", href: "/#evidence" },
  { title: "FAQ", href: "/faq" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const hideBanner = ["/login", "/register", "/reset-password", "/privacy", "/terms", "/cookies"].includes(pathname);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full flex flex-col">
      {!hideBanner && (
        <Link href="/waitlist" className="bg-[#0B0F14]/95 backdrop-blur-md border-b border-[#14B8A6]/30 hover:bg-[#14B8A6]/10 transition-colors">
          <div className="mx-auto flex h-10 max-w-[1280px] items-center justify-between px-6 gap-4">
            <span className="truncate text-white text-xs sm:text-sm">RaksHex is seeking five design partners · Budget Lock + Self-Repair</span>
            <span className="hidden sm:block text-[#14B8A6] text-xs font-semibold shrink-0">Join the conversation →</span>
          </div>
        </Link>
      )}
      <nav className="bg-gradient-to-b from-[#0F1419]/95 to-[#0F1419]/90 backdrop-blur-md border-b border-[#1A1F2E]" aria-label="Main navigation">
        <div className="max-w-[1280px] mx-auto px-6 h-14 flex justify-between items-center">
          <Link href="/" aria-label="RaksHex home" onClick={() => setOpen(false)}><RaksHexLogo size={30} /></Link>
          <div className="hidden lg:flex items-center gap-8">
            {links.map((item) => <Link key={item.href} href={item.href} className="text-sm text-neutral-300 font-medium hover:text-[#14B8A6] transition-colors">{item.title}</Link>)}
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/login" className="text-neutral-300 hover:text-white text-sm transition-colors">Sign in</Link>
            <Link href="/waitlist" className="bg-[#14B8A6] hover:bg-[#2dd4bf] text-[#07100f] text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Become a design partner</Link>
          </div>
          <button type="button" className="lg:hidden text-white p-2" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {open && (
          <div className="lg:hidden border-t border-white/10 bg-[#0B0F17] px-6 pb-5 pt-3 flex flex-col gap-1">
            {links.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="py-3 text-sm text-white hover:text-[#14B8A6]">{item.title}</Link>)}
            <Link href="/login" onClick={() => setOpen(false)} className="py-3 text-sm text-white">Sign in</Link>
            <Link href="/waitlist" onClick={() => setOpen(false)} className="text-center rounded-lg bg-[#14B8A6] text-[#07100f] p-3 font-semibold text-sm">Become a design partner</Link>
          </div>
        )}
      </nav>
    </div>
  );
}
