'use client';

import { Button } from '@/components/ui/button';
import { Download, Printer, Mail } from 'lucide-react';
import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { PresupuestoPDF } from './PresupuestoPDF';

interface PrintButtonProps {
  presupuestoId?: number;
  clienteNombre?: string;
  clienteCorreo?: string;
  estado?: string;
  presupuestoObj?: any;
  configs?: any;
}

export function PrintButton({ presupuestoId, clienteNombre, clienteCorreo, estado, presupuestoObj, configs }: PrintButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    try {
      setIsGenerating(true);
      
      if (!presupuestoObj) throw new Error('Datos del presupuesto no cargados');

      const logoUrl = window.location.origin + '/remact-logo.png';
      
      const blob = await pdf(<PresupuestoPDF presupuesto={presupuestoObj} configs={configs} logoUrl={logoUrl} />).toBlob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const prefix = estado === 'APROBADO' ? 'Cotizacion' : 'Preventa';
      const cleanName = (clienteNombre || '').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '').replace(/\s+/g, '_');
      const filename = `${prefix}_cod_${presupuestoId || ''}_${cleanName}.pdf`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generando PDF nativo:', error);
      alert('Hubo un error al generar el PDF. Inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  /*
  const handleSendEmail = () => {
    const to = clienteCorreo || '';
    const subject = encodeURIComponent(`Cotización Remact #${presupuestoId || ''}`);
    const body = encodeURIComponent(`Estimado/a ${clienteNombre || 'Cliente'},\n\nAdjunto le enviamos la cotización solicitada.\n\nAtentamente,\nEquipo Remact.`);
    
    // Abre Gmail en una nueva pestaña con los datos prellenados
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`, '_blank');
  };
  */

  return (
    <div className="flex gap-2">
      <Button 
        onClick={() => window.print()} 
        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
        title="Imprimir (o guardar como PDF Vectorial, Ligero y Seleccionable)"
      >
        <Printer className="w-4 h-4 mr-2" /> 
        Imprimir
      </Button>
      <Button 
        onClick={generatePDF} 
        disabled={isGenerating} 
        className="bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all"
        title="Descargar Foto PDF Directa (No seleccionable, Pesado)"
      >
        <Download className="w-4 h-4 mr-2" /> 
        {isGenerating ? 'Generando...' : 'Descargar PDF'}
      </Button>
      {/*
      <Button 
        onClick={handleSendEmail} 
        className="bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-100 shadow-sm transition-all"
        title="Redactar correo en Gmail (Deberás adjuntar el PDF manualmente)"
      >
        <Mail className="w-4 h-4 mr-2" /> 
        Enviar por Gmail
      </Button>
      */}
    </div>
  );
}
