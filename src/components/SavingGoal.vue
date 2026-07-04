<template>
  <div class="saving-goal">
    <!-- 添加新目标 -->
    <div v-if="!goal" class="add-goal">
      <div class="form-group">
        <label>目标名称</label>
        <input v-model="name" class="goal-input" placeholder="如：旅行基金" />
      </div>
      <div class="form-group">
        <label>目标金额 ¥</label>
        <input v-model.number="targetAmount" type="number" class="goal-input" placeholder="10000" min="0" step="100" />
      </div>
      <div class="form-group">
        <label>截止日期</label>
        <input v-model="deadline" type="date" class="goal-input" />
      </div>
      <button class="create-btn" @click="onCreate">创建目标</button>
    </div>

    <!-- 目标进度 -->
    <div v-else class="goal-progress">
      <div class="goal-header">
        <span class="goal-icon">🎯</span>
        <div>
          <div class="goal-name">{{ goal.name }}</div>
          <div class="goal-target">目标 ¥{{ goal.targetAmount.toLocaleString() }}</div>
        </div>
        <button class="delete-goal-btn" @click="onDelete">✕</button>
      </div>

      <div class="progress-section">
        <div class="progress-text">
          <span>已存 ¥{{ saved.toLocaleString() }}</span>
          <span>{{ percent.toFixed(1) }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: percent + '%' }"></div>
        </div>
        <div class="progress-info">
          <span>剩余 ¥{{ (goal.targetAmount - saved).toLocaleString() }}</span>
          <span v-if="daysLeft > 0">每天需存 ¥{{ dailyNeed.toFixed(0) }}</span>
        </div>
      </div>

      <div class="update-saved">
        <input v-model.number="addAmount" type="number" class="update-input" placeholder="更新已存金额" min="0" step="100" />
        <button class="update-btn" @click="onUpdate">更新</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { db, type Budget } from '@/db'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Goal {
  id?: number
  name: string
  targetAmount: number
  deadline: string
  saved: number
}

const goal = ref<Goal | null>(null)
const name = ref('')
const targetAmount = ref(0)
const deadline = ref('')
const addAmount = ref(0)

const saved = computed(() => goal.value?.saved || 0)
const percent = computed(() => {
  if (!goal.value || goal.value.targetAmount === 0) return 0
  return Math.min((saved.value / goal.value.targetAmount) * 100, 100)
})

const daysLeft = computed(() => {
  if (!goal.value) return 0
  const end = new Date(goal.value.deadline)
  const now = new Date()
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
})

const dailyNeed = computed(() => {
  if (daysLeft.value === 0 || !goal.value) return 0
  return (goal.value.targetAmount - saved.value) / daysLeft.value
})

onMounted(async () => {
  const g = await db.savingGoals.toCollection().first()
  if (g) goal.value = g as Goal
})

async function onCreate(): Promise<void> {
  if (!name.value || targetAmount.value <= 0 || !deadline.value) {
    ElMessage.warning('请填写完整信息')
    return
  }
  const g: Goal = {
    name: name.value,
    targetAmount: targetAmount.value,
    deadline: deadline.value,
    saved: 0
  }
  const id = await db.savingGoals.add(g as any)
  goal.value = { ...g, id: id as number }
  ElMessage.success('目标已创建！')
}

async function onUpdate(): Promise<void> {
  if (!goal.value || addAmount.value <= 0) return
  const newSaved = Math.min(goal.value.saved + addAmount.value, goal.value.targetAmount)
  await db.savingGoals.update(goal.value.id!, { saved: newSaved })
  goal.value.saved = newSaved
  addAmount.value = 0
  ElMessage.success(`已存金额已更新为 ¥${newSaved.toLocaleString()}`)
}

async function onDelete(): Promise<void> {
  try {
    await ElMessageBox.confirm('确定删除此目标吗？', '确认', { type: 'warning' })
    if (goal.value?.id) {
      await db.savingGoals.delete(goal.value.id)
    }
    goal.value = null
    ElMessage.success('目标已删除')
  } catch {}
}
</script>

<style scoped>
.saving-goal {
  padding: 0;
}

/* 新建表单 */
.add-goal {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-group label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.goal-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: var(--bg);
  color: var(--text);
}

.create-btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
}

/* 目标进度 */
.goal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.goal-icon { font-size: 28px; }

.goal-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.goal-target {
  font-size: 12px;
  color: var(--text-muted);
}

.delete-goal-btn {
  margin-left: auto;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(245,108,108,0.1);
  color: var(--danger);
  font-size: 14px;
  cursor: pointer;
}

.progress-section {
  margin-bottom: 12px;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
}

.progress-bar {
  height: 10px;
  background: var(--bg);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #67C23A, #409EFF);
  border-radius: 5px;
  transition: width 0.5s;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
}

.update-saved {
  display: flex;
  gap: 8px;
}

.update-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: var(--bg);
  color: var(--text);
}

.update-btn {
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  background: var(--success);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}
</style>
