import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, type CustomCategory } from '@/db'
import { presetCategories, updateCategoriesList, type Category } from '@/data/categories'

const STORAGE_KEY = 'heimajizhang_custom_categories'

// 从 localStorage 读写自定义分类
function loadFromStorage(): CustomCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(list: CustomCategory[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export const useCategoryStore = defineStore('category', () => {
  const customCategories = ref<CustomCategory[]>(loadFromStorage())
  const loaded = ref(true)

  // 合并后的完整分类列表
  const allCategories = ref<Category[]>([...presetCategories.map(cat => ({ ...cat, children: [...cat.children] }))])

  function buildAllCategories(): void {
    const result: Category[] = presetCategories.map(cat => ({
      ...cat,
      children: [...cat.children]
    }))

    for (const l1 of customCategories.value.filter(c => !c.parentName)) {
      const children = customCategories.value.filter(c => c.parentName === l1.name).map(c => c.name)
      result.push({ name: l1.name, icon: l1.icon, color: l1.color, children, preset: false })
    }

    for (const cat of result) {
      if (cat.preset) {
        const extras = customCategories.value.filter(c => c.parentName === cat.name).map(c => c.name)
        if (extras.length > 0) cat.children = [...cat.children, ...extras]
      }
    }

    allCategories.value = result
    updateCategoriesList(result)
  }

  // 启动时构建
  buildAllCategories()

  // ====== 增删改 ======
  let nextId = Math.max(0, ...customCategories.value.map(c => c.id || 0)) + 1

  async function addCategory(name: string, parentName: string, icon: string, color: string): Promise<number> {
    const id = nextId++
    customCategories.value.push({ id, name, icon, color, parentName, createdAt: Date.now() })
    saveToStorage(customCategories.value)
    buildAllCategories()
    return id
  }

  async function updateCategory(id: number, updates: Partial<Pick<CustomCategory, 'name' | 'icon' | 'color'>>): Promise<void> {
    const cat = customCategories.value.find(c => c.id === id)
    if (!cat) return

    // L1 改名的级联更新
    if (!cat.parentName && updates.name && updates.name !== cat.name) {
      const oldName = cat.name
      for (const child of customCategories.value.filter(c => c.parentName === oldName)) {
        child.parentName = updates.name
      }
    }

    Object.assign(cat, updates)
    saveToStorage(customCategories.value)
    buildAllCategories()
  }

  async function deleteCategory(id: number): Promise<void> {
    const cat = customCategories.value.find(c => c.id === id)
    if (!cat) return

    if (!cat.parentName) {
      // 删除 L1 及其所有 L2
      customCategories.value = customCategories.value.filter(c => c.id !== id && c.parentName !== cat.name)
      // 迁移相关花销到"其他杂项 > 其他"
      try {
        const exps = await db.expenses.where({ categoryL1: cat.name }).toArray()
        for (const e of exps) {
          if (e.id != null) await db.expenses.update(e.id, { categoryL1: '其他杂项', categoryL2: '其他' })
        }
      } catch { /* 忽略花销迁移错误 */ }
    } else {
      customCategories.value = customCategories.value.filter(c => c.id !== id)
      // 迁移相关花销
      try {
        const exps = await db.expenses
          .filter(e => e.categoryL1 === cat.parentName && e.categoryL2 === cat.name)
          .toArray()
        for (const e of exps) {
          if (e.id != null) await db.expenses.update(e.id, { categoryL1: '其他杂项', categoryL2: '其他' })
        }
      } catch { /* 忽略花销迁移错误 */ }
    }
    saveToStorage(customCategories.value)
    buildAllCategories()
  }

  async function ensureLoaded(): Promise<void> {
    // localStorage 同步读取，无需异步加载
  }

  function isCustom(categoryName: string): boolean {
    return customCategories.value.some(c => c.name === categoryName)
  }

  return {
    customCategories,
    loaded,
    allCategories,
    ensureLoaded,
    addCategory,
    updateCategory,
    deleteCategory,
    isCustom
  }
})
