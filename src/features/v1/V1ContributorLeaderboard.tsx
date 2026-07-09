import { useState, type FormEvent } from "react";
import {
  contributors,
  contributorScoreFormula,
  rankContributors,
  scoreForContributor,
} from "./v1-contributors";
import type { ContributorProfile } from "./v1-contributors";

type ContributorDraft = {
  id: string;
  role: string;
  focus: string;
  reviewedCount: string;
  correctionCount: string;
  holdCount: string;
};

const emptyDraft: ContributorDraft = {
  id: "",
  role: "",
  focus: "",
  reviewedCount: "0",
  correctionCount: "0",
  holdCount: "0",
};

export function V1ContributorLeaderboard({
  profiles = contributors,
  selectedContributorId,
  onSelectContributor,
  onAddContributor,
}: {
  profiles?: ContributorProfile[];
  selectedContributorId?: string;
  onSelectContributor?: (contributorId: string) => void;
  onAddContributor?: (contributor: ContributorProfile) => void;
}) {
  const rankedContributors = rankContributors(profiles);
  const [draft, setDraft] = useState<ContributorDraft>(emptyDraft);
  const [formMessage, setFormMessage] = useState("");

  function updateDraft<K extends keyof ContributorDraft>(
    key: K,
    value: ContributorDraft[K],
  ) {
    setDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
  }

  function parseCount(value: string) {
    const parsedValue = Number.parseInt(value, 10);

    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const id = draft.id.trim();
    const role = draft.role.trim();

    if (!id || !role) {
      setFormMessage("請填匿名代號與分工。");
      return;
    }

    if (profiles.some((profile) => profile.id === id)) {
      setFormMessage("這個匿名代號已存在。");
      return;
    }

    onAddContributor?.({
      id,
      role,
      focus: draft.focus.trim() || "尚未填寫協作重點。",
      reviewedCount: parseCount(draft.reviewedCount),
      correctionCount: parseCount(draft.correctionCount),
      holdCount: parseCount(draft.holdCount),
      relatedRecordIds: [],
    });

    setDraft(emptyDraft);
    setFormMessage(`${id} 已加入排行榜。`);
  }

  return (
    <section className="v1-leaderboard" aria-labelledby="v1-leaderboard-title">
      <div className="v1-section-heading">
        <p className="eyebrow">匿名協作者</p>
        <h2 id="v1-leaderboard-title">協作積分排行榜</h2>
        <p>
          分數只計入整理、人工確認與修正紀錄。救援次數不在此工具統計，也不作為排名依據。
        </p>
      </div>

      <div className="v1-score-formula" aria-label="積分算法">
        <strong>積分算法</strong>
        <span>{contributorScoreFormula}</span>
      </div>

      <div className="v1-scoreboard" role="list">
        {rankedContributors.map((contributor, index) => (
          <ContributorScoreRow
            contributor={contributor}
            index={index}
            isSelected={contributor.id === selectedContributorId}
            key={contributor.id}
            onSelectContributor={onSelectContributor}
          />
        ))}
      </div>

      {onAddContributor ? (
        <form className="v1-profile-form" onSubmit={handleSubmit}>
          <div className="v1-section-heading">
            <p className="eyebrow">新增使用者</p>
            <h3>匿名個人檔案</h3>
          </div>

          <div className="v1-profile-form__grid">
            <label>
              匿名代號
              <input
                value={draft.id}
                onChange={(event) => updateDraft("id", event.target.value)}
                placeholder="協作者 D"
              />
            </label>

            <label>
              分工
              <input
                value={draft.role}
                onChange={(event) => updateDraft("role", event.target.value)}
                placeholder="人工確認紀錄"
              />
            </label>

            <label className="v1-profile-form__wide">
              協作重點
              <input
                value={draft.focus}
                onChange={(event) => updateDraft("focus", event.target.value)}
                placeholder="補問缺漏資訊與修正 AI 候選判斷"
              />
            </label>

            <label>
              整理與確認
              <input
                min="0"
                type="number"
                value={draft.reviewedCount}
                onChange={(event) =>
                  updateDraft("reviewedCount", event.target.value)
                }
              />
            </label>

            <label>
              人類修正
              <input
                min="0"
                type="number"
                value={draft.correctionCount}
                onChange={(event) =>
                  updateDraft("correctionCount", event.target.value)
                }
              />
            </label>

            <label>
              暫緩採用
              <input
                min="0"
                type="number"
                value={draft.holdCount}
                onChange={(event) =>
                  updateDraft("holdCount", event.target.value)
                }
              />
            </label>
          </div>

          <div className="v1-profile-form__footer">
            <button type="submit">新增匿名檔案</button>
            {formMessage ? <p role="status">{formMessage}</p> : null}
          </div>
        </form>
      ) : null}
    </section>
  );
}

function ContributorScoreRow({
  contributor,
  index,
  isSelected,
  onSelectContributor,
}: {
  contributor: ContributorProfile;
  index: number;
  isSelected: boolean;
  onSelectContributor?: (contributorId: string) => void;
}) {
  const content = (
    <>
      <span className="v1-scoreboard__rank">#{index + 1}</span>
      <span>
        <strong>{contributor.id}</strong>
        <small>{contributor.role}</small>
      </span>
      <span>{scoreForContributor(contributor)} 分</span>
    </>
  );

  if (!onSelectContributor) {
    return (
      <div className="v1-scoreboard__row" role="listitem">
        {content}
      </div>
    );
  }

  return (
    <button
      className={isSelected ? "active" : ""}
      type="button"
      onClick={() => onSelectContributor(contributor.id)}
    >
      {content}
    </button>
  );
}
