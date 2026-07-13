"use client";

import { useState } from "react";
import { categoriasFactura, tiposFactura } from "@/lib/facturas";
import {
  fieldBaseClass,
  fieldNormalClass,
  fieldErrorClass,
  labelClass,
  sectionCardClass,
} from "@/lib/ui";
import QrScanner from "@/components/qr-scanner";

type FormState = {
  fecha: string;
  proveedor: string;
  monto: string;
  categoria: string;
  tipo: string;
  notas: string;
  numeroFactura: string;
  ruc: string;
};

const initialForm: FormState = {
  fecha: "",
  proveedor: "",
  monto: "",
  categoria: "",
  tipo: "",
  notas: "",
  numeroFactura: "",
  ruc: "",
};

function isDgiQrUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "dgi-fep.mef.gob.pa" &&
      parsed.pathname.includes("/Consultas/FacturasPorQR")
    );
  } catch {
    return false;
  }
}

export default function NuevaFacturaPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [isReadingQr, setIsReadingQr] = useState(false);
  const [dgiUrl, setDgiUrl] = useState("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const requiredFields: (keyof FormState)[] = [
    "fecha",
    "proveedor",
    "monto",
    "categoria",
    "tipo",
  ];

  const hasError = (field: keyof FormState) => {
    return showValidationErrors && requiredFields.includes(field) && !form[field];
  };

  const getFieldClass = (field: keyof FormState) =>
    `${fieldBaseClass} ${hasError(field) ? fieldErrorClass : fieldNormalClass}`;

  const getSelectClass = (field: keyof FormState) =>
    `${fieldBaseClass} appearance-none ${
      form[field] ? "text-text" : "text-text-muted"
    } ${hasError(field) ? fieldErrorClass : fieldNormalClass}`;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
    if (showValidationErrors) setShowValidationErrors(false);
  };

  const applyFacturaData = (factura: {
    fecha?: string;
    proveedor?: string;
    monto?: string;
    numeroFactura?: string;
    ruc?: string;
  }) => {
    setForm((prev) => ({
      ...prev,
      fecha: factura.fecha || prev.fecha,
      proveedor: factura.proveedor || prev.proveedor,
      monto: factura.monto || prev.monto,
      numeroFactura: factura.numeroFactura || prev.numeroFactura,
      ruc: factura.ruc || prev.ruc,
      tipo: "Fiscal",
    }));
  };

  const readDgiUrl = async (url: string) => {
    setMensaje("");
    setError("");
    setDebugInfo("");

    const trimmedUrl = url.trim();

    if (!isDgiQrUrl(trimmedUrl)) {
      setError("El link no parece ser una URL válida de la DGI.");
      return;
    }

    setIsReadingQr(true);

    try {
      const res = await fetch("/api/facturas/leer-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const data = await res.json();
      console.log("Respuesta leer-qr:", data);

      if (!res.ok || !data.success) {
        setError(data.message || "No se pudo leer la factura desde la DGI.");
        setDebugInfo(data?.data?.debugPreview || "");
        return;
      }

      applyFacturaData(data.data);
      setMensaje(
        "Factura fiscal leída desde la DGI. Revisa fecha, proveedor, monto, número y RUC antes de guardar."
      );
      setShowScanner(false);
      setDebugInfo("");
    } catch (err) {
      console.error("Error leyendo link DGI:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error leyendo el link de la DGI."
      );
    } finally {
      setIsReadingQr(false);
    }
  };

  const handleQrScan = async (decodedText: string) => {
    setMensaje("");
    setError("");
    setDebugInfo("");

    if (!isDgiQrUrl(decodedText)) {
      setError("El QR leído no parece ser una factura electrónica válida de la DGI.");
      setShowScanner(false);
      return;
    }

    setDgiUrl(decodedText);
    await readDgiUrl(decodedText);
  };

  const handleReadPastedUrl = async () => {
    await readDgiUrl(dgiUrl);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    setDebugInfo("");

    if (requiredFields.some((field) => !form[field])) {
      setShowValidationErrors(true);
      setError("Completa los campos obligatorios.");
      return;
    }

    setShowValidationErrors(false);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/facturas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        console.error("Respuesta del backend con error:", data);
        throw new Error(data.message || "No se pudo guardar la factura");
      }

      setMensaje("Factura guardada correctamente.");
      setForm(initialForm);
      setShowScanner(false);
      setDgiUrl("");
    } catch (err) {
      console.error("Error al enviar factura:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Hubo un error al guardar la factura."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-ink p-6">
      <div className="mx-auto max-w-3xl">
        <div className={sectionCardClass}>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-text">
                Nueva factura
              </h1>
              <p className="mt-1 text-sm text-text-muted">
                Registra una factura manualmente y organízala por tipo, mes y año.
              </p>
             
            </div>

            <a
              href="/facturas"
              className="hidden rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-gold hover:bg-surface-raised md:inline-flex"
            >
              Ver facturas
            </a>
          </div>
{mensaje ? (
  <div className="mb-4 rounded-xl border border-sage/30 bg-sage-soft px-4 py-3 text-sm text-sage">
    {mensaje}
  </div>
) : null}

{error ? (
  <div className="mb-4 rounded-xl border border-rust/30 bg-rust-soft px-4 py-3 text-sm text-rust">
    {error}
  </div>
) : null}

{debugInfo ? (
  <div className="mb-4 rounded-xl border border-gold/30 bg-gold-soft px-4 py-3">
    <p className="mb-2 text-sm font-medium text-gold">DEBUG</p>
    <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-gold">
      {debugInfo}
    </pre>
  </div>
) : null}

          <div className="mb-5 rounded-2xl border border-line bg-surface p-4">
            <label htmlFor="dgiUrl" className={labelClass}>
              Link consulta DGI
            </label>

            <div className="mt-2">
              <input
                id="dgiUrl"
                type="url"
                value={dgiUrl}
                onChange={(e) => {
                  setDgiUrl(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Pega aquí el link de consulta de la DGI"
                className={`${fieldBaseClass} ${fieldNormalClass} w-full`}
                disabled={isSubmitting || isReadingQr}
              />
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleReadPastedUrl}
                disabled={isSubmitting || isReadingQr || !dgiUrl.trim()}
                className="inline-flex items-center justify-center rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-text transition hover:border-gold hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
              >
                Leer link DGI
              </button>

              <button
                type="button"
                onClick={() => setShowScanner((prev) => !prev)}
                disabled={isSubmitting || isReadingQr}
                className="inline-flex items-center justify-center rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-text transition hover:border-gold hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
              >
                {showScanner ? "Ocultar escáner" : "Escanear QR DGI"}
              </button>

              {isReadingQr ? (
                <span className="inline-flex items-center rounded-xl border border-gold/30 bg-gold-soft px-4 py-3 text-sm text-gold">
                  Consultando la DGI...
                </span>
              ) : null}
            </div>
          </div>

          {showScanner ? (
            <div className="mb-5">
              <QrScanner
                onScan={handleQrScan}
                onClose={() => setShowScanner(false)}
              />
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="fecha" className={labelClass}>
                  Fecha de factura
                </label>
                <input
                  id="fecha"
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  className={getFieldClass("fecha")}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="monto" className={labelClass}>
                  Monto
                </label>
                <input
                  id="monto"
                  type="number"
                  name="monto"
                  value={form.monto}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={getFieldClass("monto")}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="numeroFactura" className={labelClass}>
                  Número factura
                </label>
                <input
                  id="numeroFactura"
                  type="text"
                  name="numeroFactura"
                  value={form.numeroFactura}
                  onChange={handleChange}
                  placeholder="Ej. 0000004939"
                  className={`${fieldBaseClass} ${fieldNormalClass}`}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="ruc" className={labelClass}>
                  RUC
                </label>
                <input
                  id="ruc"
                  type="text"
                  name="ruc"
                  value={form.ruc}
                  onChange={handleChange}
                  placeholder="Ej. 1470859-1-641924"
                  className={`${fieldBaseClass} ${fieldNormalClass}`}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label htmlFor="proveedor" className={labelClass}>
                Proveedor
              </label>
              <input
                id="proveedor"
                type="text"
                name="proveedor"
                value={form.proveedor}
                onChange={handleChange}
                placeholder="Ej. Supermercado X"
                className={getFieldClass("proveedor")}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="relative">
                <label htmlFor="categoria" className={labelClass}>
                  Categoría
                </label>
                <select
                  id="categoria"
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  className={getSelectClass("categoria")}
                  disabled={isSubmitting}
                >
                  <option value="">Selecciona una categoría</option>
                  {categoriasFactura.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-[42px] text-text-muted">
                  ▾
                </span>
              </div>

              <div className="relative">
                <label htmlFor="tipo" className={labelClass}>
                  Tipo de factura
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  className={getSelectClass("tipo")}
                  disabled={isSubmitting}
                >
                  <option value="">Selecciona un tipo</option>
                  {tiposFactura.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-[42px] text-text-muted">
                  ▾
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="notas" className={labelClass}>
                Notas
              </label>
              <textarea
                id="notas"
                name="notas"
                value={form.notas}
                onChange={handleChange}
                rows={4}
                placeholder="Observaciones"
                className={`${fieldBaseClass} ${fieldNormalClass} resize-none`}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl bg-gold px-5 py-3 text-sm font-medium text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Guardando..." : "Guardar factura"}
              </button>

              <a
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-line bg-surface px-5 py-3 text-sm font-medium text-text transition hover:border-gold hover:bg-surface-raised"
              >
                Volver
              </a>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}