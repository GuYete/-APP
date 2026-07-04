// 黑马记账 - 花销分类体系
// 一级分类（大类）→ 二级分类（小类）

export interface Category {
  name: string
  icon: string
  color: string
  children: string[]
  preset: boolean   // true = 预置分类（不可修改删除），false = 用户自定义
}

export const presetCategories: Category[] = [
  {
    name: '餐饮饮食',
    icon: '🍜',
    color: '#FF6B6B',
    children: ['早餐', '午餐', '晚餐', '零食饮料', '外卖', '聚餐'],
    preset: true
  },
  {
    name: '交通出行',
    icon: '🚗',
    color: '#4ECDC4',
    children: ['公共交通', '打车/网约车', '加油/充电', '停车费', '火车/飞机'],
    preset: true
  },
  {
    name: '购物消费',
    icon: '🛒',
    color: '#45B7D1',
    children: ['日用品', '服饰鞋包', '数码产品', '家居用品', '美妆护肤'],
    preset: true
  },
  {
    name: '住房生活',
    icon: '🏠',
    color: '#96CEB4',
    children: ['房租/房贷', '水电燃气', '物业费', '维修装修', '家居日杂'],
    preset: true
  },
  {
    name: '娱乐休闲',
    icon: '🎮',
    color: '#FFEAA7',
    children: ['电影演出', '游戏充值', '旅游度假', '运动健身', 'KTV/酒吧'],
    preset: true
  },
  {
    name: '医疗健康',
    icon: '💊',
    color: '#DDA0DD',
    children: ['看病挂号', '药品', '体检', '保健品'],
    preset: true
  },
  {
    name: '教育学习',
    icon: '📚',
    color: '#87CEEB',
    children: ['书籍', '课程培训', '文具', '考试报名'],
    preset: true
  },
  {
    name: '人情往来',
    icon: '🎁',
    color: '#F0A0A0',
    children: ['礼物', '红包', '请客吃饭', '婚礼份子'],
    preset: true
  },
  {
    name: '其他杂项',
    icon: '🔧',
    color: '#A0A0A0',
    children: ['快递运费', '宠物用品', '其他'],
    preset: true
  }
]

// 向后兼容：合并预置 + 自定义分类（由 categoryStore 在运行时填充）
// 初始值为预置分类，store 初始化后会被更新
export let categories: Category[] = [...presetCategories]

// 由 categoryStore 调用，注入自定义分类后的完整列表
export function updateCategoriesList(list: Category[]): void {
  categories = list
}

// 根据一级分类名获取分类信息（从完整列表中查找）
export function getCategoryByName(name: string, list?: Category[]): Category | undefined {
  return (list || categories).find(c => c.name === name)
}

// 获取所有二级分类扁平列表
export function getAllSubCategories(list?: Category[]): { l1: string; l2: string }[] {
  const source = list || categories
  const result: { l1: string; l2: string }[] = []
  for (const cat of source) {
    for (const child of cat.children) {
      result.push({ l1: cat.name, l2: child })
    }
  }
  return result
}
