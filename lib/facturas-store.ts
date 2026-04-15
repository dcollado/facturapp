export type Factura = {
  id: string;
  fecha: string;
  proveedor: string;
  monto: string;
  categoria: string;
  tipo: string;
  notas: string;
  mes: string;
  anio: string;
};

export const facturasStore: Factura[] = [];