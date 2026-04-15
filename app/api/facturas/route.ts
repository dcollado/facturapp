import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/google-sheets";
import type { Factura } from "@/lib/facturas-store";

const SHEET_NAME = "Sheet1";

export async function GET() {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) {
      throw new Error("Falta GOOGLE_SHEET_ID en .env.local");
    }

    const sheets = await getSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!A:I`,
    });

    const rows = response.data.values ?? [];

    if (rows.length <= 1) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const dataRows = rows.slice(1);

    const facturas: Factura[] = dataRows.map((row) => ({
      id: row[0] ?? "",
      fecha: row[1] ?? "",
      proveedor: row[2] ?? "",
      monto: row[3] ?? "",
      categoria: row[4] ?? "",
      tipo: row[5] ?? "",
      notas: row[6] ?? "",
      mes: row[7] ?? "",
      anio: row[8] ?? "",
    }));

    return NextResponse.json({
      success: true,
      data: facturas.reverse(),
    });
  } catch (error) {
    console.error("Error leyendo Google Sheets:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudieron leer las facturas",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) {
      throw new Error("Falta GOOGLE_SHEET_ID en .env.local");
    }

    const data = await req.json();

    const fecha = new Date(data.fecha);
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = String(fecha.getFullYear());

    const nuevaFactura: Factura = {
      id: crypto.randomUUID(),
      fecha: data.fecha ?? "",
      proveedor: data.proveedor ?? "",
      monto: data.monto ?? "",
      categoria: data.categoria ?? "",
      tipo: data.tipo ?? "",
      notas: data.notas ?? "",
      mes,
      anio,
    };

    const sheets = await getSheetsClient();

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!A:I`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            nuevaFactura.id,
            nuevaFactura.fecha,
            nuevaFactura.proveedor,
            nuevaFactura.monto,
            nuevaFactura.categoria,
            nuevaFactura.tipo,
            nuevaFactura.notas,
            nuevaFactura.mes,
            nuevaFactura.anio,
          ],
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Factura guardada correctamente en Google Sheets",
      data: nuevaFactura,
    });
  } catch (error) {
    console.error("Error escribiendo Google Sheets:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo guardar la factura en Google Sheets",
      },
      { status: 500 }
    );
  }
}