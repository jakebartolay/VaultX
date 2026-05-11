import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/current-user";
import {
  getFinanceSnapshot,
  saveFinanceSnapshot,
  type FinanceSnapshot,
} from "@/lib/db/finance-repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const snapshot = await getFinanceSnapshot(user.sub, user.email);

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("[api/finance] Unable to load finance data.", error);

    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 500;

    return NextResponse.json({ error: "Unable to load finance data." }, { status });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireCurrentUser();
    const snapshot = (await request.json()) as FinanceSnapshot;

    await saveFinanceSnapshot(user.sub, snapshot, user.email);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/finance] Unable to save finance data.", error);

    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 500;

    return NextResponse.json({ error: "Unable to save finance data." }, { status });
  }
}
