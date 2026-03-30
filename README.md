# 🏦 BankFlow — Sistema Bancário Simplificado

Sistema bancário full-stack com foco em segurança, regras de negócio robustas e experiência de usuário moderna.

![Java](https://img.shields.io/badge/Java-21-orange?style=flat-square&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-green?style=flat-square&logo=springboot)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-compose-blue?style=flat-square&logo=docker)

---

## 📐 Arquitetura

```
banking-system/
├── frontend/          # React + TypeScript + Vite + Tailwind CSS
├── backend/           # Spring Boot 3.3 + Spring Security + JWT
└── docker/            # Docker Compose (app + postgres + pgadmin)
```

## ✨ Funcionalidades

- **Autenticação JWT** com refresh token e blacklist de tokens expirados
- **Cadastro de usuários** com validação de CPF e e-mail
- **Contas bancárias** com saldo, tipo (CORRENTE/POUPANÇA) e número gerado automaticamente
- **Transferências** com validação de saldo, limites diários e auditoria completa
- **Extrato** paginado com filtro por data e tipo de transação
- **Depósito / Saque** com regras de negócio e limites configuráveis
- **Dashboard** com gráficos de movimentação e resumo financeiro
- **Spring Security** com roles (ADMIN/USER) e filtros de segurança
- **Testes JUnit 5** para camadas de service e repository

## 🚀 Como rodar

### Pré-requisitos
- Docker & Docker Compose
- Node.js 20+
- Java 21+

### Com Docker (recomendado)

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/bankflow.git
cd bankflow

# Sobe tudo (banco + backend + frontend)
docker compose up --build
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:8080  
- PgAdmin: http://localhost:5050 (admin@bank.com / admin)

### Sem Docker

```bash
# 1. Banco de dados — sobe só o Postgres
docker compose up postgres -d

# 2. Backend
cd backend
./mvnw spring-boot:run

# 3. Frontend
cd frontend
npm install
npm run dev
```

## 🔐 Segurança

- Senhas com BCrypt (strength 12)
- JWT com expiração de 15min + Refresh Token de 7 dias
- Blacklist de refresh tokens revogados
- Rate limiting por IP (Bucket4j)
- CORS configurado por ambiente
- Validação de entrada em todos os endpoints
- Transações com `@Transactional` e lock otimista

## 📡 Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Cadastro |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Renovar token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/accounts/me` | Minha conta |
| POST | `/api/transactions/transfer` | Transferência |
| POST | `/api/transactions/deposit` | Depósito |
| POST | `/api/transactions/withdraw` | Saque |
| GET | `/api/transactions/statement` | Extrato |
| GET | `/api/admin/users` | Listar usuários (ADMIN) |

## 🧪 Testes

```bash
cd backend
./mvnw test
```

Cobertura: Services, Repositories (H2 em memória), Controllers (MockMvc)

## 🛠 Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Query, Zustand, React Hook Form, Zod |
| Backend | Spring Boot 3.3, Spring Security, Spring Data JPA, Hibernate |
| Banco | PostgreSQL 16 com Flyway migrations |
| Segurança | JWT (JJWT), BCrypt, Bucket4j |
| Testes | JUnit 5, Mockito, Testcontainers |
| Infra | Docker, Docker Compose, Nginx |

## 📄 Licença

MIT
