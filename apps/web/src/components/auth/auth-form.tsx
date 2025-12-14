import { useState } from "react";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "signup";

export function AuthForm() {
  const { signIn, signUp, error } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setLocalError("Enter email and password");
      return;
    }
    setLocalError(null);
    setPending(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err) {
      if (err instanceof Error) {
        setLocalError(err.message);
      } else {
        setLocalError("Authentication failed");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm rounded-3xl border border-[#FFD9C0] bg-white/85 p-8 shadow-xl backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-[#3D2C29]">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-[#8B7355]">
            Sign {mode === "signin" ? "in" : "up"} to sync your vocabulary
            progress.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-[#3D2C29]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
            required
            className="rounded-xl border-[#FFD9C0] bg-white/80 text-[#3D2C29] placeholder:text-[#8B7355]/50 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-[#3D2C29]">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={pending}
            required
            minLength={6}
            className="rounded-xl border-[#FFD9C0] bg-white/80 text-[#3D2C29] placeholder:text-[#8B7355]/50 focus:border-[#FF6B6B] focus:ring-[#FF6B6B]"
          />
        </div>

        {(localError || error) && (
          <p className="rounded-lg bg-rose-50 p-2 text-center text-sm text-rose-600">
            {localError ?? error}
          </p>
        )}

        <Button
          className="w-full rounded-xl bg-[#FF6B6B] py-5 text-white shadow-lg hover:bg-[#FF6B6B]/90"
          type="submit"
          disabled={pending}
        >
          {pending ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-[#8B7355]">
        {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
        <button
          type="button"
          className="font-medium text-[#FF6B6B] underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          disabled={pending}
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
