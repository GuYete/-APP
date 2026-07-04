<template>
  <div class="category-manager">
    <!-- 预置分类 -->
    <div class="section-label">{{ t('category.presetTitle') }}</div>
    <div v-for="cat in presetList" :key="cat.name" class="cat-group">
      <div class="cat-l1-row">
        <span class="cat-icon">{{ cat.icon }}</span>
        <span class="cat-name">{{ cat.name }}</span>
        <span class="cat-sub-count">{{ t('category.subCount', [cat.children.length]) }}</span>
        <span class="lock-icon" title="预置分类不可修改">🔒</span>
      </div>
      <div class="cat-l2-list">
        <span v-for="sub in cat.children" :key="sub" class="cat-l2-tag preset">{{ sub }}</span>
      </div>
    </div>

    <div class="divider"></div>

    <!-- 自定义分类 -->
    <div class="section-label">{{ t('category.customTitle') }}</div>
    <div v-if="customL1s.length === 0" class="empty-hint">{{ t('category.empty') }}</div>
    <div v-for="cat in customL1s" :key="cat.name" class="cat-group custom">
      <div class="cat-l1-row">
        <span class="cat-icon">{{ cat.icon }}</span>
        <span class="cat-name">{{ cat.name }}</span>
        <span class="cat-sub-count">{{ t('category.subCount', [cat.children.length]) }}</span>
        <button class="action-btn small" @click="onAddL2(cat.name)" title="添加子分类">+</button>
        <button class="action-btn small" @click="onEditL1(cat)" title="编辑">✏️</button>
        <button class="action-btn small danger" @click="onDeleteL1(cat)" title="删除">🗑️</button>
      </div>
      <div class="cat-l2-list">
        <span
          v-for="sub in cat.children"
          :key="sub"
          class="cat-l2-tag custom"
        >
          {{ sub }}
          <button class="l2-edit-btn" @click="onEditL2(cat.name, sub)" title="编辑">✏️</button>
          <button class="l2-delete-btn" @click="onDeleteL2(cat.name, sub)" title="删除">×</button>
        </span>
      </div>
    </div>

    <button class="add-l1-btn" @click="onOpenAddL1">{{ t('category.addL1') }}</button>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showDialog" class="dialog-overlay" @click.self="closeDialog">
        <div class="dialog-card">
          <div class="dialog-title">{{ dialogTitle }}</div>

          <div class="dialog-field" v-if="dialogMode !== 'editL2'">
            <label>{{ t('category.nameLabel') }}</label>
            <input v-model="form.name" class="dialog-input" :placeholder="t('category.namePlaceholder')" maxlength="10" />
          </div>
          <div class="dialog-field" v-if="dialogMode === 'editL2'">
            <label>{{ t('category.subNameLabel') }}</label>
            <input v-model="form.name" class="dialog-input" :placeholder="t('category.subNamePlaceholder')" maxlength="10" />
          </div>

          <!-- 图标选择（仅一级分类） -->
          <div v-if="dialogMode !== 'editL2'" class="dialog-field">
            <label>{{ t('category.iconLabel') }}</label>
            <div class="icon-grid">
              <span
                v-for="ico in iconOptions"
                :key="ico"
                class="icon-option"
                :class="{ selected: form.icon === ico }"
                @click="form.icon = ico"
              >{{ ico }}</span>
            </div>
          </div>

          <!-- 颜色选择（仅一级分类） -->
          <div v-if="dialogMode !== 'editL2'" class="dialog-field">
            <label>{{ t('category.colorLabel') }}</label>
            <div class="color-grid">
              <span
                v-for="clr in colorOptions"
                :key="clr"
                class="color-option"
                :class="{ selected: form.color === clr }"
                :style="{ background: clr }"
                @click="form.color = clr"
              ></span>
            </div>
          </div>

          <div class="dialog-actions">
            <button class="dialog-btn cancel" @click="closeDialog">{{ t('common.no') }}</button>
            <button class="dialog-btn confirm" :disabled="!form.name.trim()" @click="onConfirm">{{ t('common.yes') }}</button>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCategoryStore } from '@/stores/category'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { CustomCategory } from '@/db'

