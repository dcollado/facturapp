import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/google-sheets";

const SHEET_NAME = "Sheet1";

type Factura = {
  id: string;
  fecha: string;
  proveedor: string;
  monto: string;
  categoria: string;
  tipo: string;
  mes: string;
  anio: string;
  numeroFactura: string;
  ruc: string;
  notas: string;
};

type PieItem = {
  label: string;
  value: number;
};

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function parseMonto(value: string | undefined): number {
  if (!value) return 0;

  const limpio = String(value)
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .trim();

  const num = Number(limpio);
  return Number.isFinite(num) ? num : 0;
}

function normalizarMes(mes: string | undefined, fecha?: string): number {
  if (mes && /^\d+$/.test(mes)) {
    const n = Number(mes);
    if (n >= 1 && n <= 12) return n;
  }

  if (fecha) {
    const d = new Date(fecha);
    if (!Number.isNaN(d.getTime())) return d.getMonth() + 1;
  }

  return 0;
}

function normalizarAnio(anio: string | undefined, fecha?: string): number {
  if (anio && /^\d+$/.test(anio)) {
    const n = Number(anio);
    if (n >= 2000 && n <= 3000) return n;
  }

  if (fecha) {
    const d = new Date(fecha);
    if (!Number.isNaN(d.getTime())) return d.getFullYear();
  }

  return 0;
}

function mapRowToFactura(row: string[]): Factura {
  return {
    id: row[0] ?? "",
    fecha: row[1] ?? "",
    proveedor: row[2] ?? "",
    monto: row[3] ?? "",
    categoria: row[4] ?? "",
    tipo: row[5] ?? "",
    mes: row[6] ?? "",
    anio: row[7] ?? "",
    numeroFactura: row[8] ?? "",
    ruc: row[9] ?? "",
    notas: row[10] ?? "",
  };
}

function agrupar(items: Factura[], field: "categoria" | "tipo"): PieItem[] {
  const mapa: Record<string, number> = {};

  for (const item of items) {
    const key =
      (field === "categoria"
        ? item.categoria?.trim()
        : item.tipo?.trim()) || `Sin ${field}`;

    mapa[key] = (mapa[key] || 0) + parseMonto(item.monto);
  }

  return Object.entries(mapa)
    .map(([label, value]) => ({
      label,
      value: Number(value.toFixed(2)),
    }))
    .sort((a, b) => b.value - a.value);
}

export async function GET(request: NextRequest) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) {
      throw new Error("Falta GOOGLE_SHEET_ID en .env.local");
    }

    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year")?.trim() || "";
    const month = searchParams.get("month")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const tipo = searchParams.get("tipo")?.trim() || "";

    const sheets = await getSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!A:K`,
    });

    const rows = response.data.values ?? [];

    if (rows.length <= 1) {
      return NextResponse.json({
        success: true,
        data: {
          filters: {
            years: [],
            months: [],
            categories: [],
            tipos: [],
          },
          resumen: {
            totalGeneral: 0,
            totalFacturas: 0,
          },
          pieCategorias: [],
          pieTipos: [],
        },
      });
    }

    const facturasBase = rows.slice(1).map(mapRowToFactura);

    const facturas = facturasBase.map((f) => {
      const mesNum = normalizarMes(f.mes, f.fecha);
      const anioNum = normalizarAnio(f.anio, f.fecha);

      return {
        ...f,
        mes: mesNum ? String(mesNum) : "",
        anio: anioNum ? String(anioNum) : "",
      };
    });

    const years = Array.from(new Set(facturas.map((f) => f.anio).filter(Boolean))).sort(
      (a, b) => Number(b) - Number(a)
    );

    const months = Array.from(new Set(facturas.map((f) => f.mes).filter(Boolean)))
      .map(Number)
      .sort((a, b) => a - b)
      .map((m) => ({
        value: String(m),
        label: MESES[m - 1],
      }));

    const categories = Array.from(
      new Set(facturas.map((f) => f.categoria?.trim()).filter(Boolean))
    ).sort((a, b) => a!.localeCompare(b!));

    const tipos = Array.from(
      new Set(facturas.map((f) => f.tipo?.trim()).filter(Boolean))
    ).sort((a, b) => a!.localeCompare(b!));

    const filtered = facturas.filter((f) => {
      if (year && f.anio !== year) return false;
      if (month && f.mes !== month) return false;
      if (category && (f.categoria?.trim() || "") !== category) return false;
      if (tipo && (f.tipo?.trim() || "") !== tipo) return false;
      return true;
    });

    const totalGeneral = filtered.reduce((acc, f) => acc + parseMonto(f.monto), 0);
    const totalFacturas = filtered.length;

    return NextResponse.json({
      success: true,
      data: {
        filters: {
          years,
          months,
          categories,
          tipos,
        },
        resumen: {
          totalGeneral: Number(totalGeneral.toFixed(2)),
          totalFacturas,
        },
        pieCategorias: agrupar(filtered, "categoria"),
        pieTipos: agrupar(filtered, "tipo"),
      },
    });
  } catch (error) {
    console.error("Error generando reportes:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error generando reportes",
      },
      { status: 500 }
    );
  }
}