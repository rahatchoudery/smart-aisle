"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Loader2, AlertCircle, Camera, Keyboard } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMobile } from "@/hooks/use-mobile"
import { ImprovedZXingScanner } from "@/components/improved-zxing-scanner"
import { ManualBarcodeEntry } from "@/components/manual-barcode-entry"
// Import the app configuration
import { APP_CONFIG } from "@/config/app-config"

export default function ScanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMobile = useMobile()

  // Set timeouts to show manual entry option and a suggestion to use demo mode
  // Update the useEffect to use the configured timeouts
  useEffect(() => {
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Only set a new timeout if we're not in an error or loading state
    if (!error && !loading && !showManualEntry) {
      // First timeout to show manual entry
      timeoutRef.current = setTimeout(() => {
        setShowManualEntry(true)
      }, APP_CONFIG.scanner.options.manualEntryTimeout)

      // Second timeout to show a suggestion for using demo mode
      const demoSuggestionTimeout = setTimeout(() => {
        setError("Having trouble scanning? Try our demo mode to see how the app works.")
      }, APP_CONFIG.scanner.options.demoSuggestionTimeout)

      // Update cleanup function
      return () => {
        clearTimeout(timeoutRef.current)
        clearTimeout(demoSuggestionTimeout)
      }
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [error, loading, showManualEntry])

  // Update the handleBarcodeScan function to use the configured validation pattern
  const handleBarcodeScan = (barcode: string) => {
    console.log(`Barcode scanned: ${barcode}`)
    setLoading(true)

    // Clear any timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Validate barcode format using the configured pattern
    if (!APP_CONFIG.scanner.options.barcodeValidationPattern.test(barcode)) {
      console.warn(`Invalid barcode format: ${barcode}`)
      setError(`Invalid barcode format: ${barcode}. Expected 7-14 digits or alphanumeric characters.`)
      setLoading(false)
      return
    }

    // Log successful barcode for debugging
    console.log(`Valid barcode accepted: ${barcode}, proceeding to product page`)

    // Navigate to the product page with the scanned barcode
    setTimeout(() => {
      router.push(`/product/${barcode}`)
    }, 1000)
  }

  const handleScanError = (error: Error) => {
    console.error("Barcode scanning error:", error.message)

    // If it's a permission error, show a specific message
    if (
      error.message.includes("Permission") ||
      error.message.includes("permission") ||
      error.name === "NotAllowedError"
    ) {
      setError("Camera access denied. Please check your browser permissions and try again.")
    } else if (error.message.includes("getUserMedia") || error.message.includes("mediaDevices")) {
      setError("Camera not available. Your browser may not support camera access or you need to use HTTPS.")
    } else {
      setError(error.message || "Failed to access camera. Please try again or enter the code manually.")
    }

    // Clear any timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const toggleManualEntry = () => {
    setShowManualEntry(!showManualEntry)
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <span className="font-medium">Back</span>
          </Link>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleManualEntry}
              title={showManualEntry ? "Scan barcode" : "Enter barcode manually"}
            >
              {showManualEntry ? <Camera className="h-5 w-5" /> : <Keyboard className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="container flex-1 py-8">
        <div className="mx-auto max-w-md">
          <h1 className="mb-6 text-2xl font-bold">{showManualEntry ? "Enter Barcode" : "Scan Product Barcode"}</h1>

          {error ? (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>

                <div className="flex flex-col gap-4">
                  <Button variant="secondary" className="w-full" onClick={() => handleBarcodeScan("9780201379624")}>
                    Use Demo Product
                  </Button>

                  <div className="text-center">
                    <p className="mb-4">Or enter the barcode manually:</p>
                    <ManualBarcodeEntry onSubmit={handleBarcodeScan} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card className="mb-6">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                <p className="mt-4 text-center">Analyzing product...</p>
              </CardContent>
            </Card>
          ) : showManualEntry ? (
            <div>
              <ManualBarcodeEntry onSubmit={handleBarcodeScan} />
              <p className="text-center mt-4">
                <Button variant="link" onClick={toggleManualEntry}>
                  Switch to camera scanning
                </Button>
              </p>
            </div>
          ) : (
            <>
              <ImprovedZXingScanner onScan={handleBarcodeScan} onError={handleScanError} />
            </>
          )}

          {!error && !loading && !showManualEntry && (
            <div className="mt-6">
              <p className="text-center text-muted-foreground mb-4">
                {isMobile
                  ? "Hold the barcode 4-8 inches from the camera"
                  : "For best results, use a mobile device with a camera"}
              </p>

              <Card>
                <CardContent className="p-4 text-sm">
                  <h3 className="font-medium mb-2">Scanning Tips:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Ensure good lighting on the barcode</li>
                    <li>Hold the device steady</li>
                    <li>Try different angles if needed</li>
                    <li>Use manual entry if scanning doesn't work</li>
                  </ul>
                </CardContent>
              </Card>

              <p className="text-center mt-4">
                <Button variant="link" onClick={toggleManualEntry}>
                  Enter barcode manually instead
                </Button>
              </p>
            </div>
          )}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">Having trouble with scanning?</p>
            <Link href="/debug-barcode">
              <Button variant="link" size="sm">
                Use Barcode Debug Tool
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

