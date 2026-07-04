// 黑马记账 - 花销分类体系
// 一级分类（大类）→ 二级分类（小类）

export interface Category {
  name: string
  icon: string
  color: string
  children: string[]
}

export const categories: Category[] = [
  {
    name: '餐饮饮食',
    icon: '🍜',
    color: '#FF6B6B',
    children: ['早餐', '午餐', '晚餐', '零食饮料', '外卖', '聚餐']
  },
  {
    name: '交通出行',
    icon: '🚗',
    color: '#4ECDC4',
    children: ['公共交通', '打车/网约车', '加油/充电', '停车费', '火车/飞机']
  },
  {
    name: '购物消费',
    icon: '🛒',
    color: '#45B7D1',
    children: ['日用品', '服饰鞋包', '数码产品', '家居用品', '美妆护肤']
  },
  {
    name: '住房生活',
    icon: '🏠',
    color: '#96CEB4',
    children: ['房租/房贷', '水电燃气', '物业费', '维修装修', '家居日杂']
  },
  {
    name: '娱乐休闲',
    icon: '🎮',
    color: '#FFEAA7',
    children: ['电影演出', '游戏充值', '旅游度假', '运动健身', 'KTV/酒吧']
  },
  {
    name: '医疗健康',
    icon: '💊',
    color: '#DDA0DD',
    children: ['看病挂号', '药品', '体检', '保健品']
  },
  {
    name: '教育学习',
    icon: '📚',
    color: '#87CEEB',
    children: ['书籍', '课程培训', '文具', '考试报名']
  },
  {
    name: '人情往来',
    icon: '🎁',
    color: '#F0A0A0',
    children: ['礼物', '红包', '请客吃饭', '婚礼份子']
  },
  {
    name: '其他杂项',
    icon: '🔧',
    color: '#A0A0A0',
    children: ['快递运费', '宠物用品', '其他']
  }
]

// 根据一级分类名获取分类信息
export function getCategoryByName(name: string): Category | undefined {
  return categories.find(c => c.name === name)
}

// 获取所有二级分类扁平列表
export function getAllSubCategories(): { l1: string; l2: string }[] {
  const result: { l1: string; l2: string }[] = []
  for (const cat of categories) {
    for (const child of cat.children) {
      result.push({ l1: cat.name, l2: child })
    }
  }
  return result
}
