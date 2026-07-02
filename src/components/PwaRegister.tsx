'use client';
import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('Fallo al registrar Service Worker PWA: ', err);
      });
    }
  }, []);
  
  return null;
}
