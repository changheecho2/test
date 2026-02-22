import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "반주자 매칭 MVP",
  description: "반주자와 연주자를 연결하는 두-사이드 마켓플레이스"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <header className="border-b border-black/10 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold">
              반주자 매칭
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/">반주자 목록</Link>
              <Link href="/dashboard">대시보드</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
