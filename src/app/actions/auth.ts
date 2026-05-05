"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session";
import { queryRows } from "@/lib/db/mysql";
import { getMysqlPool } from "@/lib/db/mysql";

const loginSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(1, "Password is required."),
});

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required.").trim(),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export type LoginState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
};

export type RegisterState = {
  errors?: {
    fullName?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string;
};

function getConfiguredUser() {
  return {
    id: process.env.AUTH_USER_ID || "local-user",
    name: process.env.AUTH_NAME || "VaultX User",
    email: (process.env.AUTH_EMAIL || "admin@vaultx.local").toLowerCase(),
    password: process.env.AUTH_PASSWORD || "vaultx123",
  };
}

type UserRow = {
  user_id: string;
  email: string;
  password_hash: string;
  full_name: string;
};

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: "Please check the highlighted fields.",
    };
  }

  let user: UserRow | undefined;

  try {
    const rows = await queryRows<(UserRow & import("mysql2").RowDataPacket)[]>(
      "SELECT user_id, email, password_hash, full_name FROM users WHERE email = ? LIMIT 1",
      [validated.data.email],
    );

    user = rows[0];
  } catch {
    const configuredUser = getConfiguredUser();

    if (
      validated.data.email === configuredUser.email &&
      validated.data.password === configuredUser.password
    ) {
      user = {
        user_id: configuredUser.id,
        email: configuredUser.email,
        password_hash: hashPassword(configuredUser.password),
        full_name: configuredUser.name,
      };
    }
  }

  const credentialsMatch =
    user?.password_hash === hashPassword(validated.data.password) ||
    user?.password_hash === validated.data.password;

  if (!user || !credentialsMatch) {
    return {
      message: "Invalid email or password.",
    };
  }

  const token = await createSessionToken({
    sub: user.user_id,
    email: user.email,
    name: user.full_name,
  });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/overview");
}

export async function logout() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

export async function register(
  _state: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const validated = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: "Please check the highlighted fields.",
    };
  }

  const userId = randomUUID();

  try {
    await getMysqlPool().query(
      `INSERT INTO users (user_id, email, password_hash, full_name, preferences)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        validated.data.email,
        hashPassword(validated.data.password),
        validated.data.fullName,
        JSON.stringify({
          currency: "PHP",
          dateFormat: "MMM d, yyyy",
          exportFormat: "csv",
          darkMode: false,
          liabilities: 0,
        }),
      ],
    );
  } catch {
    return {
      message: "That email is already registered or the database is unavailable.",
    };
  }

  const token = await createSessionToken({
    sub: userId,
    email: validated.data.email,
    name: validated.data.fullName,
  });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/overview");
}
