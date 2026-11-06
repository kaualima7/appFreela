import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import SessionGate from "./SessionGate";

export default function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <SessionGate access="guest">
      <main className="auth-page container py-4 py-lg-5">
        <Link
          href="/"
          className="brand d-inline-flex align-items-center mb-4"
          aria-label="Freelike, voltar à vitrine"
        >
          <Image
            src="/freelike-symbol.png"
            alt=""
            width={48}
            height={48}
            loading="eager"
          />
          <span>
            Freelike<span className="brand-dot">.</span>
          </span>
        </Link>
        <div className="auth-panel row g-0">
          <aside
            className="auth-visual col-lg-5 d-none d-lg-flex"
            aria-label="Freelike"
          >
            <Image
              src="/freelike-symbol.png"
              alt=""
              fill
              sizes="40vw"
              className="auth-watermark"
            />
            <div className="auth-visual-content">
              <p className="section-label mb-3">FREELIKE</p>
              <p className="auth-visual-title mb-0">
                Encontre serviços.
                <br />
                Compartilhe seu trabalho.
              </p>
            </div>
          </aside>
          <section
            className="col-lg-7 auth-form-section"
            aria-labelledby="auth-title"
          >
            <h1 id="auth-title" className="h3 fw-bold mb-2">
              {title}
            </h1>
            <p className="text-secondary mb-4">{description}</p>
            {children}
          </section>
        </div>
      </main>
    </SessionGate>
  );
}
