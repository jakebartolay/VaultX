"use client";

import { useActionState } from "react";
import Link from "next/link";
import { LockKeyhole, Mail } from "lucide-react";
import { login, type LoginState } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginState = {};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;

  return <p className="text-xs text-red-600">{messages[0]}</p>;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action} className="space-y-4">
      {state.message ? (
        <Alert variant={state.message.startsWith("Invalid") ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="h-10 pl-9"
            placeholder="admin@vaultx.local"
            required
          />
        </div>
        <FieldError messages={state.errors?.email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="h-10 pl-9"
            placeholder="vaultx123"
            required
          />
        </div>
        <FieldError messages={state.errors?.password} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Checkbox />
          Remember me
        </label>
        <span className="text-sm font-medium text-violet-600">Forgot password?</span>
      </div>

      <Button type="submit" className="h-10 w-full bg-violet-600 hover:bg-violet-700" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Need an account?{" "}
        <Link href="/register" className="font-medium text-violet-600 underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
