"use client";

import Link from "next/link";
import { TerminalDemo } from "./TerminalDemo";

export function HeroSection() {
  return (
    <section className="hero-section relative w-full bg-transparent overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(20,184,166,0.08),transparent_70%)] pointer-events-none z-0" />
      <div className="hero-grid relative z-10">
        <div className="hero-left text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-4 py-1.5 backdrop-blur-sm w-fit mb-6">
            <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
            <p className="text-xs sm:text-sm font-semibold text-[#14B8A6] font-sans">Building with design partners · Early validation</p>
          </div>
          <h1 className="hero-headline font-sans font-bold tracking-[-0.02em] text-left flex flex-col text-[40px] sm:text-[48px] md:text-[56px] leading-[1.1] mb-6">
            <span className="text-white">Control AI/API costs.</span>
            <span className="text-[#14B8A6]">Handle breaking</span>
            <span className="text-[#14B8A6]">API changes.</span>
          </h1>
          <p className="hero-subtext font-sans text-lg max-w-[500px] text-[#9CA3AF] mb-8 leading-[1.6] font-medium">
            RaksHex is developing Budget Lock for spend visibility and advisory controls, and Self-Repair
            for detecting API changes and validating suggested fixes before human approval.
            We are looking for five teams to help validate what is worth paying for.
          </p>
          <div className="hero-buttons flex flex-wrap items-center gap-4 w-full mb-8">
            <Link href="/waitlist" className="px-6 py-3 bg-[#14B8A6] text-[#07100f] font-sans font-semibold text-sm rounded-lg hover:bg-[#2dd4bf] hover:-translate-y-0.5 transition-all duration-200 text-center flex items-center justify-center">
              Become a design partner →
            </Link>
            <Link href="/features" className="px-6 py-3 bg-transparent border-2 border-[#14B8A6] text-white font-sans font-semibold text-sm rounded-lg hover:bg-[#14B8A6]/10 hover:-translate-y-0.5 transition-all duration-200 text-center flex items-center justify-center">
              Explore the two workflows
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-xs font-mono text-[#9CA3AF]" aria-label="Product status">
            <span><span className="text-[#14B8A6]">●</span> Budget Lock: commercial hypothesis</span>
            <span><span className="text-[#14B8A6]">●</span> Self-Repair: controlled Stripe example</span>
            <span><span className="text-[#14B8A6]">●</span> Neither production-proven</span>
          </div>
        </div>
        <div className="hero-right flex items-center justify-center">
          <TerminalDemo />
        </div>
      </div>
    </section>
  );
}
