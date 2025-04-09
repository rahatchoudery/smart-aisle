"use client"

import { useRef, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface FallbackScannerProps {
  onScan: (barcode: string) => void
  onError: (error: Error) => void
}

export function FallbackScanner({ onScan, onError }: FallbackScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const initializeCamera = async () => {
      if (!videoRef.current) return

      try {
        setIsInitializing(true)

        // Get user media
        const constraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        videoRef.current.srcObject = stream

        // For demo purposes, simulate finding a barcode after a few seconds
        setTimeout(() => {
          onScan("9780201379624") // Example barcode (ISBN)
        }, 5000)
      } catch (error) {
        console.error("Camera initialization error:", error)
        if (error instanceof Error) {
          onError(error)
        } else {
          onError(new Error("Failed to access camera"))
        }
      } finally {
        setIsInitializing(false)
      }
    }

    initializeCamera()

    // Clean up
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
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

