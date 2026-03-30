import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FileText, ArrowDownToLine, ArrowUpFromLine,
  ArrowLeftRight, ChevronLeft, ChevronRight, SlidersHorizontal,
} from 'lucide-react'
import { transactionService } from '../services/bankService'
import { Card, Skeleton, EmptyState, Button, Select } from '../components/ui'
import { formatCurrency, formatDate, isCredit, txLabels } from '../utils'
import type { TransactionResponse, TransactionType } from '../types'

function TxIcon({ type }: { type: TransactionType }) {
  const credit = isCredit(type)
  const map = {
    TRANSFERENCIA_ENVIADA:  <ArrowLeftRight size={16} className="text-red-400" />,
    TRANSFERENCIA_RECEBIDA: <ArrowLeftRight size={16} className="text-emerald-400" />,
    DEPOSITO:               <ArrowDownToLine size={16} className="text-emerald-400" />,
    SAQUE:                  <ArrowUpFromLine size={16} className="text-red-400" />,
  }
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
      ${credit ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
      {map[type]}
    </div>
  )
}

function TxRow({ tx }: { tx: TransactionResponse }) {
  const credit = isCredit(tx.type)
  const counterparty = credit ? tx.sourceAccountNumber : tx.targetAccountNumber

  return (
    <div className="flex items-center gap-4 py-4 border-b border-ink-800/50 last:border-0 group hover:bg-ink-800/20 -mx-6 px-6 transition-colors">
      <TxIcon type={tx.type} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-100">{txLabels[tx.type]}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {counterparty && (
            <span className="text-xs font-mono text-ink-500">{counterparty}</span>
          )}
          {tx.description && (
            <span className="text-xs text-ink-500 truncate">• {tx.description}</span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className={`font-mono font-semibold text-sm ${credit ? 'text-emerald-400' : 'text-red-400'}`}>
          {credit ? '+' : '-'}{formatCurrency(tx.amount)}
        </p>
        {tx.balanceAfter != null && (
          <p className="text-xs text-ink-500 mt-0.5">
            Saldo: {formatCurrency(tx.balanceAfter)}
          </p>
        )}
        <p className="text-xs text-ink-600 mt-0.5">{formatDate(tx.createdAt)}</p>
      </div>
    </div>
  )
}

export default function StatementPage() {
  const [page, setPage] = useState(0)
  const [typeFilter, setTypeFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['statement', page, typeFilter, startDate, endDate],
    queryFn: () =>
      transactionService.getStatement({
        page,
        size: 15,
        type: typeFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    placeholderData: (prev) => prev,
  })

  const transactions = data?.content ?? []
  const totalPages = data?.totalPages ?? 1

  const clearFilters = () => {
    setTypeFilter('')
    setStartDate('')
    setEndDate('')
    setPage(0)
  }

  const hasFilters = typeFilter || startDate || endDate

  return (
    <div className="space-y-6 page-fade">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ink-700 border border-ink-600 flex items-center justify-center">
            <FileText size={18} className="text-ink-300" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-50">Extrato</h1>
            <p className="text-ink-400 text-sm">
              {data ? `${data.totalElements} movimentação${data.totalElements !== 1 ? 'ões' : ''}` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all
            ${showFilters || hasFilters
              ? 'bg-gold-500/10 border border-gold-500/20 text-gold-400'
              : 'glass text-ink-400 hover:text-ink-200'}`}
        >
          <SlidersHorizontal size={16} />
          Filtros
          {hasFilters && <span className="w-2 h-2 rounded-full bg-gold-500" />}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="animate-fade-up">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Tipo"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}
            >
              <option value="">Todos</option>
              <option value="DEPOSITO">Depósito</option>
              <option value="SAQUE">Saque</option>
              <option value="TRANSFERENCIA_ENVIADA">Transferência enviada</option>
              <option value="TRANSFERENCIA_RECEBIDA">Transferência recebida</option>
            </Select>
            <div>
              <label className="label">Data inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(0) }}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Data final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(0) }}
                className="input-field"
              />
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </Card>
      )}

      {/* Transactions */}
      <Card className="animate-fade-up stagger-1">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<FileText size={40} />}
            title="Nenhuma movimentação encontrada"
            description={hasFilters ? 'Tente ajustar os filtros' : 'Suas transações aparecerão aqui'}
          />
        ) : (
          <div>
            {transactions.map((tx) => <TxRow key={tx.id} tx={tx} />)}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 animate-fade-up stagger-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            icon={<ChevronLeft size={16} />}
          >
            Anterior
          </Button>
          <span className="text-sm text-ink-400">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={data?.last}
            icon={<ChevronRight size={16} />}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}
