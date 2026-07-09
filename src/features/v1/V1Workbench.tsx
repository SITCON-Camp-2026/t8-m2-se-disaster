import { useMemo, useState } from "react";
import { SourceLabel } from "../../components/SourceLabel";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/date";
import { createPhase0CandidateClassification } from "../phase-0/phase0-heuristics";
import type {
  Phase0CandidateClassification,
  Phase0MessyRecord,
  Phase0PossibleKind,
} from "../phase-0/phase0-types";
import { V1ContributorLeaderboard } from "./V1ContributorLeaderboard";
import { rankContributors } from "./v1-contributors";
import type { ContributorProfile } from "./v1-contributors";

const kindLabels: Record<Phase0PossibleKind, string> = {
  help_request_candidate: "求助候選",
  site_status_candidate: "地點狀態候選",
  task_candidate: "任務候選",
  assignment_candidate: "支援或指派候選",
  announcement_candidate: "公告候選",
  unknown: "候選類型待判斷",
};

function createRiskSummary(classification: Phase0CandidateClassification) {
  const warningCount = classification.screenMaterial.warningLabels.length;
  const missingCount = classification.screenMaterial.missingContextHints.length;
  const blockerCount = classification.screenMaterial.taskBlockers.length;

  return {
    total: warningCount + missingCount + blockerCount,
    warningCount,
    missingCount,
    blockerCount,
  };
}

function sortRecordsByReviewNeed(records: Phase0MessyRecord[]) {
  return [...records]
    .map((record) => {
      const classification = createPhase0CandidateClassification(record);

      return {
        record,
        classification,
        risk: createRiskSummary(classification),
      };
    })
    .sort((a, b) => b.risk.total - a.risk.total);
}

