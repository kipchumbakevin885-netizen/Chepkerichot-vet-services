import Link from "next/link";

const SERVICES = [
  "Livestock Health Management",
  "Breeding & Heat Tracking",
  "Feeding Guidance",
  "Vaccination Reminders",
  "Deworming & Treatment Records",
  "Veterinary Support",
  "Livestock Records",
  "Farmer Notifications",
];

const STEPS = [
  "Create your farmer account",
  "Add your animals",
  "Record health and breeding information",
  "Receive reminders",
  "Monitor your livestock",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-cream">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Chepkerichot" className="h-9 w-9 object-contain" />
          <span className="font-semibold text-green-900">Vet Sambai Services</span>
        </div>
        <div className="hidden md:flex gap-6 text-sm text-green-800">
          <a href="#services">Services</a>
          <a href="#how-it-works">How It Works</a>
          <Link href="/login">Login</Link>
          <Link href="/register" className="font-medium">
            Register
          </Link>
        </div>
      </nav>

      <section className="relative max-w-4xl mx-auto text-center px-6 py-16 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] max-w-none opacity-[0.06]"
        />
        <div className="relative">
          <h1 className="text-3xl md:text-5xl font-semibold text-green-900 leading-tight">
            Smart Livestock Care. Healthier Animals. Better Farming.
          </h1>
          <p className="mt-4 text-green-800/80 max-w-2xl mx-auto">
            Vet Sambai Services helps farmers manage livestock health, feeding, breeding, records,
            and veterinary reminders from one simple platform.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
          <Link href="/register" className="bg-green-700 text-white px-6 py-3 rounded-xl font-medium">
            Get Started
          </Link>
          <Link href="/login" className="border border-green-700 text-green-800 px-6 py-3 rounded-xl font-medium">
            Farmer Login
          </Link>
          </div>
        </div>
      </section>

      <section id="services" className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-xl font-semibold text-green-900 mb-6">Our Services</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SERVICES.map((s) => (
            <div key={s} className="bg-white border border-green-100 rounded-xl p-4 text-sm text-green-900">
              {s}
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="text-xl font-semibold text-green-900 mb-6">How It Works</h2>
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-3 text-green-900">
              <span className="font-semibold text-green-700">{i + 1}.</span> {s}
            </li>
          ))}
        </ol>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-12 text-center">
        <h2 className="text-xl font-semibold text-green-900">Start Managing Your Livestock Today</h2>
        <Link
          href="/register"
          className="inline-block mt-4 bg-green-700 text-white px-6 py-3 rounded-xl font-medium"
        >
          Get Started
        </Link>
      </section>
    </main>
  );
}
