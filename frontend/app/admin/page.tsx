"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_URL } from "@/app/api";
import RefreshButton from "@/app/components/RefreshButton";
import { useSession } from "@/app/components/SessionProvider";
import { authenticatedFetch } from "@/app/login/auth_service";
import { money } from "@/app/types/management";
import MonthlyChart from "./MonthlyChart";
import styles from "./dashboard.module.css";

type DashboardSummary = {
  totalReceived: string;
  totalLikes: number;
  months: { month: string; received: string; likes: number }[];
  publishedServices: number;
  activeProjects: number;
  contacts: number;
  linkedClients: number;
  mostLiked: {
    id: number;
    title: string;
    category: string;
    published: boolean;
    likes: number;
  } | null;
};

const count = new Intl.NumberFormat("pt-BR");

export default function Admin() {
  const { user } = useSession();
  if (!user) return null;
  return <FreelancerDashboard key={user.id} name={user.name} />;
}

function FreelancerDashboard({ name }: { name: string }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadSummary() {
      try {
        const response = await authenticatedFetch(
          `${API_URL.replace(/\/$/, "")}/dashboard/summary`,
          {
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(15000),
            ]),
          },
        );
        if (!response.ok) throw new Error();
        const result: DashboardSummary = await response.json();
        if (!controller.signal.aborted) setSummary(result);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadSummary();
    return () => controller.abort();
  }, [revision]);

  function refresh() {
    setError(false);
    setLoading(true);
    setRevision((value) => value + 1);
  }

  return (
    <section className={styles.dashboard} aria-labelledby="workspace-title">
      <header className={`${styles.header} mb-4`}>
        <div>
          <p className="section-label mb-2">Área do freelancer</p>
          <h1 id="workspace-title" className="h2 fw-bold mb-1 text-break">
            Olá, {name}.
          </h1>
          <p className="text-secondary mb-0">
            Acompanhe seus recebimentos e a atividade dos seus anúncios.
          </p>
        </div>
        <RefreshButton
          label="Atualizar estatísticas"
          loading={loading}
          onClick={refresh}
        />
      </header>

      {loading && !summary && (
        <div className="card card-body p-4 text-secondary" role="status">
          Carregando estatísticas...
        </div>
      )}
      {error && (
        <div
          className="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2"
          role="alert"
        >
          <span>
            Não foi possível carregar as estatísticas.{" "}
            {summary && "Os últimos dados carregados continuam abaixo."}
          </span>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={refresh}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {summary && <DashboardContent summary={summary} />}
    </section>
  );
}

function DashboardContent({ summary }: { summary: DashboardSummary }) {
  const revenue = [
    {
      label: "Recebido neste mês",
      value: summary.months.at(-1)?.received ?? "0",
      icon: "calendar-check",
    },
    {
      label: "Recebido no mês passado",
      value: summary.months.at(-2)?.received ?? "0",
      icon: "calendar2",
    },
    { label: "Total recebido", value: summary.totalReceived, icon: "wallet2" },
  ];
  const activity = [
    {
      label: "Anúncios publicados",
      value: summary.publishedServices,
      icon: "megaphone",
    },
    {
      label: "Projetos em andamento",
      value: summary.activeProjects,
      icon: "folder2-open",
    },
    {
      label: "Contatos na agenda",
      value: summary.contacts,
      icon: "person-lines-fill",
    },
    {
      label: "Clientes com conta vinculada",
      value: summary.linkedClients,
      icon: "people",
    },
  ];

  return (
    <>
      <section className="mb-4" aria-labelledby="revenue-title">
        <h2 id="revenue-title" className="h5 fw-semibold mb-3">
          Resumo financeiro
        </h2>
        <dl className={`${styles.revenue} mb-0`}>
          {revenue.map(({ label, value, icon }) => (
            <div className={styles.metric} key={label}>
              <dt>
                {label}
                <i className={`bi bi-${icon}`} aria-hidden="true" />
              </dt>
              <dd>{money(value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mb-4" aria-labelledby="movements-title">
        <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-1 mb-3">
          <h2 id="movements-title" className="h5 fw-semibold mb-0">
            Movimento
          </h2>
          <span className="small text-secondary">Últimos 6 meses</span>
        </div>
        <div className={styles.charts}>
          <MonthlyChart
            title="Recebimentos"
            metric="received"
            months={summary.months}
            emptyMessage="Nenhum recebimento no período."
          />
          <MonthlyChart
            title="Likes recebidos"
            metric="likes"
            months={summary.months}
            emptyMessage="Nenhum like ativo no período."
          />
        </div>
      </section>

      <section aria-labelledby="activity-title">
        <h2 id="activity-title" className="h5 fw-semibold mb-3">
          Atividade
        </h2>
        <div className={styles.activity}>
          <dl className={`${styles.activityCounts} mb-0`}>
            {activity.map(({ label, value, icon }) => (
              <div key={label}>
                <dt>
                  <i className={`bi bi-${icon}`} aria-hidden="true" />
                  {label}
                </dt>
                <dd>{count.format(value)}</dd>
              </div>
            ))}
          </dl>
          <section
            className={styles.highlight}
            aria-labelledby="highlight-title"
          >
            <span className={styles.heart} aria-hidden="true">
              <i className="bi bi-heart-fill" />
            </span>
            <h3 id="highlight-title" className="h6 fw-semibold mb-2">
              Anúncio mais curtido
            </h3>
            {summary.mostLiked ? (
              <>
                <p className="fw-semibold mb-1 text-break">
                  {summary.mostLiked.published ? (
                    <Link
                      href={`/services/${summary.mostLiked.id}`}
                      className={styles.highlightLink}
                    >
                      {summary.mostLiked.title}
                    </Link>
                  ) : (
                    summary.mostLiked.title
                  )}
                </p>
                <p className="small text-secondary mb-3 text-break">
                  {summary.mostLiked.category}
                </p>
                <p className="mb-0">
                  <strong>{count.format(summary.mostLiked.likes)}</strong> neste
                  anúncio
                  <span className="text-secondary">
                    {" "}
                    · {count.format(summary.totalLikes)} no total
                  </span>
                </p>
              </>
            ) : (
              <p className="text-secondary small mb-0">
                Seus anúncios ainda não receberam likes.
              </p>
            )}
          </section>
        </div>
      </section>
    </>
  );
}
