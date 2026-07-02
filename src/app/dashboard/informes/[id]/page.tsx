import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getInformeById } from '@/actions/informes';
import { getConfiguraciones } from '@/actions/configuracion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DoubleScrollContainer } from '@/components/presupuestos/DoubleScrollContainer';
import { InformeActions } from '@/components/informes/InformeActions';
import { PreviewImagesGrid } from '@/components/informes/PreviewImagesGrid';

export const dynamic = 'force-dynamic';

export default async function InformeViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) return notFound();

  const result = await getInformeById(id);
  if (!result.success || !result.data) {
    return notFound();
  }

  const i = result.data;

  const resConfigs = await getConfiguraciones();
  const configs = resConfigs.success && resConfigs.data ? resConfigs.data : {};
  const logoUrl = '/remact-logo.webp';

  const formatDate = (dateValue: any) => {
    if (!dateValue) return '';
    const isoStr = new Date(dateValue).toISOString();
    const dateStr = isoStr.split('T')[0];
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const trabajosRealizados = i.trabajos_realizados ? (typeof i.trabajos_realizados === 'string' ? JSON.parse(i.trabajos_realizados) : i.trabajos_realizados) : [];
  const observaciones = i.observaciones ? (typeof i.observaciones === 'string' ? JSON.parse(i.observaciones) : i.observaciones) : [];
  const imagenes = i.imagenes ? (typeof i.imagenes === 'string' ? JSON.parse(i.imagenes) : i.imagenes) : [];

  return (
    <div className="space-y-4 pb-20 print:pb-0 print:bg-transparent min-h-screen print:min-h-0 p-4 sm:p-8 print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print max-w-[210mm] mx-auto">
        <div className="flex gap-2 items-center flex-wrap">
          <Button variant="outline" asChild>
            <Link href="/dashboard/informes">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Link>
          </Button>
        </div>
        <InformeActions informe={i} configs={configs} logoUrl={logoUrl} />
      </div>

      <DoubleScrollContainer>
        <div className="bg-white mx-auto shadow-xl min-w-[210mm] max-w-[210mm] print:min-w-0 print:max-w-none print:shadow-none print:bg-transparent">
          <div
            id="print-area"
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
            className="p-8 print:p-0 w-full text-xs flex flex-col text-black bg-white"
          >
            {/* Encabezado Principal */}
            <div className="border border-blue-600 mb-4">
              <div className="flex border-b border-blue-600">
                <div className="flex-1 flex items-center justify-center p-2">
                  <div className="text-[14px] font-bold text-blue-600 tracking-widest uppercase">
                    INFORME TÉCNICO DE SERVICIO
                  </div>
                </div>
                <div className="border-l border-blue-600 px-4 py-2 flex justify-center items-center">
                  <div className="text-[14px] font-bold text-blue-600">
                    N° {i.id}
                  </div>
                </div>
              </div>

              <div className="flex p-2.5 items-center">
                <div className="flex-1 flex flex-col justify-center items-start">
                  <div className="font-bold text-[8px] text-blue-600 mb-1 uppercase">DIRECCIÓN DE OBRA</div>
                  <div className="text-[8px] leading-tight uppercase">
                    <div>{i.direccion_obra || 'N/A'}</div>
                    <div className="mt-0.5">{i.comuna || 'N/A'}</div>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  {logoUrl && <img src={logoUrl} alt="Logo" className="w-[110px] object-contain" />}
                </div>
                <div className="flex-1 flex items-center justify-end">
                  <div className="w-[120px] border border-blue-600 text-center">
                    <div className="bg-blue-600 text-white p-[3px] text-[8px] font-bold uppercase">FECHA DEL INFORME</div>
                    <div className="p-1 text-[9px] font-bold">{formatDate(i.fecha_informe)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Datos del Servicio */}
            <div className="mb-4 mt-4">
              <div className="bg-blue-600 text-white p-[5px] text-[10px] font-bold text-center uppercase border border-blue-600">
                DATOS DEL SERVICIO
              </div>
              <div className="flex flex-wrap border-l border-b border-blue-600">
                <div className="w-1/2 p-2 border-r border-b border-blue-600">
                  <div className="font-bold text-[9px] text-blue-600 mb-0.5">CLIENTE / EMPRESA</div>
                  <div className="text-[9px]">{i.cliente_nombre}</div>
                </div>
                <div className="w-1/2 p-2 border-r border-b border-blue-600">
                  <div className="font-bold text-[9px] text-blue-600 mb-0.5">SOLICITADO POR</div>
                  <div className="text-[9px]">{i.solicitado_por || 'N/A'}</div>
                </div>

                <div className="w-1/2 p-2 border-r border-b border-blue-600">
                  <div className="font-bold text-[9px] text-blue-600 mb-0.5">INICIO DE TRABAJOS</div>
                  <div className="text-[9px]">{formatDate(i.fecha_inicio)}</div>
                </div>
                <div className="w-1/2 p-2 border-r border-b border-blue-600">
                  <div className="font-bold text-[9px] text-blue-600 mb-0.5">FIN DE TRABAJOS</div>
                  <div className="text-[9px]">{formatDate(i.fecha_fin)}</div>
                </div>
                <div className="w-full p-2 border-r border-blue-600">
                  <div className="font-bold text-[9px] text-blue-600 mb-0.5">TRABAJOS SOLICITADOS</div>
                  <div className="text-[9px]">{i.trabajos_solicitados || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Trabajos Realizados */}
            <div className="mb-4 mt-4">
              <div className="bg-blue-600 text-white p-[5px] text-[10px] font-bold text-center uppercase border border-blue-600">
                TRABAJOS REALIZADOS
              </div>
              <div className="border-l border-r border-b border-blue-600">
                {trabajosRealizados.length > 0 ? (
                  trabajosRealizados.map((t: string, idx: number) => (
                    <div key={idx} className="flex p-2 border-b border-blue-600 last:border-b-0">
                      <span className="flex-1 text-[9px] leading-[1.4]">{t}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-[9px] text-[#666] italic">No se detallaron trabajos realizados.</div>
                )}
              </div>
            </div>

            {/* Observaciones */}
            {(observaciones && observaciones.length > 0) && (
              <div className="mb-4 mt-4">
                <div className="bg-blue-600 text-white p-[5px] text-[10px] font-bold text-center uppercase border border-blue-600">
                  OBSERVACIONES
                </div>
                <div className="border-l border-r border-b border-blue-600">
                  {observaciones.map((t: string, idx: number) => (
                    <div key={idx} className="flex p-2 border-b border-blue-600 last:border-b-0">
                      <span className="flex-1 text-[9px] leading-[1.4]">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Imágenes */}
            <PreviewImagesGrid imageUrls={imagenes} />



            {/* Footer Link */}
            {Boolean(i.link_fotografias) && (
              <div className="mt-5 pt-2.5 text-center">
                <span className="text-[10px]">
                  Si desea visualizar más fotografías{' '}
                  <a href={i.link_fotografias} target="_blank" rel="noreferrer" className="text-blue-600 font-bold no-underline">
                    haz click aquí
                  </a>
                </span>
              </div>
            )}

          </div>
        </div>
      </DoubleScrollContainer>
    </div>
  );
}
