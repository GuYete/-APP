<template>
  <div class="voice-input">
    <button class="voice-btn" :class="{ active: listening }" @click="toggle" :title="listening ? '停止' : '语音记账'">
      {{ listening ? '🔴' : '🎤' }}
    </button>
    <span v-if="listening" class="voice-status">正在聆听...</span>
    <span v-if="result" class="voice-result">{{ result }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { categories } from '@/data/categories'

const emit = defineEmits<{ recognized: [data: { amount: number; categoryL1: string; categoryL2: string; note: string }] }>()

const listening = ref(false)
const result = ref('')
let recognition: any = null

// 语音解析
function parseVoice(text: string): { amount: number; categoryL1: string; categoryL2: string; note: string } | null {
  // 提取金额
  let amount = 0
  const amountPatterns = [
    /(\d+)块/, /(\d+)元/, /(\d+\.?\d*)块/, /(\d+\.?\d*)元/,
    /(\d+)/  // 最后的数字
  ]
  for (const pat of amountPatterns) {
    const m = text.match(pat)
    if (m) { amount = parseFloat(m[1]); break }
  }
  if (!amount || amount <= 0) return null

  // 匹配分类
  for (const cat of categories) {
    for (const sub of cat.children) {
      if (text.includes(sub) || (sub.length >= 2 && text.includes(sub.substring(0, 2)))) {
        return { amount, categoryL1: cat.name, categoryL2: sub, note: text }
      }
    }
  }

  // 没有匹配到具体分类，默认归到其他
  return { amount, categoryL1: '其他杂项', categoryL2: '其他', note: text }
}

function toggle(): void {
  // @ts-ignore
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    result.value = '当前环境不支持语音识别'
    return
  }

  if (listening.value) {
    recognition?.stop()
    listening.value = false
    return
  }

  recognition = new SpeechRecognition()
  recognition.lang = 'zh-CN'
  recognition.interimResults = false
  recognition.maxAlternatives = 1

  recognition.onstart = () => { listening.value = true; result.value = '' }
  recognition.onend = () => { listening.value = false }
  recognition.onerror = () => { listening.value = false; result.value = '识别失败，请重试' }
  recognition.onresult = (event: any) => {
    const text = event.results[0][0].transcript
    result.value = `"${text}"`
    const parsed = parseVoice(text)
    if (parsed) {
      emit('recognized', parsed)
      result.value += ' ✅'
    } else {
      result.value += ' ❌ 未能识别金额'
    }
  }

  recognition.start()
}
</script>

<style scoped>
.voice-input { display: flex; align-items: center; gap: 8px; }
.voice-btn { width: 36px; height: 36px; border: 2px solid var(--border); border-radius: 50%; background: var(--bg-card); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .2s; }
.voice-btn.active { border-color: #F56C6C; background: rgba(245,108,108,0.1); animation: pulse 1s infinite; }
@keyframes pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.1) } }
.voice-status { font-size: 12px; color: var(--danger); }
.voice-result { font-size: 12px; color: var(--text-secondary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
