import { SourceLabel } from "../../components/SourceLabel";
import { StatusBadge } from "../../components/StatusBadge";
import type {
  Phase0CandidateClassification,
  Phase0MessyRecord,
  Phase0PossibleKind,
} from "./phase0-types";

const kindLabels: Record<Phase0PossibleKind, string> = {
  help_request_candidate: "求助候選",
  site_status_candidate: "地點狀態候選",
  task_candidate: "任務候選",
  assignment_candidate: "支援或指派候選",
  announcement_candidate: "公告候選",
  unknown: "候選類型待判斷",
};

const confidenceLabels: Record<
  Phase0CandidateClassification["confidence"],
  string
> = {
  low: "低：僅供整理",
  medium: "中：仍需確認",
  high: "高：仍需確認",
};

export function Phase0ClassificationCard({
  classification,
}: {
  classification: Phase0CandidateClassification;
}) {
  return (
    <article className="classification-card">
      <div className="classification-card__header">
        <div>
          <p className="eyebrow">候選分類</p>
          <h3>{kindLabels[classification.possibleKind]}</h3>
        </div>
        <span className="safety-chip">候選結果</span>
      </div>

      <dl className="classification-summary">
        <div>
          <dt>信心程度</dt>
          <dd>{confidenceLabels[classification.confidence]}</dd>
        </div>
        <div>
          <dt>使用限制</dt>
          <dd>不可派工</dd>
        </div>
      </dl>

      <section>
        <h4>原文線索</h4>
        <ul>
          {classification.basis.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h4>保留警示</h4>
        <ul>
          {classification.screenMaterial.warningLabels.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}

export function Phase0ReviewPanel({
  classification,
}: {
  classification: Phase0CandidateClassification;
}) {
  return (
    <aside className="workbench__review-panel">
      <h3>人工確認欄</h3>
      <p>{classification.screenMaterial.humanCheckPrompt}</p>

      <section>
        <h4>待補脈絡</h4>
        <ul>
          {classification.screenMaterial.missingContextHints.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h4>不可派工原因</h4>
        <ul>
          {classification.screenMaterial.taskBlockers.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

export function Phase0ClassificationTable({
  classifications,
  records,
  selectedRecordId,
  onSelect,
}: {
  classifications: Phase0CandidateClassification[];
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
}) {
  const recordsById = new Map(records.map((record) => [record.id, record]));

  return (
    <section
      className="classification-table"
      aria-labelledby="classification-title"
    >
      <div className="classification-table__header">
        <div>
          <p className="eyebrow">分類整理模式</p>
          <h3 id="classification-title">所有事件一一分類</h3>
        </div>
        <p>{classifications.length} 筆候選分類</p>
      </div>

      <div className="classification-table__scroller">
        <table>
          <thead>
            <tr>
              <th scope="col">事件</th>
              <th scope="col">候選分類</th>
              <th scope="col">原始狀態</th>
              <th scope="col">來源</th>
              <th scope="col">整理警示</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            {classifications.map((classification) => {
              const record = recordsById.get(classification.messyRecordId);

              if (!record) {
                return null;
              }

              return (
                <tr
                  className={
                    record.id === selectedRecordId
                      ? "classification-table__row--selected"
                      : ""
                  }
                  key={record.id}
                >
                  <th scope="row">{record.id}</th>
                  <td>{kindLabels[classification.possibleKind]}</td>
                  <td>
                    <StatusBadge status={record.verificationStatus} />
                  </td>
                  <td>
                    <SourceLabel sourceType={record.sourceType} />
                  </td>
                  <td>
                    {classification.screenMaterial.warningLabels[0] ??
                      "仍需人工確認"}
                  </td>
                  <td>
                    <button type="button" onClick={() => onSelect(record.id)}>
                      查看
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
