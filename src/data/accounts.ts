// 支付方式 / 账户配置
export interface Account {
  key: string
  name: string
  icon: string
  color: string
}

export const accounts: Account[] = [
  { key: 'cash', name: '现金', icon: '💵', color: '#67C23A' },
  { key: 'wechat', name: '微信', icon: '💬', color: '#07C160' },
  { key: 'alipay', name: '支付宝', icon: '🔵', color: '#1677FF' },
  { key: 'bank', name: '银行卡', icon: '🏦', color: '#E6A23C' },
  { key: 'other', name: '其他', icon: '💰', color: '#909399' }
]

export function getAccountByKey(key: string): Account | undefined {
  return accounts.find(a => a.key === key)
}
