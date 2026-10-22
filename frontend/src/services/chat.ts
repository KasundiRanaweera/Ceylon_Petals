import { post } from '../lib/api'

// The customer support chatbot. The browser only ever talks to our own API; the AI key lives on the server.

export interface ChatProduct {
  slug: string
  name: string
  price: number
  originalPrice?: number
  imageUrl?: string
  url: string
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatReply {
  reply: string
  products: ChatProduct[]
  fallback: boolean
}

export function sendChat(messages: ChatTurn[]): Promise<ChatReply> {
  return post<ChatReply>('/chat', { messages })
}
