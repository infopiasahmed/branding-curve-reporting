"use client"

import { useEffect, useRef, useState } from "react"
import { Mic } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { speechToText } from "@/lib/speech/recognition"
import { cn } from "@/lib/utils"

export function VoiceButton({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (text: string) => void
  className?: string
}) {
  const [listening, setListening] = useState(false)
  const base = useRef(value)
  const finals = useRef("")

  useEffect(() => () => speechToText.stop(), [])

  function toggle() {
    if (!speechToText.isSupported()) {
      toast.error("Voice input is not available in this browser. You can still type.")
      return
    }
    if (listening) {
      speechToText.stop()
      setListening(false)
      return
    }
    base.current = value
    finals.current = ""
    setListening(true)
    speechToText.start({
      lang: "bn-BD",
      onResult: (text, isFinal) => {
        if (isFinal) {
          finals.current = `${finals.current} ${text}`.trim()
          onChange(`${base.current} ${finals.current}`.trim())
        } else {
          onChange(`${base.current} ${finals.current} ${text}`.trim())
        }
      },
      onError: (message) => {
        setListening(false)
        toast.error(message)
      },
      onEnd: () => setListening(false),
    })
  }

  return (
    <Button
      type="button"
      variant={listening ? "default" : "outline"}
      size="xl"
      onClick={toggle}
      className={cn("w-full", className)}
    >
      <Mic className={cn("size-5", listening && "animate-pulse")} />
      {listening ? "Listening..." : "Tap to Speak"}
    </Button>
  )
}
