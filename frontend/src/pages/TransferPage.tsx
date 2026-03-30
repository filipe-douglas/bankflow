import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, Hash, DollarSign, FileText } from 'lucide-react'
import { Button, Input, Card } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { transactionService } from '../services/bankService'
import { extractApiError } from '../services/api'
import { formatCurrency } from '../utils'

const schema = z.object({
  targetAccountNumber: z.string().min(1, 'Número da conta obrigatório'),
  amount: z
    .string()
    .min(1, 'Valor obrigatório')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Valor deve ser positivo')
    .refine((v) => parseFloat(v) <= 10000, 'Máximo R$ 10.000 por transferência'),
  description: z.string().max(255).optional(),
})

type FormData = z.infer<typeof schema>

export default function TransferPage() {
  const { success, error } = useToast()
  const queryClient = useQueryClient()

  const {
    register, handleSubmit, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const amount = parseFloat(watch('amount') ?? '0') || 0

  const onSubmit = async (data: FormData) => {
    try {
      await transactionService.transfer({
        targetAccountNumber: data.targetAccountNumber.trim(),
        amount: parseFloat(data.amount),
        description: data.description,
      })
      queryClient.invalidateQueries({ queryKey: ['account'] })
      queryClient.invalidateQueries({ queryKey: ['statement'] })
      success('Transferência realizada com sucesso!')
      reset()
    } catch (err) {
      error(extractApiError(err))
    }
  }

  return (
    <div className="max-w-lg space-y-6 page-fade">
      <div className="animate-fade-up">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
            <ArrowLeftRight size={18} className="text-gold-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-50">Transferência</h1>
        </div>
        <p className="text-ink-400 text-sm ml-12">Envie dinheiro para outra conta</p>
      </div>

      {/* Limits info */}
      <Card className="animate-fade-up stagger-1">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-ink-500 uppercase tracking-wide mb-1">Limite por operação</p>
            <p className="font-mono font-semibold text-gold-400">{formatCurrency(10000)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-500 uppercase tracking-wide mb-1">Limite diário</p>
            <p className="font-mono font-semibold text-gold-400">{formatCurrency(50000)}</p>
          </div>
        </div>
      </Card>

      {/* Form */}
      <Card className="animate-fade-up stagger-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Conta destino"
            placeholder="0000.00000-0"
            icon={<Hash size={16} />}
            error={errors.targetAccountNumber?.message}
            {...register('targetAccountNumber')}
          />

          <Input
            label="Valor"
            type="number"
            placeholder="0,00"
            step="0.01"
            min="0.01"
            max="10000"
            icon={<DollarSign size={16} />}
            error={errors.amount?.message}
            {...register('amount')}
          />

          <Input
            label="Descrição (opcional)"
            placeholder="Ex: aluguel, pagamento..."
            icon={<FileText size={16} />}
            error={errors.description?.message}
            {...register('description')}
          />

          {/* Preview */}
          {amount > 0 && (
            <div className="glass-gold rounded-xl p-4">
              <p className="text-xs text-ink-400 mb-1">Você vai enviar</p>
              <p className="font-display text-2xl font-bold text-gold-400">
                {formatCurrency(amount)}
              </p>
            </div>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full" size="lg"
            icon={<ArrowLeftRight size={16} />}>
            Confirmar transferência
          </Button>
        </form>
      </Card>
    </div>
  )
}
