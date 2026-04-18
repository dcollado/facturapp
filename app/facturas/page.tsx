"use client";

import { useEffect, useMemo, useState } from "react";
import type { Factura } from "@/lib/facturas-store";
import {
  fieldBaseClass,
  fieldNormalClass,
  helperTextClass,
  labelClass,
  sectionCardClass,
} from "@/lib/ui";

export default function FacturasPage() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [mesFiltro, setMesFiltro] = useState("");
  const [anioFiltro, setAnioFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");

  const [facturaAEliminar, setFacturaAEliminar] = useState<Factura | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const cargarFacturas = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/facturas");
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "No se pudieron cargar las facturas.");
      }

      setFacturas(data.data ?? []);
    } catch (err) {
      console.error("Error cargando facturas:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error cargando las facturas."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFacturas();
  }, []);

  const facturasFiltradas = useMemo(() => {
    return facturas.filter((factura) => {
      const matchMes = mesFiltro ? factura.mes === mesFiltro : true;
      const matchAnio = anioFiltro ? factura.anio === anioFiltro : true;
      const matchTipo = tipoFiltro ? factura.tipo === tipoFiltro : true;
      const matchCategoria = categoriaFiltro
        ? factura.categoria === categoriaFiltro
        : true;

      return matchMes && matchAnio && matchTipo && matchCategoria;
    });
  }, [facturas, mesFiltro, anioFiltro, tipoFiltro, categoriaFiltro]);

  const meses = Array.from(new Set(facturas.map((f) => f.mes).filter(Boolean))).sort();
  const anios = Array.from(new Set(facturas.map((f) => f.anio).filter(Boolean))).sort();
  const tipos = Array.from(new Set(facturas.map((f) => f.tipo).filter(Boolean))).sort();
  const categorias = Array.from(
    new Set(facturas.map((f) => f.categoria).filter(Boolean))
  ).sort();

  const confirmarEliminar = async () => {
    if (!facturaAEliminar) return;

    setIsDeleting(true);
    setError("");
    setMensaje("");

    try {
      const res = await fetch(
        `/api/facturas?id=${encodeURIComponent(facturaAEliminar.id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "No se pudo eliminar la factura.");
      }

      setFacturas((prev) =>
        prev.filter((factura) => factura.id !== facturaAEliminar.id)
      );

      setMensaje("Factura eliminada correctamente.");
      setFacturaAEliminar(null);
    } catch (err) {
      console.error("Error eliminando factura:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error eliminando la factura."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className={sectionCardClass}>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Facturas
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Consulta, filtra y elimina facturas guardadas.
              </p>
            </div>

            <a
              href="/nueva_factura"
              className="hidden rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-400 hover:bg-slate-50 md:inline-flex"
            >
              Nueva factura
            </a>
          </div>

          {mensaje ? (
            <p className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {mensaje}
            </p>
          ) : null}

          {error ? (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div>
              <label className={labelClass}>Mes</label>
              <select
                value={mesFiltro}
                onChange={(e) => setMesFiltro(e.target.value)}
                className={`${fieldBaseClass} ${fieldNormalClass} appearance-none`}
              >
                <option value="">Todos</option>
                {meses.map((mes) => (
                  <option key={mes} value={mes}>
                    {mes}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Año</label>
              <select
                value={anioFiltro}
                onChange={(e) => setAnioFiltro(e.target.value)}
                className={`${fieldBaseClass} ${fieldNormalClass} appearance-none`}
              >
                <option value="">Todos</option>
                {anios.map((anio) => (
                  <option key={anio} value={anio}>
                    {anio}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Tipo</label>
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                className={`${fieldBaseClass} ${fieldNormalClass} appearance-none`}
              >
                <option value="">Todos</option>
                {tipos.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Categoría</label>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className={`${fieldBaseClass} ${fieldNormalClass} appearance-none`}
              >
                <option value="">Todas</option>
                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className={helperTextClass}>Cargando facturas...</p>
          ) : facturasFiltradas.length === 0 ? (
            <p className={helperTextClass}>No hay facturas para mostrar.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Proveedor</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Monto</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Categoría</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">No. factura</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">RUC</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {facturasFiltradas.map((factura) => (
                    <tr key={factura.id} className="bg-white">
                      <td className="px-4 py-3 text-slate-700">{factura.fecha}</td>
                      <td className="px-4 py-3 text-slate-700">{factura.proveedor}</td>
                      <td className="px-4 py-3 text-slate-700">{factura.monto}</td>
                      <td className="px-4 py-3 text-slate-700">{factura.categoria}</td>
                      <td className="px-4 py-3 text-slate-700">{factura.tipo}</td>
                      <td className="px-4 py-3 text-slate-700">{factura.numeroFactura ?? ""}</td>
                      <td className="px-4 py-3 text-slate-700">{factura.ruc ?? ""}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setFacturaAEliminar(factura)}
                          className="inline-flex items-center justify-center rounded-xl border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {facturaAEliminar ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              ¿Eliminar factura?
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Esta acción eliminará la factura de Google Sheets y no se puede deshacer.
            </p>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                <span className="font-medium">Proveedor:</span>{" "}
                {facturaAEliminar.proveedor || "Sin proveedor"}
              </p>
              <p className="mt-1">
                <span className="font-medium">Fecha:</span> {facturaAEliminar.fecha}
              </p>
              <p className="mt-1">
                <span className="font-medium">Monto:</span> {facturaAEliminar.monto}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setFacturaAEliminar(null)}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarEliminar}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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