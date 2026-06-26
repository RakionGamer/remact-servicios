import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Link } from '@react-pdf/renderer';
import { ProcessedGroup } from '@/lib/imageUtils';

const themeColor = '#2563eb'; // Remact blue

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000'
  },
  topBox: {
    borderWidth: 1,
    borderColor: themeColor,
    marginBottom: 16
  },
  topRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: themeColor,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: themeColor,
    letterSpacing: 1
  },
  numberContainer: {
    borderLeftWidth: 1,
    borderColor: themeColor,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center'
  },
  numberText: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: themeColor,
  },
  headerBottomRow: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center'
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  logo: {
    width: 110,
    objectFit: 'contain'
  },
  transferContainer: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center'
  },
  fechasContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  miniTable: {
    width: 120,
    borderWidth: 1,
    borderColor: themeColor,
    textAlign: 'center'
  },
  miniTableHeader: {
    backgroundColor: themeColor,
    color: '#fff',
    padding: 3,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold'
  },
  miniTableBody: {
    padding: 4,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold'
  },
  sectionBox: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: themeColor
  },
  sectionHeader: {
    backgroundColor: themeColor,
    color: '#fff',
    padding: 5,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoCol: {
    width: '50%',
    padding: 6,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: themeColor
  },
  infoColFull: {
    width: '100%',
    padding: 6,
  },
  infoLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: themeColor,
    marginBottom: 2
  },
  infoValue: {
    fontSize: 9,
    fontFamily: 'Helvetica'
  },
  listContainer: {
  },
  listItem: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderColor: themeColor
  },
  listItemLast: {
    flexDirection: 'row',
    padding: 6,
  },

  listText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.4
  },
  imageWrapper: {
    width: '100%',
    height: 580,
    marginBottom: 15,
    padding: 2
  },
  reportImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  groupTag: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: themeColor,
    textAlign: 'center',
    textTransform: 'uppercase',
    backgroundColor: '#eff6ff', // blue-50
    padding: 6,
    borderBottomWidth: 1,
    borderColor: themeColor
  },
  imageRow: {
    flexDirection: 'row',
    width: '100%',
    borderBottomWidth: 1,
    borderColor: themeColor
  },
  imageRowLast: {
    flexDirection: 'row',
    width: '100%'
  },
  imageCell: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderColor: themeColor,
    justifyContent: 'center',
    alignItems: 'center'
  },
  imageCellLast: {
    flex: 1,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerLinkContainer: {
    marginTop: 20,
    paddingTop: 10,
    alignItems: 'center'
  },
  footerLinkText: {
    fontSize: 10
  },
  footerLink: {
    color: themeColor,
    textDecoration: 'none',
    fontFamily: 'Helvetica-Bold'
  }
});

interface Props {
  informe: any;
  configs: any;
  logoUrl: string;
  imagenesLayout?: ProcessedGroup[];
}

