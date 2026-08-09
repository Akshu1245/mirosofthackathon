"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Shared 4-step nav for the Hindsight + cascadeflow judge demo.
 * See apps/web/DESIGN.md — this is the one flow in the app where screen-to-
 * screen visual consistency matters most; every step reuses the same shell.
 */
const STEPS = [
  { href: "/governance-demo", label: "1. The pain" },
  { href: "/runtime-governance", label: "2. Live: block + recall" },
  { href: "/governance-demo/trust", label: "3. Why it's hard to fake" },
  { href: "/governance-demo/close", label: "4. Honest close" },
];

export default function GovernanceDemoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 bg-black/80 px-5 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
          {STEPS.map((step) => {
            const active = pathname === step.href;
            return (
              <Link
                key={step.href}
                href={step.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-400 text-black"
                    : "text-gray-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {step.label}
              </Link>
            );
          })}
        </div>
      </nav>
      {children}
    </div>
  );
}
