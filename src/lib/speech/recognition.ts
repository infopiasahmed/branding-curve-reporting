export type SpeechResultHandler = (text: string, isFinal: boolean) => void

export type SpeechStartOptions = {
  lang?: string
  onResult: SpeechResultHandler
  onError?: (message: string) => void
  onEnd?: () => void
}

export interface SpeechToTextProvider {
  isSupported(): boolean
  start(options: SpeechStartOptions): void
  stop(): void
}

type BrowserRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: {
    resultIndex: number
    results: ArrayLike<{
      isFinal: boolean
      0: { transcript: string }
    }>
  }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

function getBrowserRecognition(): (new () => BrowserRecognition) | null {
  if (typeof window === "undefined") return null
  const speechWindow = window as Window & {
    SpeechRecognition?: new () => BrowserRecognition
    webkitSpeechRecognition?: new () => BrowserRecognition
  }
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null
}

export class BrowserSpeechToText implements SpeechToTextProvider {
  private recognition: BrowserRecognition | null = null

  isSupported() {
    return Boolean(getBrowserRecognition())
  }

  start(options: SpeechStartOptions) {
    const Recognition = getBrowserRecognition()
    if (!Recognition) {
      options.onError?.("Voice input is not supported in this browser.")
      return
    }

    this.stop()
    const recognition = new Recognition()
    recognition.lang = options.lang ?? "bn-BD"
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let transcript = ""
      let isFinal = true
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript
        if (!event.results[i].isFinal) isFinal = false
      }
      options.onResult(transcript, isFinal)
    }
    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return
      if (event.error === "not-allowed") {
        options.onError?.("Microphone permission was denied. You can still type the report.")
        return
      }
      options.onError?.(event.error)
    }
    recognition.onend = () => options.onEnd?.()
    this.recognition = recognition
    recognition.start()
  }

  stop() {
    this.recognition?.stop()
    this.recognition = null
  }
}

export const speechToText: SpeechToTextProvider = new BrowserSpeechToText()
