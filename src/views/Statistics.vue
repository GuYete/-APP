<template>
  <div class="statistics">
    <div class="page-header">
      <h2 class="page-title">统计</h2>
    </div>

    <!-- 日期范围选择 -->
    <div class="date-range-bar">
      <div class="quick-btns">
        <button
          v-for="opt in quickOptions"
          :key="opt.key"
          class="quick-btn"
          :class="{ active: activeQuick === opt.key }"
          @click="onQuick(opt.key)"
        >{{ opt.label }}</button>
      </div>
      <div class="date-inputs">
        <input v-model="dateStart" type="date" class="date-input" @change="onDateChange" />
        <span class="date-sep">→</span>
        <input v-model="dateEnd" type="date" class="date-input" @change="onDateChange" />
      </div>
    </div>

    <!-- 区间总支出 -->
    <div class="total-card">
      <span class="total-card-label">{{ rangeLabel }}</span>
      <span class="total-card-amount">¥{{ rangeTotal.toFixed(2) }}</span>
    </div>

    <!-- 导出按钮 -->
    <div class="export-buttons">
      <button class="export-btn" @click="onExportExcel">📥 Excel</button>
      <button class="export-btn" @click="onExportPDF">📄 PDF 报表</button>
    </div>

    <!-- 空数据 -->
    <div v-if="categorySummary.length === 0" class="empty-state">
      <span class="empty-icon">📊</span>
      <p>本月暂无记录</p>
    </div>

    <template v-else>
      <!-- 分类占比饼图 -->
      <div class="chart-card">
        <div class="chart-title">分类占比</div>
        <div ref="pieChartRef" class="chart-box"></div>
      </div>

      <!-- 月度趋势折线图 -->
      <div class="chart-card">
        <div class="chart-title">近6个月趋势</div>
        <div ref="lineChartRef" class="chart-box"></div>
      </div>

      <!-- 趋势预测 -->
      <PredictCard :total="rangeTotal" />

      <!-- 标签云 -->
      <TagCloud :expenses="store.getExpensesByDateRange(dateStart, dateEnd)" />

      <!-- 分类排行 -->
      <div class="rank-card">
        <div class="chart-title">分类排行</div>
        <div
          v-for="(item, index) in categorySummary"
          :key="item.name"
          class="rank-item"
        >
          <span class="rank-num" :class="'rank-' + (index + 1)">{{ index + 1 }}</span>
          <span class="rank-icon">{{ item.icon }}</span>
          <span class="rank-name">{{ item.name }}</span>
          <div class="rank-bar-wrapper">
            <div
              class="rank-bar"
              :style="{
                width: (item.total / maxTotal * 100) + '%',
                background: item.color
              }"
            ></div>
          </div>
          <span class="rank-amount">¥{{ item.total.toFixed(2) }}</span>
        </div>
      </div>
    </template>

    <!-- 对比卡片 -->
    <div v-if="categorySummary.length > 0" class="compare-section">
      <CompareCard
        title="📊 环比对比（本月 vs 上月）"
        :current-label="momData.currentMonth + ' 本月'"
        :prev-label="momData.prevMonth + ' 上月'"
        :current-total="momData.currentTotal"
        :prev-total="momData.prevTotal"
        :change-percent="momData.changePercent"
        :is-up="momData.isUp"
      />
      <CompareCard
        title="📈 同比对比（本月 vs 去年同月）"
        :current-label="yoyData.currentMonth + ' 今年'"
        :prev-label="yoyData.prevYearMonth + ' 去年'"
        :current-total="yoyData.currentTotal"
        :prev-total="yoyData.prevYearTotal"
        :change-percent="yoyData.changePercent"
        :is-up="yoyData.isUp"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useExpenseStore } from '@/stores/expense'
import { accounts } from '@/data/accounts'
import { exportToExcel } from '@/utils/export'
import CompareCard from '@/components/CompareCard.vue'
import PredictCard from '@/components/PredictCard.vue'
import TagCloud from '@/components/TagCloud.vue'
import { generatePDFReport } from '@/utils/pdfReport'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const store = useExpenseStore()
const pieChartRef = ref<HTMLDivElement>()
const lineChartRef = ref<HTMLDivElement>()
let pieChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null

// 日期范围
const dateStart = ref(getTodayStr())
const dateEnd = ref(getTodayStr())
const activeQuick = ref('month')

