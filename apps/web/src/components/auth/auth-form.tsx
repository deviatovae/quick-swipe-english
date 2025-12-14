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
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-border/40 bg-card/80 p-6 shadow-xl backdrop-blur">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign {mode === "signin" ? "in" : "up"} to sync your vocabulary progress.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={pending}
            required
            minLength={6}
          />
        </div>

        {(localError || error) && (
          <p className="text-sm text-destructive">{localError ?? error}</p>
        )}

        <Button className="w-full" type="submit" disabled={pending}>
          {pending ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
        <button
          type="button"
          className="font-medium text-primary underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          disabled={pending}
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

