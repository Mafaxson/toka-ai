import { createFileRoute, Link } from "@tanstack/react-router";
import { Mic, NotebookPen, TrendingUp, BarChart3, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/toka-logo.png";
import heroImage from "@/assets/hero-trader.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TOKA AI — Talk to your business. Understand your money." },
      {
        name: "description",
        content:
          "TOKA AI helps you talk to your business and understand your money. Record sales, track expenses and know your profit just by talking.",
      },
      { property: "og:title", content: "TOKA AI — Talk to your business. Understand your money." },
      {
        property: "og:description",
        content:
          "Record sales, track expenses and know your profit just by talking. No spreadsheets, no jargon.",
      },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    icon: Mic,
    title: "Just talk",
    description:
      'Say "I sold rice today for 1000" — by voice or text. TOKA AI understands and records it instantly.',
  },
  {
    icon: NotebookPen,
    title: "Automatic bookkeeping",
    description:
      "Every sale and expense is categorized and saved for you. No spreadsheets, no accounting knowledge needed.",
  },
  {
    icon: TrendingUp,
    title: "Know your real profit",
    description:
      "Ask “How much profit did I make this month?” and get a clear answer in simple language.",
  },
  {
    icon: BarChart3,
    title: "Simple reports",
    description:
      "Daily, weekly and monthly summaries show where your money comes from and where it goes.",
  },
];

const steps = [
  {
    title: "Tell TOKA what happened",
    description: "Speak or type naturally, in everyday words — a sale, a purchase, anything.",
  },
  {
    title: "TOKA records it for you",
    description: "Amount, category and date are captured automatically into your books.",
  },
  {
    title: "Understand your money",
    description: "See your revenue, expenses and profit grow on a clean, simple dashboard.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="TOKA AI logo" width={36} height={36} className="h-9 w-9" />
            <span className="font-display text-lg font-bold">TOKA AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <Mic className="h-3.5 w-3.5" /> Voice-first finance
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
            Talk to your business.
            <br />
            <span className="text-primary">Understand your money.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            TOKA AI records your sales and expenses, tracks your profit and answers your money
            questions — through simple conversation, in your language.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/auth">
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
          <ul className="mt-8 space-y-2 text-sm text-muted-foreground">
            {[
              "No spreadsheets or accounting jargon",
              "Works by voice or text",
              "Built for market traders, shops & small businesses",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-income" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <img
            src={heroImage}
            alt="Market trader recording a sale with TOKA AI on her phone"
            width={1248}
            height={832}
            className="w-full rounded-3xl object-cover shadow-glow"
          />
          <div className="absolute -bottom-6 left-4 right-4 rounded-2xl border border-border bg-card p-4 shadow-soft sm:left-8 sm:right-auto sm:w-80">
            <p className="rounded-xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
              “I sold rice today for 1000”
            </p>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
              <div>
                <p className="text-xs font-medium text-secondary-foreground">Sales · Today</p>
                <p className="text-sm font-bold text-income">+ 1,000 recorded</p>
              </div>
              <Check className="h-5 w-5 text-income" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/40 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">Your books, handled by conversation</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Everything a small business needs to understand its money — without the complexity.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="gradient-card rounded-2xl border border-border p-6 shadow-soft"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="gradient-hero mx-auto max-w-6xl rounded-3xl px-6 py-14 text-center shadow-glow md:py-20">
          <h2 className="text-3xl font-bold text-primary-foreground md:text-4xl">
            Start understanding your money today
          </h2>
          <p className="mx-auto mt-4 max-w-md text-primary-foreground/85">
            Free to start. Your first conversation takes less than a minute.
          </p>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link to="/auth">
              Create your free account <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" width={28} height={28} className="h-7 w-7" loading="lazy" />
            <span className="font-display font-semibold">TOKA AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Talk to your business. Understand your money.
          </p>
        </div>
      </footer>
    </div>
  );
}