const store = useCategoryStore()
const { t } = useI18n()

// 可选的图标
const iconOptions = ['🍜', '🚗', '🛒', '🏠', '🎮', '💊', '📚', '🎁', '🔧', '☕', '🐱', '✈️', '🎵', '💻', '📱', '💄', '👶', '🐶', '🌿', '⚽', '🎓', '💼', '🏦', '🎂', '🧹', '📦', '💡', '❤️']

// 可选的颜色
const colorOptions = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#87CEEB', '#F0A0A0', '#A0A0A0', '#FF9F43', '#54A0FF', '#5F27CD', '#01A3A4', '#F368E0', '#EE5A24', '#009432']

// 弹窗状态
const showDialog = ref(false)
const dialogMode = ref<'addL1' | 'editL1' | 'addL2' | 'editL2'>('addL1')
const dialogTitle = computed(() => {
  switch (dialogMode.value) {
    case 'addL1': return t('category.addL1')
    case 'editL1': return t('category.editL1')
    case 'addL2': return t('category.addL2')
    case 'editL2': return t('category.editL2')
  }
})

const form = ref({ name: '', icon: '☕', color: '#FF9F43', parentName: '' })
const editingId = ref<number | null>(null)
const oldL2Name = ref('')

// 自定义一级分类（含其子分类）
const customL1s = computed(() => {
  return store.allCategories.filter(c => !c.preset)
})

// 预置分类
const presetList = computed(() => {
  return store.allCategories.filter(c => c.preset)
})

onMounted(() => {
  // App.vue 启动时已加载分类数据
})

function onOpenAddL1(): void {
  dialogMode.value = 'addL1'
  form.value = { name: '', icon: '☕', color: '#FF9F43', parentName: '' }
  editingId.value = null
  showDialog.value = true
}

function onAddL2(parentName: string): void {
  dialogMode.value = 'addL2'
  form.value = { name: '', icon: '', color: '', parentName }
  editingId.value = null
  showDialog.value = true
}

function onEditL1(cat: { name: string; icon: string; color: string }): void {
  const custom = store.customCategories.find(c => c.name === cat.name && !c.parentName)
  if (!custom) return
  dialogMode.value = 'editL1'
  form.value = { name: cat.name, icon: cat.icon, color: cat.color, parentName: '' }
  editingId.value = custom.id ?? null
  showDialog.value = true
}

function onEditL2(parentName: string, subName: string): void {
  const custom = store.customCategories.find(c => c.name === subName && c.parentName === parentName)
  if (!custom) return
  dialogMode.value = 'editL2'
  form.value = { name: subName, icon: '', color: '', parentName }
  editingId.value = custom.id ?? null
  oldL2Name.value = subName
  showDialog.value = true
}

async function onDeleteL1(cat: { name: string }): Promise<void> {
  try {
    await ElMessageBox.confirm(
      t('category.deleteL1Msg', [cat.name]),
      t('category.deleteL1Title'),
      { confirmButtonText: t('category.deleteConfirm'), cancelButtonText: t('common.no'), type: 'warning' }
    )
    const custom = store.customCategories.find(c => c.name === cat.name && !c.parentName)
    if (custom?.id != null) {
      await store.deleteCategory(custom.id)
      ElMessage.success(t('category.deleted', [cat.name]))
    }
  } catch { /* 取消 */ }
}

async function onDeleteL2(parentName: string, subName: string): Promise<void> {
  try {
    await ElMessageBox.confirm(
      t('category.deleteL2Msg', [subName]),
      t('category.deleteL2Title'),
      { confirmButtonText: t('category.deleteConfirm'), cancelButtonText: t('common.no'), type: 'warning' }
    )
    const custom = store.customCategories.find(c => c.name === subName && c.parentName === parentName)
    if (custom?.id != null) {
      await store.deleteCategory(custom.id)
      ElMessage.success(t('category.deleted', [subName]))
    }
  } catch { /* 取消 */ }
}

