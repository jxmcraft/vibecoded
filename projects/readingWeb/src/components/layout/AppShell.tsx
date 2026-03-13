"use client";

import { TopBar } from "./TopBar";
import { SideBar } from "./SideBar";
import { BottomBar } from "./BottomBar";
import { ReaderArea } from "./ReaderArea";
import { useReader } from "../../context/ReaderContext";

export function AppShell() {
  const { sidebarCollapsed } = useReader();

  return (
    <div className="app-root">
      <TopBar />
      <div className={`app-main ${sidebarCollapsed ? "is-sidebar-collapsed" : ""}`}>
        <SideBar />
        <ReaderArea />
      </div>
      <BottomBar />
    </div>
  );
}

