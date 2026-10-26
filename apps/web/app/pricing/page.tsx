import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-transparent text-white pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[#14B8A6] font-mono text-xs uppercase tracking-widest mb-4">Pricing and availability</p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-6">We're validating what teams will pay for.</h1>
        <p className="text-neutral-400 text-lg leading-relaxed max-w-2xl mb-10">There is no public commercial pricing or production subscription for Budget Lock or Self-Repair today. We are pre-revenue and looking for genuine design partners.</p>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <article className="rounded-xl border border-[#14B8A6]/25 bg-[#0B0F17]/70 p-7">
            <p className="text-[#14B8A6] font-mono text-xs mb-4">Budget Lock</p>
            <h2 className="text-2xl font-bold mb-3">Spend visibility and advisory controls</h2>
            <p className="text-neutral-400 leading-relaxed text-sm">We are testing the need, pricing and willingness to pay. Universal hard caps are not available as a proven product.</p>
          </article>
          <article className="rounded-xl border border-[#14B8A6]/25 bg-[#0B0F17]/70 p-7">
            <p className="text-[#14B8A6] font-mono text-xs mb-4">Self-Repair</p>
            <h2 className="text-2xl font-bold mb-3">Human-reviewed API fixes</h2>
            <p className="text-neutral-400 leading-relaxed text-sm">We are validating technical reliability beyond a controlled Stripe example before making commercial claims.</p>
          </article>
        </div>
        <div className="border border-[#14B8A6]/30 bg-[#14B8A6]/5 rounded-xl p-7">
          <h2 className="text-xl font-semibold mb-3">Interested in evaluating RaksHex?</h2>
          <p className="text-neutral-400 mb-6">Describe the cost incident or broken integration you want to solve. No checkout or payment is required to request a conversation.</p>
          <Link href="/waitlist" className="inline-flex items-center gap-2 rounded-lg bg-[#14B8A6] text-[#07100f] px-5 py-3 font-semibold hover:bg-[#2dd4bf] transition-colors">Discuss a pilot <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    </main>
  );
}
