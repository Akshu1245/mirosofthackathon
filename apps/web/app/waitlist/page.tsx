"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const joinWaitlist = trpc.waitlist.join.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    // Existing waitlist API uses a legacy Free/Pro/Enterprise enum.
    // Record interest as Free rather than pretending a paid plan exists.
    joinWaitlist.mutate({ email: email.trim(), plan: "Free", source: "design_partner_interest" });
  };

  return (
    <main className="min-h-screen bg-transparent text-white pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-[#14B8A6] text-xs tracking-widest uppercase font-semibold mb-4">Seeking five design partners</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-5">Help shape RaksHex.</h1>
        <p className="text-neutral-400 max-w-xl mx-auto leading-relaxed text-lg mb-10">Have an unexpected AI/API bill or a breaking API integration? Share your email and we'll contact you to discuss a possible scoped evaluation. This is not a product signup or paid subscription.</p>
        {!submitted ? (
          <form onSubmit={handleSubmit} className="bg-[#0B0F17]/70 rounded-2xl border border-[#14B8A6]/25 p-8 max-w-lg mx-auto">
            <label htmlFor="partner-email" className="block text-neutral-300 text-sm mb-3 text-left">Work email address</label>
            <input id="partner-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={320}
              placeholder="you@company.com" className="w-full bg-black/50 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#14B8A6] transition-colors" />
            <button type="submit" disabled={joinWaitlist.isPending} className="w-full mt-5 py-3 rounded-lg bg-[#14B8A6] text-[#07100f] font-semibold hover:bg-[#2dd4bf] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {joinWaitlist.isPending ? "Submitting…" : <>Request a conversation <ArrowRight className="w-4 h-4" /></>}
            </button>
            {joinWaitlist.isError && <p role="alert" className="text-red-400 mt-3 text-sm">{joinWaitlist.error.message}</p>}
            <p className="text-neutral-500 text-xs mt-5 text-left">We use your email to follow up about a potential design-partner conversation. We won't imply that a pilot or integration is ready until verified.</p>
          </form>
        ) : (
          <div role="status" className="bg-[#0B0F17] rounded-2xl border border-[#14B8A6]/30 p-8 max-w-lg mx-auto">
            <CheckCircle className="w-12 h-12 text-[#14B8A6] mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Interest received</h2>
            <p className="text-neutral-400 mb-5">Thanks. We have recorded <strong className="text-white">{email}</strong> for a potential design-partner conversation.</p>
            <Link href="/" className="text-[#14B8A6] hover:underline">Back to home →</Link>
          </div>
        )}
      </div>
    </main>
  );
}
