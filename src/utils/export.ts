import * as XLSX from 'xlsx'
import type { Expense } from '@/db'
import { categories } from '@/data/categories'
import { accounts } from '@/data/accounts'

// 导出花销数据为 Excel 文件
export function exportToExcel(expenses: Expense[], filename?: string): void {
  // 准备数据
  const rows = expenses.map(e => ({
    '日期': e.date,
    '金额': e.amount,
    '一级分类': e.categoryL1,
    '二级分类': e.categoryL2,
    '支付方式': accounts.find(a => a.key === e.account)?.name || e.account || '现金',
    '备注': e.note || ''
  }))

  // 创建工作簿
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  // 设置列宽
  ws['!cols'] = [
    { wch: 12 },  // 日期
    { wch: 10 },  // 金额
    { wch: 12 },  // 一级分类
    { wch: 12 },  // 二级分类
    { wch: 12 },  // 支付方式
    { wch: 30 }   // 备注
  ]

  XLSX.utils.book_append_sheet(wb, ws, '花销明细')

  // 添加分类汇总 sheet
  const summaryRows = categories
    .map(cat => {
      const catExpenses = expenses.filter(e => e.categoryL1 === cat.name)
      return {
        '分类': cat.name,
        '笔数': catExpenses.length,
        '合计金额': catExpenses.reduce((s, e) => s + e.amount, 0)
      }
    })
    .filter(r => r['笔数'] > 0)

  if (summaryRows.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(summaryRows)
    ws2['!cols'] = [{ wch: 15 }, { wch: 8 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, ws2, '分类汇总')
  }

  // 生成并下载
  const name = filename || `黑马记账_导出_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, name)
}
