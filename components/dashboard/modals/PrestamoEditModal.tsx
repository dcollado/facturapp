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

export default function PrestamoEditModal({ deuda, onClose, onSaved }: Props) {
  const [pagoMensual, setPagoMensual] = useState(String(deuda.pagoMensual));
  const [tasaInteres, setTasaInteres] = useState(
    deuda.tasaInteres != null ? String(deuda.tasaInteres) : ""
  );
  const [montoDesembolsado, setMontoDesembolsado] = useState(
    deuda.montoDesembolsado != null ? String(deuda.montoDesembolsado) : ""
  );
  const [fechaDesembolso, setFechaDesembolso] = useState(deuda.fechaDesembolso || "");
  const [fechaPrimerPago, setFechaPrimerPago] = useState(deuda.fechaPrimerPago || "");
  const [fechaVencimiento, setFechaVencimiento] = useState(deuda.fechaVencimiento || "");
  const [plazoMeses, setPlazoMeses] = useState(
    deuda.plazoMeses != null ? String(deuda.plazoMeses) : ""
  );
  const [saldoActual, setSaldoActual] = useState(
    deuda.saldoActual != null ? String(deuda.saldoActual) : ""
  );
  const [saldoTotal, setSaldoTotal] = useState(
    deuda.saldoTotal != null ? String(deuda.saldoTotal) : ""
  );
  const [cargosPagados, setCargosPagados] = useState(
    deuda.cargosPagados != null ? String(deuda.cargosPagados) : ""
  );
  const [cargosPendientes, setCargosPendientes] = useState(
    deuda.cargosPendientes != null ? String(deuda.cargosPendientes) : ""
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
    const desembolsoTrim = montoDesembolsado.trim();
    const saldoActualTrim = saldoActual.trim();

    if (!Number.isFinite(mensual) || mensual <= 0) {
      setError("El pago mensual debe ser mayor que cero.");
      return;
    }
    if (tasa !== null && (!Number.isFinite(tasa) || tasa < 0)) {
      setError("La tasa de interés no puede ser negativa.");
      return;
    }
    if (desembolsoTrim !== "" && saldoActualTrim === "") {
      setError("Si pones el monto desembolsado, agrega también el saldo actual.");
      return;
    }
    if (desembolsoTrim === "" && saldoActualTrim !== "") {
      setError("Si pones el saldo actual, agrega también el monto desembolsado.");
      return;
    }

    const tieneDetalleBancario = desembolsoTrim !== "" && saldoActualTrim !== "";

    const total = Number(totalAPagar);
    const pagado = Number(totalPagado);
    if (!tieneDetalleBancario) {
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
    }

    const actualizada: Deuda = {
      ...deuda,
      pagoMensual: mensual,
      tasaInteres: tasa,
      nota: nota.trim(),
      totalAPagar: total,
      totalPagado: pagado,
      montoDesembolsado: tieneDetalleBancario ? Number(desembolsoTrim) : null,
      saldoActual: tieneDetalleBancario ? Number(saldoActualTrim) : null,
      fechaDesembolso: tieneDetalleBancario ? fechaDesembolso : "",
      fechaPrimerPago: tieneDetalleBancario ? fechaPrimerPago : "",
      fechaVencimiento: tieneDetalleBancario ? fechaVencimiento : "",
      plazoMeses: tieneDetalleBancario && plazoMeses.trim() !== "" ? Number(plazoMeses) : null,
      saldoTotal: tieneDetalleBancario && saldoTotal.trim() !== "" ? Number(saldoTotal) : null,
      cargosPagados:
        tieneDetalleBancario && cargosPagados.trim() !== "" ? Number(cargosPagados) : null,
      cargosPendientes:
        tieneDetalleBancario && cargosPendientes.trim() !== "" ? Number(cargosPendientes) : null,
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
        throw new Error(data.message || "No se pudo guardar el préstamo.");
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
        style={{ maxHeight: "85vh", overflowY: "auto" }}
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
                placeholder="Ej. 11"
                className={`${fieldBaseClass} ${fieldNormalClass} font-mono`}
              />
            </div>
          </div>

          <div className="border-t border-line pt-1">
            <span className="mb-2 mt-2 block text-[10px] font-medium uppercase tracking-wide text-text-muted">
              Detalle del banco (opcional, del estado de cuenta)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Monto desembolsado</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={montoDesembolsado}
                onChange={(e) => setMontoDesembolsado(e.target.value)}
                placeholder="Ej. 16835.95"
                className={`${fieldBaseClass} ${fieldNormalClass} font-mono`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Saldo actual (capital)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={saldoActual}
                onChange={(e) => setSaldoActual(e.target.value)}
                placeholder="Ej. 11458.84"
                className={`${fieldBaseClass} ${fieldNormalClass} font-mono`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Saldo total (con intereses y cargos)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={saldoTotal}
                onChange={(e) => setSaldoTotal(e.target.value)}
                placeholder="Ej. 11477.64"
                className={`${fieldBaseClass} ${fieldNormalClass} font-mono`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Plazo (meses)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={plazoMeses}
                onChange={(e) => setPlazoMeses(e.target.value)}
                placeholder="Ej. 143"
                className={`${fieldBaseClass} ${fieldNormalClass} font-mono`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Fecha de desembolso</label>
              <input
                type="date"
                value={fechaDesembolso}
                onChange={(e) => setFechaDesembolso(e.target.value)}
                className={`${fieldBaseClass} ${fieldNormalClass} font-mono`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Primer pago</label>
              <input
                type="date"
                value={fechaPrimerPago}
                onChange={(e) => setFechaPrimerPago(e.target.value)}
                className={`${fieldBaseClass} ${fieldNormalClass} font-mono`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Fecha de vencimiento</label>
            <input
              type="date"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              className={`${fieldBaseClass} ${fieldNormalClass} font-mono`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Cargos pagados</label>
              <input
                type="number"
                step="1"
                min="0"
                value={cargosPagados}
                onChange={(e) => setCargosPagados(e.target.value)}
                className={`${fieldBaseClass} ${fieldNormalClass} font-mono`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Cargos pendientes</label>
              <input
                type="number"
                step="1"
                min="0"
                value={cargosPendientes}
                onChange={(e) => setCargosPendientes(e.target.value)}
                className={`${fieldBaseClass} ${fieldNormalClass} font-mono`}
              />
            </div>
          </div>

          <div className="border-t border-line pt-1">
            <span className="mb-2 mt-2 block text-[10px] font-medium uppercase tracking-wide text-text-muted">
              Si no tienes el estado de cuenta
            </span>
          </div>

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
