import Link from "next/link";
import { RaksHexLogo } from "@/components/common/RaksHexLogo";

export function Footer() {
  return (
    <footer className="w-full bg-transparent py-10 border-t border-white/10 relative">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10">
        <div className="flex flex-col md:flex-row gap-8 md:justify-between mb-10">
          <div className="max-w-md">
            <Link href="/" aria-label="RaksHex home"><RaksHexLogo size={30} /></Link>
            <p className="text-neutral-400 text-sm mt-4 leading-relaxed">AI/API spending visibility and human-reviewed API self-repair. Early-stage workflows under validation, not production-proven services.</p>
          </div>
          <div className="flex flex-wrap gap-x-7 gap-y-3 text-neutral-400 text-sm md:justify-end">
            <Link href="/features" className="hover:text-white">Workflows</Link>
            <Link href="/pricing" className="hover:text-white">Pricing status</Link>
            <Link href="/faq" className="hover:text-white">FAQ</Link>
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/trust" className="hover:text-white">Trust</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <a href="mailto:akshay@rakshex.in" className="hover:text-white">Contact</a>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-xs text-neutral-500 flex flex-col sm:flex-row justify-between gap-3">
          <span>© 2026 RaksHex · Bengaluru, India · Pre-incorporation</span>
          <span>Seeking five genuine design partners</span>
        </div>
      </div>
    </footer>
  );
}
