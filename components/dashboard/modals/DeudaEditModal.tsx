"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Deuda } from "@/lib/deudas";
import {
  fieldBaseClass,
  fieldNormalClass,
  labelClass,
} from "@/lib/ui";

type Props = {
  deuda: Deuda;
  onClose: () => void;
  onSaved: (deuda: Deuda) => void;
};

export default function DeudaEditModal({ deuda, onClose, onSaved }: Props) {
  const [pagoMensual, setPagoMensual] = useState(String(deuda.pagoMensual));
  const [tasaInteres, setTasaInteres] = useState(
    deuda.tasaInteres != null ? String(deuda.tasaInteres) : ""
  );
  const [totalAPagar, setTotalAPagar] = useState(String(deuda.totalAPagar ?? ""));
  const [totalPagado, setTotalPagado] = useState(String(deuda.totalPagado ?? ""));
  const [nota, setNota] = useState(deuda.nota || "");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const mensual = Number(pagoMensual);
    const tasaTrim = tasaInteres.trim();
    const tasa = tasaTrim === "" ? null : Number(tasaTrim);
    const total = Number(totalAPagar);
    const pagado = Number(totalPagado);

    if (!Number.isFinite(mensual) || mensual <= 0) {
      setError("El pago mensual debe ser mayor que cero.");
      return;
    }
    if (tasa !== null && (!Number.isFinite(tasa) || tasa < 0)) {
      setError("La tasa de interés no puede ser negativa.");
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      setError("El total a pagar debe ser mayor que cero.");
      return;
    }
    if (!Number.isFinite(pagado) || pagado < 0) {
      setError("Lo pagado no puede ser negativo.");
      return;
    }
    if (pagado > total) {
      setError("Lo pagado no puede ser mayor que el total a pagar.");
      return;
    }

    const actualizada: Deuda = {
      ...deuda,
      pagoMensual: mensual,
      tasaInteres: tasa,
      totalAPagar: total,
      totalPagado: pagado,
      nota: nota.trim(),
    };

    setGuardando(true);
    try {
      const res = await fetch(`/api/deudas?id=${encodeURIComponent(deuda.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actualizada),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "No se pudo guardar.");
      }
      onSaved(actualizada);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error guardando.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-line bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Editar — {deuda.label}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-text-muted hover:text-gold">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Total a pagar</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={totalAPagar}
                onChange={(e) => setTotalAPagar(e.target.value)}
                className={`${fieldBaseClass} ${fieldNormalClass} font-mono`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Pagado hasta ahora</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={totalPagado}
                onChange={(e) => setTotalPagado(e.target.value)}
                className={`${fieldBaseClass} ${fieldNormalClass} font-mono`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Pago mensual</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={pagoMensual}
                onChange={(e) => setPagoMensual(e.target.value)}
                className={`${fieldBaseClass} ${fieldNormalClass} font-mono`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Tasa de interés anual % (opcional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={tasaInteres}
                onChange={(e) => setTasaInteres(e.target.value)}
                className={`${fieldBaseClass} ${fieldNormalClass} font-mono`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Nota (opcional)</label>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className={`${fieldBaseClass} ${fieldNormalClass}`}
            />
          </div>

          {error ? <p className="text-xs text-rust">{error}</p> : null}

          <button
            type="submit"
            disabled={guardando}
            className="mt-1 rounded-xl bg-gold py-2.5 text-sm font-semibold text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
