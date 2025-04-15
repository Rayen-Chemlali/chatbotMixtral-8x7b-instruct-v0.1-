"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Loader2, User, Bot, Trash2, Moon, Sun } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"

// Type pour les messages
type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()

  // Charger l'historique des messages depuis localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatHistory")
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    }
  }, [])

  // Sauvegarder les messages dans localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chatHistory", JSON.stringify(messages))
    }
  }, [messages])

  // Faire défiler vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, currentAssistantMessage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Ajouter le message de l'utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setCurrentAssistantMessage("")

    try {
      // Envoyer la requête au backend
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur de réseau")
      }

      // Lire le stream de la réponse
      const reader = response.body?.getReader()
      if (!reader) throw new Error("Impossible de lire la réponse")

      let assistantMessageContent = ""

      // Fonction pour traiter les chunks de données
      const processText = async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Convertir le chunk en texte
          const text = new TextDecoder().decode(value)
          assistantMessageContent += text
          setCurrentAssistantMessage(assistantMessageContent)
        }

        // Ajouter le message complet de l'assistant
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: assistantMessageContent,
        }
        setMessages((prev) => [...prev, assistantMessage])
        setCurrentAssistantMessage("")
        setIsLoading(false)
      }

      processText()
    } catch (error) {
      console.error("Erreur:", error)
      setIsLoading(false)
    }
  }

  const clearHistory = () => {
    localStorage.removeItem("chatHistory")
    setMessages([])
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8 transition-colors duration-300">
      <Card className="w-full max-w-4xl mx-auto flex-1 flex flex-col shadow-lg border-0 dark:bg-gray-800 dark:text-gray-100 overflow-hidden">
        <CardHeader className="border-b dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-blue-500" />
              <CardTitle className="text-xl font-bold">Mixtral AI Assistant</CardTitle>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full h-9 w-9"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearHistory}
                className="rounded-full h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                aria-label="Clear chat history"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4 py-12"
              >
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-center text-lg">Commencez une conversation avec l'assistant</p>
                <p className="text-center text-sm max-w-md">
                  Posez des questions, demandez de l'aide ou discutez de n'importe quel sujet.
                </p>
              </motion.div>
            ) : (
              <>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className="flex items-start max-w-[80%] space-x-2">
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot className="h-4 w-4 text-blue-500" />
                        </div>
                      )}
                      <div
                        className={`rounded-2xl p-4 ${
                          message.role === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {currentAssistantMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start max-w-[80%] space-x-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="rounded-2xl p-4 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                        <div className="whitespace-pre-wrap">{currentAssistantMessage}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {isLoading && !currentAssistantMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start max-w-[80%] space-x-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="rounded-2xl p-4 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 flex items-center">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </CardContent>

        <CardFooter className="border-t dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tapez votre message..."
              className="flex-1 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-blue-500"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
