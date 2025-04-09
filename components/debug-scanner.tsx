"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, Bug, RefreshCw, Check } from "lucide-react"
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library"

interface DebugScannerProps {
  onScan: (barcode: string) => void
  onError: (error: Error) => void
}

export function DebugScanner({ onScan, onError }: DebugScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [detectedCodes, setDetectedCodes] = useState<{ code: string; count: number }[]>([])

  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  // Add debug log
  const addDebugLog = (message: string) => {
    setDebugInfo((prev) => {
      const newLogs = [message, ...prev]
      // Keep only the last 20 logs
      return newLogs.slice(0, 20)
    })
    console.log(`[DebugScanner] ${message}`)
  }

  // Initialize scanner
  useEffect(() => {
    mountedRef.current = true
    addDebugLog("Component mounted")

    const initScanner = async () => {
      try {
        setIsInitializing(true)
        addDebugLog("Initializing scanner...")

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
        addDebugLog(`Found ${devices.length} video devices`)

        if (devices.length === 0) {
          throw new Error("No camera devices found")
        }

        // Log all devices
        devices.forEach((device, index) => {
          addDebugLog(`Device ${index}: ${device.label || "Unnamed device"} (${device.deviceId.substring(0, 8)}...)`)
        })

        // Select back camera if available
        let deviceId = undefined
        const backCamera = devices.find(
          (device) => device.label.toLowerCase().includes("back") || device.label.toLowerCase().includes("environment"),
        )

        if (backCamera) {
          addDebugLog(`Selected back camera: ${backCamera.label}`)
          deviceId = backCamera.deviceId
        } else {
          addDebugLog(`Using default camera`)
        }

        // Get camera stream
        const constraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            facingMode: deviceId ? undefined : "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        }

        addDebugLog("Requesting camera access...")
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream

        if (!mountedRef.current) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        // Log stream info
        const videoTrack = stream.getVideoTracks()[0]
        if (videoTrack) {
          addDebugLog(`Using camera: ${videoTrack.label}`)
          const settings = videoTrack.getSettings()
          addDebugLog(`Resolution: ${settings.width}x${settings.height}`)
        }

        // Set up video element
        videoRef.current.srcObject = stream
        addDebugLog("Stream connected to video element")

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          if (!mountedRef.current || !videoRef.current) return
          addDebugLog("Video metadata loaded")

          videoRef.current
            .play()
            .then(() => {
              if (!mountedRef.current) return
              addDebugLog("Video playback started")
              setIsInitializing(false)
              setIsScanning(true)
              startScanning()
            })
            .catch((err) => {
              addDebugLog(`Error playing video: ${err.message}`)
              onError(new Error(`Failed to start video stream: ${err.message}`))
            })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        addDebugLog(`Initialization error: ${errorMessage}`)
        setIsInitializing(false)
        onError(error instanceof Error ? error : new Error(errorMessage))
      }
    }

    initScanner()

    // Clean up
    return () => {
      mountedRef.current = false
      addDebugLog("Component unmounting")

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

    addDebugLog("Starting continuous scanning")

    // Scan every 500ms
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
            addDebugLog(`Detected barcode: ${barcode}`)

            // Update detected codes list
            setDetectedCodes((prev) => {
              const existingIndex = prev.findIndex((item) => item.code === barcode)
              if (existingIndex >= 0) {
                // Increment count for existing code
                const newList = [...prev]
                newList[existingIndex] = {
                  ...newList[existingIndex],
                  count: newList[existingIndex].count + 1,
                }
                return newList
              } else {
                // Add new code
                return [...prev, { code: barcode, count: 1 }]
              }
            })

            // Validate barcode format
            if (/^\d{8,14}$/.test(barcode)) {
              // Find this code in our list
              const codeEntry = detectedCodes.find((item) => item.code === barcode)

              // If we've seen this code multiple times, it's likely valid
              if (codeEntry && codeEntry.count >= 3) {
                addDebugLog(`Confirmed barcode: ${barcode} (detected ${codeEntry.count} times)`)

                // Stop scanning
                if (scanIntervalRef.current) {
                  clearInterval(scanIntervalRef.current)
                  scanIntervalRef.current = null
                }

                setIsScanning(false)

                // Notify parent
                onScan(barcode)
              }
            } else {
              addDebugLog(`Invalid barcode format: ${barcode}`)
            }
          })
          .catch((error) => {
            // Ignore "not found" errors
            if (
              error.name !== "NotFoundException" &&
              !error.message?.includes("No MultiFormat Readers were able to detect the code")
            ) {
              addDebugLog(`Decoding error: ${error.message || error}`)
            }
          })
      } catch (error) {
        addDebugLog(`Scan cycle error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }, 500)
  }

  // Handle manual scan button
  const handleManualScan = () => {
    if (isScanning) {
      // If already scanning, restart the scanner
      addDebugLog("Restarting scanner")

      if (readerRef.current) {
        readerRef.current.reset()
      }

      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }

      // Clear detected codes
      setDetectedCodes([])

      startScanning()
    } else {
      // Start scanning
      addDebugLog("Starting scanner")
      setIsScanning(true)
      startScanning()
    }
  }

  // Handle demo mode
  const handleDemoMode = () => {
    // For demo purposes, simulate finding a barcode
    const mockBarcodes = [
      "9780201379624", // Organic Granola
      "123456789012", // Chocolate Chip Cookies
      "987654321098", // Organic Spinach
    ]

    const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)]
    addDebugLog(`Using demo mode with barcode: ${randomBarcode}`)

    // Stop scanning
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    setIsScanning(false)
    onScan(randomBarcode)
  }

  // Handle using a detected code
  const handleUseCode = (code: string) => {
    addDebugLog(`Manually selected code: ${code}`)

    // Stop scanning
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    setIsScanning(false)
    onScan(code)
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
      </div>

      {/* Debug panel */}
      <div className="w-full max-w-md mb-4 p-3 bg-slate-100 border border-slate-200 rounded-md text-xs">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium flex items-center">
            <Bug className="h-3 w-3 mr-1" />
            Debug Information
          </h3>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setDebugInfo([])}>
            Clear
          </Button>
        </div>

        {/* Detected codes */}
        {detectedCodes.length > 0 && (
          <div className="mb-3">
            <h4 className="font-medium text-xs mb-1">Detected Codes:</h4>
            <div className="space-y-1">
              {detectedCodes.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-white p-1 rounded border border-slate-200"
                >
                  <div>
                    <span className="font-mono">{item.code}</span>
                    <span className="ml-2 text-slate-500">({item.count}x)</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleUseCode(item.code)}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Use
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug logs */}
        <div className="max-h-32 overflow-y-auto text-slate-700 bg-white p-2 rounded border border-slate-200">
          {debugInfo.length > 0 ? (
            debugInfo.map((log, index) => (
              <div key={index} className="pb-1 mb-1 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
                {log}
              </div>
            ))
          ) : (
            <div className="text-slate-400 italic">No logs yet</div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button size="lg" className="gap-2 w-full" disabled={isInitializing} onClick={handleManualScan}>
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
              Start Scanning
            </>
          )}
        </Button>

        <Button variant="secondary" size="lg" className="gap-2 w-full" onClick={handleDemoMode}>
          Use Demo Mode
        </Button>
      </div>
    </div>
  )
}

