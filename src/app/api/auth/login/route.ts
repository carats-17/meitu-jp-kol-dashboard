import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  createSessionToken,
  isAuthConfigured,
  sessionCookieOptions,
  verifyCredentials,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    if (!isAuthConfigured()) {
      return NextResponse.json(
        { error: "未配置登录账号，请在服务器 .env 设置 AUTH_USERNAME / AUTH_PASSWORD" },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { username?: string; password?: string };
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";

    if (!username || !password) {
      return NextResponse.json({ error: "请输入用户名和密码" }, { status: 400 });
    }

    if (!verifyCredentials(username, password)) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    const token = await createSessionToken(username);
    const res = NextResponse.json({ ok: true, username });
    res.cookies.set(AUTH_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
