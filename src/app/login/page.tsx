import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthCover } from "@/components/auth/auth-cover";
import { LoginForm } from "@/components/auth/login-form";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (session) {
    redirect("/overview");
  }

  return (
    <AuthCover
      title="Welcome to VaultX!"
      description="Please sign in to your account and manage your finance workspace."
    >
      <LoginForm />
    </AuthCover>
  );
}
