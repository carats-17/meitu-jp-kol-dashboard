import type { Platform } from "@prisma/client";
import { displayPlatform, formatViews } from "@/lib/platform-display";
import {
  formatCurrency,
  formatDate,
  formatMetric,
  formatNumber,
} from "@/lib/utils";

type PostCardData = {
  id: string;
  publishedAt: Date | string;
  platform: Platform | string;
  feature: string;
  contentTheme: string;
  postUrl: string;
  price: number;
  organicViews: number;
  likes?: number;
  comments?: number;
  saves?: number;
  shares?: number;
  totalEngagement: number;
  er: number;
  viewsHidden?: boolean;
  cpmJpy?: number | null;
  cpeJpy?: number | null;
  sourceSheet?: string | null;
  handle?: string;
};

export function PostCard({ post }: { post: PostCardData }) {
  const platformLabel = displayPlatform(post.platform, post.contentTheme, true);
  const views = formatViews(
    post.organicViews,
    post.platform,
    post.totalEngagement,
    post.viewsHidden,
  );

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-900">{post.feature}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {formatDate(post.publishedAt)} · {platformLabel} · {post.contentTheme}
            {post.handle ? ` · @${post.handle}` : ""}
          </p>
        </div>
        <p className="text-sm font-semibold text-zinc-900">
          {formatCurrency(post.price, "JPY")}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Metric label="曝光" value={views.text} highlight={views.hidden} />
        <Metric label="总互动" value={formatNumber(post.totalEngagement)} />
        <Metric label="ER" value={`${post.er.toFixed(2)}%`} />
        <Metric label="点赞" value={formatNumber(post.likes ?? 0)} />
        <Metric label="留言" value={formatNumber(post.comments ?? 0)} />
        <Metric label="保存" value={formatNumber(post.saves ?? 0)} />
        <Metric label="转发" value={formatNumber(post.shares ?? 0)} />
        <Metric label="CPM(JPY)" value={formatMetric(post.cpmJpy)} />
        <Metric label="CPE(JPY)" value={formatMetric(post.cpeJpy)} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="truncate text-xs text-zinc-400">
          {post.sourceSheet ?? "来源 Sheet 未记录"}
        </span>
        <a
          href={post.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-medium text-mint-600 hover:underline"
        >
          打开贴文 →
        </a>
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-zinc-50 p-2">
      <p className="text-zinc-500">{label}</p>
      <p className={`mt-0.5 font-medium ${highlight ? "text-amber-600" : "text-zinc-900"}`}>
        {value}
      </p>
    </div>
  );
}
