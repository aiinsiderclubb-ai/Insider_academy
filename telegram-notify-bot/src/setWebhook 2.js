import 'dotenv/config'
import { config } from './config.js'
import { setWebhook } from './telegramApi.js'

const url = `${config.publicUrl}/telegram/webhook`
if (!config.publicUrl) {
  console.error('Set BOT_PUBLIC_URL in .env')
  process.exit(1)
}

const result = await setWebhook(url)
console.log(result)
