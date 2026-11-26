"use client";

import { useId, useState } from "react";
import { money } from "@/app/types/management";
import styles from "./dashboard.module.css";

const shortMonth = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  timeZone: "UTC",
});
const longMonth = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const count = new Intl.NumberFormat("pt-BR");
const axisNumber = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function tickStep(max: number) {
  const target = Math.max(1, max / 3);
  const base = 10 ** Math.floor(Math.log10(target));
  return (
    (target <= base
      ? 1
      : target <= base * 2
        ? 2
        : target <= base * 5
          ? 5
          : 10) * base
  );
}

export default function MonthlyChart({
  title,
  metric,
  months,
  emptyMessage,
}: {
  title: string;
  metric: "received" | "likes";
  months: { month: string; received: string; likes: number }[];
  emptyMessage: string;
}) {
  const titleId = useId();
  const [selectedMonth, setSelectedMonth] = useState("");
  const values = months.map((month) => ({
    key: month.month,
    value: Number(month[metric]),
    date: new Date(`${month.month}-01T00:00:00Z`),
  }));
  const selected =
    values.find(({ key }) => key === selectedMonth) ?? values.at(-1);
  const max = Math.max(0, ...values.map(({ value }) => value));
  const step = tickStep(max);
  const format = (value: number) =>
    metric === "received" ? money(String(value)) : count.format(value);

  return (
    <article
      className={`${styles.chart} ${metric === "likes" ? styles.likesChart : ""}`}
      aria-labelledby={titleId}
    >
      <div className={styles.chartHeading}>
        <h3 id={titleId} className="h6 fw-semibold mb-0">
          {title}
        </h3>
        <span className={styles.chartIcon} aria-hidden="true">
          <i
            className={`bi bi-${metric === "received" ? "bar-chart-line" : "heart"}`}
          />
        </span>
      </div>
      {selected && (
        <p className={styles.chartSelection} aria-live="polite">
          <span>{format(selected.value)}</span>
          <small>{longMonth.format(selected.date)}</small>
        </p>
      )}
      <div className={styles.chartPlot}>
        <div className={styles.chartAxis} aria-hidden="true">
          {[3, 2, 1, 0].map((tick) => (
            <span key={tick}>{axisNumber.format(tick * step)}</span>
          ))}
        </div>
        <div className={styles.chartArea}>
          <div className={styles.chartLines} aria-hidden="true">
            {[3, 2, 1, 0].map((tick) => (
              <span key={tick} />
            ))}
          </div>
          <div className={styles.chartColumns}>
            {values.map(({ key, value, date }) => (
              <button
                key={key}
                type="button"
                className={styles.chartColumn}
                aria-pressed={selected?.key === key}
                aria-label={`${longMonth.format(date)}, ${format(value)}`}
                onClick={() => setSelectedMonth(key)}
              >
                <span className={styles.chartTrack} aria-hidden="true">
                  <span
                    className={styles.chartBar}
                    style={{ height: `${(value / (3 * step)) * 100}%` }}
                  />
                </span>
                <span className={styles.chartMonth}>
                  {shortMonth.format(date).replace(".", "")}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="small text-secondary mb-0">
        {max === 0
          ? emptyMessage
          : metric === "received"
            ? "Valores em reais, pela data do recebimento."
            : "Likes que ainda estão ativos."}
      </p>
    </article>
  );
}
