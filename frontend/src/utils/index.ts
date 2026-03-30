import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TransactionType } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(dateStr))
}

export function formatCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14)
}

export function formatAccountNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11)
}

export const txLabels: Record<TransactionType, string> = {
  TRANSFERENCIA_ENVIADA:   'Transferência enviada',
  TRANSFERENCIA_RECEBIDA:  'Transferência recebida',
  DEPOSITO:                'Depósito',
  SAQUE:                   'Saque',
}

export function isCredit(type: TransactionType): boolean {
  return type === 'TRANSFERENCIA_RECEBIDA' || type === 'DEPOSITO'
}

export function maskAccountNumber(number: string): string {
  if (!number) return ''
  const parts = number.split('.')
  if (parts.length < 2) return number
  return `****${number.slice(-4)}`
}
