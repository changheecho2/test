import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "앙코르메이트",
  description: "반주자와 연주자를 연결하는 두-사이드 마켓플레이스"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen">
        <header className="border-b border-line bg-sand/90 backdrop-blur dark:border-white/10 dark:bg-[#0f0c0a]/90">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white text-lg font-display">
                AM
              </div>
              <div>
                <Link href="/" className="text-lg font-display font-semibold text-ink dark:text-[#f4efe9]">
                  앙코르메이트
                </Link>
                <p className="text-xs text-muted dark:text-[#cdbfb3]">연주자와 반주자를 빠르게 연결합니다</p>
              </div>
            </div>
            <nav className="flex items-center gap-3 text-sm">
              <Link
                href="/"
                className="rounded-full border border-line bg-white px-4 py-2 text-ink dark:border-white/20 dark:bg-[#1b1512] dark:text-[#f4efe9]"
              >
                반주자 찾기
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full bg-cocoa px-4 py-2 text-white shadow-sm dark:bg-[#c9a483] dark:text-[#1b140f]"
              >
                반주자 대시보드
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        <div className="fixed bottom-4 left-0 right-0 z-40 px-4 md:hidden">
          <div className="flex items-center justify-between rounded-full border border-line bg-white/90 px-4 py-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-[#16110e]/90">
            <Link href="/" className="text-xs font-semibold text-ink dark:text-[#f4efe9]">
              반주자 찾기
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-cocoa px-4 py-2 text-xs font-semibold text-white dark:bg-[#c9a483] dark:text-[#1b140f]"
            >
              대시보드
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
