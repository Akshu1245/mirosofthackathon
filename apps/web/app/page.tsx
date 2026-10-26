"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { HeroSection } from "@/components/home/HeroSection";
import { FeatureCards } from "@/components/home/FeatureCards";
import { Footer } from "@/components/layout/Footer";

const faqs = [
  {
    question: "What is RaksHex?",
    answer: "RaksHex is developing two workflows: Budget Lock for AI/API spend visibility and advisory control, and Self-Repair for detecting breaking API changes and proposing tested fixes for human approval.",
  },
  {
    question: "Does Budget Lock stop all providers from charging above a limit?",
    answer: "No. Cross-provider hard spending limits have not been proven. Budget Lock is currently a hypothesis for paid validation, not a guaranteed provider-level cap.",
  },
  {
    question: "Can Self-Repair automatically fix production integrations?",
    answer: "No. We have a controlled Stripe example with repair validation, but the complete detection-to-reviewed-PR integration is still in progress. Human approval is a requirement.",
  },
  {
    question: "Who can join as a design partner?",
    answer: "We are looking for five genuine teams using AI models or external APIs that have experienced unpredictable usage costs or breaking integrations. We want evidence of the problem and honest feedback on willingness to pay.",
  },
];

export default function RootHomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-transparent text-white overflow-x-hidden font-sans selection:bg-[#14B8A6] selection:text-black pt-32 pb-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(20,184,166,0.15)_1px,transparent_0)] [background-size:24px_24px] pointer-events-none -z-10" />
      <HeroSection />

      <div className="w-full flex justify-center py-4 px-4 sticky top-16 z-40 pointer-events-none">
        <nav aria-label="Explore RaksHex" className="pointer-events-auto bg-[#0B0F17]/90 backdrop-blur-xl border border-[#14B8A6]/30 shadow-2xl rounded-full p-1.5 flex items-center gap-1 sm:gap-2 max-w-full overflow-x-auto">
          {[
            { name: "Budget Lock", href: "#budget-lock" },
            { name: "Self-Repair", href: "#self-repair" },
            { name: "Evidence", href: "#evidence" },
            { name: "FAQ", href: "#faq" },
          ].map((tab) => (
            <Link key={tab.href} href={tab.href} className="px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap text-slate-300 hover:text-white hover:bg-[#14B8A6]/15 transition-colors">{tab.name}</Link>
          ))}
        </nav>
      </div>

      <section className="relative w-full max-w-[1280px] mx-auto py-20 px-6 xl:px-8" id="features">
        <FeatureCards />
      </section>

      <section id="evidence" className="scroll-mt-32 w-full py-20 px-6 bg-[#090D14] border-y border-white/10">
        <div className="max-w-[1150px] mx-auto">
          <div className="max-w-3xl mb-10">
            <p className="text-[#14B8A6] text-xs uppercase font-semibold tracking-widest mb-3">Evidence before expansion</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What we know — and what we still need to prove.</h2>
            <p className="text-neutral-400 leading-relaxed">We are bootstrapped, pre-revenue and not yet incorporated. Neither workflow is production-proven. We will choose the primary paid offering from real pilot evidence.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { label: "Budget Lock", title: "Validate willingness to pay", detail: "Measure whether teams want advisory spend visibility and controls enough to purchase them." },
              { label: "Self-Repair", title: "Reproduce a controlled repair", detail: "Stripe fixture: two TypeScript errors before, zero after; six fixture tests passing. Not a production deployment." },
              { label: "Next milestone", title: "Five real design partners", detail: "Interview developers, review incidents, measure results and use evidence to decide which workflow leads." },
            ].map((item) => (
              <div key={item.label} className="bg-[#0B0F17] border border-[#14B8A6]/20 rounded-xl p-6 hover:border-[#14B8A6]/45 transition-colors">
                <p className="text-[#14B8A6] text-xs uppercase tracking-widest font-mono mb-3">{item.label}</p>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-32 w-full max-w-[1280px] mx-auto py-20 px-6 xl:px-8">
        <div className="flex flex-col lg:flex-row gap-12 max-w-5xl mx-auto items-start">
          <div className="lg:w-1/3">
            <h2 className="text-3xl font-bold text-white mb-4">Frequently asked questions</h2>
            <p className="text-[#9CA3AF] text-sm leading-relaxed">An accurate picture of where RaksHex stands today.</p>
            <Link href="/faq" className="inline-flex items-center gap-1.5 text-[#14B8A6] hover:underline text-sm font-semibold mt-5">Read all FAQs <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="w-full lg:w-2/3 rounded-lg border border-[#14B8A6]/20 divide-y divide-white/10">
            {faqs.map((faq, index) => (
              <div key={faq.question}>
                <h3><button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index} className="flex w-full items-center justify-between gap-3 p-6 text-left text-sm sm:text-base font-semibold hover:text-[#14B8A6] transition-colors">
                  {faq.question}<ChevronRight className={`w-5 h-5 shrink-0 transition-transform duration-200 ${openFaq === index ? "rotate-90 text-[#14B8A6]" : "text-[#9CA3AF]"}`} />
                </button></h3>
                {openFaq === index && <p className="px-6 pb-6 text-sm text-[#9CA3AF] leading-relaxed">{faq.answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative w-full max-w-[1150px] mx-auto px-6 pb-20">
        <div className="rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/5 p-8 md:p-12 text-center">
          <p className="text-[#14B8A6] text-xs uppercase tracking-widest font-semibold mb-3">Design partner program</p>
          <h2 className="text-3xl font-bold mb-4">Have unpredictable API bills or a broken integration?</h2>
          <p className="text-neutral-400 max-w-2xl mx-auto mb-7">Help us test the problem before we expand the product. No paid product or guaranteed pilot access is implied.</p>
          <Link href="/waitlist" className="inline-flex items-center gap-2 rounded-lg bg-[#14B8A6] text-[#07100f] px-6 py-3 font-semibold hover:bg-[#2dd4bf] transition-colors">Talk about a pilot <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
