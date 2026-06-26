'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateInforme } from '@/actions/informes';
import { getServicios } from '@/actions/servicios';
import { uploadImage } from '@/actions/cloudinary';
import { Loader2, Calendar as CalendarIcon, Save, Trash2, Plus, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { ServiciosSelectionModal } from '@/components/presupuestos/ServiciosSelectionModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import Link from 'next/link';

export function EditarInformeClient({ informe, clientes }: { informe: any, clientes: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Parse fields
  const parseJson = (val: any) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return []; }
    }
    return Array.isArray(val) ? val : [];
  };

  const initialTrabajos = parseJson(informe.trabajos_realizados).map((t: string, i: number) => ({ id: i.toString(), text: t }));
  const initialObservaciones = parseJson(informe.observaciones).map((t: string, i: number) => ({ id: i.toString(), text: t }));
  const initialImages = parseJson(informe.imagenes);

  const clienteSeleccionado = clientes.find(c => c.id === informe.cliente_id) || null;

  // Form State
  const [servicios, setServicios] = useState<any[]>([]);
  const [clienteNombre, setClienteNombre] = useState(informe.cliente_nombre || '');
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(informe.direccion_obra || '');
  const [solicitadoPor, setSolicitadoPor] = useState(informe.solicitado_por || '');
  const [comuna, setComuna] = useState(informe.comuna || '');
  const [trabajosSolicitados, setTrabajosSolicitados] = useState(informe.trabajos_solicitados || '');

  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(informe.fecha_inicio ? new Date(informe.fecha_inicio) : undefined);
  const [fechaFin, setFechaFin] = useState<Date | undefined>(informe.fecha_fin ? new Date(informe.fecha_fin) : undefined);
  const [fechaInforme, setFechaInforme] = useState<Date | undefined>(informe.fecha_informe ? new Date(informe.fecha_informe) : new Date());

  const [trabajosRealizados, setTrabajosRealizados] = useState<{ id: string; text: string }[]>(initialTrabajos);
  const [observaciones, setObservaciones] = useState<{ id: string; text: string }[]>(initialObservaciones);
  const [linkFotografias, setLinkFotografias] = useState(informe.link_fotografias || '');
  type ImageGroupState = {
    id: string;
    tag: string;
    existingUrls: string[];
    newFiles: File[];
  };

  const initialGroups: ImageGroupState[] = [];
  if (initialImages.length > 0) {
    const isFlatArray = typeof initialImages[0] === 'string';
    if (isFlatArray) {
      initialGroups.push({ id: 'initial', tag: '', existingUrls: initialImages as string[], newFiles: [] });
    } else {
      (initialImages as { tag: string, urls: string[] }[]).forEach((g, i) => {
        initialGroups.push({ id: `group-${i}`, tag: g.tag || '', existingUrls: g.urls || [], newFiles: [] });
      });
    }
  } else {
    initialGroups.push({ id: 'initial', tag: 'Antes', existingUrls: [], newFiles: [] });
  }

  const [imageGroups, setImageGroups] = useState<ImageGroupState[]>(initialGroups);

  useEffect(() => {
    getServicios().then(res => { if (res.success) setServicios(res.data || []) });
  }, []);

  const addTrabajoRealizado = () => {
    setTrabajosRealizados([...trabajosRealizados, { id: Date.now().toString(), text: '' }]);
  };

  const updateTrabajoRealizado = (id: string, text: string) => {
    setTrabajosRealizados(trabajosRealizados.map(t => t.id === id ? { ...t, text } : t));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTrabajoRealizado();
      setTimeout(() => {
        const inputs = document.querySelectorAll('input[name="trabajo-item"]');
        const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
        if (lastInput) lastInput.focus();
      }, 10);
    }
  };

  const removeTrabajoRealizado = (id: string) => {
    setTrabajosRealizados(trabajosRealizados.filter(t => t.id !== id));
  };

  const addObservacion = () => {
    setObservaciones([...observaciones, { id: Date.now().toString(), text: '' }]);
  };

  const updateObservacion = (id: string, text: string) => {
    setObservaciones(observaciones.map(t => t.id === id ? { ...t, text } : t));
  };

  const handleKeyDownObservaciones = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addObservacion();
      setTimeout(() => {
        const inputs = document.querySelectorAll('input[name="observacion-item"]');
        const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
        if (lastInput) lastInput.focus();
      }, 10);
    }
  };

  const removeObservacion = (id: string) => {
    setObservaciones(observaciones.filter(t => t.id !== id));
  };

  const addImageGroup = (tag: string) => {
    setImageGroups(prev => [...prev, { id: Date.now().toString(), tag, existingUrls: [], newFiles: [] }]);
  };

  const removeImageGroup = (id: string) => {
    setImageGroups(prev => prev.filter(g => g.id !== id));
  };

  const handleGroupImageChange = (groupId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImageGroups(prev => prev.map(g => g.id === groupId ? { ...g, newFiles: [...g.newFiles, ...filesArray] } : g));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (groupId: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (filesArray.length > 0) {
        setImageGroups(prev => prev.map(g => g.id === groupId ? { ...g, newFiles: [...g.newFiles, ...filesArray] } : g));
      }
    }
  };

  const removeGroupNewImage = (groupId: string, index: number) => {
    setImageGroups(prev => prev.map(g => g.id === groupId ? { ...g, newFiles: g.newFiles.filter((_, i) => i !== index) } : g));
  };

  const removeGroupExistingImage = (groupId: string, index: number) => {
    setImageGroups(prev => prev.map(g => g.id === groupId ? { ...g, existingUrls: g.existingUrls.filter((_, i) => i !== index) } : g));
  };

  const handleSubmit = async () => {
    if (!fechaInforme) {
      toast.error('Debes seleccionar la fecha del informe.');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload new images by groups
      const finalGroupsData: { tag: string, urls: string[] }[] = [];

      for (const group of imageGroups) {
        const imageUrls: string[] = [...group.existingUrls];
        if (group.newFiles.length > 0) {
          toast.loading(`Subiendo imágenes para "${group.tag || 'Sin título'}"...`, { id: 'uploading' });

          for (let i = 0; i < group.newFiles.length; i++) {
            const formData = new FormData();
            formData.append('file', group.newFiles[i]);
            const result = await uploadImage(formData);
            if (result.success && result.url) {
              imageUrls.push(result.url);
            } else {
              console.error("Error uploading image:", result.error);
              toast.error(`Error subiendo imagen en grupo ${group.tag}`);
            }
          }
          toast.dismiss('uploading');
        }
        if (imageUrls.length > 0 || group.tag) {
          if (imageUrls.length > 0) {
            finalGroupsData.push({ tag: group.tag, urls: imageUrls });
          }
        }
      }

      // 2. Save informe
      const payload = {
        cliente_nombre: clienteNombre,
        solicitado_por: solicitadoPor,
        direccion_obra: direccionSeleccionada,
        comuna,
        trabajos_solicitados: trabajosSolicitados,
        fecha_inicio: fechaInicio ? format(fechaInicio, 'yyyy-MM-dd') : null,
        fecha_fin: fechaFin ? format(fechaFin, 'yyyy-MM-dd') : null,
        fecha_informe: fechaInforme ? format(fechaInforme, 'yyyy-MM-dd') : null,
        trabajos_realizados: trabajosRealizados.filter(t => t.text.trim() !== '').map(t => t.text),
        observaciones: observaciones.filter(t => t.text.trim() !== '').map(t => t.text),
        link_fotografias: linkFotografias.trim() !== '' ? linkFotografias.trim() : null,
        imagenes: finalGroupsData
      };

      const res = await updateInforme(informe.id, payload);
      if (res.success) {
        toast.success("Informe actualizado correctamente");
        router.push(`/dashboard/informes/${informe.id}`);
      } else {
        toast.error(res.error || 'Error al actualizar el informe');
      }
    } catch (err: any) {
      toast.error("Error inesperado: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/informes/${informe.id}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Editar Informe N°{informe.id}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className={cn("w-[200px] justify-start text-left font-normal bg-white h-10 shadow-sm", !fechaInforme && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fechaInforme ? format(fechaInforme, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={fechaInforme} onSelect={setFechaInforme} locale={es} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 space-y-8">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800">Cliente <span className="text-red-500">*</span></label>
            <Input value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Ej: Juan Pérez" className="h-10 bg-white" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800">Dirección de Obra</label>
            <Input value={direccionSeleccionada} onChange={e => setDireccionSeleccionada(e.target.value)} placeholder="Ej: Av. Principal 123" className="h-10 bg-white" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800">Solicitado Por</label>
            <Input value={solicitadoPor} onChange={e => setSolicitadoPor(e.target.value)} placeholder="Ej: Paola Rivero" className="h-10 bg-white" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800">Comuna</label>
            <Input value={comuna} onChange={e => setComuna(e.target.value)} placeholder="Ej: Huechuraba" className="h-10 bg-white" />
          </div>

          <div className="space-y-1.5 col-span-1 md:col-span-2">
            <label className="text-sm font-semibold text-zinc-800">Trabajos Solicitados</label>
            <Textarea
              value={trabajosSolicitados}
              onChange={e => setTrabajosSolicitados(e.target.value)}
              placeholder="Ej: Detección y reparación de filtración de agua..."
              className="bg-white min-h-[80px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800">Inicio de Trabajos</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white h-10 shadow-sm", !fechaInicio && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaInicio ? format(fechaInicio, "PPP", { locale: es }) : <span>Seleccionar</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={fechaInicio} onSelect={setFechaInicio} locale={es} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800">Fin de Trabajos</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white h-10 shadow-sm", !fechaFin && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaFin ? format(fechaFin, "PPP", { locale: es }) : <span>Seleccionar</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={fechaFin} onSelect={setFechaFin} locale={es} />
              </PopoverContent>
            </Popover>
          </div>


        </div>

        <hr className="border-zinc-200" />

        {/* Trabajos Realizados */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">Trabajos Realizados</h2>
            <div className="flex gap-2">
              <ServiciosSelectionModal
                servicios={servicios}
                initialSelectedIds={[]}
                hidePrices={true}
                onAddServicios={(selected) => {
                  const newTrabajos = selected.map((s, i) => ({
                    id: Date.now().toString() + '-' + i,
                    text: s.item
                  }));
                  setTrabajosRealizados(prev => [...prev, ...newTrabajos]);
                }}
              />
              <Button type="button" onClick={addTrabajoRealizado} variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Manual
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {trabajosRealizados.length === 0 ? (
              <p className="text-sm text-zinc-500 italic text-center py-4 border rounded-md border-dashed">No se han agregado trabajos realizados.</p>
            ) : (
              trabajosRealizados.map((t, index) => (
                <div key={t.id} className="flex gap-2 items-start">
                  <Input
                    name="trabajo-item"
                    value={t.text}
                    onChange={e => updateTrabajoRealizado(t.id, e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Trabajo realizado ${index + 1}`}
                    className="bg-white flex-1"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeTrabajoRealizado(t.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <hr className="border-zinc-200" />

        {/* Observaciones */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Observaciones</h2>
            <Button type="button" onClick={addObservacion} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Agregar Item
            </Button>
          </div>

          <div className="space-y-3">
            {observaciones.length === 0 ? (
              <p className="text-sm text-zinc-500 italic text-center py-4 border rounded-md border-dashed">No se han agregado observaciones.</p>
            ) : (
              observaciones.map((t, index) => (
                <div key={t.id} className="flex gap-2 items-start">
                  <Input
                    name="observacion-item"
                    value={t.text}
                    onChange={e => updateObservacion(t.id, e.target.value)}
                    onKeyDown={handleKeyDownObservaciones}
                    placeholder={`Observación ${index + 1}`}
                    className="bg-white flex-1"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeObservacion(t.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <hr className="border-zinc-200" />

        {/* Imágenes por Grupos */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Imágenes del Informe</h2>
              <p className="text-sm text-zinc-500">Agrupa las imágenes por etapas (ej: Antes, Después).</p>
            </div>
          </div>

          <div className="space-y-6">
            {imageGroups.map((group, groupIndex) => (
              <div key={group.id} className="border border-zinc-200 rounded-lg p-4 bg-zinc-50 relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-zinc-800 mb-2 block">Etapa del Grupo</label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={group.tag.toLowerCase() === 'antes' ? 'default' : 'outline'}
                        onClick={() => setImageGroups(prev => prev.map(g => g.id === group.id ? { ...g, tag: 'Antes' } : g))}
                        className={group.tag.toLowerCase() === 'antes' ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-zinc-100'}
                      >
                        Antes
                      </Button>
                      <Button
                        type="button"
                        variant={group.tag.toLowerCase() === 'después' || group.tag.toLowerCase() === 'despues' ? 'default' : 'outline'}
                        onClick={() => setImageGroups(prev => prev.map(g => g.id === group.id ? { ...g, tag: 'Después' } : g))}
                        className={group.tag.toLowerCase() === 'después' || group.tag.toLowerCase() === 'despues' ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-zinc-100'}
                      >
                        Después
                      </Button>
                    </div>
                  </div>
                  {imageGroups.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeImageGroup(group.id)} className="text-red-500 hover:text-red-700 hover:bg-red-100 mt-6">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="mb-4">
                  <input
                    type="file"
                    id={`images-upload-${group.id}`}
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleGroupImageChange(group.id, e)}
                  />
                  <label htmlFor={`images-upload-${group.id}`}>
                    <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-white hover:bg-zinc-100 hover:text-accent-foreground h-9 px-3 cursor-pointer">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Añadir Fotos a este Grupo
                    </div>
                  </label>
                </div>
                {(group.existingUrls.length > 0 || group.newFiles.length > 0) ? (
                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 bg-white p-4 rounded-md border border-zinc-200 min-h-[150px]"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(group.id, e)}
                  >
                    {group.existingUrls.map((url, index) => (
                      <div key={`existing-${index}`} className="relative group aspect-square rounded-md overflow-hidden border border-zinc-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Imagen ${index}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button type="button" variant="destructive" size="icon" onClick={() => removeGroupExistingImage(group.id, index)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {group.newFiles.map((file, index) => (
                      <div key={`new-${index}`} className="relative group aspect-square rounded-md overflow-hidden border border-zinc-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={URL.createObjectURL(file)} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button type="button" variant="destructive" size="icon" onClick={() => removeGroupNewImage(group.id, index)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="text-sm text-zinc-500 italic text-center py-6 border rounded-md border-dashed bg-white cursor-pointer hover:bg-zinc-50"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(group.id, e)}
                    onClick={() => document.getElementById(`images-upload-${group.id}`)?.click()}
                  >
                    No hay fotos en este grupo. Arrastra y suelta imágenes aquí, o haz clic para subir.
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button type="button" onClick={() => addImageGroup('')} variant="outline" className="w-full border-dashed border-2 py-8 text-zinc-500 hover:text-zinc-800">
            <Plus className="w-4 h-4 mr-2" /> Agregar Nuevo Grupo de Imágenes
          </Button>
        </div>

        <div className="bg-zinc-50 p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-zinc-800">Enlace de Fotografías Adicionales</h2>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Enlace (Opcional)</label>
            <Input
              value={linkFotografias}
              onChange={(e) => setLinkFotografias(e.target.value)}
              placeholder="Ej: https://drive.google.com/drive/folders/..."
              className="bg-white"
            />
            <p className="text-xs text-zinc-500 mt-1">Este enlace aparecerá al final del PDF para redirigir al cliente a más fotos.</p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 pt-4">
          <Button variant="ghost" onClick={() => router.push(`/dashboard/informes/${informe.id}`)} className="w-full sm:w-auto">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} size="lg" className="w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Actualizar Informe
          </Button>
        </div>

      </div>
    </div>
  );
}