const quickOptions = [
  { key: '7d', label: '近7天' },
  { key: '30d', label: '近30天' },
  { key: 'month', label: '本月' },
  { key: 'year', label: '本年' }
]

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function onQuick(key: string): void {
  activeQuick.value = key
  const now = new Date()
  const today = getTodayStr()
  dateEnd.value = today

  switch (key) {
    case '7d': {
      const d = new Date(now)
      d.setDate(d.getDate() - 6)
      dateStart.value = fmt(d)
      break
    }
    case '30d': {
      const d = new Date(now)
      d.setDate(d.getDate() - 29)
      dateStart.value = fmt(d)
      break
    }
    case 'month':
      dateStart.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      break
    case 'year':
      dateStart.value = `${now.getFullYear()}-01-01`
      break
  }
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function onDateChange(): void {
  activeQuick.value = ''
}

const rangeLabel = computed(() => {
  if (activeQuick.value) {
    return quickOptions.find(o => o.key === activeQuick.value)?.label + ' 总支出' || '区间总支出'
  }
  return '区间总支出'
})

const rangeTotal = computed(() => store.getDateRangeTotal(dateStart.value, dateEnd.value))
const categorySummary = computed(() => store.getCategorySummaryByRange(dateStart.value, dateEnd.value))

const momData = computed(() => store.getCompareMom())
const yoyData = computed(() => store.getCompareYoy())
const maxTotal = computed(() => {
  if (categorySummary.value.length === 0) return 1
  return Math.max(...categorySummary.value.map(c => c.total))
})

function initPieChart(): void {
  if (!pieChartRef.value) return
  if (pieChart) pieChart.dispose()

  pieChart = echarts.init(pieChartRef.value)
  const data = categorySummary.value.map(c => ({
    name: c.name,
    value: c.total,
    itemStyle: { color: c.color }
  }))

  pieChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (params: { name: string; value: number; percent: number }) =>
        `${params.name}<br/>¥${params.value.toFixed(2)} (${params.percent}%)`
    },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'outside',
        formatter: (params: { name: string; percent: number }) =>
          `${params.name}\n${params.percent}%`
      },
      data
    }]
  })
}

async function initLineChart(): Promise<void> {
  if (!lineChartRef.value) return
  if (lineChart) lineChart.dispose()

  lineChart = echarts.init(lineChartRef.value)
  const trend = await store.getMonthTrend(6)

  lineChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0]
        return `${p.name}<br/>总支出：¥${p.value.toFixed(2)}`
      }
    },
    grid: {
      left: 16,
      right: 16,
      top: 20,
      bottom: 20
    },
    xAxis: {
      type: 'category',
      data: trend.map(t => {
        const parts = t.month.split('-')
        return parts[1] + '月'
      }),
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      show: false,
      min: 0
    },
    series: [{
      type: 'line',
      data: trend.map(t => t.total),
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#409EFF', width: 3 },
      itemStyle: { color: '#409EFF' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.02)' }
        ])
      }
    }]
  })
}

function onExportExcel(): void {
  const list = store.getExpensesByDateRange(dateStart.value, dateEnd.value)
  if (list.length === 0) {
    ElMessage.warning('当前范围暂无数据')
    return
  }
  exportToExcel(list, `黑马记账_${dateStart.value}_${dateEnd.value}.xlsx`)
  ElMessage.success('Excel 已导出')
}

function onExportPDF(): void {
  const list = store.getExpensesByDateRange(dateStart.value, dateEnd.value)
  if (list.length === 0) {
    ElMessage.warning('当前范围暂无数据')
    return
  }
  generatePDFReport(list, `${dateStart.value} 至 ${dateEnd.value} 消费报告`)
  ElMessage.success('PDF 报表已导出')
}

function updateCharts(): void {
  nextTick(() => {
    initPieChart()
    initLineChart()
  })
}

watch([dateStart, dateEnd], () => {
  updateCharts()
})

onMounted(async () => {
  await store.loadExpenses()
  onQuick('month')
  updateCharts()
})
</script>

<style scoped>
.statistics {
  padding: 20px 16px;
  max-width: 420px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
}

.date-range-bar {
  margin-bottom: 12px;
}

.quick-btns {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.quick-btn {
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-card);
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  background: var(--bg-card);
  outline: none;
  color: var(--text);
}

.date-sep {
  color: var(--text-muted);
  font-size: 14px;
}

.compare-section {
  margin-top: 4px;
}

/* 导出按钮 */
.export-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.export-btn {
  flex: 1;
  padding: 10px;
  border: 1.5px dashed var(--primary);
  border-radius: 10px;
  background: transparent;
  color: var(--primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover {
  background: #ecf5ff;
}

[theme="dark"] .export-btn:hover {
  background: rgba(64, 158, 255, 0.1);
}

/* 总额卡片 */
.total-card {
  background: linear-gradient(135deg, #409EFF, #66B1FF);
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 12px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.25);
}

.total-card-label {
  display: block;
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  margin-bottom: 8px;
}

.total-card-amount {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
}

/* 图表卡片 */
.chart-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow);
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}

.chart-box {
  width: 100%;
  height: 260px;
}

/* 排行卡片 */
.rank-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow);
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.rank-item + .rank-item {
  border-top: 1px solid #f5f5f5;
}

.rank-num {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: #eee;
  color: #999;
  flex-shrink: 0;
}

.rank-num.rank-1 { background: #FFD700; color: #fff; }
.rank-num.rank-2 { background: #C0C0C0; color: #fff; }
.rank-num.rank-3 { background: #CD853F; color: #fff; }

.rank-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.rank-name {
  font-size: 13px;
  color: var(--text);
  width: 64px;
  flex-shrink: 0;
}

.rank-bar-wrapper {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.rank-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
  min-width: 4px;
}

.rank-amount {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  flex-shrink: 0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}
</style>
