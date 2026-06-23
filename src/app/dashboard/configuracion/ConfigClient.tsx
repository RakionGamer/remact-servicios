'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Pencil, Save, Loader2, X } from 'lucide-react';
import { updateConfiguracion } from '@/actions/configuracion';
import { changePasswordAction } from '@/actions/usuarios';

export function ConfigClient({ session, initialConfigs }: { session: any, initialConfigs: Record<string, string> }) {
  // Estado para la sección de empresa
  const [editingCompany, setEditingCompany] = useState(false);
  const [facturacion, setFacturacion] = useState(initialConfigs['DATOS_FACTURACION'] || '');
  const [pago, setPago] = useState(initialConfigs['DATOS_PAGO'] || '');
  const [savingCompany, setSavingCompany] = useState(false);
  const [companyMsg, setCompanyMsg] = useState('');

  // Estado para seguridad
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');

  const handleSaveCompany = async () => {
    setSavingCompany(true);
    setCompanyMsg('');
    await updateConfiguracion('DATOS_FACTURACION', facturacion);
    await updateConfiguracion('DATOS_PAGO', pago);
    setSavingCompany(false);
    setEditingCompany(false);
    setCompanyMsg('Datos actualizados correctamente.');
    setTimeout(() => setCompanyMsg(''), 3000);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdMsg('Las contraseñas nuevas no coinciden.');
      return;
    }
    setSavingPwd(true);
    setPwdMsg('');
    const res = await changePasswordAction(session.id, currentPassword, newPassword);
    if (res.success) {
      setPwdMsg('Contraseña actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPwdMsg(res.error || 'Error al cambiar contraseña.');
    }
    setSavingPwd(false);
    setTimeout(() => setPwdMsg(''), 3000);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 mt-8 items-start">
      {/* SECCIÓN DATOS EMPRESA */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 relative">
        <div className="flex flex-col md:flex-row md:justify-between items-start mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Datos de la Empresa</h2>
            <p className="text-sm text-zinc-500 mt-1">Esta información aparecerá al final de todos los presupuestos emitidos en PDF.</p>
          </div>
          {session?.rol === 'ADMIN' && (
            !editingCompany ? (
              <Button variant="outline" size="sm" onClick={() => setEditingCompany(true)}>
                <Pencil className="w-4 h-4 mr-2" /> Editar Textos
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => {
                  setEditingCompany(false);
                  setFacturacion(initialConfigs['DATOS_FACTURACION'] || '');
                  setPago(initialConfigs['DATOS_PAGO'] || '');
                }}>
                  <X className="w-4 h-4 mr-2" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveCompany} disabled={savingCompany} className="bg-blue-600 hover:bg-blue-700">
                  {savingCompany ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar
                </Button>
              </div>
            )
          )}
        </div>

        {companyMsg && <div className="mb-6 p-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm font-medium">{companyMsg}</div>}

        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-800">Datos de Facturación</label>
            <Textarea 
              value={facturacion} 
              onChange={e => setFacturacion(e.target.value)} 
              disabled={!editingCompany}
              className={`h-32 resize-none text-zinc-700 ${!editingCompany ? 'bg-zinc-50 border-transparent shadow-none cursor-not-allowed font-medium opacity-90' : 'bg-white'}`}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-800">Datos de Pago (Cuenta Bancaria)</label>
            <Textarea 
              value={pago} 
              onChange={e => setPago(e.target.value)} 
              disabled={!editingCompany}
              className={`h-32 resize-none text-zinc-700 ${!editingCompany ? 'bg-zinc-50 border-transparent shadow-none cursor-not-allowed font-medium opacity-90' : 'bg-white'}`}
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN SEGURIDAD */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
        <h2 className="text-xl font-bold text-zinc-900 mb-1">Seguridad</h2>
        <p className="text-sm text-zinc-500 mb-6">Cambia tu contraseña de acceso administrativo.</p>
        
        {pwdMsg && <div className={`mb-6 p-3 rounded-md text-sm font-medium border ${pwdMsg.includes('correctamente') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{pwdMsg}</div>}

        <form onSubmit={handleSavePassword} className="space-y-5 max-w-full">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-800">Contraseña Actual</label>
            <Input 
              type="password" 
              required 
              value={currentPassword} 
              onChange={e => setCurrentPassword(e.target.value)} 
              className="bg-zinc-50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-800">Nueva Contraseña</label>
            <Input 
              type="password" 
              required 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              minLength={6}
              className="bg-zinc-50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-800">Confirmar Nueva Contraseña</label>
            <Input 
              type="password" 
              required 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              minLength={6}
              className="bg-zinc-50"
            />
          </div>
          <Button type="submit" disabled={savingPwd} className="w-full mt-4">
            {savingPwd ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Actualizar Contraseña'}
          </Button>
        </form>
      </div>
    </div>
  );
}
