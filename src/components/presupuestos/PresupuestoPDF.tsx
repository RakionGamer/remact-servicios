import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Formateador de dinero
const formatMoney = (val: number) => new Intl.NumberFormat('es-CL', { style: 'decimal', minimumFractionDigits: 0 }).format(val);

const styles = StyleSheet.create({
  page: {
    padding: 24, // Smaller padding
    fontFamily: 'Helvetica',
    fontSize: 8, // Base font smaller
    color: '#000'
  },
  topBox: {
    borderWidth: 1,
    marginBottom: 8
  },
  topRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4
  },
  title: {
    fontSize: 13, // Smaller title
    fontWeight: 'bold',
    textDecoration: 'underline',
    letterSpacing: 1
  },
  numberContainer: {
    borderLeftWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: 'center'
  },
  numberText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  bottomRow: {
    flexDirection: 'row',
    padding: 6,
    alignItems: 'center'
  },
  facturacionContainer: {
    flex: 1.2,
  },
  facturacionText: {
    fontSize: 7.5,
    fontWeight: 'bold',
    lineHeight: 1.2
  },
  logoContainer: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: 80 // Smaller logo
  },
  fechasContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  miniTable: {
    width: 100,
    borderWidth: 1,
    marginBottom: 4,
    textAlign: 'center'
  },
  miniTableHeader: {
    color: '#fff',
    padding: 2,
    fontSize: 7,
    fontWeight: 'bold'
  },
  miniTableBody: {
    padding: 2,
    fontSize: 7,
    fontWeight: 'bold'
  },
  solicitanteRemitente: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  box: {
    flex: 1,
    borderWidth: 1,
  },
  boxHeader: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 7.5,
    fontWeight: 'bold',
    padding: 2,
    borderBottomWidth: 1
  },
  boxBody: {
    padding: 4,
    fontSize: 7.5,
    fontWeight: 'bold',
    lineHeight: 1.3
  },
  motivoContainer: {
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 3,
    fontSize: 7.5,
    fontWeight: 'bold'
  },
  table: {
    borderWidth: 1,
    borderBottomWidth: 0,
    borderRightWidth: 1
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tableColHeader: {
    color: '#fff',
    padding: 3,
    fontSize: 7.5,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRightWidth: 1
  },
  tableCol: {
    padding: 3,
    fontSize: 7.5,
    borderRightWidth: 1
  },
  wDesc: { flex: 1 },
  wCant: { width: 35, textAlign: 'center' },
  wUnid: { width: 40, textAlign: 'center' },
  wPrecio: { width: 75, textAlign: 'right' },
  wImporte: { width: 75, textAlign: 'right' },
  
  bgLightBlue: { backgroundColor: '#dce6f1' },
  bgUltraLightBlue: { backgroundColor: '#ebf1f8' },

  totalRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  totalCellLabel: {
    width: 150, 
    padding: 3,
    fontSize: 7.5,
    fontWeight: 'bold',
    backgroundColor: '#dce6f1',
    borderRightWidth: 1,
  },
  totalCellValue: {
    width: 75, 
    padding: 3,
    fontSize: 7.5,
    textAlign: 'right',
    backgroundColor: '#ebf1f8',
    borderRightWidth: 0
  },
  footerNota: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  }
});

interface Props {
  presupuesto: any;
  configs: any;
  logoUrl: string;
}

