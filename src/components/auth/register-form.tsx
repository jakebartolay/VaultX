"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LockKeyhole, Mail, User } from "lucide-react";
import { register, type RegisterState } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: RegisterState = {};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;

  return <p className="text-xs text-red-600">{messages[0]}</p>;
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, initialState);

  return (
    <form action={action} className="space-y-4">
      {state.message ? (
        <Alert variant={state.message.startsWith("That email") ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="fullName" name="fullName" autoComplete="name" className="h-10 pl-9" required />
        </div>
        <FieldError messages={state.errors?.fullName} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" name="email" type="email" autoComplete="email" className="h-10 pl-9" required />
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
            autoComplete="new-password"
            className="h-10 pl-9"
            required
          />
        </div>
        <FieldError messages={state.errors?.password} />
      </div>

      <Button type="submit" className="h-10 w-full bg-violet-600 hover:bg-violet-700" disabled={pending}>
        {pending ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-violet-600 underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
