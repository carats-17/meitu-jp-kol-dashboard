const FEATURE_GROUPS: Record<string, string[]> = {
  苹果相机: [
    "iPhone模式相机",
    "iPhone模式",
    "iphone模式",
    "苹果相机",
    "苹果模式",
    "蘋果模式",
    "蘋果相机",
  ],
  补光灯: ["iPhone模式-补光灯", "补光灯"],
  "苹果相机-双摄": [
    "iPhone模式-双摄",
    "苹果双摄",
    "BeReal+数值文",
    "iPhone模式-BeReal",
    "双摄",
  ],
  "iPhone模式-不同机型": ["iPhone模式-新机型", "iPhone模式-不同机型"],
  经典相机: ["主相机", "经典相机"],
  CCD相机: ["ccd cam", "ccd", "CCD相机", "CCD cam", "CCD"],
  平成相机: ["平成贴纸", "平成相机"],
};

const FEATURE_ALIAS_TO_CANONICAL = new Map<string, string>(
  Object.entries(FEATURE_GROUPS).flatMap(([canonical, aliases]) =>
    aliases.map((alias) => [alias.toLowerCase(), canonical]),
  ),
);

export function normalizeFeatureName(feature: string): string {
  const trimmed = feature.trim();
  if (!trimmed || trimmed === "-") return trimmed;
  return FEATURE_ALIAS_TO_CANONICAL.get(trimmed.toLowerCase()) ?? trimmed;
}

export function featureAliasesFor(feature: string): string[] {
  const canonical = normalizeFeatureName(feature);
  const aliases = FEATURE_GROUPS[canonical];
  if (aliases) return [...new Set([canonical, ...aliases])];
  return [canonical];
}

export function allCanonicalFeatures(rawFeatures: string[]): string[] {
  return [...new Set(rawFeatures.map(normalizeFeatureName).filter((f) => f && f !== "-"))].sort();
}
