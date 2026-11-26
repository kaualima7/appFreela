import type { Metadata } from "next";
import localFont from "next/font/local";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import SessionProvider from "./components/SessionProvider";
import InterestsProvider from "./components/InterestsProvider";

import AccountWorkspace from "./components/AccountWorkspace";
import { textSizeStorageKey, themeStorageKey } from "./preferences";

const geist = localFont({
  src: "./fonts/Geist-Latin.woff2",
  weight: "100 900",
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Freelike | Vitrine de serviços",
  description:
    "Serviços publicados por freelancers, com descrição, categoria e preço inicial.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={geist.variable}
      data-scroll-behavior="smooth"
      data-bs-theme="light"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
              if (localStorage.getItem(${JSON.stringify(themeStorageKey)}) === "dark") {
                document.documentElement.dataset.bsTheme = "dark";
              }
              const textSize = localStorage.getItem(${JSON.stringify(textSizeStorageKey)});
              if (textSize === "medium" || textSize === "large") {
                document.documentElement.dataset.textSize = textSize;
              }
            } catch {}`,
          }}
        />
      </head>
      <body>
        <SessionProvider>
          <InterestsProvider>
            <AccountWorkspace>{children}</AccountWorkspace>
          </InterestsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
