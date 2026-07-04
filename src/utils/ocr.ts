import { createWorker } from 'tesseract.js'

// OCR 识别图片中的文字，尝试提取金额
export async function recognizeAmount(imageUrl: string): Promise<{ amount: number | null; text: string }> {
  try {
    const worker = await createWorker('chi_sim')
    const { data } = await worker.recognize(imageUrl)
    await worker.terminate()

    const text = data.text
    // 尝试从识别文字中提取金额
    const amount = extractAmount(text)
    return { amount, text }
  } catch {
    return { amount: null, text: 'OCR 识别失败' }
  }
}

function extractAmount(text: string): number | null {
  // 匹配 ¥xx.xx / xx元 / xx块 等模式
  const patterns = [
    /¥\s*(\d+\.?\d*)/,
    /(\d+\.?\d*)\s*元/,
    /(\d+\.?\d*)\s*块/,
    /合计[：:]\s*(\d+\.?\d*)/,
    /总价[：:]\s*(\d+\.?\d*)/,
    /金额[：:]\s*(\d+\.?\d*)/,
    /(\d+\.\d{2})/,  // 通用：匹配 xx.xx 格式
  ]
  for (const pat of patterns) {
    const match = text.match(pat)
    if (match) {
      const val = parseFloat(match[1])
      if (val > 0 && val < 100000) return val
    }
  }
  return null
}
