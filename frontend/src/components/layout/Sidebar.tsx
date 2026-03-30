import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, ArrowDownToLine,
  ArrowUpFromLine, FileText, Users, LogOut,
  Menu, X, Landmark, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/bankService'
import { cn } from '../../utils'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { to: '/dashboard',   icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/transfer',    icon: <ArrowLeftRight size={18} />,  label: 'Transferência' },
  { to: '/deposit',     icon: <ArrowDownToLine size={18} />, label: 'Depósito' },
  { to: '/withdraw',    icon: <ArrowUpFromLine size={18} />, label: 'Saque' },
  { to: '/statement',   icon: <FileText size={18} />,        label: 'Extrato' },
  { to: '/admin/users', icon: <Users size={18} />,           label: 'Usuários', adminOnly: true },
]

export function Sidebar() {
  const { user, logout, refreshToken } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    if (refreshToken) {
      try { await authService.logout(refreshToken) } catch {}
    }
    logout()
    navigate('/login')
  }

  const items = navItems.filter((i) => !i.adminOnly || user?.role === 'ADMIN')

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-500 flex items-center justify-center shadow-lg shadow-gold-500/20">
            <Landmark size={18} className="text-ink-950" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-ink-50 tracking-tight">Bank</span>
            <span className="font-display font-bold text-lg text-gold-500 tracking-tight">Flow</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-all duration-200',
                isActive
                  ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                  : 'text-ink-400 hover:text-ink-100 hover:bg-ink-800/60'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn('transition-colors', isActive ? 'text-gold-400' : 'text-ink-500 group-hover:text-ink-300')}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto text-gold-500/60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-6">
        <div className="divider" />
        <div className="glass rounded-xl p-3 mb-2">
          <p className="text-xs text-ink-400 truncate">{user?.email}</p>
          <p className="text-sm font-medium text-ink-100 truncate mt-0.5">{user?.fullName}</p>
          {user?.account && (
            <p className="text-xs font-mono text-gold-600 mt-1">{user.account.accountNumber}</p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-ink-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-ink-900 border-r border-ink-800 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 glass rounded-xl flex items-center justify-center text-ink-300 hover:text-ink-100"
      >
        <Menu size={20} />
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative w-64 bg-ink-900 border-r border-ink-800 h-full animate-slide-in">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-ink-400 hover:text-ink-100"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
