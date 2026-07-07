import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import './styles/global.css'
import App from './App.vue'
import router from './router'

window.onerror = function(msg, url, line) {
  document.body.innerHTML = `<pre style="padding:20px;font-size:14px;color:red;">ERROR: ${msg}\nURL: ${url}\nLine: ${line}</pre>`
}

const app = createApp(App)
app.use(ElementPlus)
app.config.errorHandler = (err) => {
  console.error('Vue Error:', err)
  try { document.body.innerHTML = `<pre style="padding:20px;font-size:14px;color:red;">VUE ERROR: ${err.message}\n${err.stack}</pre>` } catch {}
}
app.use(router)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.mount('#app')
