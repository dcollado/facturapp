import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/google-sheets";
import type { Deuda, TipoDeuda } from "@/lib/deudas";

const SHEET_NAME = "Deudas";
// A:V — 22 columnas, ver IMPLEMENTACION.md sección 2 para el layout completo.
const RANGE = `${SHEET_NAME}!A:V`;

function numOrNull(valor: string | undefined): number | null {
  const trimmed = (valor ?? "").trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function numOrZero(valor: string | undefined): number {
  const trimmed = (valor ?? "").trim();
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : 0;
}

function buildDeuda(row: string[]): Deuda {
  const tipoRaw = row[1] ?? "generico";
  const tipo: TipoDeuda =
    tipoRaw === "prestamo" || tipoRaw === "tarjeta" ? tipoRaw : "generico";

  return {
    id: row[0] ?? "",
    tipo,
    label: row[2] ?? "",
    pagoMensual: numOrZero(row[3]),
    tasaInteres: numOrNull(row[4]),
    totalAPagar: numOrZero(row[5]),
    totalPagado: numOrZero(row[6]),
    montoDesembolsado: numOrNull(row[7]),
    fechaDesembolso: row[8] ?? "",
    fechaPrimerPago: row[9] ?? "",
    fechaVencimiento: row[10] ?? "",
    plazoMeses: numOrNull(row[11]),
    saldoActual: numOrNull(row[12]),
    saldoTotal: numOrNull(row[13]),
    cargosPagados: numOrNull(row[14]),
    cargosPendientes: numOrNull(row[15]),
    tasaInteresAdelantos: numOrNull(row[16]),
    membresiaAnual: numOrNull(row[17]),
    pagoMinimoPorcentaje: numOrNull(row[18]),
    pagoMinimoMonto: numOrNull(row[19]),
    cargoPagoAtrasado: numOrNull(row[20]),
    nota: row[21] ?? "",
  };
}

function deudaToRow(deuda: Deuda): (string | number)[] {
  return [
    deuda.id,
    deuda.tipo,
    deuda.label,
    deuda.pagoMensual,
    deuda.tasaInteres ?? "",
    deuda.totalAPagar,
    deuda.totalPagado,
    deuda.montoDesembolsado ?? "",
    deuda.fechaDesembolso ?? "",
    deuda.fechaPrimerPago ?? "",
    deuda.fechaVencimiento ?? "",
    deuda.plazoMeses ?? "",
    deuda.saldoActual ?? "",
    deuda.saldoTotal ?? "",
    deuda.cargosPagados ?? "",
    deuda.cargosPendientes ?? "",
    deuda.tasaInteresAdelantos ?? "",
    deuda.membresiaAnual ?? "",
    deuda.pagoMinimoPorcentaje ?? "",
    deuda.pagoMinimoMonto ?? "",
    deuda.cargoPagoAtrasado ?? "",
    deuda.nota ?? "",
  ];
}

export async function GET() {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) {
      throw new Error("Falta GOOGLE_SHEET_ID en .env.local");
    }

    const sheets = await getSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: RANGE,
    });

    const rows = response.data.values ?? [];

    if (rows.length <= 1) {
      return NextResponse.json({ success: true, data: [] });
    }

    const dataRows = rows.slice(1);
    const deudas: Deuda[] = dataRows.map((row) => buildDeuda(row));

    return NextResponse.json({ success: true, data: deudas });
  } catch (error) {
    console.error("Error obteniendo deudas:", error);

    return NextResponse.json(
      { success: false, message: "No se pudieron obtener las deudas." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) {
      throw new Error("Falta GOOGLE_SHEET_ID en .env.local");
    }

    const id = req.nextUrl.searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Falta el id de la deuda." },
        { status: 400 }
      );
    }

    const body = (await req.json()) as Deuda;

    if (!body || body.id !== id) {
      return NextResponse.json(
        { success: false, message: "El id del cuerpo no coincide con el de la URL." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(body.pagoMensual) || body.pagoMensual <= 0) {
      return NextResponse.json(
        { success: false, message: "El pago mensual debe ser mayor que cero." },
        { status: 400 }
      );
    }

    const sheets = await getSheetsClient();

    const valuesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!A:A`,
    });

    const rows = valuesResponse.data.values ?? [];

    if (rows.length <= 1) {
      return NextResponse.json(
        { success: false, message: "No se encontraron deudas." },
        { status: 404 }
      );
    }

    const dataRows = rows.slice(1);
    const dataIndex = dataRows.findIndex((row) => (row[0] ?? "").trim() === id);

    if (dataIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Deuda no encontrada." },
        { status: 404 }
      );
    }

    const sheetRowNumber = dataIndex + 2;

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!A${sheetRowNumber}:V${sheetRowNumber}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [deudaToRow(body)],
      },
    });

    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    console.error("Error actualizando deuda:", error);

    return NextResponse.json(
      { success: false, message: "No se pudo actualizar la deuda." },
      { status: 500 }
    );
  }
}
