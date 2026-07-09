export type ContributorProfile = {
  id: string;
  role: string;
  focus: string;
  reviewedCount: number;
  correctionCount: number;
  holdCount: number;
  relatedRecordIds: string[];
};

export const contributorScoreFormula =
  "整理與確認 x 4 + 人類修正 x 6 + 暫緩採用 x 3";

export const contributors: ContributorProfile[] = [
  {
    id: "整理者 A",
    role: "來源與脈絡整理",
    focus: "標出來源不明、轉述與時間不足的原始資訊。",
    reviewedCount: 5,
    correctionCount: 2,
    holdCount: 3,
    relatedRecordIds: ["M-001", "M-004", "M-005"],
  },
  {
    id: "確認者 B",
    role: "人工確認紀錄",
    focus: "記錄哪些資訊需要補問地點、現況或當事人意願。",
    reviewedCount: 4,
    correctionCount: 3,
    holdCount: 2,
    relatedRecordIds: ["M-006", "M-008", "M-011"],
  },
  {
    id: "修正者 C",
    role: "AI 判斷修正",
    focus: "把看似可行動的候選結果改回需要人工確認。",
    reviewedCount: 3,
    correctionCount: 4,
    holdCount: 2,
    relatedRecordIds: ["M-007", "M-010", "M-012"],
  },
];

export function scoreForContributor(contributor: ContributorProfile) {
  return (
    contributor.reviewedCount * 4 +
    contributor.correctionCount * 6 +
    contributor.holdCount * 3
  );
}

export function rankContributors(
  profiles: ContributorProfile[] = contributors,
) {
  return [...profiles].sort(
    (a, b) => scoreForContributor(b) - scoreForContributor(a),
  );
}
