import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowDownToLine, ArrowUpFromLine, DollarSign, FileText } from 'lucide-react'
import { Button, Input, Card } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { transactionService } from '../services/bankService'
import { extractApiError } from '../services/api'
import { formatCurrency } from '../utils'

const makeSchema = (max: number) =>
  z.object({
    amount: z
      .string()
      .min(1, 'Valor obrigatório')
      .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Valor deve ser positivo')
      .refine((v) => parseFloat(v) <= max, `Máximo ${formatCurrency(max)}`),
    description: z.string().max(255).optional(),
  })

type FormData = { amount: string; description?: string }

function OperationForm({
  type,
}: {
  type: 'deposit' | 'withdraw'
}) {
  const isDeposit = type === 'deposit'
  const maxAmount = isDeposit ? 100000 : 2000
  const dailyLimit = isDeposit ? null : 5000
  const schema = makeSchema(maxAmount)

  const { success, error } = useToast()
  const queryClient = useQueryClient()

  const {
    register, handleSubmit, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const amount = parseFloat(watch('amount') ?? '0') || 0

  const onSubmit = async (data: FormData) => {
    const payload = { amount: parseFloat(data.amount), description: data.description }
    try {
      if (isDeposit) {
        await transactionService.deposit(payload)
      } else {
        await transactionService.withdraw(payload)
      }
      queryClient.invalidateQueries({ queryKey: ['account'] })
      queryClient.invalidateQueries({ queryKey: ['statement'] })
      success(`${isDeposit ? 'Depósito' : 'Saque'} realizado com sucesso!`)
      reset()
    } catch (err) {
      error(extractApiError(err))
    }
  }

  const color = isDeposit
    ? { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: 'text-emerald-400' }
    : { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: 'text-red-400' }

  return (
    <div className="max-w-lg space-y-6 page-fade">
      <div className="animate-fade-up">
        <div className="flex items-center gap-3 mb-1">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color.bg} border ${color.border}`}>
            {isDeposit
              ? <ArrowDownToLine size={18} className={color.icon} />
              : <ArrowUpFromLine size={18} className={color.icon} />}
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-50">
            {isDeposit ? 'Depósito' : 'Saque'}
          </h1>
        </div>
        <p className="text-ink-400 text-sm ml-12">
          {isDeposit ? 'Adicione saldo à sua conta' : 'Retire dinheiro da sua conta'}
        </p>
      </div>

      {/* Limits */}
      <Card className="animate-fade-up stagger-1">
        <div className={`grid gap-4 text-center ${dailyLimit ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div>
            <p className="text-xs text-ink-500 uppercase tracking-wide mb-1">Limite por operação</p>
            <p className={`font-mono font-semibold ${color.text}`}>{formatCurrency(maxAmount)}</p>
          </div>
          {dailyLimit && (
            <div>
              <p className="text-xs text-ink-500 uppercase tracking-wide mb-1">Limite diário</p>
              <p className={`font-mono font-semibold ${color.text}`}>{formatCurrency(dailyLimit)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Form */}
      <Card className="animate-fade-up stagger-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Valor"
            type="number"
            placeholder="0,00"
            step="0.01"
            min="0.01"
            icon={<DollarSign size={16} />}
            error={errors.amount?.message}
            {...register('amount')}
          />

          <Input
            label="Descrição (opcional)"
            placeholder={isDeposit ? 'Ex: salário, transferência...' : 'Ex: despesas pessoais...'}
            icon={<FileText size={16} />}
            error={errors.description?.message}
            {...register('description')}
          />

          {amount > 0 && (
            <div className={`rounded-xl p-4 ${color.bg} border ${color.border}`}>
              <p className="text-xs text-ink-400 mb-1">
                {isDeposit ? 'Você vai depositar' : 'Você vai sacar'}
              </p>
              <p className={`font-display text-2xl font-bold ${color.text}`}>
                {formatCurrency(amount)}
              </p>
            </div>
          )}

          <Button
            type="submit"
            loading={isSubmitting}
            className="w-full"
            size="lg"
            icon={isDeposit ? <ArrowDownToLine size={16} /> : <ArrowUpFromLine size={16} />}
          >
            {isDeposit ? 'Confirmar depósito' : 'Confirmar saque'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export function DepositPage() {
  return <OperationForm type="deposit" />
}

export function WithdrawPage() {
  return <OperationForm type="withdraw" />
}
