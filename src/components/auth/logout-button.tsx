"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton({ onSubmit }: { onSubmit?: () => void }) {
  return (
    <form action={logout} onSubmit={onSubmit}>
      <Button type="submit" variant="outline" className="mt-3 w-full gap-2">
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </form>
  );
}
