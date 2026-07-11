import type { Platform } from "@prisma/client";
import { prisma } from "./prisma";
import {
  SCRAPE_PLATFORM_PRIORITY,
  scrapeFollowers,
  sleep,
} from "./follower-scraper";

export type FollowerBackfillResult = {
  namesProcessed: number;
  scraped: number;
  propagated: number;
  failed: number;
  errors: string[];
};

function platformRank(platform: Platform): number {
  const idx = SCRAPE_PLATFORM_PRIORITY.indexOf(platform);
  return idx === -1 ? 99 : idx;
}

/**
 * Backfill missing follower counts via public profile scraping.
 * Same 达人名称 across multiple platforms shares one scraped value (any platform).
 */
export async function backfillFollowers(options?: {
  delayMs?: number;
  maxErrors?: number;
}): Promise<FollowerBackfillResult> {
  const delayMs = options?.delayMs ?? 650;
  const maxErrors = options?.maxErrors ?? 30;

  const allKols = await prisma.kol.findMany({
    select: { id: true, name: true, handle: true, platform: true, followers: true },
  });

  const followersByName = new Map<string, number>();
  for (const kol of allKols) {
    if (kol.followers && kol.followers > 0) {
      const key = kol.name.trim();
      followersByName.set(key, Math.max(followersByName.get(key) ?? 0, kol.followers));
    }
  }

  const missingByName = new Map<
    string,
    { id: string; name: string; handle: string; platform: Platform }[]
  >();
  for (const kol of allKols) {
    if (kol.followers && kol.followers > 0) continue;
    const key = kol.name.trim();
    if (!missingByName.has(key)) missingByName.set(key, []);
    missingByName.get(key)!.push(kol);
  }

  let scraped = 0;
  let propagated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const [name, members] of missingByName) {
    const known = followersByName.get(name);
    if (known && known > 0) {
      await prisma.kol.updateMany({
        where: { name, OR: [{ followers: null }, { followers: 0 }] },
        data: { followers: known },
      });
      propagated += members.length;
      continue;
    }

    const target = [...members].sort(
      (a, b) => platformRank(a.platform) - platformRank(b.platform),
    )[0];

    await sleep(delayMs);
    const count = await scrapeFollowers(target.platform, target.handle);

    if (count && count > 0) {
      await prisma.kol.updateMany({
        where: { name },
        data: { followers: count },
      });
      followersByName.set(name, count);
      scraped++;
    } else {
      failed++;
      if (errors.length < maxErrors) {
        errors.push(`${name}（@${target.handle} · ${target.platform}）抓取失败`);
      }
    }
  }

  return {
    namesProcessed: missingByName.size,
    scraped,
    propagated,
    failed,
    errors,
  };
}
