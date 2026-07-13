"use client";

import { useEffect, useMemo, useState } from "react";
import { categoriasFactura, categoriasIngreso } from "@/lib/facturas";
import type { ItemFijo } from "@/lib/items-fijos-store";
import {
  fieldBaseClass,
  fieldNormalClass,
  helperTextClass,
  labelClass,
  sectionCardClass,
} from "@/lib/ui";

type FormState = {
  label: string;
  tipo: "ingreso" | "gasto";
  monto: string;
  categoria: string;
};

const formVacio: FormState = { label: "", tipo: "gasto", monto: "", categoria: "" };

export default function ItemsFijosPage() {
  const [items, setItems] = useState<ItemFijo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [form, setForm] = useState<FormState>(formVacio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [itemAEliminar, setItemAEliminar] = useState<ItemFijo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categorias = form.tipo === "gasto" ? categoriasFactura : categoriasIngreso;

  const cargarItems = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/items-fijos");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "No se pudieron cargar los ítems fijos.");
      }
      setItems(data.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error cargando los ítems fijos."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarItems();
  }, []);

  const totalFijoIngresos = useMemo(
    () =>
      items
        .filter((i) => i.activo && i.tipo === "ingreso")
        .reduce((acc, i) => acc + i.monto, 0),
    [items]
  );
  const totalFijoGastos = useMemo(
    () =>
      items
        .filter((i) => i.activo && i.tipo === "gasto")
        .reduce((acc, i) => acc + i.monto, 0),
    [items]
  );

  const iniciarEdicion = (item: ItemFijo) => {
    setEditandoId(item.id);
    setForm({
      label: item.label,
      tipo: item.tipo,
      monto: String(item.monto),
      categoria: item.categoria,
    });
    setMensaje("");
    setError("");
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setForm(formVacio);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!form.label.trim() || !form.monto || !form.categoria) {
      setError("Completa nombre, monto y categoría.");
      return;
    }

    setGuardando(true);
    try {
      const url = editandoId ? `/api/items-fijos?id=${encodeURIComponent(editandoId)}` : "/api/items-fijos";
      const method = editandoId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "No se pudo guardar el ítem fijo.");
      }

      if (editandoId) {
        setItems((prev) => prev.map((i) => (i.id === editandoId ? data.data : i)));
        setMensaje("Ítem fijo actualizado correctamente.");
      } else {
        setItems((prev) => [...prev, data.data]);
        setMensaje("Ítem fijo agregado correctamente.");
      }

      setForm(formVacio);
      setEditandoId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error guardando.");
    } finally {
      setGuardando(false);
    }
  };

  const toggleActivo = async (item: ItemFijo) => {
    setError("");
    try {
      const res = await fetch(`/api/items-fijos?id=${encodeURIComponent(item.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: item.label,
          tipo: item.tipo,
          monto: String(item.monto),
          categoria: item.categoria,
          activo: !item.activo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "No se pudo actualizar el ítem fijo.");
      }
      setItems((prev) => prev.map((i) => (i.id === item.id ? data.data : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error actualizando.");
    }
  };

  const confirmarEliminar = async () => {
    if (!itemAEliminar) return;
    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/items-fijos?id=${encodeURIComponent(itemAEliminar.id)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "No se pudo eliminar el ítem fijo.");
      }
      setItems((prev) => prev.filter((i) => i.id !== itemAEliminar.id));
      setMensaje("Ítem fijo eliminado correctamente.");
      setItemAEliminar(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error eliminando.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-ink p-6">
      <div className="mx-auto max-w-4xl">
        <div className={sectionCardClass}>
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight text-text">
              Ítems fijos
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Salario, alquiler, préstamo, tarjeta — se configuran una vez y se
              generan automáticamente cada mes en el panel.
            </p>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-sage/30 bg-sage-soft px-4 py-3">
              <p className="text-xs font-medium text-sage">Ingresos fijos activos</p>
              <p className="mt-1 font-mono text-lg font-semibold text-sage">
                ${totalFijoIngresos.toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl border border-rust/30 bg-rust-soft px-4 py-3">
              <p className="text-xs font-medium text-rust">Gastos fijos activos</p>
              <p className="mt-1 font-mono text-lg font-semibold text-rust">
                ${totalFijoGastos.toFixed(2)}
              </p>
            </div>
          </div>

          {mensaje ? (
            <p className="mb-4 rounded-xl border border-sage/30 bg-sage-soft px-4 py-3 text-sm text-sage">
              {mensaje}
            </p>
          ) : null}
          {error ? (
            <p className="mb-4 rounded-xl border border-rust/30 bg-rust-soft px-4 py-3 text-sm text-rust">
              {error}
            </p>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="mb-6 flex flex-col gap-4 rounded-2xl border border-line bg-surface-raised p-4"
          >
            <div className="flex overflow-hidden rounded-xl border border-line">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, tipo: "gasto", categoria: "" }))}
                className={`flex-1 py-2 text-sm font-medium transition ${
                  form.tipo === "gasto" ? "bg-rust-soft text-rust" : "text-text-muted"
                }`}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, tipo: "ingreso", categoria: "" }))}
                className={`flex-1 py-2 text-sm font-medium transition ${
                  form.tipo === "ingreso" ? "bg-sage-soft text-sage" : "text-text-muted"
                }`}
              >
                Ingreso
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Nombre</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Ej. Salario, Alquiler"
                  className={`${fieldBaseClass} ${fieldNormalClass}`}
                />
              </div>
              <div>
                <label className={labelClass}>Monto mensual</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.monto}
                  onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
                  placeholder="0.00"
                  className={`${fieldBaseClass} ${fieldNormalClass} font-mono`}
                />
              </div>
              <div>
                <label className={labelClass}>Categoría</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                  className={`${fieldBaseClass} ${fieldNormalClass} appearance-none ${
                    form.categoria ? "text-text" : "text-text-muted"
                  }`}
                >
                  <option value="">Selecciona</option>
                  {categorias.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={guardando}
                className="rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Agregar ítem fijo"}
              </button>
              {editandoId ? (
                <button
                  type="button"
                  onClick={cancelarEdicion}
                  className="rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-medium text-text transition hover:border-gold hover:bg-surface-raised"
                >
                  Cancelar edición
                </button>
              ) : null}
            </div>
          </form>

          {loading ? (
            <p className={helperTextClass}>Cargando ítems fijos...</p>
          ) : items.length === 0 ? (
            <p className={helperTextClass}>Todavía no hay ítems fijos configurados.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
              <table className="min-w-full divide-y divide-line text-sm">
                <thead className="bg-surface-raised">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Nombre</th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Categoría</th>
                    <th className="px-4 py-3 text-right font-medium text-text-muted">Monto</th>
                    <th className="px-4 py-3 text-center font-medium text-text-muted">Activo</th>
                    <th className="px-4 py-3 text-right font-medium text-text-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((item) => (
                    <tr key={item.id} className="bg-surface">
                      <td className="px-4 py-3 text-text">{item.label}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            item.tipo === "ingreso"
                              ? "bg-sage-soft text-sage"
                              : "bg-rust-soft text-rust"
                          }`}
                        >
                          {item.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text">{item.categoria}</td>
                      <td className="px-4 py-3 text-right font-mono text-text">
                        ${item.monto.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleActivo(item)}
                          className={`rounded-full px-2 py-0.5 text-xs transition ${
                            item.activo
                              ? "bg-sage-soft text-sage"
                              : "border border-line text-text-muted"
                          }`}
                        >
                          {item.activo ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => iniciarEdicion(item)}
                            className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-text transition hover:border-gold hover:bg-surface-raised"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemAEliminar(item)}
                            className="rounded-xl border border-rust/40 bg-surface px-3 py-1.5 text-xs font-medium text-rust transition hover:bg-rust-soft"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {itemAEliminar ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-text">¿Eliminar ítem fijo?</h2>
            <p className="mt-2 text-sm text-text-muted">
              &quot;{itemAEliminar.label}&quot; dejará de generarse cada mes. Los
              movimientos ya generados en meses anteriores no se ven afectados.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setItemAEliminar(null)}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-text transition hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminar}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-xl bg-rust px-4 py-3 text-sm font-medium text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
