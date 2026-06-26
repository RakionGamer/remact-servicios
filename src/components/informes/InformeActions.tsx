"use client"

import { Button } from '@/components/ui/button';
import { Download, Loader2, Pencil } from 'lucide-react';
import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { InformePDF } from '@/components/informes/InformePDF';
import { toast } from 'sonner';
import Link from 'next/link';
import { processImagesLayout } from '@/lib/imageUtils';

export function InformeActions({ informe, configs, logoUrl }: { informe: any, configs: any, logoUrl: string }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadPDF = async () => {
    setIsGenerating(true);
    try {
      const imagenes = typeof informe.imagenes === 'string' ? JSON.parse(informe.imagenes) : informe.imagenes;
      const layout = await processImagesLayout(imagenes || []);
      const blob = await pdf(
        <InformePDF informe={informe} configs={configs} logoUrl={logoUrl} imagenesLayout={layout} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dirObra = informe.direccion_obra ? informe.direccion_obra.trim() : '';
      const comunaObra = informe.comuna ? informe.comuna.trim() : '';
      let filename = 'Informe';
      if (dirObra) filename += ` ${dirObra}`;
      if (comunaObra) filename += ` ${comunaObra}`;
      if (!dirObra && !comunaObra) filename += ` ${informe.id}`;
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("PDF generado exitosamente");
    } catch (e) {
      console.error(e);
      toast.error("Error al generar PDF");
    }
    setIsGenerating(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" asChild>
        <Link href={`/dashboard/informes/${informe.id}/editar`}>
          <Pencil className="w-4 h-4 mr-2" /> Editar
        </Link>
      </Button>
      <Button onClick={downloadPDF} disabled={isGenerating}>
        {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
        Descargar PDF
      </Button>
    </div>
  );
}
