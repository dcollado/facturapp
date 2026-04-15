"use client";

import { useEffect, useMemo, useState } from "react";
import type { Factura } from "@/lib/facturas-store";
import { categoriasFactura, tiposFactura } from "@/lib/facturas";

function normalizarMes(valor: string) {
  const limpio = String(valor ?? "").trim().toLowerCase();

  const mapa: Record<string, string> = {
    "1": "01",
    "01": "01",
    enero: "01",
    "2": "02",
    "02": "02",
    febrero: "02",
    "3": "03",
    "03": "03",
    marzo: "03",
    "4": "04",
    "04": "04",
    abril: "04",
    "5": "05",
    "05": "05",
    mayo: "05",
    "6": "06",
    "06": "06",
    junio: "06",
    "7": "07",
    "07": "07",
    julio: "07",
    "8": "08",
    "08": "08",
    agosto: "08",
    "9": "09",
    "09": "09",
    septiembre: "09",
    setiembre: "09",
    "10": "10",
    octubre: "10",
    "11": "11",
    noviembre: "11",
    "12": "12",
    diciembre: "12",
  };

  return mapa[limpio] || limpio;
}

function nombreMes(mes: string) {
  const meses: Record<string, string> = {
    "01": "Enero",
    "02": "Febrero",
    "03": "Marzo",
    "04": "Abril",
    "05": "Mayo",
    "06": "Junio",
    "07": "Julio",
    "08": "Agosto",
    "09": "Septiembre",
    "10": "Octubre",
    "11": "Noviembre",
    "12": "Diciembre",
  };

  return meses[normalizarMes(mes)] || mes;
}

export default function FacturasPage() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroAnio, setFiltroAnio] = useState("");

  useEffect(() => {
    const cargarFacturas = async () => {
      try {
        const res = await fetch("/api/facturas");
        const data = await res.json();
        setFacturas(data.data ?? []);
      } catch (error) {
        console.error("Error cargando facturas:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarFacturas();
  }, []);

  const aniosDisponibles = useMemo(() => {
    return Array.from(
      new Set(facturas.map((f) => String(f.anio ?? "").trim()).filter(Boolean))
    ).sort((a, b) => b.localeCompare(a));
  }, [facturas]);

  const categoriasDisponibles = useMemo(() => {
    const categoriasEnFacturas = Array.from(
      new Set(
        facturas.map((f) => String(f.categoria ?? "").trim()).filter(Boolean)
      )
    );

    return categoriasFactura.filter((categoria) =>
      categoriasEnFacturas.includes(categoria)
    );
  }, [facturas]);

  const facturasFiltradas = useMemo(() => {
    return facturas.filter((factura) => {
      const tipo = String(factura.tipo ?? "").trim();
      const categoria = String(factura.categoria ?? "").trim();
      const mes = normalizarMes(String(factura.mes ?? ""));
      const anio = String(factura.anio ?? "").trim();

      const okTipo = filtroTipo ? tipo === filtroTipo : true;
      const okCategoria = filtroCategoria ? categoria === filtroCategoria : true;
      const okMes = filtroMes ? mes === filtroMes : true;
      const okAnio = filtroAnio ? anio === filtroAnio : true;

      return okTipo && okCategoria && okMes && okAnio;
    });
  }, [facturas, filtroTipo, filtroCategoria, filtroMes, filtroAnio]);

  const totalFiltrado = useMemo(() => {
    return facturasFiltradas.reduce((acc, f) => {
      return acc + (Number(f.monto) || 0);
    }, 0);
  }, [facturasFiltradas]);

  const categoriasUsadas = useMemo(() => {
    return new Set(facturasFiltradas.map((f) => f.categoria)).size;
  }, [facturasFiltradas]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">
                Historial de facturas
              </h1>
              <p className="mt-3 text-slate-600">
                Consulta, filtra y revisa todas tus facturas.
              </p>
            </div>

            
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5">
            <p className="text-sm text-indigo-600">Total facturas</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "..." : facturasFiltradas.length}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
            <p className="text-sm text-blue-600">Monto</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "..." : `$${totalFiltrado.toFixed(2)}`}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-5">
            <p className="text-sm text-purple-600">Categorías</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "..." : categoriasUsadas}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>
            <p className="mt-1 text-sm text-slate-600">
              Refina el listado por tipo, categoría, mes y año.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label
                htmlFor="filtro-tipo"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Tipo
              </label>
              <select
                id="filtro-tipo"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition outline-none hover:border-indigo-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">Todos los tipos</option>
                {tiposFactura.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filtro-categoria"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Categoría
              </label>
              <select
                id="filtro-categoria"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition outline-none hover:border-indigo-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">Todas las categorías</option>
                {categoriasDisponibles.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filtro-mes"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Mes
              </label>
              <select
                id="filtro-mes"
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition outline-none hover:border-indigo-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">Todos los meses</option>
                <option value="01">Enero</option>
                <option value="02">Febrero</option>
                <option value="03">Marzo</option>
                <option value="04">Abril</option>
                <option value="05">Mayo</option>
                <option value="06">Junio</option>
                <option value="07">Julio</option>
                <option value="08">Agosto</option>
                <option value="09">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="filtro-anio"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Año
              </label>
              <select
                id="filtro-anio"
                value={filtroAnio}
                onChange={(e) => setFiltroAnio(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition outline-none hover:border-indigo-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="">Todos los años</option>
                {aniosDisponibles.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

  {loading ? (
    <div className="p-6 text-sm text-slate-500">Cargando...</div>
  ) : facturasFiltradas.length === 0 ? (
    <div className="p-6 text-sm text-slate-500">
      No hay facturas
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">

        {/* HEADER */}
        <thead className="bg-gradient-to-r from-slate-50 to-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Proveedor</th>
            <th className="px-4 py-3">Monto</th>
            <th className="px-4 py-3">Categoría</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Mes</th>
            <th className="px-4 py-3">Año</th>
          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {facturasFiltradas.map((f) => (
            <tr
              key={f.id}
              className="border-t border-slate-200 transition hover:bg-indigo-50/40"
            >
              {/* FECHA */}
              <td className="px-4 py-3 text-slate-700">
                {f.fecha}
              </td>

              {/* PROVEEDOR */}
              <td className="px-4 py-3 font-medium text-slate-900">
                {f.proveedor}
              </td>

              {/* MONTO */}
              <td className="px-4 py-3 font-semibold text-slate-900">
                ${Number(f.monto).toFixed(2)}
              </td>

              {/* CATEGORÍA */}
              <td className="px-4 py-3">
                <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">
                  {f.categoria}
                </span>
              </td>

              {/* TIPO */}
              <td className="px-4 py-3 text-slate-700">
                {f.tipo}
              </td>

              {/* MES */}
              <td className="px-4 py-3 text-slate-700">
                {nombreMes(f.mes)}
              </td>

              {/* AÑO */}
              <td className="px-4 py-3 text-slate-700">
                {f.anio}
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  )}

</section>
      </div>
    </main>
  );
}