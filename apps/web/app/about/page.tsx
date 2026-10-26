import Link from "next/link";

export const metadata = {
  title: "About RaksHex — An Early-Stage Developer Tools Startup",
  description: "RaksHex is a bootstrapped, student-led team building AI/API cost visibility and tested, human-reviewed API repair.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-transparent text-white pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="py-12">
          <p className="text-[#14B8A6] font-mono text-xs tracking-widest uppercase mb-4">About RaksHex</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Built from real API frustrations.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">Unpredictable AI/API usage costs and breaking integrations can disrupt small teams. We are building focused workflows to make those problems easier to understand and address.</p>
        </header>
        <section className="border-y border-neutral-800 py-12">
          <h2 className="text-2xl font-semibold mb-5">Our focus</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="border border-[#14B8A6]/20 bg-[#0B0F17]/60 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3 text-[#14B8A6]">Budget Lock</h3>
              <p className="text-sm leading-relaxed text-neutral-400">Advisory AI/API usage, spending forecasts and budget alerts. Our first revenue hypothesis; provider-level hard caps are unproven.</p>
            </div>
            <div className="border border-[#14B8A6]/20 bg-[#0B0F17]/60 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3 text-[#14B8A6]">Self-Repair</h3>
              <p className="text-sm leading-relaxed text-neutral-400">Detection, affected-code analysis and tested repair suggestions for developer review. The current proof is a controlled Stripe example.</p>
            </div>
          </div>
        </section>
        <section className="py-14">
          <h2 className="text-2xl font-semibold mb-4">Team and stage</h2>
          <p className="text-neutral-400 leading-relaxed">RaksHex is a founder-led, student-built effort involving six contributors. Founder Akshay Kammar is a final-year BCA student based in Bengaluru. Anushree contributes as co-founder. The startup is bootstrapped, pre-incorporation, pre-revenue and without customers today.</p>
          <p className="text-neutral-400 leading-relaxed mt-5">We began working on RaksHex in February 2025. Our next goal is five genuine design partners to validate technical outcomes and willingness to pay, not a larger catalogue of features.</p>
        </section>
        <section className="rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/5 p-8">
          <h2 className="text-2xl font-semibold mb-3">Help us validate the problem.</h2>
          <p className="text-neutral-400 mb-6">Tell us about an unexpected AI/API bill or an API change that broke your code. We will discuss what a responsible, scoped pilot might look like.</p>
          <Link href="/waitlist" className="inline-block bg-[#14B8A6] text-[#07100f] rounded-lg px-5 py-3 font-semibold hover:bg-[#2dd4bf] transition-colors">Become a design partner →</Link>
        </section>
      </div>
    </main>
  );
}
