import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRUT(rut: string) {
  let value = rut.replace(/[^0-9kK]/g, '');
  if (value.length === 0) return '';
  const dv = value.slice(-1).toUpperCase();
  const body = value.slice(0, -1);
  if (body.length === 0) return dv;
  const formatBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatBody}-${dv}`;
}