export function V1Workbench({
  records,
  contributorProfiles,
  onAddContributor,
}: {
  records: Phase0MessyRecord[];
  contributorProfiles: ContributorProfile[];
  onAddContributor: (contributor: ContributorProfile) => void;
}) {
  const reviewQueue = useMemo(
    () => sortRecordsByReviewNeed(records),
    [records],
  );
  const rankedContributors = useMemo(
    () => rankContributors(contributorProfiles),
    [contributorProfiles],
  );
  const [selectedRecordId, setSelectedRecordId] = useState(
    reviewQueue[0]?.record.id ?? "",
  );
  const [selectedContributorId, setSelectedContributorId] = useState(
    rankedContributors[0]?.id ?? "",
  );

  const selectedQueueItem =
    reviewQueue.find((item) => item.record.id === selectedRecordId) ??
    reviewQueue[0];
  const selectedContributor =
    rankedContributors.find(
      (contributor) => contributor.id === selectedContributorId,
    ) ?? rankedContributors[0];

  if (!selectedQueueItem || !selectedContributor) {
    return (
      <section className="v1-shell">
        <p>目前沒有 Phase 0 原始資訊可整理。</p>
      </section>
    );
  }

  return (
    <section className="v1-shell" aria-labelledby="v1-title">
      <div className="v1-hero">
        <div>
          <p className="eyebrow">v1 重新整理</p>
          <h1 id="v1-title">資訊整理者工作台</h1>
          <p>
            這個畫面仍只使用 Phase 0
            原始資訊。候選分類、人工確認與協作者積分都只是整理輔助，不代表已確認任務。
          </p>
        </div>
        <div className="v1-hero__badges" aria-label="v1 安全邊界">
          <span>資料仍來自 Phase 0 原始資訊</span>
          <span>未確認內容不可派工</span>
          <span>救援次數不列入計分</span>
        </div>
      </div>

      <section className="v1-flow-strip" aria-label="v1 資訊流程">
        <div>
          <span>1</span>
          <strong>查看原文</strong>
          <p>保留資訊取得方式與查核狀態。</p>
        </div>
        <div>
          <span>2</span>
          <strong>標出風險</strong>
          <p>找出轉述、衝突、過期與模糊地點。</p>
        </div>
        <div>
          <span>3</span>
          <strong>人工確認</strong>
          <p>補問來源、現況、地點與當事人意願。</p>
        </div>
        <div>
          <span>4</span>
          <strong>留下紀錄</strong>
          <p>記錄匿名協作者與判斷理由。</p>
        </div>
      </section>

      <div className="v1-grid">
        <section className="v1-queue" aria-labelledby="v1-queue-title">
          <div className="v1-section-heading">
            <p className="eyebrow">人工確認佇列</p>
            <h2 id="v1-queue-title">先處理風險最高的原始資訊</h2>
          </div>

          <div className="v1-queue__list">
            {reviewQueue.map(({ record, classification, risk }) => (
              <button
                className={
                  record.id === selectedQueueItem.record.id ? "active" : ""
                }
                key={record.id}
                type="button"
                onClick={() => setSelectedRecordId(record.id)}
              >
                <span className="v1-queue__topline">
                  <strong>{record.id}</strong>
                  <StatusBadge status={record.verificationStatus} />
                </span>
                <span>{kindLabels[classification.possibleKind]}</span>
                <span className="v1-queue__meta">
                  {risk.total} 個待檢查訊號
                </span>
              </button>
            ))}
          </div>
        </section>

        <article className="v1-detail" aria-labelledby="v1-detail-title">
          <div className="v1-section-heading">
            <p className="eyebrow">選取資訊</p>
            <h2 id="v1-detail-title">{selectedQueueItem.record.id}</h2>
          </div>

          <p className="v1-detail__raw">{selectedQueueItem.record.rawText}</p>

          <dl className="v1-detail__meta">
            <div>
              <dt>資訊取得方式</dt>
              <dd>
                <SourceLabel sourceType={selectedQueueItem.record.sourceType} />
              </dd>
            </div>
            <div>
              <dt>查核狀態</dt>
              <dd>
                <StatusBadge
                  status={selectedQueueItem.record.verificationStatus}
                />
              </dd>
            </div>
            <div>
              <dt>更新時間</dt>
              <dd>{formatDateTime(selectedQueueItem.record.updatedAt)}</dd>
            </div>
          </dl>

          <div className="v1-detail__columns">
            <section>
              <h3>候選整理</h3>
              <p>
                {kindLabels[selectedQueueItem.classification.possibleKind]}，
                仍需人工確認。
              </p>
              <ul>
                {selectedQueueItem.classification.basis.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3>不可直接變成任務</h3>
              <ul>
                {selectedQueueItem.classification.screenMaterial.taskBlockers.map(
                  (item) => (
                    <li key={item}>{item}</li>
                  ),
                )}
              </ul>
            </section>
          </div>
        </article>
      </div>

      <section className="v1-contributors">
        <div className="v1-contributors__layout">
          <V1ContributorLeaderboard
            profiles={contributorProfiles}
            selectedContributorId={selectedContributor.id}
            onSelectContributor={setSelectedContributorId}
            onAddContributor={(contributor) => {
              onAddContributor(contributor);
              setSelectedContributorId(contributor.id);
            }}
          />

          <article className="v1-profile">
            <div className="v1-profile__header">
              <div>
                <p className="eyebrow">個人檔案</p>
                <h3>{selectedContributor.id}</h3>
              </div>
              <span className="safety-chip">匿名紀錄</span>
            </div>

            <p>{selectedContributor.focus}</p>

            <dl className="v1-profile__stats">
              <div>
                <dt>整理與確認</dt>
                <dd>{selectedContributor.reviewedCount}</dd>
              </div>
              <div>
                <dt>人類修正</dt>
                <dd>{selectedContributor.correctionCount}</dd>
              </div>
              <div>
                <dt>暫緩採用</dt>
                <dd>{selectedContributor.holdCount}</dd>
              </div>
              <div>
                <dt>救援次數</dt>
                <dd>不統計</dd>
              </div>
            </dl>

            <section>
              <h4>相關原始資訊</h4>
              <div className="v1-profile__chips">
                {selectedContributor.relatedRecordIds.map((recordId) => (
                  <button
                    key={recordId}
                    type="button"
                    onClick={() => setSelectedRecordId(recordId)}
                  >
                    {recordId}
                  </button>
                ))}
              </div>
            </section>
          </article>
        </div>
      </section>
    </section>
  );
}
