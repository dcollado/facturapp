export type Factura = {
  id: string;
  fecha: string;
  proveedor: string;
  monto: string;
  categoria: string;
  tipo: string;
  mes: string;
  anio: string;
  numeroFactura?: string;
  ruc?: string;
  notas?: string;
};