import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

type QrLookupResponse = {
  success: boolean;
  data?: {
    fecha: string;
    proveedor: string;
    monto: string;
    tipo: string;
    numeroFactura?: string;
    ruc?: string;
    debugPreview?: string;
  };
  message?: string;
};

function cleanText(value?: string | null): string {
  if (!value) return "";

  return value
    .replace(/\u00a0/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDate(value: string): string {
  if (!value) return "";

  const match = value.match(
    /(\d{2})\/(\d{2})\/(\d{4})(?:\s+\d{2}:\d{2}:\d{2})?/
  );

  if (!match) return "";

  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeAmount(value: string): string {
  if (!value) return "";

  return value.replace(/[^\d,.-]/g, "").replace(",", ".");
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

function getBodyText($: cheerio.CheerioAPI): string {
  const clone = $.root().clone();
  clone.find("script, style, noscript").remove();
  return cleanText(clone.text());
}

function extractRegexValue(text: string, pattern: RegExp): string {
  const match = text.match(pattern);
  return cleanText(match?.[1] || "");
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
    const $ = cheerio.load(html);
    const bodyText = getBodyText($);

    const fechaRaw = extractRegexValue(
      bodyText,
      /FACTURA\s+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/i
    );

    const numeroFactura = extractRegexValue(
      bodyText,
      /No\.\s*([0-9]+)/i
    );

    const ruc = extractRegexValue(
      bodyText,
      /EMISOR\s+RUC\s*([0-9\-]+)/i
    );

    const proveedor = extractRegexValue(
      bodyText,
      /EMISOR[\s\S]*?NOMBRE\s*([A-ZÁÉÍÓÚÑ0-9 .,&'-]+?)\s*DIRECCIÓN/i
    );

    const montoRaw =
      extractRegexValue(
        bodyText,
        /TOTAL PAGADO:\s*([0-9]+(?:\.[0-9]{1,2})?)/i
      ) ||
      extractRegexValue(
        bodyText,
        /Valor Total:\s*([0-9]+(?:\.[0-9]{1,2})?)/i
      );

    const fecha = normalizeDate(fechaRaw);
    const monto = normalizeAmount(montoRaw);

    console.log("DGI extracción:", {
      fechaRaw,
      fecha,
      proveedor,
      montoRaw,
      monto,
      numeroFactura,
      ruc,
    });

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
            tipo: "Fiscal",
            debugPreview: bodyText.slice(0, 2000),
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
        tipo: "Fiscal",
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