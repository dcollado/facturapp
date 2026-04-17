import { NextRequest, NextResponse } from "next/server";

type QrLookupResponse = {
  success: boolean;
  data?: {
    fecha: string;
    proveedor: string;
    monto: string;
    numeroFactura?: string;
    ruc?: string;
    rawHtmlSnippet?: string;
  };
  message?: string;
};

function extractValue(html: string, label: string): string {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const patterns = [
    new RegExp(
      `${escapedLabel}[\\s\\S]{0,200}?<td[^>]*>\\s*([^<]+?)\\s*</td>`,
      "i"
    ),
    new RegExp(
      `${escapedLabel}[\\s\\S]{0,200}?<span[^>]*>\\s*([^<]+?)\\s*</span>`,
      "i"
    ),
    new RegExp(
      `${escapedLabel}[\\s\\S]{0,200}?<div[^>]*>\\s*([^<]+?)\\s*</div>`,
      "i"
    ),
    new RegExp(
      `${escapedLabel}[\\s\\S]{0,80}?:\\s*</?[^>]*>\\s*([^<\\n]+)`,
      "i"
    ),
    new RegExp(
      `${escapedLabel}[\\s\\S]{0,80}?:\\s*([^<\\n]+)`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return cleanText(match[1]);
    }
  }

  return "";
}

function cleanText(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDate(value: string): string {
  if (!value) return "";

  // Esperamos algo como 13/04/2026 12:55:29
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+\d{2}:\d{2}:\d{2})?$/);
  if (!match) return "";

  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeAmount(value: string): string {
  if (!value) return "";

  const cleaned = value
    .replace(/[^\d,.-]/g, "")
    .replace(",", ".");

  return cleaned;
}

function isValidDgiUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "dgi-fep.mef.gob.pa" &&
      parsed.pathname.includes("/Consultas/FacturasPorQR")
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const qrUrl = String(body?.url || "").trim();

    if (!qrUrl) {
      return NextResponse.json<QrLookupResponse>(
        {
          success: false,
          message: "Falta la URL del QR.",
        },
        { status: 400 }
      );
    }

    if (!isValidDgiUrl(qrUrl)) {
      return NextResponse.json<QrLookupResponse>(
        {
          success: false,
          message: "El QR no corresponde a una URL válida de la DGI.",
        },
        { status: 400 }
      );
    }

    const response = await fetch(qrUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json<QrLookupResponse>(
        {
          success: false,
          message: "No se pudo consultar la página de la DGI.",
        },
        { status: 502 }
      );
    }

    const html = await response.text();

    const numeroFactura =
      extractValue(html, "Número de factura") ||
      extractValue(html, "Numero de factura");

    const fechaRaw =
      extractValue(html, "Fecha de factura") ||
      extractValue(html, "Fecha de emisión") ||
      extractValue(html, "Fecha de emision");

    const proveedor =
      extractValue(html, "Nombre del emisor") ||
      extractValue(html, "Emisor") ||
      extractValue(html, "Nombre comercial");

    const ruc =
      extractValue(html, "RUC del emisor") ||
      extractValue(html, "RUC");

    const montoRaw =
      extractValue(html, "Valor Total") ||
      extractValue(html, "Total pagado") ||
      extractValue(html, "Total");

    const fecha = normalizeDate(fechaRaw);
    const monto = normalizeAmount(montoRaw);

    if (!fecha && !proveedor && !monto) {
      return NextResponse.json<QrLookupResponse>(
        {
          success: false,
          message:
            "Se consultó la DGI, pero no se pudieron extraer datos útiles de la factura.",
          data: {
            fecha: "",
            proveedor: "",
            monto: "",
            numeroFactura,
            ruc,
            rawHtmlSnippet: html.slice(0, 1200),
          },
        },
        { status: 422 }
      );
    }

    return NextResponse.json<QrLookupResponse>({
      success: true,
      data: {
        fecha,
        proveedor,
        monto,
        numeroFactura,
        ruc,
      },
    });
  } catch (error) {
    console.error("Error leyendo QR DGI:", error);

    return NextResponse.json<QrLookupResponse>(
      {
        success: false,
        message: "Ocurrió un error al procesar el QR.",
      },
      { status: 500 }
    );
  }
}