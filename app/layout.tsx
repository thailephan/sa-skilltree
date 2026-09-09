import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SA Skill Tree — Edtech 10M users",
  description:
    "Lộ trình tự học Solution Architect dạng game skill-tree: lý thuyết, câu hỏi, lab, capacity planning cho hệ edtech quy mô lớn.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
