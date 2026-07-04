import { db, type Expense } from '@/db'

export interface BackupData {
  version: string
  exportedAt: string
  expenses: Expense[]
}

// 导出全部数据为 JSON 字符串
export async function exportToJSON(): Promise<string> {
  const expenses = await db.expenses.toArray()
  const backup: BackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    expenses
  }
  return JSON.stringify(backup, null, 2)
}

// 从 JSON 字符串导入数据
export async function importFromJSON(jsonStr: string): Promise<{ imported: number; skipped: number }> {
  let backup: BackupData
  try {
    backup = JSON.parse(jsonStr)
  } catch {
    throw new Error('文件格式不正确，无法解析')
  }

  if (!backup.expenses || !Array.isArray(backup.expenses)) {
    throw new Error('备份文件缺少数据')
  }

  // 获取现有 ID 集合，避免重复导入
  const existingIds = new Set((await db.expenses.toCollection().primaryKeys()).map(String))

  let imported = 0
  let skipped = 0

  for (const expense of backup.expenses) {
    // 清除 id，让数据库自动生成新 id
    const { id, ...record } = expense
    // 兼容旧数据（没有 account 字段）
    if (!record.account) {
      ;(record as any).account = 'cash'
    }
    if (!record.createdAt) {
      ;(record as any).createdAt = Date.now()
    }

    // 按金额+日期+分类去重
    const dup = await db.expenses
      .where({ amount: record.amount, date: record.date, categoryL2: record.categoryL2 })
      .first()
    if (dup) {
      skipped++
      continue
    }

    await db.expenses.add(record as any)
    imported++
  }

  return { imported, skipped }
}

// 下载字符串为文件
export function downloadFile(content: string, filename: string, mimeType: string = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 读取用户选择的文件
export function readFileAsText(accept: string = '.json'): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        reject(new Error('未选择文件'))
        return
      }
      try {
        const text = await file.text()
        resolve(text)
      } catch {
        reject(new Error('读取文件失败'))
      }
    }
    input.click()
  })
}
