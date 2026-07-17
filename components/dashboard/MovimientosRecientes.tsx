"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import type { Movimiento } from "@/lib/movimientos-store";

type Props = {
  movimientos: Movimiento[];
  loading?: boolean;
  limite?: number;
};

function formatMoney(value: number): string {
  const sign = value < 0 ? "-" : "";

  return `${sign}$${Math.abs(value).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatFechaCorta(fecha: string): string {
  const [anio, mes, dia] = fecha
    .split("-")
    .map(Number);

  if (!anio || !mes || !dia) {
    return fecha;
  }

  return new Intl.DateTimeFormat("es-PA", {
    day: "numeric",
    month: "short",
  }).format(new Date(anio, mes - 1, dia));
}

export default function MovimientosRecientes({
  movimientos,
  loading = false,
  limite = 5,
}: Props) {
  const recientes = [...movimientos]
    .sort((a, b) => {
      if (a.fecha !== b.fecha) {
        return a.fecha < b.fecha ? 1 : -1;
      }

      return a.id < b.id ? 1 : -1;
    })
    .slice(0, limite);

  return (
    <section className="rounded-2xl border border-line bg-surface-raised">
      <div className="flex items-center justify-between border-b border-line px-4 py-4 sm:px-5">
        <div>
          <h2 className="font-serif text-xl font-semibold text-text">
            Movimientos recientes
          </h2>

          <p className="mt-0.5 text-xs text-text-muted">
            Los últimos {limite} del mes
          </p>
        </div>

        <Link
          href="/movimientos"
          className="flex items-center gap-1 text-sm font-medium text-gold transition hover:opacity-80"
        >
          Ver todos
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <p className="px-5 py-8 text-center text-sm text-text-muted">
          Cargando...
        </p>
      ) : recientes.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-text-muted">
          Todavía no hay movimientos este mes.
        </p>
      ) : (
        <div>
          {recientes.map((movimiento) => {
            const esIngreso =
              movimiento.tipo === "ingreso";

            const monto =
              Number(movimiento.monto) || 0;

            return (
              <div
                key={movimiento.id}
                className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 sm:px-5"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    esIngreso
                      ? "bg-sage-soft text-sage"
                      : "bg-rust-soft text-rust"
                  }`}
                >
                  {esIngreso ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {movimiento.descripcion ||
                      "Sin descripción"}
                  </p>

                  <p className="mt-0.5 text-xs text-text-muted">
                    {formatFechaCorta(
                      movimiento.fecha
                    )}{" "}
                    ·{" "}
                    {movimiento.categoria ||
                      "Sin categoría"}
                  </p>
                </div>

                <p
                  className={`whitespace-nowrap font-mono text-sm font-medium ${
                    esIngreso
                      ? "text-sage"
                      : "text-rust"
                  }`}
                >
                  {formatMoney(
                    esIngreso ? monto : -monto
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
