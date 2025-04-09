"use client"

import { useRef, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface SimpleScannerProps {
  onScan: (barcode: string) => void
  onError: (error: Error) => void
}

export function SimpleScanner({ onScan, onError }: SimpleScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const isMountedRef = useRef(true)

  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true
    let stream: MediaStream | null = null
    let scanTimeout: NodeJS.Timeout | null = null

    const initializeCamera = async () => {
      if (!videoRef.current || !isMountedRef.current) return

      try {
        setIsInitializing(true)
        console.log("Initializing simple scanner...")

        // Get user media
        const constraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        }

        stream = await navigator.mediaDevices.getUserMedia(constraints)

        if (!isMountedRef.current) {
          // Component unmounted during async operation
          if (stream) {
            stream.getTracks().forEach((track) => track.stop())
          }
          return
        }

        videoRef.current.srcObject = stream
        console.log("Camera access granted")

        // Set up error handler
        videoRef.current.onerror = (e) => {
          console.error("Video element error:", e)
          if (isMountedRef.current) {
            onError(new Error("Failed to initialize video element"))
          }
        }

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          if (!isMountedRef.current) return

          console.log("Video metadata loaded")
          videoRef
            .current!.play()
            .then(() => {
              if (!isMountedRef.current) return

              setIsInitializing(false)
              console.log("Video playing, starting to scan")

              // For demo purposes, simulate finding a barcode after a longer delay
              // This prevents random detections and gives the user time to position a real barcode
              const mockBarcodes = [
                "9780201379624", // Organic Granola
                "123456789012", // Chocolate Chip Cookies
                "987654321098", // Organic Spinach
              ]

              const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)]
              console.log(`Will simulate finding barcode: ${randomBarcode} in 8 seconds`)

              scanTimeout = setTimeout(() => {
                if (isMountedRef.current) {
                  console.log(`Simulated barcode found: ${randomBarcode}`)
                  onScan(randomBarcode)
                }
              }, 8000) // Longer delay to give user time to position a real barcode
            })
            .catch((err) => {
              console.error("Error playing video:", err)
              if (isMountedRef.current) {
                onError(new Error("Failed to play video stream"))
              }
            })
        }
      } catch (error) {
        console.error("Camera initialization error:", error)
        if (isMountedRef.current) {
          if (error instanceof Error) {
            onError(error)
          } else {
            onError(new Error("Failed to access camera"))
          }
        }
      }
    }

    initializeCamera()

    // Clean up
    return () => {
      isMountedRef.current = false

      if (scanTimeout) {
        clearTimeout(scanTimeout)
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      console.log("Simple scanner stopped")
    }
  }, [onScan, onError])

  return (
    <div className="scanner-container aspect-video bg-black">
      {isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}

      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

      <div className="scanner-overlay">
        <div className="scanner-target">
          <div className="scanner-line"></div>
        </div>
        <p className="mt-4 text-white text-center">Position barcode within the frame</p>
      </div>
    </div>
  )
}

