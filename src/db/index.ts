import Dexie, { type Table } from 'dexie'
import type { AppSettings } from '@/stores/settings'

export interface Expense {
  id?: number
  amount: number
  categoryL1: string
  categoryL2: string
  date: string
  note: string
  account: string
  photo: string           // 票据照片 base64（可选）
  createdAt: number
}

export interface Budget {
  id?: number
  yearMonth: string
  categoryL1: string
  amount: number
}

export interface SavingGoal {
  id?: number
  name: string
  targetAmount: number
  deadline: string
  saved: number
}

export interface ExpenseTemplate {
  id?: number
  name: string
  amount: number
  categoryL1: string
  categoryL2: string
  account: string
  note: string
  useCount: number
}

export interface RecurringBill {
  id?: number
  name: string
  amount: number
  categoryL1: string
  categoryL2: string
  account: string
  cycle: 'monthly' | 'weekly' | 'daily'
  dayOfMonth: number
  dayOfWeek: number
  enabled: boolean
  lastRecorded: string
}

class ExpenseDB extends Dexie {
  expenses!: Table<Expense>
  settings!: Table<AppSettings>
  budgets!: Table<Budget>
  savingGoals!: Table<SavingGoal>
  templates!: Table<ExpenseTemplate>
  recurring!: Table<RecurringBill>

  constructor() {
    super('heimajizhang')

    this.version(1).stores({
      expenses: '++id, categoryL1, categoryL2, date, createdAt'
    })

    this.version(2).stores({
      expenses: '++id, categoryL1, categoryL2, date, account, createdAt',
      settings: '++id'
    }).upgrade(async tx => {
      const expenses = await tx.table('expenses').toCollection().toArray()
      for (const e of expenses) {
        if (!e.account) {
          await tx.table('expenses').update(e.id, { account: 'cash' })
        }
      }
    })

    this.version(3).stores({
      expenses: '++id, categoryL1, categoryL2, date, account, createdAt',
      settings: '++id',
      budgets: '++id, yearMonth, categoryL1'
    })

    this.version(4).stores({
      expenses: '++id, categoryL1, categoryL2, date, account, createdAt',
      settings: '++id',
      budgets: '++id, yearMonth, categoryL1',
      savingGoals: '++id'
    })

    // v5: photo + templates + recurring
    this.version(5).stores({
      expenses: '++id, categoryL1, categoryL2, date, account, createdAt',
      settings: '++id',
      budgets: '++id, yearMonth, categoryL1',
      savingGoals: '++id',
      templates: '++id',
      recurring: '++id'
    }).upgrade(async tx => {
      const expenses = await tx.table('expenses').toCollection().toArray()
      for (const e of expenses) {
        if (!e.photo) {
          await tx.table('expenses').update(e.id, { photo: '' })
        }
      }
    })
  }
}

export const db = new ExpenseDB()
