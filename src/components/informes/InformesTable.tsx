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
    if (typeof dateValue === 'string') {
      return dateValue.substring(0,10).split('-').reverse().join('-');
    }
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
      {/* Vista Móvil (Tarjetas) */}
      <div className="md:hidden space-y-4">
        {informes.length > 0 ? (
          informes.map((i: any) => (
            <div key={i.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-zinc-500 font-medium">#{i.id}</div>
                  <div className="font-bold text-base text-zinc-900 leading-tight">{i.cliente_nombre}</div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xs font-semibold text-zinc-600 bg-zinc-100 px-2 py-1 rounded-md">
                    {formatDate(i.fecha_informe)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-zinc-500 text-xs block mb-0.5">Obra</span>
                  <span className="font-medium text-zinc-800 line-clamp-2">{i.direccion_obra || '-'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs block mb-0.5">Solicitado Por</span>
                  <span className="font-medium text-zinc-800 line-clamp-2">{i.solicitado_por || '-'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex justify-end items-center">
                <div className="flex items-center gap-1 bg-zinc-50 rounded-lg p-1 border border-zinc-100">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 text-zinc-500 hover:text-blue-600 hover:bg-blue-100">
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
                        className="h-8 w-8 p-0 text-zinc-500 hover:text-blue-600 hover:bg-blue-100"
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
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
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
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border p-8 text-center text-muted-foreground shadow-sm">
            No hay informes registrados.
          </div>
        )}
      </div>

      {/* Vista Desktop (Tabla) */}
      <div className="hidden md:block bg-white rounded-md border shadow-sm">
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
          <DialogFooter className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 mt-4 sm:mt-0 w-full">
            <Button size="lg" type="button" variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button size="lg" type="button" variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting} className="flex-1 sm:flex-none">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
