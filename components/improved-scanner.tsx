"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, RefreshCw, Info } from "lucide-react"
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library"

interface ImprovedScannerProps {
  onScan: (barcode: string) => void
  onError: (error: Error) => void
}

export function ImprovedScanner({ onScan, onError }: ImprovedScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanAttempts, setScanAttempts] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [showDebug, setShowDebug] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)
  const scanCountRef = useRef(0)

  // Initialize camera and barcode reader
  useEffect(() => {
    mountedRef.current = true

    const initializeCamera = async () => {
      if (!videoRef.current) return

      try {
        setIsInitializing(true)
        setDebugInfo("Initializing camera...")

        // Clean up any existing resources
        cleanupResources()

        // Configure ZXing reader with optimal settings
        const hints = new Map()
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_128,
        ])
        hints.set(DecodeHintType.TRY_HARDER, true)

        const reader = new BrowserMultiFormatReader(hints, 300) // Faster scanning interval
        readerRef.current = reader

        // Try to get camera devices
        try {
          const devices = await reader.listVideoInputDevices()
          setDebugInfo((prev) => `${prev}\nFound ${devices.length} camera devices`)

          if (devices.length === 0) {
            throw new Error("No camera devices found")
          }

          // Select back camera if available
          let deviceId = undefined
          const backCamera = devices.find(
            (device) =>
              device.label.toLowerCase().includes("back") || device.label.toLowerCase().includes("environment"),
          )

          if (backCamera) {
            setDebugInfo((prev) => `${prev}\nSelected back camera: ${backCamera.label}`)
            deviceId = backCamera.deviceId
          } else {
            setDebugInfo((prev) => `${prev}\nUsing default camera`)
          }

          // Get camera stream with optimal settings for barcode scanning
          const constraints = {
            video: {
              deviceId: deviceId ? { exact: deviceId } : undefined,
              facingMode: deviceId ? undefined : "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
              // Add focus settings to improve barcode clarity
              advanced: [
                {
                  focusMode: "continuous",
                  zoom: 1.0,
                },
              ],
            },
          }

          const stream = await navigator.mediaDevices.getUserMedia(constraints)
          streamRef.current = stream

          if (!mountedRef.current) {
            cleanupResources()
            return
          }

          // Apply stream to video element
          videoRef.current.srcObject = stream
          setDebugInfo((prev) => `${prev}\nCamera stream acquired`)

          // Set up video element event handlers
          videoRef.current.onloadedmetadata = () => {
            if (!mountedRef.current) return
            setDebugInfo((prev) => `${prev}\nVideo metadata loaded`)

            videoRef
              .current!.play()
              .then(() => {
                if (!mountedRef.current) return
                setIsInitializing(false)
                setIsCameraReady(true)
                setDebugInfo((prev) => `${prev}\nCamera ready, starting scanner`)

                // Start direct scanning from video
                startDirectScanning()
              })
              .catch((err) => {
                setDebugInfo((prev) => `${prev}\nError playing video: ${err.message}`)
                handleError(new Error(`Failed to play video: ${err.message}`))
              })
          }
        } catch (error) {
          setDebugInfo(
            (prev) => `${prev}\nError listing devices: ${error instanceof Error ? error.message : String(error)}`,
          )
          throw error
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown camera error"
        setDebugInfo((prev) => `${prev}\nCamera initialization failed: ${errorMessage}`)
        handleError(error instanceof Error ? error : new Error(errorMessage))
      }
    }

    initializeCamera()

    // Clean up on unmount
    return () => {
      mountedRef.current = false
      cleanupResources()
    }
  }, [onError, scanAttempts])

  // Clean up resources
  const cleanupResources = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    if (readerRef.current) {
      try {
        readerRef.current.reset()
      } catch (e) {
        console.error("Error resetting reader:", e)
      }
      readerRef.current = null
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop())
      } catch (e) {
        console.error("Error stopping tracks:", e)
      }
      streamRef.current = null
    }
  }

  // Handle errors
  const handleError = (error: Error) => {
    setLastError(error.message)
    setIsInitializing(false)
    onError(error)
  }

  // Start direct scanning from video element
  const startDirectScanning = () => {
    if (!videoRef.current || !readerRef.current || !mountedRef.current) return

    setIsScanning(true)
    setDebugInfo((prev) => `${prev}\nStarting continuous scanning`)

    // Clear any existing interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }

    // Set up continuous scanning
    scanIntervalRef.current = setInterval(() => {
      if (!mountedRef.current || !videoRef.current || !readerRef.current) return

      scanCountRef.current++

      // Update debug info occasionally
      if (scanCountRef.current % 10 === 0) {
        setDebugInfo((prev) => `${prev}\nScan attempt #${scanCountRef.current}`)
      }

      try {
        // Decode directly from video element
        readerRef.current
          .decodeFromVideoElement(videoRef.current)
          .then((result) => {
            if (!mountedRef.current) return

            const barcode = result.getText()
            setDebugInfo((prev) => `${prev}\nBarcode detected: ${barcode}`)

            // Validate barcode format
            if (/^\d{8,14}$/.test(barcode)) {
              // Stop scanning
              cleanupResources()
              setIsScanning(false)

              // Notify parent
              onScan(barcode)
            } else {
              setDebugInfo((prev) => `${prev}\nInvalid barcode format: ${barcode}`)
            }
          })
          .catch((error) => {
            // Most errors here are just "barcode not found" which is normal
            // Only log real errors
            if (
              error.name !== "NotFoundException" &&
              !error.message?.includes("No MultiFormat Readers were able to detect the code")
            ) {
              setDebugInfo((prev) => `${prev}\nScan error: ${error.message}`)
            }
          })
      } catch (error) {
        setDebugInfo(
          (prev) => `${prev}\nUnexpected scan error: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }, 500) // Scan every 500ms

    // Set up a fallback for demo mode after 20 seconds
    setTimeout(() => {
      if (!mountedRef.current || !isScanning) return

      setDebugInfo((prev) => `${prev}\nScanning taking longer than expected`)

      // If we've been scanning for 20 seconds with no result, show debug info
      if (scanCountRef.current > 10) {
        setShowDebug(true)
      }
    }, 20000)
  }

  // Function to retry camera initialization
  const handleRetry = () => {
    setLastError(null)
    setDebugInfo("Retrying camera initialization...")
    setScanAttempts((prev) => prev + 1)
  }

  // Fallback to demo mode
  const handleFallbackDemo = () => {
    setDebugInfo((prev) => `${prev}\nUsing fallback demo mode`)

    // For demo purposes, simulate finding a barcode
    const mockBarcodes = [
      "9780201379624", // Organic Granola
      "123456789012", // Chocolate Chip Cookies
      "987654321098", // Organic Spinach
    ]

    const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)]
    setDebugInfo((prev) => `${prev}\nSimulating barcode: ${randomBarcode}`)

    // Clean up resources
    cleanupResources()
    setIsScanning(false)

    // Notify parent
    onScan(randomBarcode)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="scanner-container aspect-video bg-black mb-4 relative">
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

        <div className="scanner-overlay">
          <div className="scanner-target">{isScanning && <div className="scanner-line"></div>}</div>
          <p className="mt-4 text-white text-center">
            Position barcode within the frame
            {isScanning && <span className="inline-block ml-1 animate-pulse">•</span>}
          </p>
        </div>

        {/* Scanning indicator */}
        {isScanning && !isInitializing && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center">
            <span className="inline-block h-2 w-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
            Scanning...
          </div>
        )}
      </div>

      {lastError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
          <p>{lastError}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {isScanning ? (
          <Button size="lg" className="gap-2 w-full" variant="outline" onClick={handleRetry}>
            <RefreshCw className="h-5 w-5" />
            Restart Scanner
          </Button>
        ) : (
          <Button size="lg" className="gap-2 w-full" disabled={!isCameraReady || isInitializing} onClick={handleRetry}>
            {isInitializing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Camera className="h-5 w-5" />
                {lastError ? "Try Again" : "Scan Barcode"}
              </>
            )}
          </Button>
        )}

        <Button variant="secondary" size="lg" className="gap-2 w-full" onClick={handleFallbackDemo}>
          Use Demo Mode
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => setShowDebug(!showDebug)}
        >
          <Info className="h-3 w-3 mr-1" />
          {showDebug ? "Hide" : "Show"} Debug Info
        </Button>
      </div>

      {showDebug && (
        <div className="mt-4 p-3 bg-slate-100 rounded-md w-full max-w-md">
          <h4 className="text-sm font-medium mb-2">Debug Information:</h4>
          <pre className="text-xs whitespace-pre-wrap break-words text-slate-700 max-h-40 overflow-auto">
            {debugInfo || "No debug information available"}
          </pre>
        </div>
      )}

      <div className="mt-4 text-sm text-muted-foreground">
        <p className="text-center">For best results:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Ensure good lighting on the barcode</li>
          <li>Hold the device steady</li>
          <li>Position the barcode within the frame</li>
          <li>Make sure the barcode is not blurry or damaged</li>
        </ul>
      </div>
    </div>
  )
}