export function PresupuestoPDF({ presupuesto: p, configs, logoUrl }: Props) {
  const themeColor = p.estado === 'APROBADO' ? '#ed0e2c' : '#2563eb';
  const borderColorStyle = { borderColor: themeColor };
  const bgColorStyle = { backgroundColor: themeColor };
  const textColorStyle = { color: themeColor };

  const emptyRowsCount = 2;
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top Box */}
        <View style={[styles.topBox, borderColorStyle]}>
          <View style={[styles.topRow, borderColorStyle]}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, textColorStyle]}>
                {p.estado === 'APROBADO' ? 'COTIZACIÓN DE PRESUPUESTO' : 'PREVENTA'}
              </Text>
            </View>
            <View style={[styles.numberContainer, borderColorStyle]}>
              <Text style={[styles.numberText, textColorStyle]}>N: {p.id}</Text>
            </View>
          </View>
          
          <View style={styles.bottomRow}>
            <View style={styles.facturacionContainer}>
              <Text style={styles.facturacionText}>{configs['DATOS_FACTURACION'] || ''}</Text>
            </View>
            <View style={styles.logoContainer}>
              <Image src={logoUrl} style={styles.logo} />
            </View>
            <View style={styles.fechasContainer}>
              <View style={[styles.miniTable, borderColorStyle]}>
                <View style={[styles.miniTableHeader, bgColorStyle, borderColorStyle]}>
                  <Text>FECHA EMISIÓN</Text>
                </View>
                <View style={styles.miniTableBody}>
                  <Text>{new Date(p.fecha_emision).toLocaleDateString('es-CL')}</Text>
                </View>
              </View>
              <View style={[styles.miniTable, borderColorStyle]}>
                <View style={[styles.miniTableHeader, bgColorStyle, borderColorStyle]}>
                  <Text>TÉRMINOS</Text>
                </View>
                <View style={styles.miniTableBody}>
                  <Text>TRANSFERENCIA</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Solicitante / Remitente */}
        <View style={styles.solicitanteRemitente}>
          <View style={[styles.box, borderColorStyle]}>
            <View style={[styles.boxHeader, bgColorStyle, borderColorStyle]}>
              <Text>SOLICITANTE:</Text>
            </View>
            <View style={styles.boxBody}>
              <Text>SOLICITADO POR: {p.solicitado_por || p.cliente_nombre}</Text>
              <Text>NOMBRE EMPRESA: {p.cliente_nombre}</Text>
              <Text>DIRECCION: {p.cliente_direccion || ''}</Text>
              <Text>TELÉFONO: {p.cliente_telefono || ''}</Text>
            </View>
          </View>
          <View style={[styles.box, borderColorStyle]}>
            <View style={[styles.boxHeader, bgColorStyle, borderColorStyle]}>
              <Text>REMITENTE:</Text>
            </View>
            <View style={styles.boxBody}>
              <Text>{configs['DATOS_PAGO'] || ''}</Text>
            </View>
          </View>
        </View>

        {/* Motivo & Table */}
        <View style={[styles.motivoContainer, borderColorStyle]}>
          <Text>MOTIVO: {p.motivo_servicio || ''}</Text>
        </View>

        <View style={[styles.table, borderColorStyle]}>
          {/* Header */}
          <View style={[styles.tableRow, bgColorStyle, borderColorStyle]}>
            <Text style={[styles.tableColHeader, styles.wDesc, borderColorStyle]}>DESCRIPCIÓN</Text>
            <Text style={[styles.tableColHeader, styles.wCant, borderColorStyle]}>CANT.</Text>
            <Text style={[styles.tableColHeader, styles.wUnid, borderColorStyle]}>UNID.</Text>
            <Text style={[styles.tableColHeader, styles.wPrecio, borderColorStyle]}>PRECIO UNITARIO</Text>
            <Text style={[styles.tableColHeader, styles.wImporte, borderColorStyle, { borderRightWidth: 0 }]}>IMPORTE</Text>
          </View>

          {/* Rows */}
          {p.detalles?.map((item: any, i: number) => (
            <View key={i} style={[styles.tableRow, borderColorStyle]}>
              <Text style={[styles.tableCol, styles.wDesc, borderColorStyle]}>{item.servicio_nombre}</Text>
              <Text style={[styles.tableCol, styles.wCant, borderColorStyle]}>{Math.round(Number(item.cantidad))}</Text>
              <Text style={[styles.tableCol, styles.wUnid, borderColorStyle]}>{item.unidad_medida || 'UNID.'}</Text>
              <Text style={[styles.tableCol, styles.wPrecio, borderColorStyle]}>$ {formatMoney(Number(item.precio_unitario_historico))}</Text>
              <Text style={[styles.tableCol, styles.wImporte, borderColorStyle, { borderRightWidth: 0 }]}>$ {formatMoney(Number(item.total_linea))}</Text>
            </View>
          ))}

          {/* Empty space filling */}
          {emptyRows.map((_, i) => (
            <View key={`empty-${i}`} style={[styles.tableRow, borderColorStyle]}>
              <Text style={[styles.tableCol, styles.wDesc, borderColorStyle, { height: 16 }]} />
              <Text style={[styles.tableCol, styles.wCant, borderColorStyle]} />
              <Text style={[styles.tableCol, styles.wUnid, borderColorStyle]} />
              <Text style={[styles.tableCol, styles.wPrecio, borderColorStyle]} />
              <Text style={[styles.tableCol, styles.wImporte, borderColorStyle, { borderRightWidth: 0 }]} />
            </View>
          ))}

          {/* Totals */}
          <View style={[styles.totalRow, borderColorStyle]}>
             <Text style={[styles.tableCol, styles.wDesc, borderColorStyle, { fontSize: 8 }]}>
                {p.condiciones ? `Nota: ${p.condiciones}` : ''}
             </Text>
             <Text style={[styles.totalCellLabel, borderColorStyle]}>SUBTOTAL</Text>
             <Text style={[styles.totalCellValue, borderColorStyle, { borderRightWidth: 0 }]}>$ {formatMoney(Number(p.subtotal))}</Text>
          </View>

          {p.tipo_documento === 'FACTURA' && (
            <View style={[styles.totalRow, borderColorStyle]}>
               <Text style={[styles.tableCol, styles.wDesc, borderColorStyle, { borderBottomWidth: 0 }]} />
               <Text style={[styles.totalCellLabel, borderColorStyle]}>IMPUESTOS IVA 19%</Text>
               <Text style={[styles.totalCellValue, borderColorStyle, { borderRightWidth: 0 }]}>$ {formatMoney(Number(p.impuesto_total))}</Text>
            </View>
          )}

          <View style={[styles.totalRow, borderColorStyle]}>
             <Text style={[styles.tableCol, styles.wDesc, borderColorStyle, { borderBottomWidth: 0 }]} />
             <Text style={[styles.totalCellLabel, borderColorStyle]}>TOTAL</Text>
             <Text style={[styles.totalCellValue, borderColorStyle, { borderRightWidth: 0 }]}>$ {formatMoney(Number(p.total))}</Text>
          </View>
        </View>

        {p.estado !== 'APROBADO' && (
          <Text style={[styles.footerNota, textColorStyle]}>
            Este presupuesto está sujeto a cambios hasta ser aprobado por el cliente y la administración de Remactservicios
          </Text>
        )}

      </Page>
    </Document>
  );
}
