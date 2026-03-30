import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, ShieldCheck, ShieldOff, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminService } from '../services/bankService'
import { Card, Skeleton, EmptyState, Button } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { extractApiError } from '../services/api'
import { formatCurrency, formatDate } from '../utils'
import type { UserResponse } from '../types'

function UserRow({ user, onToggle }: { user: UserResponse; onToggle: (id: string) => void }) {
  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex items-center gap-4 py-4 border-b border-ink-800/50 last:border-0">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
        <span className="text-gold-400 text-sm font-semibold font-mono">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ink-100 truncate">{user.fullName}</p>
          {user.role === 'ADMIN' && (
            <span className="px-1.5 py-0.5 rounded text-xs bg-gold-500/10 text-gold-400 border border-gold-500/20 shrink-0">
              Admin
            </span>
          )}
          {!user.enabled && (
            <span className="px-1.5 py-0.5 rounded text-xs bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
              Bloqueado
            </span>
          )}
        </div>
        <p className="text-xs text-ink-500 truncate">{user.email} · CPF: {user.cpf}</p>
        {user.account && (
          <p className="text-xs font-mono text-ink-600 mt-0.5">
            {user.account.accountNumber} · {formatCurrency(user.account.balance)}
          </p>
        )}
      </div>

      {/* Date + action */}
      <div className="text-right shrink-0 flex flex-col items-end gap-2">
        <p className="text-xs text-ink-600">{formatDate(user.createdAt)}</p>
        {user.role !== 'ADMIN' && (
          <button
            onClick={() => onToggle(user.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all
              ${user.enabled
                ? 'text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20'
                : 'text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20'}`}
          >
            {user.enabled
              ? <><ShieldOff size={12} /> Bloquear</>
              : <><ShieldCheck size={12} /> Ativar</>}
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(0)
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: () => adminService.listUsers(page, 15),
  })

  const toggleMutation = useMutation({
    mutationFn: adminService.toggleUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      success('Status do usuário atualizado.')
    },
    onError: (err) => error(extractApiError(err)),
  })

  const users = data?.content ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-6 page-fade">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-up">
        <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
          <Users size={18} className="text-gold-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-50">Usuários</h1>
          <p className="text-ink-400 text-sm">
            {data ? `${data.totalElements} usuário${data.totalElements !== 1 ? 's' : ''} cadastrado${data.totalElements !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
      </div>

      {/* Table */}
      <Card className="animate-fade-up stagger-1">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : users.length === 0 ? (
          <EmptyState icon={<Users size={40} />} title="Nenhum usuário encontrado" />
        ) : (
          <div>
            {users.map((user: UserResponse) => (
              <UserRow
                key={user.id}
                user={user}
                onToggle={(id) => toggleMutation.mutate(id)}
              />
            ))}
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
          <span className="text-sm text-ink-400">{page + 1} / {totalPages}</span>
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
