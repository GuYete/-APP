import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import './styles/global.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.use(i18n)

// 全局错误捕获
app.config.errorHandler = (err, _vm, info) => {
  console.error('[Vue Error]', info, String(err))
}

app.mount('#app')
