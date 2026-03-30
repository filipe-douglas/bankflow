import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine,
  TrendingUp, TrendingDown, Eye, EyeOff, Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAuthStore } from '../store/authStore'
import { accountService, transactionService } from '../services/bankService'
import { Skeleton, Card } from '../components/ui'
import { formatCurrency, formatDateShort, isCredit, txLabels } from '../utils'
import type { TransactionResponse } from '../types'

// ─── Balance card ──────────────────────────────────────────────────────────

function BalanceCard({ balance, accountNumber, accountType }: {
  balance: number
  accountNumber: string
  accountType: string
}) {
  const [hidden, setHidden] = useState(false)

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold-600 via-gold-500 to-gold-400 p-6 shadow-2xl shadow-gold-500/20">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full border-2 border-ink-950" />
        <div className="absolute -bottom-12 -right-4 w-56 h-56 rounded-full border-2 border-ink-950" />
        <div className="absolute top-1/2 -left-8 w-28 h-28 rounded-full border border-ink-950" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-gold-900/70 text-xs font-medium tracking-widest uppercase">Saldo disponível</p>
            <p className="text-xs font-mono text-gold-900/60 mt-1">{accountNumber}</p>
          </div>
          <button
            onClick={() => setHidden(!hidden)}
            className="w-8 h-8 rounded-lg bg-gold-900/10 hover:bg-gold-900/20 flex items-center justify-center transition-colors"
          >
            {hidden ? <EyeOff size={15} className="text-gold-900/70" /> : <Eye size={15} className="text-gold-900/70" />}
          </button>
        </div>

        <div className="mb-6">
          <span className="font-display text-4xl font-bold text-ink-950 tracking-tight">
            {hidden ? '••••••' : formatCurrency(balance)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-md bg-gold-900/10 text-gold-950 text-xs font-medium">
            {accountType === 'CORRENTE' ? 'Conta Corrente' : 'Conta Poupança'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Quick action button ────────────────────────────────────────────────────

function QuickAction({ icon, label, to, color }: {
  icon: React.ReactNode
  label: string
  to: string
  color: string
}) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className="flex flex-col items-center gap-2 group"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200
        group-hover:scale-110 group-hover:shadow-lg ${color}`}>
        {icon}
      </div>
      <span className="text-xs text-ink-400 group-hover:text-ink-200 transition-colors font-medium">{label}</span>
    </button>
  )
}

// ─── Transaction row ────────────────────────────────────────────────────────

function TxRow({ tx }: { tx: TransactionResponse }) {
  const credit = isCredit(tx.type)
  return (
    <div className="flex items-center gap-3 py-3 border-b border-ink-800/50 last:border-0">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
        ${credit ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
        {credit
          ? <ArrowDownToLine size={16} className="text-emerald-400" />
          : <ArrowUpFromLine size={16} className="text-red-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink-100 truncate">{txLabels[tx.type]}</p>
        <p className="text-xs text-ink-500 truncate">{tx.description || '—'}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-medium font-mono ${credit ? 'text-emerald-400' : 'text-red-400'}`}>
          {credit ? '+' : '-'}{formatCurrency(tx.amount)}
        </p>
        <p className="text-xs text-ink-500">{formatDateShort(tx.createdAt)}</p>
      </div>
    </div>
  )
}

// ─── Chart tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs">
      <p className="text-ink-400">{label}</p>
      <p className="text-gold-400 font-mono font-medium">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: account, isLoading: loadingAccount } = useQuery({
    queryKey: ['account'],
    queryFn: accountService.getMyAccount,
  })

  const { data: statementPage, isLoading: loadingTx } = useQuery({
    queryKey: ['statement', 'recent'],
    queryFn: () => transactionService.getStatement({ page: 0, size: 10 }),
  })

  const transactions = statementPage?.content ?? []

  // Build chart data from last 7 transactions (running balance)
  const chartData = [...transactions]
    .reverse()
    .slice(-7)
    .map((tx) => ({
      date: formatDateShort(tx.createdAt),
      saldo: tx.balanceAfter ?? 0,
    }))

  const totalIn = transactions
    .filter((t) => isCredit(t.type))
    .reduce((s, t) => s + t.amount, 0)

  const totalOut = transactions
    .filter((t) => !isCredit(t.type))
    .reduce((s, t) => s + t.amount, 0)

  const firstName = user?.fullName?.split(' ')[0] ?? 'Usuário'

  return (
    <div className="space-y-6 page-fade">
      {/* Header */}
      <div className="animate-fade-up">
        <p className="text-ink-400 text-sm">Bem-vindo de volta,</p>
        <h1 className="font-display text-3xl font-bold text-ink-50">{firstName}</h1>
      </div>

      {/* Balance + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up stagger-1">
        <div className="lg:col-span-2">
          {loadingAccount ? (
            <Skeleton className="h-48" />
          ) : account ? (
            <BalanceCard
              balance={account.balance}
              accountNumber={account.accountNumber}
              accountType={account.accountType}
            />
          ) : null}
        </div>

        <Card className="flex flex-col justify-center">
          <p className="label mb-4">Ações rápidas</p>
          <div className="grid grid-cols-3 gap-4">
            <QuickAction
              icon={<ArrowLeftRight size={20} className="text-gold-400" />}
              label="Transferir"
              to="/transfer"
              color="bg-gold-500/10 border border-gold-500/20"
            />
            <QuickAction
              icon={<ArrowDownToLine size={20} className="text-emerald-400" />}
              label="Depositar"
              to="/deposit"
              color="bg-emerald-500/10 border border-emerald-500/20"
            />
            <QuickAction
              icon={<ArrowUpFromLine size={20} className="text-red-400" />}
              label="Sacar"
              to="/withdraw"
              color="bg-red-500/10 border border-red-500/20"
            />
          </div>

          <div className="divider" />

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-gold rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp size={12} className="text-emerald-400" />
                <span className="text-xs text-ink-400">Entradas</span>
              </div>
              <p className="text-sm font-mono font-semibold text-emerald-400">
                {formatCurrency(totalIn)}
              </p>
            </div>
            <div className="glass rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown size={12} className="text-red-400" />
                <span className="text-xs text-ink-400">Saídas</span>
              </div>
              <p className="text-sm font-mono font-semibold text-red-400">
                {formatCurrency(totalOut)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <Card className="animate-fade-up stagger-2">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={16} className="text-gold-500" />
            <p className="text-sm font-medium text-ink-200">Evolução do saldo</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"   stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%"  stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="saldo"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#goldGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Recent transactions */}
      <Card className="animate-fade-up stagger-3">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-ink-200">Últimas movimentações</p>
          <a href="/statement" className="text-xs text-gold-500 hover:text-gold-400 transition-colors">
            Ver extrato →
          </a>
        </div>

        {loadingTx ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-ink-500 text-sm text-center py-8">Nenhuma movimentação ainda.</p>
        ) : (
          <div>
            {transactions.slice(0, 5).map((tx) => <TxRow key={tx.id} tx={tx} />)}
          </div>
        )}
      </Card>
    </div>
  )
}
