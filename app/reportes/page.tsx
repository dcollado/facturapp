"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PieItem = {
  label: string;
  value: number;
};

type MonthOption = {
  value: string;
  label: string;
};

type ReportesResponse = {
  success: boolean;
  data: {
    filters: {
      years: string[];
      months: MonthOption[];
      categories: string[];
      tipos: string[];
    };
    resumen: {
      totalGeneral: number;
      totalFacturas: number;
    };
    pieCategorias: PieItem[];
    pieTipos: PieItem[];
  };
  message?: string;
};

function money(value: number) {
  return new Intl.NumberFormat("es-PA", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

const PIE_COLORS = [
  "#4f46e5",
  "#7c3aed",
  "#2563eb",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#0891b2",
  "#ca8a04",
];

function PieChart({
  title,
  items,
}: {
  title: string;
  items: PieItem[];
}) {
  const total = items.reduce((acc, item) => acc + item.value, 0);

  const segments = useMemo(() => {
    if (!items.length || total <= 0) return [];

    let cumulative = 0;

    return items.map((item, index) => {
      const percentage = item.value / total;
      const start = cumulative;
      const end = cumulative + percentage;
      cumulative = end;

      return {
        ...item,
        color: PIE_COLORS[index % PIE_COLORS.length],
        start,
        end,
      };
    });
  }, [items, total]);

  function describeArc(start: number, end: number) {
    const cx = 90;
    const cy = 90;
    const r = 78;

    const startAngle = start * Math.PI * 2 - Math.PI / 2;
    const endAngle = end * Math.PI * 2 - Math.PI / 2;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const largeArcFlag = end - start > 0.5 ? 1 : 0;

    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  }

  return (
    <section style={styles.sectionBox}>
      <h3 style={styles.sectionTitle}>{title}</h3>

      {items.length === 0 || total === 0 ? (
        <p style={styles.emptyText}>No hay datos para mostrar.</p>
      ) : (
        <div style={styles.chartLayout}>
          <div style={styles.chartWrap}>
            <svg width="210" height="210" viewBox="0 0 180 180">
              {segments.map((segment) => (
                <path
                  key={segment.label}
                  d={describeArc(segment.start, segment.end)}
                  fill={segment.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              ))}
              <circle cx="90" cy="90" r="42" fill="#ffffff" />
              <text
                x="90"
                y="84"
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                Total
              </text>
              <text
                x="90"
                y="98"
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#0f172a"
              >
                {money(total)}
              </text>
            </svg>
          </div>

          <div style={styles.legend}>
            {items.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;

              return (
                <div key={item.label} style={styles.legendRow}>
                  <div style={styles.legendLeft}>
                    <span
                      style={{
                        ...styles.legendDot,
                        background: PIE_COLORS[index % PIE_COLORS.length],
                      }}
                    />
                    <span style={styles.legendLabel}>{item.label}</span>
                  </div>

                  <div style={styles.legendRight}>
                    <span style={styles.legendValue}>{money(item.value)}</span>
                    <span style={styles.legendPercent}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default function ReportesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [category, setCategory] = useState("");
  const [tipo, setTipo] = useState("");

  const [years, setYears] = useState<string[]>([]);
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);

  const [totalGeneral, setTotalGeneral] = useState(0);
  const [totalFacturas, setTotalFacturas] = useState(0);
  const [pieCategorias, setPieCategorias] = useState<PieItem[]>([]);
  const [pieTipos, setPieTipos] = useState<PieItem[]>([]);

  useEffect(() => {
    async function loadReportes() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        if (year) params.set("year", year);
        if (month) params.set("month", month);
        if (category) params.set("category", category);
        if (tipo) params.set("tipo", tipo);

        const res = await fetch(`/api/reportes?${params.toString()}`, {
          cache: "no-store",
        });

        const json: ReportesResponse = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || "No se pudieron cargar los reportes");
        }

        setYears(json.data.filters.years);
        setMonths(json.data.filters.months);
        setCategories(json.data.filters.categories);
        setTipos(json.data.filters.tipos);

        setTotalGeneral(json.data.resumen.totalGeneral);
        setTotalFacturas(json.data.resumen.totalFacturas);
        setPieCategorias(json.data.pieCategorias);
        setPieTipos(json.data.pieTipos);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      } finally {
        setLoading(false);
      }
    }

    loadReportes();
  }, [year, month, category, tipo]);

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Reportes</h1>
            <p style={styles.subtitle}>
              Visualiza tus gastos por categoría y tipo.
            </p>
          </div>

          <Link href="/facturas" style={styles.topButton}>
            Ver facturas
          </Link>
        </div>

        <section style={styles.sectionBox}>
          <h3 style={styles.sectionTitle}>Filtros</h3>

          <div style={styles.filtersGrid}>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={styles.input}
            >
              <option value="">Todos los años</option>
              {years.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={styles.input}
            >
              <option value="">Todos los meses</option>
              {months.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.input}
            >
              <option value="">Todas las categorías</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              style={styles.input}
            >
              <option value="">Todos los tipos</option>
              {tipos.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.buttonRow}>
            <button
              type="button"
              onClick={() => {
                setYear("");
                setMonth("");
                setCategory("");
                setTipo("");
              }}
              style={styles.secondaryButton}
            >
              Limpiar filtros
            </button>
          </div>
        </section>

        {loading ? (
          <p style={styles.stateText}>Cargando reportes...</p>
        ) : error ? (
          <div style={styles.errorBox}>{error}</div>
        ) : (
          <>
            <section style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <span style={styles.summaryLabel}>Total</span>
                <strong style={styles.summaryValue}>{money(totalGeneral)}</strong>
              </div>

              <div style={styles.summaryCard}>
                <span style={styles.summaryLabel}>Facturas</span>
                <strong style={styles.summaryValue}>{totalFacturas}</strong>
              </div>
            </section>

            <div style={styles.chartsGrid}>
              <PieChart title="Por categoría" items={pieCategorias} />
              <PieChart title="Por tipo" items={pieTipos} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: "8px",
  },
  card: {
    maxWidth: 1280,
    margin: "0 auto",
    background: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: 18,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    padding: 24,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: 15,
    color: "#334155",
  },
  topButton: {
    padding: "12px 18px",
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    textDecoration: "none",
    color: "#0f172a",
    background: "#f8fafc",
    fontWeight: 500,
  },
  sectionBox: {
    border: "1px solid #d1d5db",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    background: "#ffffff",
  },
  sectionTitle: {
    margin: "0 0 14px 0",
    fontSize: 20,
    fontWeight: 600,
    color: "#0f172a",
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 16,
  },
  input: {
    width: "100%",
    height: 42,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    padding: "0 14px",
    fontSize: 15,
    color: "#0f172a",
    background: "#ffffff",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
  },
  buttonRow: {
    marginTop: 16,
    display: "flex",
    gap: 12,
  },
  secondaryButton: {
    height: 44,
    padding: "0 18px",
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: 15,
    cursor: "pointer",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
    marginBottom: 20,
  },
  summaryCard: {
    border: "1px solid #d1d5db",
    borderRadius: 16,
    padding: 18,
    background: "#ffffff",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
  },
  summaryLabel: {
    display: "block",
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    color: "#0f172a",
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 20,
  },
  chartLayout: {
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    gap: 20,
    alignItems: "center",
  },
  chartWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  legend: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  legendRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingBottom: 10,
    borderBottom: "1px solid #e5e7eb",
  },
  legendLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: 14,
    color: "#0f172a",
  },
  legendRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  legendValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
  },
  legendPercent: {
    fontSize: 12,
    color: "#64748b",
  },
  stateText: {
    margin: 0,
    color: "#64748b",
    fontSize: 15,
  },
  emptyText: {
    margin: 0,
    color: "#64748b",
    fontSize: 15,
  },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: 14,
    borderRadius: 14,
    border: "1px solid #fecaca",
  },
};