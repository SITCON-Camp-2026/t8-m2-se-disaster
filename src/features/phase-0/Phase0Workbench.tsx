import { useRef } from "react";
import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import {
  Phase0ClassificationCard,
  Phase0ClassificationTable,
  Phase0ReviewPanel,
} from "./Phase0ClassificationPanel";
import { Phase0JudgementCard } from "./Phase0JudgementCard";
import {
  createPhase0CandidateClassification,
  createPhase0Judgement,
} from "./phase0-heuristics";
import type { Phase0MessyRecord, Phase0PossibleKind } from "./phase0-types";

const queueKindLabels: Record<Phase0PossibleKind, string> = {
  help_request_candidate: "求助候選",
  site_status_candidate: "地點狀態候選",
  task_candidate: "任務候選",
  assignment_candidate: "支援或指派候選",
  announcement_candidate: "公告候選",
  unknown: "候選類型待判斷",
};

export function Phase0Workbench({
  records,
  selectedRecordId,
  onSelect,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
}) {
  const detailRef = useRef<HTMLDivElement>(null);
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];
  const safetyBoundary = createPhase0Judgement(selectedRecord);
  const classifications = records.map(createPhase0CandidateClassification);
  const selectedClassification =
    classifications.find(
      (classification) => classification.messyRecordId === selectedRecord.id,
    ) ?? createPhase0CandidateClassification(selectedRecord);

  function selectAndFocus(recordId: string) {
    onSelect(recordId);
    window.requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      detailRef.current?.focus({ preventScroll: true });
    });
  }

  return (
    <div className="workbench">
      <div className="workbench__intro">
        <p className="eyebrow">分類整理模式</p>
        <h2>先把每筆原始資訊分成候選類型，並列出待確認處。</h2>
        <p>
          分類只輔助閱讀；不是已確認事實、不是正式資料模型，也不能用來派工。
        </p>
      </div>

      <div className="workbench__layout">
        <aside className="workbench__queue" aria-label="選擇原始資訊">
          {records.map((record) => {
            const classification = classifications.find(
              (item) => item.messyRecordId === record.id,
            );

            return (
              <button
                className={record.id === selectedRecord.id ? "active" : ""}
                key={record.id}
                type="button"
                onClick={() => selectAndFocus(record.id)}
              >
                <span>{record.id}</span>
                <span className="workbench__queue-kind">
                  {classification
                    ? queueKindLabels[classification.possibleKind]
                    : queueKindLabels.unknown}
                </span>
                <StatusBadge status={record.verificationStatus} />
              </button>
            );
          })}
        </aside>

        <div
          className="workbench__main"
          ref={detailRef}
          tabIndex={-1}
          aria-live="polite"
        >
          <RecordCard record={selectedRecord} />

          <Phase0ClassificationCard classification={selectedClassification} />

          <Phase0JudgementCard
            judgement={safetyBoundary}
            record={selectedRecord}
          />
        </div>

        <Phase0ReviewPanel classification={selectedClassification} />
      </div>

      <Phase0ClassificationTable
        classifications={classifications}
        records={records}
        selectedRecordId={selectedRecord.id}
        onSelect={selectAndFocus}
      />
    </div>
  );
}
