import type { Account } from './types'

export const acc = (o: Partial<Account>): Account => ({ id: 'a', label: 'Acc 1', key: 'k', used: 0, limit: 10000, resetAt: null, status: 'ok', checkedAt: 0, ...o })
