import type { Platform } from "@prisma/client";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function cleanHandle(handle: string): string {
  return handle.trim().replace(/^@+/, "");
}

async function scrapeTikTokFollowers(handle: string): Promise<number | null> {
  const user = cleanHandle(handle);
  if (!user) return null;
  const res = await fetchWithTimeout(`https://www.tiktok.com/@${encodeURIComponent(user)}`, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9" },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const match = html.match(/"followerCount":(\d+)/);
  return match ? Number(match[1]) : null;
}

async function scrapeInstagramFollowers(handle: string): Promise<number | null> {
  const user = cleanHandle(handle);
  if (!user) return null;
  const res = await fetchWithTimeout(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(user)}`,
    {
      headers: {
        "User-Agent": USER_AGENT,
        "X-IG-App-ID": "936619743392459",
        "X-Requested-With": "XMLHttpRequest",
        Referer: `https://www.instagram.com/${encodeURIComponent(user)}/`,
        Accept: "*/*",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
      },
    },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    data?: { user?: { edge_followed_by?: { count?: number } } };
  };
  const count = data.data?.user?.edge_followed_by?.count;
  return typeof count === "number" && count > 0 ? count : null;
}

async function scrapeXFollowers(handle: string): Promise<number | null> {
  const user = cleanHandle(handle);
  if (!user) return null;
  const res = await fetchWithTimeout(`https://api.fxtwitter.com/${encodeURIComponent(user)}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { user?: { followers?: number } };
  const count = data.user?.followers;
  return typeof count === "number" && count > 0 ? count : null;
}

/** Public profile follower scrape. Returns null when blocked or not found. */
export async function scrapeFollowers(
  platform: Platform,
  handle: string,
): Promise<number | null> {
  const user = cleanHandle(handle);
  if (!user) return null;

  try {
    switch (platform) {
      case "TIKTOK":
        return await scrapeTikTokFollowers(user);
      case "INSTAGRAM":
        return await scrapeInstagramFollowers(user);
      case "X":
        return await scrapeXFollowers(user);
      case "THREADS":
        // Threads 账号通常与 IG 同名，优先走 IG 接口
        return (await scrapeInstagramFollowers(user)) ?? null;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export const SCRAPE_PLATFORM_PRIORITY: Platform[] = [
  "TIKTOK",
  "INSTAGRAM",
  "X",
  "THREADS",
];

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
