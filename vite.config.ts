import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

type ServerRequest = { method?: string; on: (event: string, callback: (...args: unknown[]) => void) => void }
type ServerResponse = { statusCode: number; setHeader: (name: string, value: string) => void; end: (body: string) => void }
type ServerMiddleware = (req: ServerRequest, res: ServerResponse, next: () => void) => void | Promise<void>
type ServerFetchResponse = { ok: boolean; status: number; json: () => Promise<unknown> }
type ServerFetch = (input: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<ServerFetchResponse>

type GeminiPart = { text?: string }
type GeminiPayload = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>
}

const serverFetch = (globalThis as typeof globalThis & { fetch?: ServerFetch }).fetch

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function readBody(req: ServerRequest) {
  return new Promise<string>((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => { body += String(chunk) })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function geminiApi(serverEnv: Record<string, string | undefined>) {
  const geminiModel = serverEnv.GEMINI_MODEL || 'gemini-3.8-flash'

  return {
    name: 'commumathy-gemini-api',
    configureServer(server: { middlewares: { use: (path: string, middleware: ServerMiddleware) => void } }) {
      server.middlewares.use('/api/gemini/status', (_req, res) => {
        sendJson(res, 200, { configured: Boolean(serverEnv.GEMINI_API_KEY), model: geminiModel })
      })

      server.middlewares.use('/api/gemini', async (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        const apiKey = serverEnv.GEMINI_API_KEY
        if (!apiKey) {
          sendJson(res, 503, { error: 'Gemini API key is not configured.' })
          return
        }

        try {
          if (!serverFetch) {
            sendJson(res, 500, { error: 'This Node runtime does not provide fetch.' })
            return
          }
          const body = JSON.parse(await readBody(req)) as {
            contents?: Array<{ role?: string; parts?: Array<{ text?: string }> }>
          }
          const contents = (body.contents ?? [])
            .filter((message) => message.parts?.some((part) => part.text?.trim()))
            .map((message) => ({
              role: message.role === 'model' ? 'model' : 'user',
              parts: message.parts ?? [],
            }))

          if (!contents.length) {
            sendJson(res, 400, { error: 'A tutor question is required.' })
            return
          }

          const response = await serverFetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: 'คุณคือ Mathy Tutor ติวเตอร์คณิตศาสตร์ภาษาไทย อธิบายเป็นขั้นตอน ใช้ภาษาที่เป็นมิตร ชวนผู้เรียนคิดเอง และอย่าเดาคำตอบเมื่อข้อมูลไม่พอ' }],
              },
              contents,
              generationConfig: { temperature: 0.35, maxOutputTokens: 700 },
            }),
          })

          const payload = await response.json() as GeminiPayload & { error?: { message?: string } }
          if (!response.ok) {
            sendJson(res, response.status, { error: payload.error?.message || 'Gemini request failed.' })
            return
          }

          const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim()
          if (!text) {
            sendJson(res, 502, { error: 'Gemini returned no text.' })
            return
          }

          sendJson(res, 200, { text, model: geminiModel })
        } catch (error) {
          sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unable to contact Gemini.' })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const serverEnv = loadEnv(mode, '.', '')
  return {
    plugins: [react(), geminiApi(serverEnv)],
  }
})
