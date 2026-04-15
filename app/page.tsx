"use client";

import { useEffect, useMemo, useState } from "react";
import type { Factura } from "@/lib/facturas-store";

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

export default function Home() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarFacturas = async () => {
      try {
        const res = await fetch("/api/facturas");
        const data = await res.json();
        setFacturas(data.data ?? []);
      } catch (error) {
        console.error("Error cargando facturas del home:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarFacturas();
  }, []);

  const ahora = new Date();
  const mesActual = String(ahora.getMonth() + 1).padStart(2, "0");
  const anioActual = String(ahora.getFullYear());

  const facturasEsteMes = useMemo(() => {
    return facturas.filter((factura) => {
      const mesFactura = normalizarMes(String(factura.mes ?? ""));
      const anioFactura = String(factura.anio ?? "").trim();

      return mesFactura === mesActual && anioFactura === anioActual;
    });
  }, [facturas, mesActual, anioActual]);

  const totalAcumulado = useMemo(() => {
    return facturas.reduce((acc, factura) => {
      return acc + (Number(factura.monto) || 0);
    }, 0);
  }, [facturas]);

  const categoriasActivas = useMemo(() => {
    return new Set(
      facturas
        .map((factura) => String(factura.categoria ?? "").trim())
        .filter(Boolean)
    ).size;
  }, [facturas]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Organiza tus facturas sin enredarte
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Guarda facturas, clasifícalas por tipo, mes y año, y ten todo
            ubicado en un solo lugar.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/nueva_factura"
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Registrar factura
            </a>

            <a
              href="/facturas"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-400 hover:bg-slate-50"
            >
              Ver historial
            </a>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
            <p className="text-sm font-medium text-indigo-600">
              Facturas este mes
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "..." : facturasEsteMes.length}
            </p>
            <p className="mt-1 text-xs text-indigo-400">
              {mesActual}/{anioActual}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <p className="text-sm font-medium text-blue-600">
              Total acumulado
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "..." : `$${totalAcumulado.toFixed(2)}`}
            </p>
            <p className="mt-1 text-xs text-blue-400">
              Suma de todas las facturas
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-5 shadow-sm">
            <p className="text-sm font-medium text-purple-600">
              Categorías activas
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "..." : categoriasActivas}
            </p>
            <p className="mt-1 text-xs text-purple-400">
              Categorías utilizadas
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <a
            href="/nueva_factura"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              ➕ Nueva factura
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Registra una factura manualmente o sube una imagen.
            </p>
          </a>

          <a
            href="/facturas"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              📄 Ver facturas
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Consulta, filtra y revisa todas tus facturas.
            </p>
          </a>
        </section>
      </div>
    </main>
  );
}