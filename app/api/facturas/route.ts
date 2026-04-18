import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/google-sheets";
import type { Factura } from "@/lib/facturas-store";

const SHEET_NAME = "Sheet1";

function buildFactura(row: string[]): Factura {
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

function getMesAnioFromFecha(fecha: string) {
  if (!fecha) return { mes: "", anio: "" };

  const parts = fecha.split("-");
  if (parts.length !== 3) {
    return { mes: "", anio: "" };
  }

  return {
    anio: parts[0],
    mes: parts[1],
  };
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
      range: `${SHEET_NAME}!A:K`,
    });

    const rows = response.data.values ?? [];

    if (rows.length <= 1) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const dataRows = rows.slice(1);
    const facturas: Factura[] = dataRows.map((row) => buildFactura(row));

    return NextResponse.json({
      success: true,
      data: facturas,
    });
  } catch (error) {
    console.error("Error obteniendo facturas:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudieron obtener las facturas.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) {
      throw new Error("Falta GOOGLE_SHEET_ID en .env.local");
    }

    const body = await req.json();

    const fecha = String(body?.fecha ?? "").trim();
    const proveedor = String(body?.proveedor ?? "").trim();
    const monto = String(body?.monto ?? "").trim();
    const categoria = String(body?.categoria ?? "").trim();
    const tipo = String(body?.tipo ?? "").trim();
    const numeroFactura = String(body?.numeroFactura ?? "").trim();
    const ruc = String(body?.ruc ?? "").trim();
    const notas = String(body?.notas ?? "").trim();

    if (!fecha || !proveedor || !monto || !categoria || !tipo) {
      return NextResponse.json(
        {
          success: false,
          message: "Faltan campos obligatorios.",
        },
        { status: 400 }
      );
    }

    const { mes, anio } = getMesAnioFromFecha(fecha);

    const factura: Factura = {
      id: crypto.randomUUID(),
      fecha,
      proveedor,
      monto,
      categoria,
      tipo,
      mes,
      anio,
      numeroFactura,
      ruc,
      notas,
    };

    const sheets = await getSheetsClient();

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!A:K`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          factura.id,
          factura.fecha,
          factura.proveedor,
          factura.monto,
          factura.categoria,
          factura.tipo,
          factura.mes,
          factura.anio,
          factura.numeroFactura,
          factura.ruc,
          factura.notas,
        ]],
      },
    });

    return NextResponse.json({
      success: true,
      data: factura,
    });
  } catch (error) {
    console.error("Error guardando factura:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo guardar la factura.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) {
      throw new Error("Falta GOOGLE_SHEET_ID en .env.local");
    }

    const id = req.nextUrl.searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Falta el id de la factura.",
        },
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
        {
          success: false,
          message: "No se encontraron facturas.",
        },
        { status: 404 }
      );
    }

    const dataRows = rows.slice(1);
    const dataIndex = dataRows.findIndex((row) => (row[0] ?? "").trim() === id);

    if (dataIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Factura no encontrada.",
        },
        { status: 404 }
      );
    }

    const sheetRowNumber = dataIndex + 2;

    const spreadsheetResponse = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "sheets.properties",
    });

    const targetSheet = spreadsheetResponse.data.sheets?.find(
      (sheet) => sheet.properties?.title === SHEET_NAME
    );

    const sheetNumericId = targetSheet?.properties?.sheetId;

    if (sheetNumericId === undefined) {
      throw new Error(`No se encontró la hoja ${SHEET_NAME}`);
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetNumericId,
                dimension: "ROWS",
                startIndex: sheetRowNumber - 1,
                endIndex: sheetRowNumber,
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Factura eliminada correctamente.",
    });
  } catch (error) {
    console.error("Error eliminando factura:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo eliminar la factura.",
      },
      { status: 500 }
    );
  }
}