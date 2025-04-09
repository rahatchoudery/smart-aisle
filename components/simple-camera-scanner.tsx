"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, RefreshCw } from "lucide-react"

interface SimpleCameraScannerProps {
  onScan: (barcode: string) => void
  onError: (error: Error) => void
}

export function SimpleCameraScanner({ onScan, onError }: SimpleCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState("Initializing camera...")
  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  // Initialize camera with minimal configuration
  useEffect(() => {
    mountedRef.current = true

    // Set a timeout to show an error if camera takes too long
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        setError("Camera is taking too long to initialize. Please try demo mode instead.")
        setIsLoading(false)
      }
    }, 10000) // 10 second timeout

    const initCamera = async () => {
      try {
        setLoadingMessage("Requesting camera access...")

        // Simple camera request with minimal constraints
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })

        if (!mountedRef.current) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          setLoadingMessage("Starting video stream...")
          videoRef.current.srcObject = stream

          videoRef.current.onloadedmetadata = () => {
            if (!mountedRef.current) return

            setLoadingMessage("Starting playback...")
            videoRef
              .current!.play()
              .then(() => {
                if (!mountedRef.current) return
                setIsLoading(false)
                setCameraReady(true)

                // Clear timeout since camera is ready
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current)
                  timeoutRef.current = null
                }
              })
              .catch((err) => {
                setError(`Could not play video: ${err.message}`)
                setIsLoading(false)
                onError(new Error(`Video playback failed: ${err.message}`))
              })
          }
        }
      } catch (err) {
        if (!mountedRef.current) return

        const errorMessage = err instanceof Error ? err.message : "Unknown camera error"
        setError(`Camera access failed: ${errorMessage}`)
        setIsLoading(false)
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    }

    initCamera()

    return () => {
      mountedRef.current = false

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [onError])

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

  // Function to retry camera initialization
  const handleRetry = () => {
    // Reload the page to restart everything
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

        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

        {cameraReady && (
          <div className="scanner-overlay">
            <div className="scanner-target">
              <div className="scanner-line"></div>
            </div>
            <p className="mt-4 text-white text-center">Camera ready! Tap "Scan Barcode" below</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {cameraReady ? (
          <Button size="lg" className="gap-2 w-full" onClick={simulateScan}>
            <Camera className="h-5 w-5" />
            Scan Barcode
          </Button>
        ) : (
          <Button size="lg" className="gap-2 w-full" disabled={isLoading} onClick={handleRetry}>
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading Camera...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                Retry Camera
              </>
            )}
          </Button>
        )}

        <Button variant="secondary" size="lg" className="gap-2 w-full" onClick={simulateScan}>
          Use Demo Mode
        </Button>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p className="text-center">Having trouble with the camera?</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Make sure you've granted camera permissions</li>
          <li>Try using a different browser (Chrome works best)</li>
          <li>Use "Demo Mode" to test the app without a camera</li>
        </ul>
      </div>
    </div>
  )
}

