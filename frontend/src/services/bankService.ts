import { api } from './api'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  AccountResponse,
  TransactionResponse,
  PageResponse,
  TransferRequest,
  DepositWithdrawRequest,
  UserResponse,
} from '../types'

// ─── Auth ──────────────────────────────────────────────────────────────────

export const authService = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
}

// ─── Account ───────────────────────────────────────────────────────────────

export const accountService = {
  getMyAccount: () =>
    api.get<AccountResponse>('/accounts/me').then((r) => r.data),
}

// ─── Transactions ──────────────────────────────────────────────────────────

export const transactionService = {
  transfer: (data: TransferRequest) =>
    api.post<TransactionResponse>('/transactions/transfer', data).then((r) => r.data),

  deposit: (data: DepositWithdrawRequest) =>
    api.post<TransactionResponse>('/transactions/deposit', data).then((r) => r.data),

  withdraw: (data: DepositWithdrawRequest) =>
    api.post<TransactionResponse>('/transactions/withdraw', data).then((r) => r.data),

  getStatement: (params: {
    page?: number
    size?: number
    startDate?: string
    endDate?: string
    type?: string
  }) =>
    api
      .get<PageResponse<TransactionResponse>>('/transactions/statement', { params })
      .then((r) => r.data),
}

// ─── Admin ─────────────────────────────────────────────────────────────────

export const adminService = {
  listUsers: (page = 0, size = 20) =>
    api.get<PageResponse<UserResponse>>('/admin/users', { params: { page, size } }).then((r) => r.data),

  toggleUser: (id: string) =>
    api.patch(`/admin/users/${id}/toggle`),
}
