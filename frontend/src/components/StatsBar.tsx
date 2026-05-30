import type { DashboardSummary } from "../types";

interface Props {
  summary: DashboardSummary;
}

export function StatsBar({ summary }: Props) {
  const stats = [
    {
      label: "Active sensors",
      value: summary.online_sensors,
      suffix: `/ ${summary.total_sensors}`,
      tone: "neutral" as const,
    },
    {
      label: "Active alerts",
      value: summary.active_anomalies,
      suffix: "",
      tone: summary.active_anomalies > 0 ? ("alert" as const) : ("neutral" as const),
    },
    {
      label: "Critical",
      value: summary.critical_anomalies,
      suffix: "",
      tone: summary.critical_anomalies > 0 ? ("critical" as const) : ("neutral" as const),
    },
    {
      label: "Low battery",
      value: summary.low_battery_sensors,
      suffix: "",
      tone: summary.low_battery_sensors > 0 ? ("warning" as const) : ("neutral" as const),
    },
  ];

  return (
    <section className="stats-bar" aria-label="Dashboard summary">
      {stats.map((stat) => (
        <article key={stat.label} className={`stat-card tone-${stat.tone}`}>
          <span className="stat-label">{stat.label}</span>
          <p className="stat-value">
            {stat.value}
            {stat.suffix && <span className="stat-suffix">{stat.suffix}</span>}
          </p>
        </article>
      ))}
    </section>
  );
}
