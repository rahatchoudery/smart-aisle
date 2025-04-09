"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, RefreshCw } from "lucide-react"
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat, NotFoundException } from "@zxing/library"

interface PhotoScannerProps {
  onScan: (barcode: string) => void
  onError: (error: Error) => void
}

export function PhotoScanner({ onScan, onError }: PhotoScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [scanAttempts, setScanAttempts] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize camera and barcode reader
  useEffect(() => {
    isMountedRef.current = true

    const initializeCamera = async () => {
      if (!videoRef.current) return

      try {
        setIsInitializing(true)
        console.log("Initializing camera...")

        // Clean up any existing stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }

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
        const reader = new BrowserMultiFormatReader(hints, 500) // 500ms timeBetweenScans
        readerRef.current = reader

        // Get available devices
        const devices = await reader.listVideoInputDevices()
        console.log(`Found ${devices.length} video devices`)

        if (devices.length === 0) {
          throw new Error("No camera devices found")
        }

        // Select back camera if available
        let deviceId = undefined // undefined will use default
        const backCamera = devices.find(
          (device) => device.label.toLowerCase().includes("back") || device.label.toLowerCase().includes("environment"),
        )

        if (backCamera) {
          console.log(`Using back camera: ${backCamera.label}`)
          deviceId = backCamera.deviceId
        } else if (devices.length > 0) {
          console.log(`Using first available camera: ${devices[0].label}`)
          deviceId = devices[0].deviceId
        }

        // Get user media
        const constraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            facingMode: deviceId ? undefined : "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream

        if (!isMountedRef.current) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        videoRef.current.srcObject = stream
        console.log("Camera access granted")

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          if (!isMountedRef.current) return

          console.log("Video metadata loaded")
          videoRef
            .current!.play()
            .then(() => {
              if (!isMountedRef.current) return
              setIsInitializing(false)
              setIsCameraReady(true)
              console.log("Camera ready")

              // Start continuous scanning
              startContinuousScan()
            })
            .catch((err) => {
              console.error("Error playing video:", err)
              if (isMountedRef.current) {
                setLastError("Failed to start video stream. Please check camera permissions.")
                onError(new Error("Failed to start video stream. Please check camera permissions."))
              }
            })
        }
      } catch (error) {
        console.error("Camera initialization error:", error)
        if (isMountedRef.current) {
          const errorMessage = error instanceof Error ? error.message : "Failed to access camera"
          setLastError(errorMessage)
          onError(error instanceof Error ? error : new Error("Failed to access camera. Please check permissions."))
        }
      }
    }

    initializeCamera()

    // Clean up
    return () => {
      isMountedRef.current = false

      if (readerRef.current) {
        readerRef.current.reset()
        readerRef.current = null
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }
    }
  }, [onError, scanAttempts])

  // Function to start continuous scanning
  const startContinuousScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }

    // Scan every 1 second
    scanIntervalRef.current = setInterval(() => {
      if (isCameraReady && !isCapturing) {
        captureAndScan()
      }
    }, 1000)
  }

  // Function to capture photo and detect barcode
  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady || isCapturing || !readerRef.current) return

    setIsCapturing(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (!context) {
        throw new Error("Could not get canvas context")
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Try to detect barcode from the canvas
      try {
        // Get image data from canvas
        const imageData = canvas.toDataURL("image/png")

        // Decode the image
        const result = await readerRef.current.decodeFromImage(undefined, imageData)

        if (result) {
          const barcode = result.getText()
          console.log(`Barcode detected: ${barcode}`)

          // Validate barcode format (basic check for numeric barcodes)
          if (/^\d{8,14}$/.test(barcode)) {
            // Stop scanning
            if (scanIntervalRef.current) {
              clearInterval(scanIntervalRef.current)
              scanIntervalRef.current = null
            }

            // Notify parent component
            onScan(barcode)
          } else {
            console.log(`Invalid barcode format: ${barcode}`)
            setLastError(null) // Clear any previous errors
          }
        }
      } catch (error) {
        // If it's just a "not found" error, don't treat it as a critical error
        if (
          error instanceof NotFoundException ||
          (error instanceof Error && error.message.includes("No MultiFormat Readers were able to detect the code"))
        ) {
          // This is normal when no barcode is in view, don't show an error
          setLastError(null)
        } else {
          console.error("Error detecting barcode:", error)
          // Only set error if it's not a "not found" error
          setLastError("Error processing image. Please try again.")
        }
      }
    } catch (error) {
      console.error("Error capturing photo:", error)
      setLastError("Failed to process image. Please try again.")
    } finally {
      setIsCapturing(false)
    }
  }

  // Function to manually trigger a scan
  const handleManualScan = () => {
    captureAndScan()
  }

  // Function to retry camera initialization
  const handleRetry = () => {
    setScanAttempts((prev) => prev + 1)
    setLastError(null)
  }

  // Fallback to demo mode after 3 failed attempts
  const handleFallbackDemo = () => {
    console.log("Using fallback demo mode")

    // For demo purposes, simulate finding a barcode
    const mockBarcodes = [
      "9780201379624", // Organic Granola
      "123456789012", // Chocolate Chip Cookies
      "987654321098", // Organic Spinach
    ]

    const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)]
    console.log(`Simulating barcode detection: ${randomBarcode}`)
    onScan(randomBarcode)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="scanner-container aspect-video bg-black mb-4">
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

        <div className="scanner-overlay">
          <div className="scanner-target">{!isCapturing && <div className="scanner-line"></div>}</div>
          <p className="mt-4 text-white text-center">Position barcode within the frame</p>
        </div>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      {lastError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
          <p>{lastError}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button size="lg" className="gap-2 w-full" disabled={!isCameraReady || isCapturing} onClick={handleManualScan}>
          {isCapturing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Camera className="h-5 w-5" />
              Scan Barcode
            </>
          )}
        </Button>

        {lastError && (
          <Button variant="outline" size="lg" className="gap-2 w-full" onClick={handleRetry}>
            <RefreshCw className="h-5 w-5" />
            Retry Camera
          </Button>
        )}

        {scanAttempts > 1 && (
          <Button variant="secondary" size="lg" className="gap-2 w-full" onClick={handleFallbackDemo}>
            Use Demo Mode
          </Button>
        )}
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

