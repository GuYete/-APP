import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, type Expense, type Budget } from '@/db'
import { categories } from '@/data/categories'
import { accounts } from '@/data/accounts'

export const useExpenseStore = defineStore('expense', () => {
  const expenses = ref<Expense[]>([])
  const selectedMonth = ref(getCurrentMonth())
  const searchQuery = ref('')
  const accountFilter = ref('')
  const categoryFilter = ref('')

  // 日期范围（统计页用）
  const dateRangeStart = ref('')
  const dateRangeEnd = ref('')

  // 预算数据
  const budgets = ref<Budget[]>([])
  // 预算预警消息
  const budgetAlerts = ref<string[]>([])

  function getCurrentMonth(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  // ====== 数据加载 ======
  async function loadExpenses(): Promise<void> {
    expenses.value = await db.expenses.orderBy('createdAt').reverse().toArray()
  }

  async function loadBudgets(): Promise<void> {
    budgets.value = await db.budgets.toArray()
  }

  // ====== 花销 CRUD ======
  async function addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<number> {
    const id = await db.expenses.add({
      ...expense,
      createdAt: Date.now()
    } as Expense)
    await loadExpenses()
    // 记账后检查预算
    await checkBudgetAlerts(expense.date.substring(0, 7))
    return id as number
  }

  async function deleteExpense(id: number): Promise<void> {
    await db.expenses.delete(id)
    await loadExpenses()
  }

  // ====== 预算管理 ======
  async function saveBudget(budget: Omit<Budget, 'id'>): Promise<void> {
    // 查找是否已有相同 yearMonth + categoryL1 的预算
    const existing = await db.budgets
      .where({ yearMonth: budget.yearMonth, categoryL1: budget.categoryL1 })
      .first()
    if (existing?.id !== undefined) {
      await db.budgets.update(existing.id, { amount: budget.amount })
    } else {
      await db.budgets.add(budget)
    }
    await loadBudgets()
  }

  async function deleteBudget(id: number): Promise<void> {
    await db.budgets.delete(id)
    await loadBudgets()
  }

  function getBudget(yearMonth: string, categoryL1: string = ''): number {
    // 优先匹配精确月份+分类的预算
    let b = budgets.value.find(b => b.yearMonth === yearMonth && b.categoryL1 === categoryL1)
    if (b) return b.amount
    // 回退到全局默认预算
    b = budgets.value.find(b => b.yearMonth === '' && b.categoryL1 === categoryL1)
    if (b) return b.amount
    return 0
  }

  // 检查预算并生成预警
  async function checkBudgetAlerts(yearMonth: string): Promise<void> {
    budgetAlerts.value = []
    if (budgets.value.length === 0) return

    // 检查总预算
    const totalBudget = getBudget(yearMonth, '')
    if (totalBudget > 0) {
      const totalSpent = getMonthTotal(yearMonth)
      const ratio = totalSpent / totalBudget
      if (ratio >= 1) {
        budgetAlerts.value.push(`⚠️ 本月预算已用完！总支出 ¥${totalSpent.toFixed(0)}，超支 ¥${(totalSpent - totalBudget).toFixed(0)}`)
      } else if (ratio >= 0.8) {
        budgetAlerts.value.push(`📢 本月已花费 ¥${totalSpent.toFixed(0)}，预算剩余 ¥${(totalBudget - totalSpent).toFixed(0)}`)
      }
    }

    // 检查各分类预算
    const monthExpenses = getExpensesByMonth(yearMonth)
    for (const cat of categories) {
      const catBudget = getBudget(yearMonth, cat.name)
      if (catBudget > 0) {
        const catSpent = monthExpenses.filter(e => e.categoryL1 === cat.name).reduce((s, e) => s + e.amount, 0)
        const ratio = catSpent / catBudget
        if (ratio >= 1) {
          budgetAlerts.value.push(`⚠️ ${cat.icon} ${cat.name}预算已用完！`)
        } else if (ratio >= 0.8) {
          budgetAlerts.value.push(`📢 ${cat.icon} ${cat.name}已使用 ${Math.round(ratio * 100)}%`)
        }
      }
    }
  }

  // ====== 查询方法 ======
  function getExpensesByMonth(month: string): Expense[] {
    return expenses.value.filter(e => e.date.startsWith(month))
  }

  function getExpensesByDateRange(start: string, end: string): Expense[] {
    return expenses.value.filter(e => e.date >= start && e.date <= end)
  }

  function getMonthTotal(month: string): number {
    return getExpensesByMonth(month).reduce((sum, e) => sum + e.amount, 0)
  }

  function getDateRangeTotal(start: string, end: string): number {
    return getExpensesByDateRange(start, end).reduce((sum, e) => sum + e.amount, 0)
  }

  function getCategorySummaryByRange(start: string, end: string): { name: string; icon: string; color: string; total: number }[] {
    const list = getExpensesByDateRange(start, end)
    return categories.map(cat => {
      const total = list.filter(e => e.categoryL1 === cat.name).reduce((sum, e) => sum + e.amount, 0)
      return { name: cat.name, icon: cat.icon, color: cat.color, total }
    }).filter(c => c.total > 0).sort((a, b) => b.total - a.total)
  }

  // 兼容旧接口
  function getCategorySummary(month: string): { name: string; icon: string; color: string; total: number }[] {
    const start = `${month}-01`
    const [y, m] = month.split('-').map(Number)
    const end = `${month}-${new Date(y, m, 0).getDate()}`
    return getCategorySummaryByRange(start, end)
  }

  function getAccountSummary(month: string): { key: string; name: string; icon: string; color: string; total: number }[] {
    const monthExpenses = getExpensesByMonth(month)
    return accounts.map(acc => {
      const total = monthExpenses.filter(e => e.account === acc.key).reduce((sum, e) => sum + e.amount, 0)
      return { ...acc, total }
    }).filter(a => a.total > 0).sort((a, b) => b.total - a.total)
  }

  async function getMonthTrend(monthCount: number = 6): Promise<{ month: string; total: number }[]> {
    if (expenses.value.length === 0) await loadExpenses()
    const result: { month: string; total: number }[] = []
    const now = new Date()
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      result.push({ month, total: getMonthTotal(month) })
    }
    return result
  }

  // ====== 环比/同比 ======
  function getCompareMom(): {
    currentMonth: string; currentTotal: number
    prevMonth: string; prevTotal: number
    changePercent: number; isUp: boolean
  } {
    const now = new Date()
    const cm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const pm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevStr = `${pm.getFullYear()}-${String(pm.getMonth() + 1).padStart(2, '0')}`
    const currentTotal = getMonthTotal(cm)
    const prevTotal = getMonthTotal(prevStr)
    const changePercent = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0
    return {
      currentMonth: cm, currentTotal,
      prevMonth: prevStr, prevTotal,
      changePercent: Math.abs(changePercent),
      isUp: currentTotal > prevTotal
    }
  }

  function getCompareYoy(): {
    currentMonth: string; currentTotal: number
    prevYearMonth: string; prevYearTotal: number
    changePercent: number; isUp: boolean
  } {
    const now = new Date()
    const cm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const py = `${now.getFullYear() - 1}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const currentTotal = getMonthTotal(cm)
    const prevYearTotal = getMonthTotal(py)
    const changePercent = prevYearTotal > 0 ? ((currentTotal - prevYearTotal) / prevYearTotal) * 100 : 0
    return {
      currentMonth: cm, currentTotal,
      prevYearMonth: py, prevYearTotal,
      changePercent: Math.abs(changePercent),
      isUp: currentTotal > prevYearTotal
    }
  }

  // ====== 搜索过滤 ======
  const filteredExpenses = computed(() => {
    let list = expenses.value
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      list = list.filter(e =>
        e.note.toLowerCase().includes(q) ||
        e.categoryL1.includes(q) ||
        e.categoryL2.includes(q) ||
        String(e.amount).includes(q)
      )
    }
    if (accountFilter.value) {
      list = list.filter(e => e.account === accountFilter.value)
    }
    if (categoryFilter.value) {
      list = list.filter(e => e.categoryL1 === categoryFilter.value)
    }
    return list
  })

  return {
    expenses,
    selectedMonth,
    searchQuery,
    accountFilter,
    categoryFilter,
    dateRangeStart,
    dateRangeEnd,
    budgets,
    budgetAlerts,
    filteredExpenses,
    loadExpenses,
    loadBudgets,
    addExpense,
    deleteExpense,
    saveBudget,
    deleteBudget,
    getBudget,
    checkBudgetAlerts,
    getExpensesByMonth,
    getExpensesByDateRange,
    getMonthTotal,
    getDateRangeTotal,
    getCategorySummary,
    getCategorySummaryByRange,
    getAccountSummary,
    getMonthTrend,
    getCompareMom,
    getCompareYoy
  }
})
