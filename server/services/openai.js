import { config, isOpenAIEnabled } from '../config.js'

export async function chatCompletion(messages) {
  if (!isOpenAIEnabled()) {
    const last = messages.filter((m) => m.role === 'user').pop()?.content || ''
    return {
      reply: `Demo mode (OpenAI не настроен). Вы написали: «${last}». Настройте OPENAI_API_KEY в .env.`,
      demo: true,
    }
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openai.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: 'Ты помощник AI Insider Academy. Отвечай кратко о курсах по AI, чат-ботам, автоматизации. Язык — как у пользователя.',
        },
        ...messages,
      ],
      max_tokens: 400,
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'OpenAI error')
  return { reply: data.choices[0].message.content, demo: false }
}
