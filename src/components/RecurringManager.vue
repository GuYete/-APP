<template>
  <div class="recurring-manager">
    <!-- 已有账单列表 -->
    <div v-for="bill in bills" :key="bill.id" class="bill-item">
      <div class="bill-info">
        <span class="bill-icon">🔄</span>
        <div>
          <div class="bill-name">{{ bill.name }}</div>
          <div class="bill-meta">
            ¥{{ bill.amount }} · {{ cycleLabel(bill) }} · {{ bill.categoryL2 }}
          </div>
        </div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" :checked="bill.enabled" @change="onToggle(bill)" />
        <span class="toggle-slider"></span>
      </label>
      <button class="del-bill-btn" @click="onDelete(bill)">✕</button>
    </div>

    <!-- 添加新账单 -->
    <div class="add-bill">
      <div class="form-row">
        <input v-model="form.name" class="bill-input" placeholder="名称（如：房租）" />
        <input v-model.number="form.amount" type="number" class="bill-input short" placeholder="金额" min="0" step="0.01" />
      </div>
      <div class="form-row">
        <select v-model="form.categoryL1" class="bill-input" @change="form.categoryL2 = ''">
          <option value="">选分类</option>
          <option v-for="cat in categories" :key="cat.name" :value="cat.name">{{ cat.icon }} {{ cat.name }}</option>
        </select>
        <select v-model="form.categoryL2" class="bill-input">
          <option value="">选小类</option>
          <option v-for="sub in subCats" :key="sub" :value="sub">{{ sub }}</option>
        </select>
      </div>
      <div class="form-row">
        <select v-model="form.cycle" class="bill-input">
          <option value="monthly">每月</option>
          <option value="weekly">每周</option>
          <option value="daily">每天</option>
        </select>
        <input v-if="form.cycle === 'monthly'" v-model.number="form.dayOfMonth" type="number" class="bill-input short" placeholder="几号" min="1" max="31" />
        <select v-if="form.cycle === 'weekly'" v-model="form.dayOfWeek" class="bill-input">
          <option :value="1">周一</option><option :value="2">周二</option><option :value="3">周三</option>
          <option :value="4">周四</option><option :value="5">周五</option><option :value="6">周六</option><option :value="0">周日</option>
        </select>
      </div>
      <button class="add-btn" @click="onAdd">添加定期账单</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { db, type RecurringBill } from '@/db'
import { categories } from '@/data/categories'
import { ElMessage, ElMessageBox } from 'element-plus'

const bills = ref<RecurringBill[]>([])
const form = ref({
  name: '', amount: 0, categoryL1: '', categoryL2: '',
  cycle: 'monthly' as const, dayOfMonth: 1, dayOfWeek: 1
})

const subCats = computed(() => {
  const cat = categories.find(c => c.name === form.value.categoryL1)
  return cat?.children || []
})

function cycleLabel(b: RecurringBill): string {
  if (b.cycle === 'monthly') return `每月${b.dayOfMonth}日`
  if (b.cycle === 'weekly') return `每周${['日','一','二','三','四','五','六'][b.dayOfWeek]}`
  return '每天'
}

async function load(): Promise<void> {
  bills.value = await db.recurring.toArray()
}

async function onToggle(bill: RecurringBill): Promise<void> {
  await db.recurring.update(bill.id!, { enabled: !bill.enabled })
  await load()
}

async function onDelete(bill: RecurringBill): Promise<void> {
  try { await ElMessageBox.confirm(`删除「${bill.name}」？`, '确认', { type: 'warning' }) } catch { return }
  await db.recurring.delete(bill.id!)
  await load()
}

async function onAdd(): Promise<void> {
  if (!form.value.name || !form.value.amount || !form.value.categoryL2) {
    ElMessage.warning('请填写完整信息')
    return
  }
  await db.recurring.add({
    name: form.value.name, amount: form.value.amount,
    categoryL1: form.value.categoryL1, categoryL2: form.value.categoryL2,
    account: 'cash', cycle: form.value.cycle,
    dayOfMonth: form.value.dayOfMonth, dayOfWeek: form.value.dayOfWeek,
    enabled: true, lastRecorded: ''
  })
  form.value = { name: '', amount: 0, categoryL1: '', categoryL2: '', cycle: 'monthly', dayOfMonth: 1, dayOfWeek: 1 }
  await load()
  ElMessage.success('定期账单已添加')
}

onMounted(load)
</script>

<style scoped>
.bill-item {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 0; border-top: 1px solid var(--border-light);
}
.bill-info { display: flex; align-items: center; gap: 10px; flex: 1; }
.bill-icon { font-size: 22px; }
.bill-name { font-size: 14px; color: var(--text); font-weight: 500; }
.bill-meta { font-size: 12px; color: var(--text-muted); }
.del-bill-btn { width: 24px; height: 24px; border: none; border-radius: 4px; background: transparent; color: var(--text-muted); cursor: pointer; font-size: 13px; }
.del-bill-btn:hover { color: var(--danger); background: rgba(245,108,108,0.1); }

.toggle-switch { position: relative; display: inline-block; width: 40px; height: 22px; flex-shrink: 0; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #ccc; border-radius: 22px; transition: .3s; }
.toggle-slider::before { content: ''; position: absolute; height: 16px; width: 16px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: .3s; }
input:checked + .toggle-slider { background: var(--primary); }
input:checked + .toggle-slider::before { transform: translateX(18px); }

.add-bill { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.form-row { display: flex; gap: 8px; }
.bill-input { flex: 1; padding: 7px 10px; border: 1px solid var(--border); border-radius: 6px; font-size: 13px; outline: none; background: var(--bg); color: var(--text); }
.bill-input.short { max-width: 100px; flex: 0 0 100px; }
.add-btn { width: 100%; padding: 8px; border: none; border-radius: 6px; background: var(--primary); color: #fff; font-size: 13px; cursor: pointer; }
</style>
