"use client"

import { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { deleteInforme } from '@/actions/informes';
import { toast } from 'sonner';
import { Loader2, Trash2, Download, Eye } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { pdf } from '@react-pdf/renderer';
import { InformePDF } from './InformePDF';

export function InformesTable({
  initialInformes,
  isAdmin,
  configs,
  logoUrl
}: {
  initialInformes: any[];
  isAdmin: boolean;
  configs: any;
  logoUrl: string;
}) {
  const [informes, setInformes] = useState<any[]>(initialInformes);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState<number | null>(null);

  useEffect(() => {
    setInformes(initialInformes);
  }, [initialInformes]);

  const formatDate = (dateValue: any) => {
    if (!dateValue) return '';
    const isoStr = new Date(dateValue).toISOString();
    const dateStr = isoStr.split('T')[0];
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    setIsDeleting(true);
    const result = await deleteInforme(deleteId);
    if (!result.success) {
      toast.error(result.error || 'Ocurrió un error al eliminar el informe.');
    } else {
      toast.success('Informe eliminado correctamente.');
      setInformes(prev => prev.filter(i => i.id !== deleteId));
      setDeleteId(null);
    }
    setIsDeleting(false);
  };

  const downloadPDF = async (informe: any) => {
    setIsGenerating(informe.id);
    try {
      const { processImagesLayout } = await import('@/lib/imageUtils');
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
    setIsGenerating(null);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="bg-white rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Fecha Informe</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Solicitado Por</TableHead>
              <TableHead>Obra</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {informes.length > 0 ? (
              informes.map((i: any) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium text-muted-foreground">#{i.id}</TableCell>
                  <TableCell>{formatDate(i.fecha_informe)}</TableCell>
                  <TableCell className="font-medium">{i.cliente_nombre}</TableCell>
                  <TableCell>{i.solicitado_por || '-'}</TableCell>
                  <TableCell>{i.direccion_obra || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" asChild className="px-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50">
                            <Link href={`/dashboard/informes/${i.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ver Informe</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="px-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => downloadPDF(i)}
                            disabled={isGenerating === i.id}
                          >
                            {isGenerating === i.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Descargar PDF</p>
                        </TooltipContent>
                      </Tooltip>
                      {isAdmin && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
                              onClick={() => setDeleteId(i.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Eliminar informe</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No hay informes registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && !isDeleting && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar Informe</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el informe #{deleteId}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