export function InformePDF({ informe: i, configs, logoUrl, imagenesLayout }: Props) {
  const formatDate = (dateValue: any) => {
    if (!dateValue) return '';
    const isoStr = new Date(dateValue).toISOString();
    const dateStr = isoStr.split('T')[0];
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const parseJson = (val: any) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return []; }
    }
    return Array.isArray(val) ? val : [];
  };

  const trabajosRealizados = parseJson(i.trabajos_realizados);
  const observaciones = parseJson(i.observaciones);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Encabezado Principal */}
        <View style={styles.topBox} wrap={false}>
          <View style={styles.topRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>INFORME TÉCNICO DE SERVICIO</Text>
            </View>
            <View style={styles.numberContainer}>
              <Text style={styles.numberText}>N° {i.id}</Text>
            </View>
          </View>
          
          <View style={styles.headerBottomRow}>
            <View style={styles.transferContainer}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, color: themeColor, marginBottom: 4 }}>DATOS DE TRANSFERENCIA</Text>
              {configs['DATOS_PAGO']
                ? configs['DATOS_PAGO'].split('\n').filter((line: string) => line.trim() !== '' && !line.toUpperCase().includes('CORREO')).map((line: string, idx: number) => (
                  <Text key={idx} style={{ fontSize: 8, marginBottom: 2 }}>{line}</Text>
                ))
                : <Text style={{ fontSize: 8 }}>-</Text>
              }
            </View>
            <View style={[styles.logoContainer, { alignItems: 'center' }]}>
              {logoUrl && <Image src={logoUrl} style={styles.logo} />}
            </View>
            <View style={styles.fechasContainer}>
              <View style={styles.miniTable}>
                <View style={styles.miniTableHeader}>
                  <Text>FECHA DEL INFORME</Text>
                </View>
                <View style={styles.miniTableBody}>
                  <Text>{formatDate(i.fecha_informe)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Datos del Servicio */}
        <View style={styles.sectionBox} wrap={false}>
          <View style={styles.sectionHeader}>
            <Text>DATOS DEL SERVICIO</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>CLIENTE / EMPRESA</Text>
              <Text style={styles.infoValue}>{i.cliente_nombre}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>SOLICITADO POR</Text>
              <Text style={styles.infoValue}>{i.solicitado_por || 'N/A'}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>DIRECCIÓN DE OBRA</Text>
              <Text style={styles.infoValue}>{i.direccion_obra || 'N/A'}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>COMUNA</Text>
              <Text style={styles.infoValue}>{i.comuna || 'N/A'}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>INICIO DE TRABAJOS</Text>
              <Text style={styles.infoValue}>{formatDate(i.fecha_inicio)}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>FIN DE TRABAJOS</Text>
              <Text style={styles.infoValue}>{formatDate(i.fecha_fin)}</Text>
            </View>
            <View style={styles.infoColFull}>
              <Text style={styles.infoLabel}>TRABAJOS SOLICITADOS</Text>
              <Text style={styles.infoValue}>{i.trabajos_solicitados || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Trabajos Realizados */}
        <View style={styles.sectionBox} wrap={false}>
          <View style={styles.sectionHeader}>
            <Text>TRABAJOS REALIZADOS</Text>
          </View>
          <View style={styles.listContainer}>
            {trabajosRealizados.length > 0 ? (
              trabajosRealizados.map((trabajo: string, idx: number) => (
                <View style={idx === trabajosRealizados.length - 1 ? styles.listItemLast : styles.listItem} key={idx}>
                  <Text style={styles.listText}>{trabajo}</Text>
                </View>
              ))
            ) : (
              <View style={styles.listItemLast}>
                <Text style={{ fontSize: 9, color: '#666', fontStyle: 'italic' }}>No se detallaron trabajos realizados.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Observaciones */}
        {observaciones && observaciones.length > 0 && (
          <View style={styles.sectionBox} wrap={false}>
            <View style={styles.sectionHeader}>
              <Text>OBSERVACIONES</Text>
            </View>
            <View style={styles.listContainer}>
              {observaciones.map((obs: string, idx: number) => (
                <View style={idx === observaciones.length - 1 ? styles.listItemLast : styles.listItem} key={idx}>
                  <Text style={styles.listText}>{obs}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Registro Fotográfico (Movido a la primera página) */}
        {imagenesLayout && imagenesLayout.length > 0 && (
          <>
            <View style={[styles.sectionBox, { marginTop: 'auto' }]}>
              <View style={styles.sectionHeader}>
                <Text>REGISTRO FOTOGRÁFICO</Text>
              </View>
            </View>

            <View style={{ width: '100%', minHeight: '100%', borderWidth: 1, borderColor: themeColor }} break>
              {/* Esta línea dibujará el borde inferior en TODAS las páginas que ocupe este contenedor, cerrando la caja al hacer saltos de página */}
              <View fixed style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderBottomWidth: 1, borderColor: themeColor }} />

              {imagenesLayout.map((group, gIdx) => {
                const allRows = Array.isArray(group.layout) ? group.layout : [];

                return (
                  <View key={gIdx} style={{ width: '100%' }}>
                    {allRows.map((row, rIdx) => {
                      const isFirstRow = rIdx === 0;
                      const hasTag = Boolean(group.tag);
                      const isFirstOverall = gIdx === 0 && rIdx === 0;
                      
                      const rowContent = (
                        <View style={styles.imageRowLast}>
                          {Array.isArray(row) && row.map((img, iIdx) => {
                            const isLastImg = iIdx === row.length - 1;
                            return (
                              <View
                                key={iIdx}
                                style={[
                                  isLastImg ? styles.imageCellLast : styles.imageCell,
                                  { height: 580 }
                                ]}
                              >
                                <Image
                                  src={img?.url?.includes('cloudinary.com') ? img.url.replace('/upload/', '/upload/f_jpg/') : (img?.url || '')}
                                  style={styles.reportImage}
                                />
                              </View>
                            );
                          })}
                        </View>
                      );

                      return (
                        <View key={`row-${rIdx}`} wrap={false} style={{ width: '100%', borderTopWidth: isFirstOverall ? 0 : 1, borderColor: themeColor }}>
                          {isFirstRow && hasTag && (
                            <Text style={styles.groupTag}>
                              {group.tag}
                            </Text>
                          )}
                          {rowContent}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </>
        )}




        {/* Footer Link */}
        {Boolean(i.link_fotografias) && (
          <View wrap={false} style={styles.footerLinkContainer}>
            <Text style={styles.footerLinkText}>
              Si desea visualizar más fotografías{' '}
              <Link src={i.link_fotografias} style={styles.footerLink}>
                haz click aquí
              </Link>
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
