import Link from "next/link";
import type { Metadata } from "next";
import HomeHeroPhoto from "./components/HomeHeroPhoto";
import HomeServiceHighlight from "./components/service/HomeServiceHighlight";

export const metadata: Metadata = {
  title: "Freelike | Encontre um freelancer",
  description: "Explore serviços, conheça os profissionais e encontre um freelancer para o seu projeto.",
};

const steps = [
  {
    icon: "search",
    title: "Explore os serviços",
    description: "Busque por serviço, categoria ou profissional.",
  },
  {
    icon: "card-text",
    title: "Abra o anúncio",
    description: "Confira a descrição, o preço inicial e o perfil do profissional.",
  },
  {
    icon: "heart",
    title: "Dê seu like",
    description: "Use o coração no anúncio para demonstrar interesse ao freelancer.",
  },
];

export default function Home() {
  return (
    <main className="container home-main">
      <section className="row g-4 g-xl-5 align-items-center" aria-labelledby="home-title">
        <div className="col-lg-5">
          <h1 id="home-title" className="home-title fw-bold mb-3">
            Encontre um freelancer para o seu projeto
          </h1>
          <p className="home-description text-secondary mb-4">
            Explore os serviços, conheça os profissionais e dê like nos anúncios que chamarem sua atenção.
          </p>
          <div className="d-flex flex-wrap align-items-center gap-2 home-actions">
            <Link href="/explorar" className="btn btn-primary">
              Explorar serviços
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </Link>
            <Link href="/register?tipo=freelancer" className="workspace-link">
              Quero oferecer meus serviços
            </Link>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="home-photo">
            <HomeHeroPhoto />
            <HomeServiceHighlight />
          </div>
        </div>
      </section>

      <section className="home-steps" aria-labelledby="home-steps-title">
        <h2 id="home-steps-title" className="h3 fw-bold mb-4">
          Como funciona
        </h2>
        <ol className="row g-3 list-unstyled mb-0">
          {steps.map(({ icon, title, description }) => (
            <li key={title} className="col-md-4">
              <div className="home-step h-100">
                <i className={`bi bi-${icon}`} aria-hidden="true" />
                <h3 className="h6 fw-bold mb-1">{title}</h3>
                <p className="text-secondary mb-0">{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
