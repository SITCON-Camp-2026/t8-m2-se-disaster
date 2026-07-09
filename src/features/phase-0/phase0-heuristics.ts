import type {
  Phase0CandidateClassification,
  Phase0JudgementDraft,
  Phase0MessyRecord,
  Phase0PossibleKind,
} from "./phase0-types";

const kindRules: Array<{
  kind: Phase0PossibleKind;
  label: string;
  keywords: string[];
}> = [
  {
    kind: "announcement_candidate",
    label: "原文提到公告、封閉或通行限制",
    keywords: ["公告", "封閉", "道路"],
  },
  {
    kind: "help_request_candidate",
    label: "原文看起來包含求助或需求",
    keywords: ["需要", "協助", "清泥", "清淤", "搬動", "藥品", "水電"],
  },
  {
    kind: "site_status_candidate",
    label: "原文描述地點、物資或現場狀態",
    keywords: [
      "還有",
      "不缺",
      "不再收",
      "開放",
      "集合點",
      "活動中心",
      "服務台",
      "入口",
      "A 區",
    ],
  },
  {
    kind: "assignment_candidate",
    label: "原文提到可支援者、工班或報到資格",
    keywords: ["工班", "支援", "報到", "志工"],
  },
  {
    kind: "task_candidate",
    label: "原文提到派人或任務狀態",
    keywords: ["派人", "任務"],
  },
];

const uncertaintyKeywords = [
  "不知道",
  "不確定",
  "疑似",
  "可能",
  "尚未",
  "無法確認",
  "沒有說",
  "未看到",
  "昨天",
  "剛剛",
  "截圖",
  "留言",
  "轉述",
  "代一位",
];

const thirdPartyKeywords = [
  "有人說",
  "有人在群組",
  "社群貼文",
  "留言",
  "家屬",
  "轉述",
  "代一位",
  "截圖",
];

const ambiguousLocationKeywords = [
  "附近",
  "那邊",
  "後面",
  "往溪邊方向",
  "A 區",
  "老街口",
  "第二排住家",
  "某工班",
];

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function unique(items: string[]) {
  return Array.from(new Set(items));
}

function inferKind(record: Phase0MessyRecord) {
  const matchedRules = kindRules.filter((rule) =>
    includesAny(record.rawText, rule.keywords),
  );

  return {
    kind: matchedRules[0]?.kind ?? "unknown",
    basis:
      matchedRules.length > 0
        ? matchedRules.map((rule) => rule.label)
        : ["原文線索不足，先維持候選類型待判斷。"],
  };
}

function createWarningLabels(record: Phase0MessyRecord) {
  const warnings: string[] = [];

  if (record.verificationStatus !== "verified") {
    warnings.push("查核狀態不是已確認");
  }

  if (
    record.sourceType === "social_post" ||
    record.sourceType === "phone_call"
  ) {
    warnings.push("來源需要回查");
  }

  if (includesAny(record.rawText, uncertaintyKeywords)) {
    warnings.push("原文含不確定或過期線索");
  }

  if (includesAny(record.rawText, thirdPartyKeywords)) {
    warnings.push("操作者或資訊來源可能不是當事人");
  }

  if (record.rawText.includes("直接")) {
    warnings.push("原文出現直接行動語氣，需要先擋下來確認");
  }

  return unique(warnings);
}

function createMissingContextHints(record: Phase0MessyRecord) {
  const hints: string[] = [];

  if (!/\d{1,2}:\d{2}|早上|下午|中午|昨天|今天|剛剛/.test(record.rawText)) {
    hints.push("原文事件時間不夠清楚，不能只看資料更新時間。");
  }

  if (includesAny(record.rawText, ambiguousLocationKeywords)) {
    hints.push("地點線索仍模糊，不能轉成精準地址或路線。");
  }

  if (record.verificationStatus !== "verified") {
    hints.push("需要人工確認來源、現況與是否仍有效。");
  }

  if (record.rawText.includes("同意公開")) {
    hints.push("需要確認當事人是否同意公開完整位置。");
  }

  return unique(hints);
}

function createTaskBlockers(record: Phase0MessyRecord) {
  const blockers: string[] = [];

  if (record.verificationStatus !== "verified") {
    blockers.push("目前不是已確認資訊，不能直接派人或發布。");
  }

  if (includesAny(record.rawText, ambiguousLocationKeywords)) {
    blockers.push("位置或範圍不足，志工無法安全抵達或判斷現場。");
  }

  if (includesAny(record.rawText, uncertaintyKeywords)) {
    blockers.push("原文含不確定、過期或衝突線索，需要先查證。");
  }

  if (includesAny(record.rawText, thirdPartyKeywords)) {
    blockers.push("資訊可能由第三方轉述，需確認當事人意願與實際需求。");
  }

  if (record.rawText.includes("不要再派人")) {
    blockers.push("原文要求不要再派人，但原因未明，不能反向推論已完成。");
  }

  return unique(blockers);
}

// ponytail: this is a safety-boundary scaffold, not an answer engine.
export function createPhase0Judgement(
  record: Phase0MessyRecord,
): Phase0JudgementDraft {
  const isVerified = record.verificationStatus === "verified";

  return {
    messyRecordId: record.id,
    possibleKind: "unknown",
    confidence: "low",
    evidence: ["尚未建立整理草稿：請由小組從原文標出判斷依據。"],
    blockers: isVerified
      ? ["仍需確認這筆資訊適合進入哪個後續流程。"]
      : ["目前不是已確認資訊，不能直接行動或當成事實發布。"],
    suggestedNextStep: isVerified ? "keep_raw" : "send_to_human_review",
    unsafeToActDirectly: true,
  };
}

export function createPhase0CandidateClassification(
  record: Phase0MessyRecord,
): Phase0CandidateClassification {
  const inferred = inferKind(record);
  const warningLabels = createWarningLabels(record);
  const missingContextHints = createMissingContextHints(record);
  const taskBlockers = createTaskBlockers(record);

  return {
    messyRecordId: record.id,
    possibleKind: inferred.kind,
    confidence: record.verificationStatus === "verified" ? "medium" : "low",
    basis: inferred.basis,
    unsafeToActDirectly: true,
    screenMaterial: {
      messyRecordId: record.id,
      safeDisplayFields: [
        {
          label: "原始資訊編號",
          value: record.id,
          reason: "可作為畫面索引，不代表已整理完成。",
        },
        {
          label: "原始查核狀態",
          value: record.verificationStatus,
          reason: "必須照原始欄位顯示，不能改成已確認。",
        },
        {
          label: "來源類型",
          value: record.sourceType,
          reason: "來源只說明從哪裡來，不等於可信度。",
        },
      ],
      warningLabels,
      missingContextHints,
      taskBlockers:
        taskBlockers.length > 0
          ? taskBlockers
          : ["即使候選分類看似明確，仍需人工確認後才能形成任務。"],
      humanCheckPrompt:
        "請人工確認來源、時間、地點、當事人意願、目前狀態與是否仍有效。",
    },
  };
}
