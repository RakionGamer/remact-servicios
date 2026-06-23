'use client';

import { useState, useEffect, useRef } from 'react';
import { io as ClientIO } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User as UserIcon } from 'lucide-react';
import { createComentario, getComentarios } from '@/actions/comentarios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatProps {
  presupuestoId: number;
  initialComments: any[];
  currentUser: any;
}

export function ChatPresupuesto({ presupuestoId, initialComments, currentUser }: ChatProps) {
  const [messages, setMessages] = useState<any[]>(initialComments);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let socketInstance: any;

      // Conectar el cliente al servidor custom de WebSockets
      socketInstance = ClientIO(process.env.NEXT_PUBLIC_SITE_URL || undefined, {
        path: '/api/socket/io',
        addTrailingSlash: false,
        transports: ['websocket'],
      });

      socketInstance.on('connect', () => {
        socketInstance.emit('join-room', `presupuesto-${presupuestoId}`);
      });

      socketInstance.on('receive-message', (data: any) => {
        setMessages((prev) => {
          if (prev.find(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
      });

      setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [presupuestoId]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const msgText = newMessage;
    setNewMessage(''); // optimistic clear

    const res = await createComentario(presupuestoId, msgText);
    if (res.success) {
      const savedMessage = res.data;
      setMessages(prev => [...prev, savedMessage]);
      if (socket) {
        socket.emit('send-message', {
          ...savedMessage,
          roomId: `presupuesto-${presupuestoId}`
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-[500px] border border-zinc-200 rounded-xl bg-white shadow-sm overflow-hidden mt-6 no-print">
      <div className="bg-zinc-50 border-b border-zinc-200 p-4 font-semibold text-zinc-800 flex justify-between items-center">
        <span>Comentarios y Revisiones (Chat en Vivo)</span>
        <span className="text-xs text-green-600 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Conectado
        </span>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
            No hay comentarios aún. Escribe el primero.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.usuario_id === currentUser?.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {!isMe && <UserIcon className="w-3 h-3 text-zinc-500" />}
                  <span className="text-xs font-medium text-zinc-600">{isMe ? 'Tú' : msg.usuario_nombre}</span>
                  <span className="text-[10px] text-zinc-400">
                    {msg.fecha_creacion ? format(new Date(msg.fecha_creacion), "dd MMM, HH:mm", { locale: es }) : ''}
                  </span>
                </div>
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-zinc-100 text-zinc-800 rounded-tl-none'
                  }`}
                >
                  {msg.mensaje}
                </div>
              </div>
            );
          })
        )}

      </div>

      <div className="p-3 border-t border-zinc-200 bg-zinc-50 flex gap-2">
        <Input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
          placeholder="Escribe un mensaje..."
          className="flex-1"
        />
        <Button onClick={handleSend} size="icon" className="bg-blue-600 hover:bg-blue-700">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
