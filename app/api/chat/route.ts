import OpenAI from "openai"

import dotenv from "dotenv"

// Charge les variables d'environnement depuis .env.local
dotenv.config({ path: ".env.local" })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL,
})
export async function POST(req: Request) {
  const { messages } = await req.json()

  // Création d'un ReadableStream pour gérer le streaming manuellement
  const stream = new ReadableStream({
    async start(controller) {
      // Création de la complétion avec streaming
      const completion = await openai.chat.completions.create({
        model: "mistralai/mixtral-8x7b-instruct-v0.1",
        messages,
        temperature: 0.5,
        top_p: 1,
        max_tokens: 1024,
        stream: true,
      })

      // Traitement de chaque morceau de la réponse
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || ""
        if (content) {
          // Envoi du contenu au client
          controller.enqueue(new TextEncoder().encode(content))
        }
      }
      controller.close()
    },
  })

  // Retour de la réponse en streaming
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}