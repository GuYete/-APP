<template>
  <div class="compare-card">
    <div class="compare-title">{{ title }}</div>
    <div class="compare-body">
      <div class="compare-col">
        <div class="compare-label">{{ currentLabel }}</div>
        <div class="compare-value">¥{{ currentTotal.toFixed(0) }}</div>
      </div>
      <div class="compare-arrow" :class="{ up: isUp, down: !isUp }">
        {{ isUp ? '↑' : '↓' }} {{ changePercent.toFixed(1) }}%
      </div>
      <div class="compare-col">
        <div class="compare-label">{{ prevLabel }}</div>
        <div class="compare-value secondary">¥{{ prevTotal.toFixed(0) }}</div>
      </div>
    </div>
    <!-- 进度条 -->
    <div class="compare-bar">
      <div
        class="compare-bar-fill"
        :style="{ width: barWidth + '%' }"
      ></div>
    </div>
    <div class="compare-note">
      相比{{ prevLabel }}，{{ isUp ? t('compare.up') : t('compare.down') }}{{ changePercent.toFixed(1) }}%
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  title: string
  currentLabel: string
  prevLabel: string
  currentTotal: number
  prevTotal: number
  changePercent: number
  isUp: boolean
}>()

const barWidth = computed(() => {
  const max = Math.max(props.currentTotal, props.prevTotal)
  if (max === 0) return 50
  return Math.min((props.currentTotal / max) * 100, 100)
})
</script>

<style scoped>
.compare-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow);
}

.compare-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}

.compare-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.compare-col {
  text-align: center;
}

.compare-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.compare-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
}

.compare-value.secondary {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
}

.compare-arrow {
  font-size: 15px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 20px;
}

.compare-arrow.up {
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.compare-arrow.down {
  color: var(--success);
  background: rgba(103, 194, 58, 0.1);
}

.compare-bar {
  height: 6px;
  background: var(--bg);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.compare-bar-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
  transition: width 0.5s ease;
  min-width: 4px;
}

.compare-note {
  font-size: 11px;
  color: var(--text-muted);
}
</style>
