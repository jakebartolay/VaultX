import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthCover } from "@/components/auth/auth-cover";
import { RegisterForm } from "@/components/auth/register-form";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (session) {
    redirect("/overview");
  }

  return (
    <AuthCover
      title="Create your VaultX account"
      description="Your profile and finance records are stored in MySQL and scoped to your user account."
    >
      <RegisterForm />
    </AuthCover>
  );
}
