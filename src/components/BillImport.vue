<template>
  <div class="bill-import">
    <!-- 选择文件 -->
    <div class="step" v-if="step === 0">
      <p class="step-hint">支持微信和支付宝导出的 CSV 账单文件</p>
      <button class="pick-btn" @click="onPickFile">📂 选择 CSV 文件</button>
    </div>

    <!-- 预览 -->
    <div class="step" v-if="step === 1">
      <div class="preview-header">
        <span>预览（共 {{ bills.length }} 条）</span>
        <div>
          <button class="link-btn" @click="toggleAll(true)">全选</button>
          <button class="link-btn" @click="toggleAll(false)">取消全选</button>
        </div>
      </div>
      <div class="preview-list">
        <div v-for="(b, i) in bills" :key="i" class="preview-item" :class="{ unselected: !b.selected }" @click="b.selected = !b.selected">
          <input type="checkbox" v-model="b.selected" class="preview-check" @click.stop />
          <span class="preview-date">{{ b.date }}</span>
          <span class="preview-cat">{{ b.categoryL2 }}</span>
          <span class="preview-note">{{ b.note }}</span>
          <span class="preview-amount">{{ b.type === '支出' ? '-' : '+' }}¥{{ b.amount.toFixed(2) }}</span>
        </div>
      </div>
      <button class="import-btn" @click="onImport">确认导入 {{ selectedCount }} 条</button>
    </div>

    <!-- 完成 -->
    <div class="step" v-if="step === 2">
      <p class="done-msg">✅ 导入完成，共 {{ imported }} 条</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useExpenseStore } from '@/stores/expense'
import { parseWechatCSV, parseAlipayCSV, billsToExpenses, type ParsedBill } from '@/utils/billImport'
import { readFileAsText } from '@/utils/backup'
import { ElMessage } from 'element-plus'

const store = useExpenseStore()
const step = ref(0)
const bills = ref<ParsedBill[]>([])
const imported = ref(0)

const selectedCount = computed(() => bills.value.filter(b => b.selected).length)

function toggleAll(v: boolean): void { bills.value.forEach(b => b.selected = v) }

async function onPickFile(): Promise<void> {
  try {
    const text = await readFileAsText('.csv')
    // 尝试微信格式，如果条数太少先试支付宝
    let parsed = parseWechatCSV(text)
    if (parsed.length === 0) parsed = parseAlipayCSV(text)
    if (parsed.length === 0) { ElMessage.warning('未能识别账单格式'); return }
    bills.value = parsed
    step.value = 1
  } catch { ElMessage.error('读取文件失败') }
}

async function onImport(): Promise<void> {
  const exps = billsToExpenses(bills.value)
  for (const e of exps) {
    await store.addExpense(e)
  }
  imported.value = exps.length
  step.value = 2
  setTimeout(() => { step.value = 0; bills.value = []; imported.value = 0 }, 2000)
}
</script>

<style scoped>
.bill-import { padding: 8px 0; }
.step-hint { font-size: 13px; color: var(--text-muted); margin-bottom: 10px; }
.pick-btn, .import-btn {
  width: 100%; padding: 10px; border: none; border-radius: 8px;
  background: var(--primary); color: #fff; font-size: 14px; cursor: pointer;
}
.preview-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 13px; color: var(--text); }
.link-btn { background: none; border: none; color: var(--primary); font-size: 12px; cursor: pointer; }
.preview-list { max-height: 300px; overflow-y: auto; }
.preview-item { display: flex; align-items: center; gap: 6px; padding: 8px 0; border-top: 1px solid var(--border-light); cursor: pointer; font-size: 12px; }
.preview-item.unselected { opacity: 0.4; }
.preview-check { flex-shrink: 0; }
.preview-date { width: 80px; font-size: 11px; color: var(--text-muted); flex-shrink: 0; }
.preview-cat { width: 56px; flex-shrink: 0; color: var(--text-secondary); }
.preview-note { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
.preview-amount { flex-shrink: 0; font-weight: 600; color: var(--danger); }
.import-btn { margin-top: 10px; }
.done-msg { text-align: center; font-size: 15px; color: var(--success); padding: 20px; }
</style>
