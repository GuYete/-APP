import { jsPDF } from 'jspdf'
import type { Expense } from '@/db'
import { categories } from '@/data/categories'

// 生成月度消费 PDF 报告
export function generatePDFReport(expenses: Expense[], title: string): void {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()

  // 标题
  doc.setFontSize(18)
  doc.text('黑马记账', pageW / 2, 20, { align: 'center' })
  doc.setFontSize(12)
  doc.text(title, pageW / 2, 30, { align: 'center' })

  // 总支出
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const days = new Set(expenses.map(e => e.date)).size || 1
  doc.setFontSize(14)
  doc.text(`总支出：¥${total.toFixed(2)}`, 20, 44)
  doc.setFontSize(11)
  doc.text(`日均消费：¥${(total / days).toFixed(2)}  记录笔数：${expenses.length}`, 20, 52)

  // 分类汇总
  doc.setFontSize(13)
  doc.text('分类汇总', 20, 66)

  let y = 74
  const summary = categories
    .map(cat => {
      const catExp = expenses.filter(e => e.categoryL1 === cat.name)
      return {
        name: cat.name,
        icon: cat.icon,
        count: catExp.length,
        total: catExp.reduce((s, e) => s + e.amount, 0),
        percent: total > 0 ? (catExp.reduce((s, e) => s + e.amount, 0) / total * 100) : 0
      }
    })
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total)

  for (const item of summary) {
    doc.setFontSize(11)
    doc.text(`${item.icon} ${item.name}`, 20, y)
    doc.text(`¥${item.total.toFixed(2)}  (${item.percent.toFixed(1)}%)  ${item.count}笔`, 80, y)
    y += 7
    if (y > 270) {
      doc.addPage()
      y = 20
    }
  }

  // 日期
  y += 8
  doc.setFontSize(10)
  doc.setTextColor(128, 128, 128)
  doc.text(`报告生成日期：${new Date().toLocaleDateString('zh-CN')}`, 20, y)

  // 下载
  const filename = `黑马记账_报告_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
