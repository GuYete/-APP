<template>
  <div class="tag-cloud-card">
    <div class="tag-cloud-title">{{ t('stats.tagCloud') }}</div>
    <div v-if="tags.length === 0" class="tag-empty">{{ t('stats.noData') }}</div>
    <div v-else class="tag-cloud">
      <span
        v-for="tag in tags"
        :key="tag.name"
        class="tag-item"
        :style="{
          fontSize: tag.fontSize + 'px',
          color: tag.color,
          opacity: tag.opacity
        }"
        :title="`${tag.name}: ¥${tag.total.toFixed(0)}`"
      >
        {{ tag.name }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Expense } from '@/db'
import { useCategoryStore } from '@/stores/category'

const { t } = useI18n()

const props = defineProps<{
  expenses: Expense[]
}>()

const tags = computed(() => {
  // 按二级分类汇总
  const map = new Map<string, number>()
  for (const e of props.expenses) {
    const key = e.categoryL2
    map.set(key, (map.get(key) || 0) + e.amount)
  }

  const maxAmount = Math.max(...Array.from(map.values()), 1)
  const entries = Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20) // 最多显示20个标签

  // 找到对应的一级分类颜色
  function getColor(catL2: string): string {
    const catStore = useCategoryStore()
    for (const cat of catStore.allCategories) {
      if (cat.children.includes(catL2)) return cat.color
    }
    return '#909399'
  }

  return entries.map(([name, total]) => {
    const ratio = total / maxAmount
    return {
      name,
      total,
      fontSize: 12 + ratio * 20, // 12px ~ 32px
      color: getColor(name),
      opacity: 0.5 + ratio * 0.5 // 0.5 ~ 1.0
    }
  })
})
</script>

<style scoped>
.tag-cloud-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow);
}

.tag-cloud-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}

.tag-empty {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  padding: 16px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
  justify-content: center;
  align-items: center;
  min-height: 80px;
  padding: 8px 0;
}

.tag-item {
  font-weight: 600;
  cursor: default;
  transition: transform 0.15s;
  line-height: 1.4;
}

.tag-item:hover {
  transform: scale(1.15);
}
</style>
