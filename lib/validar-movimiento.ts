import { categoriasFactura, categoriasIngreso } from "@/lib/facturas";

// Datos limpios y normalizados, listos para escribir en Sheets.
export type MovimientoValido = {
  fecha: string; // YYYY-MM-DD
  tipo: "ingreso" | "gasto";
  monto: string; // número como string, ej. "12.50"
  categoria: string;
  descripcion: string;
  notas: string;
};

export type ResultadoValidacionMovimiento =
  | { ok: true; data: MovimientoValido }
  | { ok: false; errores: string[] };

const MAX_TEXTO = 200;
const MAX_NOTAS = 1000;

function normalizarMonto(valor: string): string {
  return valor.replace(/\s/g, "").replace(",", ".");
}

function esFechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;

  const [anio, mes, dia] = fecha.split("-").map(Number);

  const d = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    d.getUTCFullYear() === anio &&
    d.getUTCMonth() === mes - 1 &&
    d.getUTCDate() === dia
  );
}

export function validarMovimiento(body: unknown): ResultadoValidacionMovimiento {
  const errores: string[] = [];

  const b = (body ?? {}) as Record<string, unknown>;

  const fecha = String(b.fecha ?? "").trim();
  const tipo = String(b.tipo ?? "").trim();
  const montoRaw = String(b.monto ?? "").trim();
  const categoria = String(b.categoria ?? "").trim();
  const descripcion = String(b.descripcion ?? "").trim();
  const notas = String(b.notas ?? "").trim();

  if (!fecha) errores.push("La fecha es obligatoria.");
  else if (!esFechaValida(fecha))
    errores.push("La fecha debe tener formato YYYY-MM-DD y ser una fecha real.");

  if (tipo !== "ingreso" && tipo !== "gasto") {
    errores.push("El tipo debe ser ingreso o gasto.");
  }

  if (!descripcion) errores.push("La descripción es obligatoria.");
  else if (descripcion.length > MAX_TEXTO)
    errores.push(`La descripción no puede superar ${MAX_TEXTO} caracteres.`);

  const monto = normalizarMonto(montoRaw);
  if (!montoRaw) {
    errores.push("El monto es obligatorio.");
  } else {
    const montoNum = Number(monto);
    if (!Number.isFinite(montoNum)) {
      errores.push("El monto debe ser un número válido.");
    } else if (montoNum <= 0) {
      errores.push("El monto debe ser mayor que cero.");
    }
  }

  if (!categoria) {
    errores.push("La categoría es obligatoria.");
  } else if (tipo === "gasto" && !categoriasFactura.includes(categoria)) {
    errores.push("La categoría seleccionada no es válida para un gasto.");
  } else if (tipo === "ingreso" && !categoriasIngreso.includes(categoria)) {
    errores.push("La categoría seleccionada no es válida para un ingreso.");
  }

  if (notas.length > MAX_NOTAS)
    errores.push(`Las notas no pueden superar ${MAX_NOTAS} caracteres.`);

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  return {
    ok: true,
    data: {
      fecha,
      tipo: tipo as "ingreso" | "gasto",
      monto: String(Number(monto)),
      categoria,
      descripcion,
      notas,
    },
  };
}
