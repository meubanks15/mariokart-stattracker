import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { code } = await request.json();
  const adminCode = process.env.ADMIN_CODE;

  if (!adminCode) {
    return NextResponse.json(
      { error: "Admin code not configured" },
      { status: 500 }
    );
  }

  if (code === adminCode) {
    return NextResponse.json({ valid: true });
  }

  return NextResponse.json({ valid: false }, { status: 401 });
}
