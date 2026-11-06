import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import SessionProvider from "./components/SessionProvider";
import InterestsProvider from "./components/InterestsProvider";

export const metadata: Metadata = {
  title: "Freelike | Vitrine de serviços",
  description:
    "Serviços publicados por freelancers, com descrição, categoria e preço inicial.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <SessionProvider>
          <InterestsProvider>{children}</InterestsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