async function onConfirm(): Promise<void> {
  const name = form.value.name.trim()
  if (!name) return

  try {
    if (dialogMode.value === 'addL1') {
      // 检查重名
      if (store.allCategories.some(c => c.name === name)) {
        ElMessage.warning(t('category.duplicate'))
        return
      }
      await store.addCategory(name, '', form.value.icon, form.value.color)
      ElMessage.success(t('category.added', [name]))
    } else if (dialogMode.value === 'editL1') {
      if (editingId.value == null) return
      await store.updateCategory(editingId.value, { name, icon: form.value.icon, color: form.value.color })
      ElMessage.success(t('category.updated'))
    } else if (dialogMode.value === 'addL2') {
      // 检查重名
      const parent = store.allCategories.find(c => c.name === form.value.parentName)
      if (parent?.children.includes(name)) {
        ElMessage.warning(t('category.duplicate'))
        return
      }
      await store.addCategory(name, form.value.parentName, '', '')
      ElMessage.success(t('category.added', [name]))
    } else if (dialogMode.value === 'editL2') {
      if (editingId.value == null) return
      await store.updateCategory(editingId.value, { name })
      ElMessage.success(t('category.updated'))
    }
    closeDialog()
  } catch (e: any) {
    ElMessage.error(String(e?.message || e))
    console.error('[CategoryManager] onConfirm error:', e)
  }
}

function closeDialog(): void {
  showDialog.value = false
  form.value = { name: '', icon: '☕', color: '#FF9F43', parentName: '' }
  editingId.value = null
}
</script>

<style scoped>
.category-manager {
  padding-top: 8px;
}

.section-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  font-weight: 500;
}

.cat-group {
  margin-bottom: 10px;
}

.cat-l1-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.cat-icon {
  font-size: 20px;
}

.cat-name {
  font-size: 14px;
  color: var(--text);
  flex: 1;
}

.cat-sub-count {
  font-size: 11px;
  color: var(--text-muted);
}

.lock-icon {
  font-size: 13px;
  opacity: 0.5;
}

.action-btn {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  color: var(--text-secondary);
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--primary);
  color: #fff;
}

.action-btn.danger:hover {
  background: #f56c6c;
}

.cat-l2-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-left: 28px;
  margin-top: 2px;
}

.cat-l2-tag {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.cat-l2-tag.preset {
  background: var(--bg);
  color: var(--text-secondary);
}

.cat-l2-tag.custom {
  background: #ecf5ff;
  color: var(--primary);
}

.l2-edit-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 10px;
  opacity: 0.5;
  padding: 0 2px;
}

.l2-edit-btn:hover {
  opacity: 1;
}

.l2-delete-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: #f56c6c;
  opacity: 0.5;
  padding: 0 2px;
}

.l2-delete-btn:hover {
  opacity: 1;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-muted);
  padding: 8px 0;
}

.divider {
  height: 1px;
  background: var(--border);
  margin: 12px 0;
}

.add-l1-btn {
  width: 100%;
  padding: 10px;
  border: 1.5px dashed var(--border);
  border-radius: 10px;
  background: transparent;
  color: var(--primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 4px;
}

.add-l1-btn:hover {
  background: #ecf5ff;
  border-color: var(--primary);
}

/* 弹窗 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dialog-card {
  background: var(--bg-card);
  border-radius: 14px;
  padding: 20px;
  width: 320px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 16px;
}

.dialog-field {
  margin-bottom: 14px;
}

.dialog-field label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.dialog-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: var(--bg);
  color: var(--text);
  box-sizing: border-box;
}

.dialog-input:focus {
  border-color: var(--primary);
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.icon-option {
  font-size: 22px;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.15s;
}

.icon-option:hover {
  background: var(--bg);
}

.icon-option.selected {
  border-color: var(--primary);
  background: #ecf5ff;
}

.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-option {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.15s;
}

.color-option:hover {
  transform: scale(1.15);
}

.color-option.selected {
  border-color: var(--text);
  transform: scale(1.1);
}

.dialog-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.dialog-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.dialog-btn.cancel {
  background: var(--bg);
  color: var(--text-secondary);
}

.dialog-btn.confirm {
  background: var(--primary);
  color: #fff;
}

.dialog-btn.confirm:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}
</style>
