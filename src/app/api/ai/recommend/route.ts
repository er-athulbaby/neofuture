import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { query } from '@/lib/db'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { concern } = await req.json()

  if (!concern?.trim()) {
    return new Response('Please describe your concern.', { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('AI advisor is not configured. Add ANTHROPIC_API_KEY to .env.local.', { status: 503 })
  }

  // Fetch active products from DB for context
  const products = await query<{
    id: number; name: string; slug: string; short_description: string | null
    description: string | null; price: number; sale_price: number | null
    category_name: string | null; tags: string[]
  }>(
    `SELECT p.id, p.name, p.slug, p.short_description, p.description,
            p.price, p.sale_price, c.name as category_name, p.tags
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.is_active = true ORDER BY p.is_featured DESC`,
    []
  ).catch(() => [])

  const productList = products.map((p, i) => {
    const price = p.sale_price ? `₹${p.sale_price} (was ₹${p.price})` : `₹${p.price}`
    const desc = p.short_description ?? p.description?.slice(0, 120) ?? ''
    return `${i + 1}. **${p.name}** (${p.category_name ?? 'General'}) — ${price}\n   ${desc}`
  }).join('\n\n')

  const systemPrompt = `You are Aria, a compassionate women's wellness advisor at NeoFuture — an Indian women's health brand. You help women choose the right product for their specific needs.

Our current products:
${productList}

Your role:
- Listen empathetically to the user's health concern or need
- Recommend the single most suitable NeoFuture product, explaining exactly why it fits their situation
- Be warm, reassuring, and specific (mention how the product helps their exact concern)
- Keep your response to 3-4 sentences — concise but personal
- End your response with: "👉 I recommend: [exact product name]"
- Always add: "⚠️ This is wellness guidance, not medical advice. Please consult a doctor for medical concerns."
- Write in a friendly, conversational tone suitable for Indian women
- If no product fits, say so honestly and suggest they contact the NeoFuture team`

  // Stream the response directly
  const stream = await client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: systemPrompt,
    messages: [{ role: 'user', content: concern.trim() }],
  })

  // Return as text stream so the client can read chunks
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
