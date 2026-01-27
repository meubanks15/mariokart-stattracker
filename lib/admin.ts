import { NextRequest, NextResponse } from "next/server";

export function verifyAdminCode(request: NextRequest): boolean {
  const code = request.headers.get("x-admin-code");
  const adminCode = process.env.ADMIN_CODE;

  if (!adminCode || !code) return false;
  return code === adminCode;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
