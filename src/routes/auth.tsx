import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/lib/currencies";
import logo from "@/assets/toka-logo.png";
import { getCurrentSession, sendPasswordReset, signIn, signUp } from "@/services/auth-service";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TOKA AI" },
      {
        name: "description",
        content: "Sign in or create your free TOKA AI account to start tracking your business.",
      },
      { property: "og:title", content: "Sign in — TOKA AI" },
      {
        property: "og:description",
        content: "Sign in or create your free TOKA AI account.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    getCurrentSession()
      .then((session) => {
        if (session) navigate({ to: "/dashboard", replace: true });
      })
      .catch(() => undefined);
  }, [navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await sendPasswordReset(email);
        if (error) throw error;
        toast.success("Check your email for a reset link.");
        setMode("signin");
      } else if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { data, error } = await signUp({
          email,
          password,
          fullName,
          businessName,
          preferredLanguage,
          currency,
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/dashboard", replace: true });
        } else {
          toast.success("Account created! Check your email to confirm, then sign in.");
          setMode("signin");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="gradient-hero hidden flex-col justify-between p-10 lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="TOKA AI logo" width={40} height={40} className="h-10 w-10" />
          <span className="font-display text-xl font-bold text-primary-foreground">TOKA AI</span>
        </Link>
        <div>
          <h2 className="max-w-md font-display text-4xl font-bold leading-tight text-primary-foreground">
            Talk to your business. Understand your money.
          </h2>
          <p className="mt-4 max-w-sm text-primary-foreground/80">
            Record sales, track expenses and know your profit — just by talking.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
          <Mic className="h-4 w-4" /> Voice-first financial intelligence
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <img src={logo} alt="TOKA AI logo" width={36} height={36} className="h-9 w-9" />
            <span className="font-display text-lg font-bold">TOKA AI</span>
          </Link>

          <h1 className="text-2xl font-bold">
            {mode === "signin" && "Welcome back"}
            {mode === "signup" && "Create your account"}
            {mode === "forgot" && "Reset your password"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "signin" && "Sign in to continue to your business."}
            {mode === "signup" && "Free to start — takes less than a minute."}
            {mode === "forgot" && "We'll email you a link to set a new password."}
          </p>

          {mode !== "forgot" && (
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">with email</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Your name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Aminata Kamara"
                    required
                    maxLength={100}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="businessName">Business name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Aminata's Provisions"
                    required
                    maxLength={100}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preferredLanguage">Preferred language</Label>
                  <Input
                    id="preferredLanguage"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    placeholder="English"
                    required
                    maxLength={50}
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                maxLength={255}
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  maxLength={100}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" && "Sign in"}
              {mode === "signup" && "Create account"}
              {mode === "forgot" && "Send reset link"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                New to TOKA AI?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="font-medium text-primary hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
