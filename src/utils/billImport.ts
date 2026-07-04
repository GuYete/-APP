import type { Expense } from '@/db'
import { categories } from '@/data/categories'

export interface ParsedBill {
  date: string
  amount: number
  type: '支出' | '收入'
  merchant: string
  product: string
  categoryL1: string
  categoryL2: string
  account: string
  note: string
  selected: boolean  // 是否被用户选中导入
}

// 智能分类映射表（关键词 → [大类, 小类]）
const smartMap: [string[], string, string][] = [
  [['美团', '饿了么', '外卖', '肯德基', '麦当劳', '星巴克', '奶茶', '咖啡'], '餐饮饮食', '外卖'],
  [['滴滴', '曹操', 'T3', '高德打车', '出租车', '地铁', '公交', '高铁', '机票', '火车票'], '交通出行', '打车/网约车'],
  [['超市', '永辉', '盒马', '沃尔玛', '大润发', '联华', '便利店', '罗森', '全家', '711'], '购物消费', '日用品'],
  [['淘宝', '京东', '拼多多', '天猫', '唯品会', '亚马逊'], '购物消费', '服饰鞋包'],
  [['房租', '物业', '水电', '燃气', '暖气'], '住房生活', '房租/房贷'],
  [['医院', '药房', '药店', '诊所', '挂号'], '医疗健康', '药品'],
  [['电影', 'KTV', '游戏', '景区', '门票', '酒店', '民宿'], '娱乐休闲', '电影演出'],
  [['红包', '转账', '份子'], '人情往来', '红包'],
  [['快递', '顺丰', '圆通', '韵达', '中通', '申通'], '其他杂项', '快递运费'],
]

function smartClassify(text: string): { l1: string; l2: string } {
  for (const [keywords, l1, l2] of smartMap) {
    if (keywords.some(k => text.includes(k))) {
      return { l1, l2 }
    }
  }
  return { l1: '其他杂项', l2: '其他' }
}

// 解析微信 CSV
export function parseWechatCSV(text: string): ParsedBill[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  // 微信账单第一行是标题头，跳过前几行找到表头
  let headerIdx = 0
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    if (lines[i].includes('交易时间') && lines[i].includes('金额')) {
      headerIdx = i
      break
    }
  }
  const rows = lines.slice(headerIdx + 1)
  const result: ParsedBill[] = []

  for (const row of rows) {
    const cols = parseCSVLine(row)
    if (cols.length < 7) continue
    // 微信格式: 交易时间,交易类型,交易对方,商品,收/支,金额(元),支付方式,...
    const dateStr = cols[0].trim()
    const merchant = (cols[2] || '').trim()
    const product = (cols[3] || '').trim()
    const direction = (cols[4] || '').trim()
    const amountStr = (cols[5] || '').trim()
    const account = mapAccount((cols[6] || '').trim())

    if (direction !== '支出' || !amountStr || amountStr === '0') continue

    const amount = parseFloat(amountStr)
    if (isNaN(amount)) continue

    const date = formatDate(dateStr)
    const combined = `${merchant} ${product}`
    const { l1, l2 } = smartClassify(combined)

    result.push({
      date, amount, type: '支出', merchant, product,
      categoryL1: l1, categoryL2: l2,
      account, note: `${merchant} ${product}`.trim(),
      selected: true
    })
  }
  return result
}

// 解析支付宝 CSV
export function parseAlipayCSV(text: string): ParsedBill[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  let headerIdx = 0
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    if (lines[i].includes('交易时间') && lines[i].includes('金额')) {
      headerIdx = i
      break
    }
  }
  const rows = lines.slice(headerIdx + 1)
  const result: ParsedBill[] = []

  for (const row of rows) {
    const cols = parseCSVLine(row)
    if (cols.length < 6) continue
    // 支付宝格式: 交易时间,交易对方,商品说明,收/支,金额,交易状态,...
    const dateStr = cols[0].trim()
    const merchant = (cols[1] || '').trim()
    const product = (cols[2] || '').trim()
    const direction = (cols[3] || '').trim()
    const amountStr = (cols[4] || '').trim()

    if (direction !== '支出' || !amountStr || amountStr === '0') continue

    const amount = parseFloat(amountStr)
    if (isNaN(amount)) continue

    const date = formatDate(dateStr)
    const combined = `${merchant} ${product}`
    const { l1, l2 } = smartClassify(combined)

    result.push({
      date, amount, type: '支出', merchant, product,
      categoryL1: l1, categoryL2: l2,
      account: 'alipay', note: `${merchant} ${product}`.trim(),
      selected: true
    })
  }
  return result
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (ch === ',' && !inQuotes) { result.push(current); current = '' }
    else { current += ch }
  }
  result.push(current)
  return result
}

function formatDate(raw: string): string {
  // "2024-07-03 12:30:00" → "2024-07-03"
  const match = raw.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/)
  if (match) {
    return `${match[1]}-${String(Number(match[2])).padStart(2, '0')}-${String(Number(match[3])).padStart(2, '0')}`
  }
  return raw.substring(0, 10)
}

function mapAccount(method: string): string {
  if (method.includes('零钱') || method.includes('余额')) return 'wechat'
  if (method.includes('花呗') || method.includes('余额宝')) return 'alipay'
  if (method.includes('银行') || method.includes('储蓄') || method.includes('信用卡')) return 'bank'
  return 'other'
}

// 转换为 Expense 数组
export function billsToExpenses(bills: ParsedBill[]): Omit<Expense, 'id' | 'createdAt'>[] {
  return bills.filter(b => b.selected).map(b => ({
    amount: b.amount,
    categoryL1: b.categoryL1,
    categoryL2: b.categoryL2,
    date: b.date,
    note: b.note,
    account: b.account,
    photo: ''
  }))
}
