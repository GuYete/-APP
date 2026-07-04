export default {
  app: { title: '黑马记账', subtitle: '记录每一笔花销' },
  nav: { add: '记账', list: '明细', stats: '统计', settings: '设置' },
  add: {
    amount: '金额', category: '分类', date: '日期', note: '备注',
    notePlaceholder: '选填...', account: '账户', receipt: '票据',
    photoBtn: '📷 拍照/选图', photoDone: '📷 已选',
    ocrBtn: '🔍 OCR 识别', voiceBtn: '🎤', save: '保存记账',
    saveSuccess: '记账成功！', saveAsTemplate: '是否保存为快捷模板？',
    saveTemplate: '保存', noThanks: '不用', templateSaved: '模板已保存'
  },
  list: {
    title: '明细', search: '搜索备注、分类、金额...',
    allCategories: '全部分类', allAccounts: '全部账户',
    total: '合计', empty: '暂无记录',
    deleteConfirm: '确定删除「{0} ¥{1}」吗？',
    deleteTitle: '删除确认', delete: '删除', cancel: '取消'
  },
  stats: {
    title: '统计', totalSpent: '总支出', exportExcel: '📥 Excel',
    exportPdf: '📄 PDF 报表', exportSuccess: '已导出', noData: '暂无数据',
    quickLabels: { '7d': '近7天', '30d': '近30天', month: '本月', year: '本年' },
    pieTitle: '分类占比', lineTitle: '近6个月趋势', rankTitle: '分类排行',
    prediction: '🔮 消费预测', tagCloud: '🏷️ 消费标签云',
    compareMom: '📊 环比对比（本月 vs 上月）',
    compareYoy: '📈 同比对比（本月 vs 去年同月）',
    predict: { avgDaily: '日均消费', predictEnd: '预测月底', passedDays: '本月已过', noExpense: '本月暂无消费记录' }
  },
  settings: {
    title: '设置', darkMode: '深色模式', on: '已开启', off: '已关闭',
    appLock: '应用锁', lockPwd: '输入新密码', setLockPwd: '设置解锁密码',
    savePwd: '保存密码', enableLock: '启用应用锁',
    lockOn: '应用锁已开启', lockOff: '应用锁已关闭', pwdUpdated: '密码已更新',
    budget: '预算管理', budgetDesc: '设置每月预算和分类预算',
    saving: '存钱目标', savingDesc: '设定储蓄目标，追踪进度',
    recurring: '定期账单管理', recurringDesc: '房租、订阅等自动记录',
    importBill: '📥 导入账单', importBillDesc: '导入微信/支付宝 CSV 账单',
    language: '🌐 语言', languageDesc: '中文 / English',
    dataSection: '数据管理',
    exportData: '导出数据备份', exportDataDesc: '将所有记账数据导出为 JSON 文件',
    importData: '导入数据恢复', importDataDesc: '从备份文件恢复数据',
    exportExcel: '导出 Excel 报表', exportExcelDesc: '将所有数据导出为 Excel 文件',
    version: '版本',
    exportOk: '数据备份已导出', exportFail: '导出失败',
    importOk: '导入完成：新增 {0} 条，跳过 {1} 条', importFail: '导入失败',
    importConfirm: '导入将合并数据（已存在的记录不会重复导入），确定继续吗？'
  },
  lock: { title: '黑马记账', hint: '请输入密码解锁', unlock: '解锁', error: '密码错误，请重试' },
  budget: {
    totalMonthly: '💰 每月总预算', totalMonth: '月预算',
    categoryBudget: '📂 分类预算（可选）', save: '保存',
    totalSaved: '默认总预算已保存', monthSaved: '月预算已保存',
    catSaved: '预算已保存'
  },
  saving: {
    create: '创建目标', namePlaceholder: '如：旅行基金',
    amountLabel: '目标金额 ¥', deadlineLabel: '截止日期',
    goalCreated: '目标已创建！', goalDeleted: '目标已删除',
    saved: '已存', remaining: '剩余', dailyNeed: '每天需存',
    update: '更新', updatePlaceholder: '更新已存金额',
    updated: '已存金额已更新为 ¥{0}'
  },
  recurring: {
    namePlaceholder: '名称（如：房租）', amountPlaceholder: '金额',
    categoryPlaceholder: '选分类', subPlaceholder: '选小类',
    monthly: '每月', weekly: '每周', daily: '每天',
    dayPlaceholder: '几号', addBtn: '添加定期账单',
    added: '定期账单已添加'
  },
  import: {
    title: '导入账单', selectFile: '选择 CSV 文件',
    wechatFormat: '微信账单格式', alipayFormat: '支付宝账单格式',
    preview: '预览（共 {0} 条）', selectAll: '全选', deselectAll: '取消全选',
    autoClassify: '根据商户名自动匹配分类',
    import: '确认导入', importing: '导入中...', done: '导入完成：{0} 条'
  },
  voice: { listening: '正在聆听...', stop: '停止', retry: '重试', notSupported: '当前环境不支持语音识别' },
  common: { yes: '确定', no: '取消', ok: '知道了' }
}
