import { TopBar } from "./TopBar";
import { SideBar } from "./SideBar";
import { BottomBar } from "./BottomBar";
import { ReaderArea } from "./ReaderArea";

export function AppShell() {
  return (
    <div className="app-root">
      <TopBar />
      <div className="app-main">
        <SideBar />
        <ReaderArea />
      </div>
      <BottomBar />
    </div>
  );
}

