import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="site-header">
      <a href="#services" className="skip-link">
        Pular para os serviços
      </a>
      <nav
        className="container py-3 d-flex flex-wrap align-items-center justify-content-between gap-3"
        aria-label="Navegação principal"
      >
        <Link
          className="brand d-inline-flex align-items-center"
          href="/"
          aria-label="Freelike, página inicial"
        >
          <Image
            src="/freelike-symbol.png"
            alt=""
            width={48}
            height={48}
            priority
          />
          <span>
            Freelike<span className="brand-dot">.</span>
          </span>
        </Link>
        <div className="account-links">
          <div className="d-flex justify-content-end gap-2">
            <Link
              href="/login"
              className="btn btn-outline-primary"
              aria-describedby="account-notice"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="btn btn-primary"
              aria-describedby="account-notice"
            >
              Criar conta
            </Link>
          </div>
          <p id="account-notice" className="small text-secondary mb-0 mt-2">
            Acesso e cadastro em preparação.
          </p>
        </div>
      </nav>
    </header>
  );
}
