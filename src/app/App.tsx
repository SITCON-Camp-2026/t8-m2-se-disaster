import { useState } from "react";
import messyReports from "../fixtures/phase-0/messy-reports.json";
import { EmptyState } from "../components/EmptyState";
import { Phase0RawInfoPanel } from "../features/phase-0/Phase0RawInfoPanel";
import { Phase0Workbench } from "../features/phase-0/Phase0Workbench";
import type { Phase0MessyRecord } from "../features/phase-0/phase0-types";
import { V1ContributorLeaderboard } from "../features/v1/V1ContributorLeaderboard";
import { V1Workbench } from "../features/v1/V1Workbench";
import {
  contributors,
  type ContributorProfile,
} from "../features/v1/v1-contributors";

type TabKey = "raw" | "workbench";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "raw", label: "原始資訊" },
  { key: "workbench", label: "整理工作台" },
];

const phase0Records = messyReports satisfies Phase0MessyRecord[];

function isV1Path() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = window.location.pathname.replace(/\/$/, "");
  const normalizedPath =
    base && path.startsWith(base) ? path.slice(base.length) : path;

  return normalizedPath === "/v1";
}

function createHref(path: string) {
  return `${import.meta.env.BASE_URL.replace(/\/$/, "")}${path}`;
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("raw");
  const [selectedRecordId, setSelectedRecordId] = useState(
    phase0Records[0]?.id ?? "",
  );
  const [contributorProfiles, setContributorProfiles] =
    useState<ContributorProfile[]>(contributors);
  const isV1 = isV1Path();

  function addContributorProfile(contributor: ContributorProfile) {
    setContributorProfiles((currentProfiles) => [
      ...currentProfiles,
      contributor,
    ]);
  }

  function selectForWorkbench(recordId: string) {
    setSelectedRecordId(recordId);
    setActiveTab("workbench");
  }

  if (isV1) {
    return (
      <main className="layout">
        <nav className="page-switch" aria-label="頁面切換">
          <a href={createHref("/")}>Phase 0 首頁</a>
          <a aria-current="page" href={createHref("/v1/")}>
            v1 工作台
          </a>
        </nav>
        <V1Workbench
          records={phase0Records}
          contributorProfiles={contributorProfiles}
          onAddContributor={addContributorProfile}
        />
      </main>
    );
  }

  return (
    <main className="layout">
      <nav className="page-switch" aria-label="頁面切換">
        <a aria-current="page" href={createHref("/")}>
          Phase 0 首頁
        </a>
        <a href={createHref("/v1/")}>進入 v1 工作台</a>
      </nav>

      <header className="hero">
        <p className="eyebrow">SITCON Camp 2026</p>
        <h1>災害資訊整理工作台</h1>
        <p>
          第一階段先用 coding agent
          做出可展示的前端原型，再從成果中看見資料品質、角色、狀態與來源的限制。
        </p>
      </header>

      <V1ContributorLeaderboard
        profiles={contributorProfiles}
        onAddContributor={addContributorProfile}
      />

      <nav className="tabs" aria-label="第一階段工作區">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "active" : ""}
            type="button"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="panel">
        {phase0Records.length === 0 ? (
          <EmptyState message="目前沒有資料" />
        ) : activeTab === "raw" ? (
          <Phase0RawInfoPanel
            records={phase0Records}
            selectedRecordId={selectedRecordId}
            onSelect={selectForWorkbench}
          />
        ) : (
          <Phase0Workbench
            records={phase0Records}
            selectedRecordId={selectedRecordId}
            onSelect={setSelectedRecordId}
          />
        )}
      </section>
    </main>
  );
}
