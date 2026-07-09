import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../src/app/App";

describe("App", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders starter title", () => {
    render(<App />);
    expect(screen.getByText("災害資訊整理工作台")).toBeInTheDocument();
  });

  it("shows the contributor leaderboard on the home page", () => {
    render(<App />);

    expect(screen.getByText("協作積分排行榜")).toBeInTheDocument();
    expect(screen.getByText("積分算法")).toBeInTheDocument();
    expect(
      screen.getByText("整理與確認 x 4 + 人類修正 x 6 + 暫緩採用 x 3"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/救援次數不在此工具統計，也不作為排名依據/),
    ).toBeInTheDocument();
  });

  it("adds an anonymous contributor profile on the home page", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("匿名代號"), {
      target: { value: "協作者 D" },
    });
    fireEvent.change(screen.getByLabelText("分工"), {
      target: { value: "補問紀錄" },
    });
    fireEvent.change(screen.getByLabelText("協作重點"), {
      target: { value: "整理缺漏欄位" },
    });
    fireEvent.change(screen.getByLabelText("整理與確認"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("人類修正"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("暫緩採用"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "新增匿名檔案" }));

    expect(screen.getByText("協作者 D 已加入排行榜。")).toBeInTheDocument();
    expect(screen.getByText("協作者 D")).toBeInTheDocument();
    expect(screen.getByText("23 分")).toBeInTheDocument();
  });

  it("keeps the home page focused on phase 0 tabs", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: "原始資訊" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "整理工作台" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "通報" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "地點" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "志工任務" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "人員指派" }),
    ).not.toBeInTheDocument();
  });

  it("shows review states in the phase 0 workbench", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(
      screen.getByText("先把每筆原始資訊分成候選類型，並列出待確認處。"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未查核").length).toBeGreaterThan(0);
  });

  it("shows candidate classifications without presenting them as confirmed output", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(screen.getByText("所有事件一一分類")).toBeInTheDocument();
    expect(screen.getByText("候選結果")).toBeInTheDocument();
    expect(screen.getAllByText("不可派工").length).toBeGreaterThan(0);
    expect(screen.getByText("尚未建立整理草稿")).toBeInTheDocument();
    expect(screen.queryByText(/已確認可直接派工/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/已產生 \d+ 筆安全邊界草稿/),
    ).not.toBeInTheDocument();
  });

  it("opens the selected record when a classification row is viewed", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));
    fireEvent.click(screen.getAllByRole("button", { name: "查看" })[1]);

    expect(
      screen.getByText("溪畔活動中心早上還有雨鞋，但不知道下午還有沒有。"),
    ).toBeInTheDocument();
  });

  it("shows the v1 workbench with safe contributor scoring", () => {
    window.history.pushState({}, "", "/v1/");

    render(<App />);

    expect(screen.getByText("資訊整理者工作台")).toBeInTheDocument();
    expect(screen.getByText("資料仍來自 Phase 0 原始資訊")).toBeInTheDocument();
    expect(screen.getByText("協作積分排行榜")).toBeInTheDocument();
    expect(
      screen.getByText("整理與確認 x 4 + 人類修正 x 6 + 暫緩採用 x 3"),
    ).toBeInTheDocument();
    expect(screen.getByText("救援次數不列入計分")).toBeInTheDocument();
    expect(screen.getByText("不統計")).toBeInTheDocument();
    expect(screen.queryByText(/已確認可直接派工/)).not.toBeInTheDocument();
  });
});
