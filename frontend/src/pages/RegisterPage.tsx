import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, CreditCard, Landmark } from 'lucide-react'
import { Button, Input, Select } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/bankService'
import { extractApiError } from '../services/api'
import { formatCPF } from '../utils'

const schema = z.object({
  fullName: z.string().min(3, 'Mínimo 3 caracteres').max(150),
  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (000.000.000-00)'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Precisa de uma letra maiúscula')
    .regex(/[a-z]/, 'Precisa de uma letra minúscula')
    .regex(/\d/, 'Precisa de um número')
    .regex(/[@$!%*?&]/, 'Precisa de um caractere especial (@$!%*?&)'),
  confirmPassword: z.string(),
  accountType: z.enum(['CORRENTE', 'POUPANCA']),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { setAuth } = useAuthStore()
  const { success, error } = useToast()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { accountType: 'CORRENTE' },
  })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authService.register({
        fullName: data.fullName,
        cpf: data.cpf,
        email: data.email,
        password: data.password,
        accountType: data.accountType,
      })
      setAuth(res.user, res.accessToken, res.refreshToken)
      success('Conta criada com sucesso!')
      navigate('/dashboard')
    } catch (err) {
      error(extractApiError(err))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-up">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gold-500 flex items-center justify-center shadow-lg shadow-gold-500/20">
            <Landmark size={18} className="text-ink-950" />
          </div>
          <span className="font-display text-xl font-bold">
            <span className="text-ink-50">Bank</span>
            <span className="text-gold-500">Flow</span>
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold text-ink-50 mb-2">Criar conta</h1>
        <p className="text-ink-400 mb-8">Preencha seus dados para abrir sua conta</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome completo"
            placeholder="João Silva"
            icon={<User size={16} />}
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <Input
            label="CPF"
            placeholder="000.000.000-00"
            icon={<CreditCard size={16} />}
            error={errors.cpf?.message}
            maxLength={14}
            {...register('cpf', {
              onChange: (e) => setValue('cpf', formatCPF(e.target.value), { shouldValidate: true }),
            })}
          />

          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            icon={<Mail size={16} />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={16} />}
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirmar senha"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={16} />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>

          {/* Password strength hint */}
          {watch('password') && (
            <div className="glass rounded-xl p-3 space-y-1">
              {[
                { ok: /[A-Z]/.test(watch('password') ?? ''), label: 'Letra maiúscula' },
                { ok: /[a-z]/.test(watch('password') ?? ''), label: 'Letra minúscula' },
                { ok: /\d/.test(watch('password') ?? ''),    label: 'Número' },
                { ok: /[@$!%*?&]/.test(watch('password') ?? ''), label: 'Caractere especial' },
                { ok: (watch('password') ?? '').length >= 8, label: 'Mínimo 8 caracteres' },
              ].map((req) => (
                <p key={req.label} className={`text-xs flex items-center gap-2 ${req.ok ? 'text-emerald-400' : 'text-ink-500'}`}>
                  <span>{req.ok ? '✓' : '○'}</span>
                  {req.label}
                </p>
              ))}
            </div>
          )}

          <Select
            label="Tipo de conta"
            error={errors.accountType?.message}
            {...register('accountType')}
          >
            <option value="CORRENTE">Conta Corrente</option>
            <option value="POUPANCA">Conta Poupança</option>
          </Select>

          <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
            Criar conta
          </Button>
        </form>

        <p className="text-center text-ink-400 text-sm mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-gold-400 hover:text-gold-300 font-medium transition-colors">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
