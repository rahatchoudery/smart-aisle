"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, RefreshCw } from "lucide-react"
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library"

// Import the app configuration
import { APP_CONFIG } from "@/config/app-config"

interface ImprovedZXingScannerProps {
  onScan: (barcode: string) => void
  onError: (error: Error) => void
}

export function ImprovedZXingScanner({ onScan, onError }: ImprovedZXingScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastDetectedCode, setLastDetectedCode] = useState<string | null>(null)
  const [detectionCount, setDetectionCount] = useState<Record<string, number>>({})

  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  // Initialize scanner
  useEffect(() => {
    mountedRef.current = true

    const initScanner = async () => {
      try {
        setIsInitializing(true)
        console.log("Initializing ZXing scanner...")

        // Configure hints for better barcode detection
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

        // Create reader
        const reader = new BrowserMultiFormatReader(hints, 300) // 300ms between scans
        readerRef.current = reader

        if (!videoRef.current) {
          throw new Error("Video element not found")
        }

        // Get available devices
        const devices = await reader.listVideoInputDevices()
        console.log(`Found ${devices.length} video devices`)

        if (devices.length === 0) {
          throw new Error("No camera devices found")
        }

        // Select back camera if available
        let deviceId = undefined
        const backCamera = devices.find(
          (device) => device.label.toLowerCase().includes("back") || device.label.toLowerCase().includes("environment"),
        )

        if (backCamera) {
          console.log(`Using back camera: ${backCamera.label}`)
          deviceId = backCamera.deviceId
        } else {
          console.log(`Using default camera`)
        }

        // Get camera stream
        const constraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            facingMode: deviceId ? undefined : "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: { ideal: 1.777 },
          },
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream

        if (!mountedRef.current) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        // Set up video element
        videoRef.current.srcObject = stream

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          if (!mountedRef.current || !videoRef.current) return

          videoRef.current
            .play()
            .then(() => {
              if (!mountedRef.current) return
              setIsInitializing(false)
              setIsScanning(true)
              console.log(
                "Camera initialized, starting scanner with video dimensions:",
                videoRef.current.videoWidth,
                "x",
                videoRef.current.videoHeight,
              )
              startScanning()
            })
            .catch((err) => {
              console.error("Error playing video:", err)
              setError("Failed to start video stream")
              onError(new Error("Failed to start video stream"))
            })
        }
      } catch (error) {
        console.error("Scanner initialization error:", error)
        setError(error instanceof Error ? error.message : "Failed to initialize scanner")
        setIsInitializing(false)
        onError(error instanceof Error ? error : new Error("Failed to initialize scanner"))
      }
    }

    initScanner()

    // Clean up
    return () => {
      mountedRef.current = false

      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }

      if (readerRef.current) {
        readerRef.current.reset()
        readerRef.current = null
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [onError])

  // Start continuous scanning
  const startScanning = () => {
    if (!videoRef.current || !readerRef.current || !mountedRef.current) return

    // Clear any existing interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }

    // Reset detection count when starting a new scan
    setDetectionCount({})

    console.log("Starting continuous scanning")

    // Use the configured scan interval
    const scanInterval = APP_CONFIG.scanner.options.scanInterval
    const requiredDetectionCount = APP_CONFIG.scanner.options.requiredDetectionCount

    // Scan at the configured interval
    scanIntervalRef.current = setInterval(() => {
      if (!mountedRef.current || !videoRef.current || !readerRef.current || !canvasRef.current) return

      try {
        // Take a snapshot of the video
        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        if (!context) return

        // Set canvas size to match video
        const video = videoRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Get image data
        const imageData = canvas.toDataURL("image/png")

        // Decode the image
        readerRef.current
          .decodeFromImage(undefined, imageData)
          .then((result) => {
            if (!mountedRef.current) return

            const barcode = result.getText()
            console.log(`ZXing detected barcode: ${barcode}`)

            // Use the configured validation pattern
            const validationPattern = APP_CONFIG.scanner.options.barcodeValidationPattern

            // Validate barcode format
            if (validationPattern.test(barcode)) {
              // Count detections of this barcode to ensure it's stable
              const newCount = (detectionCount[barcode] || 0) + 1
              setDetectionCount((prev) => ({ ...prev, [barcode]: newCount }))

              // Accept the barcode after required number of valid detections
              if (newCount >= requiredDetectionCount) {
                // Stop scanning
                if (scanIntervalRef.current) {
                  clearInterval(scanIntervalRef.current)
                  scanIntervalRef.current = null
                }

                setIsScanning(false)
                setLastDetectedCode(barcode)

                // Notify parent
                onScan(barcode)
                console.log(`Barcode detected and accepted: ${barcode}`)
              } else {
                console.log(`Detection #${newCount} of barcode ${barcode}`)
              }
            } else {
              console.warn(`Invalid barcode format detected: ${barcode}`)
            }
          })
          .catch((error) => {
            // Ignore "not found" errors
            if (
              error.name !== "NotFoundException" &&
              !error.message?.includes("No MultiFormat Readers were able to detect the code")
            ) {
              console.error("Error decoding image:", error)
            }
          })
      } catch (error) {
        console.error("Error during scan cycle:", error)
      }
    }, scanInterval)

    // Add a fallback for demo mode after 15 seconds
    setTimeout(() => {
      if (!mountedRef.current || !isScanning) return

      // If we've been scanning for 15 seconds with no result, show a message
      console.log("Scanning taking longer than expected, consider using manual entry")
    }, 15000)
  }

  // Handle manual scan button
  const handleManualScan = () => {
    if (isScanning) {
      // If already scanning, restart the scanner
      if (readerRef.current) {
        readerRef.current.reset()
      }

      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }

      startScanning()
    } else {
      // Start scanning
      setIsScanning(true)
      startScanning()
    }
  }

  // Handle retry
  const handleRetry = () => {
    setError(null)
    setDetectionCount({})
    setLastDetectedCode(null)

    // Reset scanner
    if (readerRef.current) {
      readerRef.current.reset()
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    // Restart scanning
    setIsScanning(true)
    startScanning()
  }

  // Handle demo mode
  const handleDemoMode = () => {
    // Get demo barcodes from configuration
    const demoBarcodes = APP_CONFIG.scanner.demoBarcodes.map((item) => item.code)

    const randomBarcode = demoBarcodes[Math.floor(Math.random() * demoBarcodes.length)]
    console.log(`Using demo mode with barcode: ${randomBarcode}`)

    // Stop scanning
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    setIsScanning(false)
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

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />

        <div className="scanner-overlay">
          <div className="scanner-target">{isScanning && <div className="scanner-line"></div>}</div>
          <p className="mt-4 text-white text-center">
            Position barcode within the frame
            {isScanning && <span className="inline-block ml-1 animate-pulse">•</span>}
          </p>
        </div>

        {/* Status indicator */}
        {isScanning && !isInitializing && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center">
            <span className="inline-block h-2 w-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
            Scanning...
          </div>
        )}

        {lastDetectedCode && (
          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs">
            Detected: {lastDetectedCode}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          size="lg"
          className="gap-2 w-full"
          disabled={isInitializing}
          onClick={isScanning ? handleRetry : handleManualScan}
        >
          {isInitializing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Initializing...
            </>
          ) : isScanning ? (
            <>
              <RefreshCw className="h-5 w-5" />
              Restart Scanner
            </>
          ) : (
            <>
              <Camera className="h-5 w-5" />
              {error ? "Try Again" : "Scan Barcode"}
            </>
          )}
        </Button>

        <Button variant="secondary" size="lg" className="gap-2 w-full" onClick={handleDemoMode}>
          Use Demo Mode
        </Button>
      </div>

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

