// ─── Auth ──────────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UserResponse
}

export interface UserResponse {
  id: string
  fullName: string
  cpf: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  account: AccountResponse | null
}

// ─── Account ───────────────────────────────────────────────────────────────

export interface AccountResponse {
  id: string
  accountNumber: string
  accountType: 'CORRENTE' | 'POUPANCA'
  balance: number
  dailyLimit: number
  active: boolean
  createdAt: string
}

// ─── Transactions ──────────────────────────────────────────────────────────

export type TransactionType =
  | 'TRANSFERENCIA_ENVIADA'
  | 'TRANSFERENCIA_RECEBIDA'
  | 'DEPOSITO'
  | 'SAQUE'

export type TransactionStatus = 'COMPLETED' | 'FAILED' | 'PENDING'

export interface TransactionResponse {
  id: string
  type: TransactionType
  amount: number
  description: string | null
  status: TransactionStatus
  balanceBefore: number | null
  balanceAfter: number | null
  sourceAccountNumber: string | null
  targetAccountNumber: string | null
  createdAt: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

// ─── Requests ──────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  cpf: string
  email: string
  password: string
  accountType: 'CORRENTE' | 'POUPANCA'
}

export interface TransferRequest {
  targetAccountNumber: string
  amount: number
  description?: string
}

export interface DepositWithdrawRequest {
  amount: number
  description?: string
}

// ─── API Error ─────────────────────────────────────────────────────────────

export interface ApiError {
  title?: string
  detail?: string
  status?: number
  errors?: Record<string, string>
}
