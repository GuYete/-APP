<template>
  <div class="add-expense">
    <!-- 头部 -->
    <div class="page-header">
      <h1 class="app-title">黑马记账</h1>
      <p class="app-subtitle">记录每一笔花销</p>
    </div>

    <!-- 金额输入 -->
    <div class="amount-card">
      <div class="amount-label">金额</div>
      <div class="amount-input-wrapper">
        <span class="currency-symbol">¥</span>
        <input
          ref="amountInputRef"
          v-model="amount"
          type="number"
          class="amount-input"
          placeholder="0.00"
          step="0.01"
          min="0"
          @keydown.enter="onSave"
        />
        <VoiceInput @recognized="onVoiceRecognized" />
      </div>
    </div>

    <!-- 快捷模板 -->
    <TemplateBar ref="templateBarRef" @apply="onApplyTemplate" />

    <!-- 分类选择 -->
    <div class="section-card">
      <div class="section-title">分类</div>
      <!-- 一级分类网格 -->
      <div class="category-grid">
        <div
          v-for="cat in categories"
          :key="cat.name"
          class="category-item"
          :class="{ selected: selectedL1 === cat.name }"
          :style="{ borderColor: selectedL1 === cat.name ? cat.color : 'transparent' }"
          @click="onSelectL1(cat.name)"
        >
          <span class="category-icon">{{ cat.icon }}</span>
          <span class="category-name">{{ cat.name }}</span>
        </div>
      </div>
      <!-- 二级分类（横向排列） -->
      <div v-if="selectedL1" class="sub-categories">
        <div
          v-for="sub in currentSubCategories"
          :key="sub"
          class="sub-item"
          :class="{ selected: selectedL2 === sub }"
          @click="selectedL2 = sub"
        >
          {{ sub }}
        </div>
      </div>
    </div>

    <!-- 日期和备注 -->
    <div class="section-card">
      <div class="form-row">
        <span class="form-label">日期</span>
        <input
          v-model="date"
          type="date"
          class="form-input"
        />
      </div>
      <div class="form-row">
        <span class="form-label">备注</span>
        <input
          v-model="note"
          type="text"
          class="form-input"
          placeholder="选填..."
          maxlength="50"
        />
      </div>
      <div class="form-row">
        <span class="form-label">账户</span>
        <div class="account-selector">
          <span
            v-for="acc in accounts"
            :key="acc.key"
            class="account-chip"
            :class="{ selected: selectedAccount === acc.key }"
            @click="selectedAccount = acc.key"
          >
            {{ acc.icon }} {{ acc.name }}
          </span>
        </div>
      </div>
      <div class="form-row">
        <span class="form-label">票据</span>
        <button class="photo-btn" @click="onPickPhoto">
          {{ photo ? '📷 已选' : '📷 拍照/选图' }}
        </button>
        <button class="photo-btn" @click="onOCR" :disabled="ocrBusy">
          {{ ocrBusy ? '⏳ 识别中...' : '🔍 OCR 识别' }}
        </button>
        <img v-if="photo" :src="photo" class="photo-preview" @click="showPhoto = true" />
      </div>
    </div>

    <PhotoViewer :visible="showPhoto" :src="photo" @close="showPhoto = false" />

    <!-- 保存按钮 -->
    <button
      class="save-btn"
      :disabled="!canSave"
      @click="onSave"
    >
      保存记账
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useExpenseStore } from '@/stores/expense'
import { categories } from '@/data/categories'
import { accounts } from '@/data/accounts'
import { db, type ExpenseTemplate } from '@/db'
import TemplateBar from '@/components/TemplateBar.vue'
import PhotoViewer from '@/components/PhotoViewer.vue'
import VoiceInput from '@/components/VoiceInput.vue'
import { recognizeAmount } from '@/utils/ocr'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useExpenseStore()

const amountInputRef = ref<HTMLInputElement>()
const templateBarRef = ref<InstanceType<typeof TemplateBar>>()
const amount = ref('')
const selectedL1 = ref('')
const selectedL2 = ref('')
const selectedAccount = ref('cash')
const date = ref(getTodayStr())
const note = ref('')
const photo = ref('')
const showPhoto = ref(false)
const ocrBusy = ref(false)

function getTodayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const currentSubCategories = computed(() => {
  const cat = categories.find(c => c.name === selectedL1.value)
  return cat ? cat.children : []
})

const canSave = computed(() => {
  return amount.value && Number(amount.value) > 0 && selectedL1.value && selectedL2.value
})

function onSelectL1(name: string): void {
  if (selectedL1.value === name) {
    selectedL1.value = ''
    selectedL2.value = ''
  } else {
    selectedL1.value = name
    selectedL2.value = ''
  }
}

function onApplyTemplate(tmpl: ExpenseTemplate): void {
  amount.value = String(tmpl.amount)
  selectedL1.value = tmpl.categoryL1
  selectedL2.value = tmpl.categoryL2
  selectedAccount.value = tmpl.account
  note.value = tmpl.note
  // 更新使用次数
  if (tmpl.id != null) {
    db.templates.update(tmpl.id, { useCount: (tmpl.useCount || 0) + 1 })
    templateBarRef.value?.refresh()
  }
}

