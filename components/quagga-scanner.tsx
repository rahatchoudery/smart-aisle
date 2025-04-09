"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, RefreshCw } from "lucide-react"

interface QuaggaScannerProps {
  onScan: (barcode: string) => void
  onError: (error: Error) => void
}

export function QuaggaScanner({ onScan, onError }: QuaggaScannerProps) {
  const videoRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState("Initializing scanner...")
  const [error, setError] = useState<string | null>(null)
  const [scannerReady, setScannerReady] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const quaggaInitialized = useRef(false)
  const mountedRef = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize Quagga barcode scanner
  useEffect(() => {
    mountedRef.current = true

    // Set a timeout to show an error if scanner takes too long
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        setError("Scanner is taking too long to initialize. Please try demo mode instead.")
        setIsLoading(false)
      }
    }, 15000) // 15 second timeout

    const initScanner = async () => {
      try {
        setLoadingMessage("Loading scanner library...")

        // Dynamically import Quagga
        const Quagga = (await import("quagga")).default

        if (!mountedRef.current) return

        setLoadingMessage("Requesting camera access...")

        if (!videoRef.current) {
          throw new Error("Scanner container not found")
        }

        // Initialize Quagga with improved configuration
        Quagga.init(
          {
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: videoRef.current,
              constraints: {
                width: { min: 640 },
                height: { min: 480 },
                facingMode: "environment",
                aspectRatio: { min: 1, max: 2 },
              },
            },
            locator: {
              patchSize: "medium",
              halfSample: true,
            },
            numOfWorkers: 2,
            frequency: 10,
            decoder: {
              readers: [
                "ean_reader",
                "ean_8_reader",
                "upc_reader",
                "upc_e_reader",
                "code_39_reader",
                "code_128_reader",
              ],
              debug: {
                showCanvas: true,
                showPatches: true,
                showFoundPatches: true,
                showSkeleton: true,
                showLabels: true,
                showPatchLabels: true,
                showRemainingPatchLabels: true,
                boxFromPatches: {
                  showTransformed: true,
                  showTransformedBox: true,
                  showBB: true,
                },
              },
            },
            locate: true,
          },
          (err) => {
            if (err) {
              if (!mountedRef.current) return
              console.error("Quagga initialization error", err)
              setError(`Scanner initialization failed: ${err.message || "Unknown error"}`)
              setIsLoading(false)
              onError(err instanceof Error ? err : new Error(String(err)))
              return
            }

            if (!mountedRef.current) return

            // Clear timeout since scanner is ready
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
              timeoutRef.current = null
            }

            setLoadingMessage("Starting scanner...")
            quaggaInitialized.current = true

            // Start the scanner
            Quagga.start()

            // Set up the barcode detected event
            Quagga.onDetected((result) => {
              if (!mountedRef.current) return

              const code = result.codeResult.code
              if (!code) return

              console.log(`Quagga detected code: ${code}, format: ${result.codeResult.format}`)

              // Validate barcode format (basic check for numeric barcodes)
              if (result.codeResult.confidence > 0.75) {
                if (/^\d{8,14}$/.test(code)) {
                  // If this is a new result or different from the last one
                  if (code !== lastResult) {
                    setLastResult(code)

                    // Highlight the detected barcode
                    if (result.box) {
                      const drawingCtx = Quagga.canvas.ctx.overlay
                      const drawingCanvas = Quagga.canvas.dom.overlay

                      drawingCtx.clearRect(
                        0,
                        0,
                        Number.parseInt(drawingCanvas.getAttribute("width")),
                        Number.parseInt(drawingCanvas.getAttribute("height")),
                      )
                      drawingCtx.strokeStyle = "#00F"
                      drawingCtx.lineWidth = 2
                      drawingCtx.strokeRect(result.box.x, result.box.y, result.box.width, result.box.height)
                    }

                    // Stop Quagga and notify parent
                    Quagga.stop()
                    onScan(code)
                  }
                } else {
                  console.warn(`Invalid barcode format detected: ${code}`)
                }
              } else {
                console.log(`Low confidence detection (${result.codeResult.confidence.toFixed(2)}): ${code}`)
              }
            })

            // Scanner is ready
            setIsLoading(false)
            setScannerReady(true)
          },
        )
      } catch (err) {
        if (!mountedRef.current) return

        const errorMessage = err instanceof Error ? err.message : "Unknown scanner error"
        console.error("Scanner initialization error:", errorMessage)
        setError(`Scanner initialization failed: ${errorMessage}`)
        setIsLoading(false)
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    }

    initScanner()

    // Clean up
    return () => {
      mountedRef.current = false

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      // Stop Quagga if it was initialized
      if (quaggaInitialized.current) {
        import("quagga").then(({ default: Quagga }) => {
          try {
            Quagga.stop()
          } catch (e) {
            console.error("Error stopping Quagga:", e)
          }
        })
      }
    }
  }, [onScan, onError, lastResult])

  // Function to simulate a barcode scan (for demo purposes)
  const simulateScan = () => {
    // Mock barcodes
    const mockBarcodes = [
      "9780201379624", // Organic Granola
      "123456789012", // Chocolate Chip Cookies
      "987654321098", // Organic Spinach
    ]

    const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)]
    onScan(randomBarcode)
  }

  // Function to retry scanner initialization
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="flex flex-col items-center">
      <div className="scanner-container aspect-video bg-black mb-4 relative">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
            <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
            <p className="text-white text-center">{loadingMessage}</p>
          </div>
        )}

        <div ref={videoRef} className="h-full w-full"></div>

        {scannerReady && (
          <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
            <span className="inline-block h-2 w-2 bg-white rounded-full mr-1 animate-pulse"></span>
            Scanner active
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {error ? (
          <Button size="lg" className="gap-2 w-full" onClick={handleRetry}>
            <RefreshCw className="h-5 w-5" />
            Retry Scanner
          </Button>
        ) : (
          <Button size="lg" className="gap-2 w-full" disabled={isLoading || !scannerReady}>
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading Scanner...
              </>
            ) : (
              <>
                <Camera className="h-5 w-5" />
                Scanner Active
              </>
            )}
          </Button>
        )}

        <Button variant="secondary" size="lg" className="gap-2 w-full" onClick={simulateScan}>
          Use Demo Mode
        </Button>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p className="text-center">For best results:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Hold the barcode 4-8 inches from the camera</li>
          <li>Ensure good lighting on the barcode</li>
          <li>Keep the phone steady</li>
          <li>Try different angles if needed</li>
        </ul>
      </div>
    </div>
  )
}

