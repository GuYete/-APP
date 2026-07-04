<template>
  <div v-if="templates.length > 0" class="template-bar">
    <div class="template-label">⚡ 快捷模板</div>
    <div class="template-scroll">
      <span
        v-for="tmpl in templates"
        :key="tmpl.id"
        class="template-chip"
        @click="$emit('apply', tmpl)"
        @contextmenu.prevent="onDelete(tmpl)"
      >
        {{ getIcon(tmpl.categoryL1) }} {{ tmpl.name }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { db, type ExpenseTemplate } from '@/db'
import { getCategoryByName } from '@/data/categories'

defineEmits<{ apply: [tmpl: ExpenseTemplate] }>()

const templates = ref<ExpenseTemplate[]>([])

function getIcon(cat: string): string {
  return getCategoryByName(cat)?.icon || '💰'
}

async function load(): Promise<void> {
  templates.value = await db.templates.orderBy('useCount').reverse().toArray()
}

async function onDelete(tmpl: ExpenseTemplate): Promise<void> {
  if (tmpl.id != null) {
    await db.templates.delete(tmpl.id)
    await load()
  }
}

onMounted(load)

defineExpose({ refresh: load })
</script>

<style scoped>
.template-bar {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow);
}

.template-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.template-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.template-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  background: var(--bg);
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid var(--border);
  transition: all 0.15s;
}

.template-chip:hover {
  background: #ecf5ff;
  border-color: var(--primary);
  color: var(--primary);
}
</style>
