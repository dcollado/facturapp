import fs from "node:fs";
import path from "node:path";

const pagePath = path.resolve(
  process.cwd(),
  "app/page.tsx"
);

if (!fs.existsSync(pagePath)) {
  console.error(
    "No encontré app/page.tsx. Ejecuta este script desde la raíz del proyecto."
  );
  process.exit(1);
}

let source = fs.readFileSync(
  pagePath,
  "utf8"
);

const importLine =
  'import MovimientosRecientes from "@/components/dashboard/MovimientosRecientes";';

if (!source.includes(importLine)) {
  const clientDirective =
    /"use client";\s*/;

  const match =
    source.match(clientDirective);

  if (!match || match.index === undefined) {
    console.error(
      'No encontré la directiva "use client" en app/page.tsx.'
    );
    process.exit(1);
  }

  const insertAt =
    match.index + match[0].length;

  source =
    source.slice(0, insertAt) +
    "\n" +
    importLine +
    source.slice(insertAt);
}

const startMarker =
  "{/* Movements table */}";

const endCandidates = [
  "{modalTipo ? (",
  "{modalTipo && (",
];

const start =
  source.indexOf(startMarker);

if (start === -1) {
  console.error(
    'No encontré el marcador "{/* Movements table */}" en app/page.tsx.'
  );
  process.exit(1);
}

let end = -1;

for (const candidate of endCandidates) {
  const candidateIndex =
    source.indexOf(candidate, start);

  if (
    candidateIndex !== -1 &&
    (end === -1 ||
      candidateIndex < end)
  ) {
    end = candidateIndex;
  }
}

if (end === -1) {
  console.error(
    "Encontré la tabla, pero no pude encontrar el inicio de los modales."
  );
  process.exit(1);
}

const replacement = `{/* Movements summary */}
      <MovimientosRecientes
        movimientos={movimientos}
        loading={loading}
        limite={5}
      />

      `;

source =
  source.slice(0, start) +
  replacement +
  source.slice(end);

fs.writeFileSync(
  pagePath,
  source,
  "utf8"
);

console.log(
  "✅ Dashboard actualizado con el resumen de movimientos."
);

console.log(
  "Revisa app/page.tsx y ejecuta npm run build."
);
