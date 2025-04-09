"use client"

import { useRef, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import barcodeScanner from "@/services/barcode-scanner"

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onError: (error: Error) => void
}

export function BarcodeScanner({ onScan, onError }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [scanAttempts, setScanAttempts] = useState(0)

  useEffect(() => {
    let isMounted = true

    const initializeScanner = async () => {
      if (!videoRef.current || !isMounted) return

      try {
        setIsInitializing(true)
        console.log("Initializing barcode scanner...")

        // Make sure video element is properly set up
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded")
        }

        videoRef.current.onloadeddata = () => {
          console.log("Video data loaded")
        }

        videoRef.current.onerror = (e) => {
          console.error("Video element error:", e)
          if (isMounted) {
            onError(new Error("Failed to initialize video element"))
          }
        }

        // Start scanning with a callback for detected barcodes
        await barcodeScanner.startScanning(videoRef.current, (result) => {
          console.log(`Barcode detected: ${result.barcode}`)
          if (isMounted) {
            onScan(result.barcode)
          }
        })

        if (isMounted) {
          setIsInitializing(false)
          console.log("Barcode scanner initialized successfully")
        }
      } catch (error) {
        console.error("Scanner initialization error:", error)
        // Ensure we're passing an Error object
        if (isMounted) {
          if (error instanceof Error) {
            onError(error)
          } else {
            onError(new Error("Failed to initialize barcode scanner"))
          }
        }
      }
    }

    initializeScanner()

    // Set up a fallback mechanism in case scanning takes too long
    const fallbackTimer = setTimeout(() => {
      if (isMounted && scanAttempts === 0) {
        setScanAttempts((prev) => prev + 1)
        console.log("Scan taking longer than expected, retrying...")
        barcodeScanner.stopScanning()
        initializeScanner()
      }
    }, 10000) // 10 seconds timeout

    // Clean up
    return () => {
      isMounted = false
      clearTimeout(fallbackTimer)
      barcodeScanner.stopScanning()
      console.log("Barcode scanner component unmounted")
    }
  }, [onScan, onError, scanAttempts])

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