function onPickPhoto(): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      // 压缩：用 canvas 缩小到 max 800px
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxW = 800
        const scale = Math.min(1, maxW / Math.max(img.width, img.height))
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        photo.value = canvas.toDataURL('image/jpeg', 0.6)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

function onVoiceRecognized(data: { amount: number; categoryL1: string; categoryL2: string; note: string }): void {
  amount.value = String(data.amount)
  selectedL1.value = data.categoryL1
  selectedL2.value = data.categoryL2
  note.value = data.note
  ElMessage.success(`语音识别：¥${data.amount} ${data.categoryL2}`)
}

async function onOCR(): Promise<void> {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    ocrBusy.value = true
    const url = URL.createObjectURL(file)
    const { amount } = await recognizeAmount(url)
    URL.revokeObjectURL(url)
    ocrBusy.value = false
    if (amount) {
      amount.value = String(amount)
      ElMessage.success(`OCR 识别金额：¥${amount}`)
    } else {
      ElMessage.warning('未能识别金额，请手动输入')
    }
  }
  input.click()
}

async function onSave(): Promise<void> {
  if (!canSave.value) return

  const savedAmount = Number(Number(amount.value).toFixed(2))
  await store.addExpense({
    amount: savedAmount,
    categoryL1: selectedL1.value,
    categoryL2: selectedL2.value,
    account: selectedAccount.value,
    date: date.value,
    note: note.value,
    photo: photo.value
  } as any)

  ElMessage.success('记账成功！')
  if (store.budgetAlerts.length > 0) {
    for (const alert of store.budgetAlerts) {
      ElMessage.warning(alert)
    }
  }

  // 询问是否保存为模板
  try {
    await ElMessageBox.confirm('是否保存为快捷模板？', '保存模板', {
      confirmButtonText: '保存', cancelButtonText: '不用', type: 'info'
    })
    await db.templates.add({
      name: `${categories.find(c => c.name === selectedL1.value)?.icon || ''} ${selectedL2.value} ¥${savedAmount}`,
      amount: savedAmount, categoryL1: selectedL1.value, categoryL2: selectedL2.value,
      account: selectedAccount.value, note: note.value, useCount: 0
    })
    ElMessage.success('模板已保存')
  } catch { /* 用户取消 */ }

  amount.value = ''
  selectedL1.value = ''
  selectedL2.value = ''
  selectedAccount.value = 'cash'
  date.value = getTodayStr()
  note.value = ''
  photo.value = ''
  await nextTick()
  amountInputRef.value?.focus()
}

// 键盘快捷键 Ctrl+S 保存
function onKeydown(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    onSave()
  }
}

onMounted(async () => {
  await store.loadExpenses()
  await store.loadBudgets()
  document.addEventListener('keydown', onKeydown)
  await nextTick()
  amountInputRef.value?.focus()
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.add-expense {
  padding: 20px 16px;
  max-width: 420px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.app-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
}

.app-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 金额卡片 */
.amount-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: var(--shadow);
}

.amount-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.amount-input-wrapper {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.currency-symbol {
  font-size: 32px;
  font-weight: 600;
  color: var(--primary);
}

.amount-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 40px;
  font-weight: 600;
  color: var(--text);
  width: 100%;
  background: transparent;
  -moz-appearance: textfield;
}

.amount-input::-webkit-outer-spin-button,
.amount-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.amount-input::placeholder {
  color: var(--text-muted);
}

/* 分类卡片 */
.section-card {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow);
}

.section-title {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border-radius: 10px;
  background: var(--bg);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.category-item:hover {
  background: #e8f0fe;
}

.category-item.selected {
  background: #ecf5ff;
  border-color: var(--primary);
}

.category-icon {
  font-size: 28px;
}

.category-name {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 二级分类 */
.sub-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.sub-item {
  padding: 6px 14px;
  border-radius: 20px;
  background: var(--bg);
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.sub-item:hover {
  background: #e8f0fe;
}

.sub-item.selected {
  background: var(--primary);
  color: #fff;
}

/* 表单 */
.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.form-row + .form-row {
  border-top: 1px solid var(--border);
  margin-top: 4px;
  padding-top: 12px;
}

.form-label {
  font-size: 14px;
  color: var(--text-secondary);
  white-space: nowrap;
  width: 36px;
}

.form-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--text);
  background: transparent;
  padding: 4px 0;
}

/* 保存按钮 */
.save-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  background: var(--primary);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 4px;
}

.save-btn:hover {
  background: var(--primary-light);
}

.save-btn:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}

.photo-btn {
  padding: 6px 12px; border: 1px dashed var(--border); border-radius: 8px;
  background: transparent; color: var(--text-secondary); font-size: 13px; cursor: pointer;
}
.photo-preview {
  width: 36px; height: 36px; border-radius: 6px; object-fit: cover; cursor: pointer; margin-left: 8px;
}

/* 账户选择器 */
.account-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.account-chip {
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 12px;
  background: var(--bg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  border: 1.5px solid transparent;
}

.account-chip:hover {
  background: #e8f0fe;
}

.account-chip.selected {
  background: #ecf5ff;
  border-color: var(--primary);
  color: var(--primary);
}
</style>
