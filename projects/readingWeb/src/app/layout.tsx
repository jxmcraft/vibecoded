import type { ReactNode } from "react";
import "./globals.css";
import { ReaderProvider } from "../context/ReaderContext";

export const metadata = {
  title: "NovelFlow",
  description: "Clean, focused reading for light novels in the browser."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <ReaderProvider>{children}</ReaderProvider>
      </body>
    </html>
  );
}

