import { Router } from 'express'
import { z } from 'zod'
import { noStore } from '../middleware/noStore.js'
import { chatLimiter } from '../middleware/rateLimit.js'
import { answerChat } from '../services/chat.js'

export const chatRouter = Router()
chatRouter.use(noStore)

// Only the visible conversation is accepted. Roles are limited to user/assistant, so a caller
// cannot slip in a "system" or "tool" message, and every message is length-capped.
const chatBody = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1, 'Please type a message').max(1000, 'That message is too long. Please keep it under 1000 characters.'),
      })
    )
    .min(1)
    .max(30),
})

// POST /api/chat  { messages: [{ role, content }] }  ->  { reply, products, fallback }
chatRouter.post('/', chatLimiter, async (req, res) => {
  const { messages } = chatBody.parse(req.body)
  if (messages[messages.length - 1]?.role !== 'user') {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'The last message must be from the customer.' } })
    return
  }
  // Keep the model's context small: the latest turns are all it needs.
  res.json(await answerChat(messages.slice(-12), req.user))
})
