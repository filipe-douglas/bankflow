import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Landmark } from 'lucide-react'
import { Button, Input } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/bankService'
import { extractApiError } from '../services/api'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { setAuth } = useAuthStore()
  const { success, error } = useToast()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authService.login(data)
      setAuth(res.user, res.accessToken, res.refreshToken)
      success(`Bem-vindo, ${res.user.fullName.split(' ')[0]}!`)
      navigate('/dashboard')
    } catch (err) {
      error(extractApiError(err))
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-ink-900 border-r border-ink-800 p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500 flex items-center justify-center">
            <Landmark size={20} className="text-ink-950" />
          </div>
          <span className="font-display text-2xl font-bold">
            <span className="text-ink-50">Bank</span>
            <span className="text-gold-500">Flow</span>
          </span>
        </div>

        <div>
          <h2 className="font-display text-4xl font-bold text-ink-50 leading-tight mb-4">
            Finanças sob<br />
            <span className="text-gold-500">seu controle.</span>
          </h2>
          <p className="text-ink-400 text-lg leading-relaxed">
            Transfira, deposite e acompanhe seu dinheiro com segurança e simplicidade.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { v: 'Segurança', d: 'JWT + BCrypt + refresh token' },
            { v: 'Tempo real', d: 'Saldo e extrato atualizados' },
            { v: 'Limites', d: 'Controle de transferências diárias' },
          ].map((item) => (
            <div key={item.v} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gold-500" />
              <span className="text-ink-300 text-sm">
                <strong className="text-ink-100 font-medium">{item.v}</strong> — {item.d}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-up">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gold-500 flex items-center justify-center">
              <Landmark size={18} className="text-ink-950" />
            </div>
            <span className="font-display text-xl font-bold">
              <span className="text-ink-50">Bank</span>
              <span className="text-gold-500">Flow</span>
            </span>
          </div>

          <h1 className="font-display text-3xl font-bold text-ink-50 mb-2">Entrar</h1>
          <p className="text-ink-400 mb-8">Acesse sua conta bancária</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              icon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={16} />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
              Entrar na conta
            </Button>
          </form>

          <p className="text-center text-ink-400 text-sm mt-6">
            Não tem conta?{' '}
            <Link to="/register" className="text-gold-400 hover:text-gold-300 font-medium transition-colors">
              Cadastre-se
            </Link>
          </p>

          <div className="mt-8 p-3 glass-gold rounded-xl">
            <p className="text-xs text-gold-600 font-mono text-center">
              Admin demo: admin@bankflow.com / Admin@123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
