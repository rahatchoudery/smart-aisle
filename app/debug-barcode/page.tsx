"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Camera, Upload, Copy, Check } from "lucide-react"
import Link from "next/link"
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library"

export default function DebugBarcodePage() {
  const [results, setResults] = useState<Array<{ format: string; text: string }>>([])
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsProcessing(true)
      setError(null)
      setResults([])

      // Create URL for the image
      const url = URL.createObjectURL(file)
      setImageUrl(url)

      // Process the image
      await processImage(url)
    } catch (err) {
      setError(`Error processing image: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Process image with ZXing
  const processImage = async (url: string) => {
    try {
      // Configure hints for better barcode detection
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_128,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.PDF_417,
        BarcodeFormat.AZTEC,
      ])
      hints.set(DecodeHintType.TRY_HARDER, true)

      // Create reader
      const reader = new BrowserMultiFormatReader(hints)

      // Decode the image
      const result = await reader.decodeFromImageUrl(url)

      if (result) {
        setResults([
          {
            format: result.getBarcodeFormat().toString(),
            text: result.getText(),
          },
        ])
      }
    } catch (err) {
      console.error("ZXing error:", err)
      setError(`ZXing couldn't detect any barcodes. Error: ${err instanceof Error ? err.message : String(err)}`)

      // Try alternative approach with canvas
      await tryCanvasProcessing(url)
    }
  }

  // Try processing with canvas for more control
  const tryCanvasProcessing = async (url: string) => {
    if (!canvasRef.current) return

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Couldn't get canvas context")

      // Load image
      const img = new Image()
      img.crossOrigin = "anonymous"

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = url
      })

      // Set canvas size to match image
      canvas.width = img.width
      canvas.height = img.height

      // Draw image to canvas
      ctx.drawImage(img, 0, 0, img.width, img.height)

      // Try different processing approaches
      await tryWithDifferentScales(canvas)
    } catch (err) {
      console.error("Canvas processing error:", err)
      setError(`Alternative processing failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Try processing with different scales and rotations
  const tryWithDifferentScales = async (canvas: HTMLCanvasElement) => {
    const scales = [1.0, 1.5, 0.75]
    const rotations = [0, 90, 180, 270]
    const reader = new BrowserMultiFormatReader()

    const newResults: Array<{ format: string; text: string }> = []

    for (const scale of scales) {
      for (const rotation of rotations) {
        try {
          // Create a new canvas with scaled/rotated image
          const tempCanvas = document.createElement("canvas")
          const ctx = tempCanvas.getContext("2d")
          if (!ctx) continue

          // Set dimensions based on rotation
          if (rotation === 90 || rotation === 270) {
            tempCanvas.width = canvas.height * scale
            tempCanvas.height = canvas.width * scale
          } else {
            tempCanvas.width = canvas.width * scale
            tempCanvas.height = canvas.height * scale
          }

          // Apply transformations
          ctx.save()
          ctx.translate(tempCanvas.width / 2, tempCanvas.height / 2)
          ctx.rotate((rotation * Math.PI) / 180)
          ctx.scale(scale, scale)
          ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height)
          ctx.restore()

          // Try to decode
          const imageData = tempCanvas.toDataURL("image/png")
          const result = await reader.decodeFromImage(undefined, imageData)

          if (result) {
            const resultData = {
              format: result.getBarcodeFormat().toString(),
              text: result.getText(),
            }

            // Only add if not already in results
            if (!newResults.some((r) => r.text === resultData.text)) {
              newResults.push(resultData)
            }
          }
        } catch (err) {
          // Ignore errors for individual attempts
        }
      }
    }

    if (newResults.length > 0) {
      setResults(newResults)
      setError(null)
    } else {
      setError("Couldn't detect any barcodes with alternative processing methods")
    }
  }

  // Copy barcode to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(text)
        setTimeout(() => setCopied(null), 2000)
      })
      .catch((err) => {
        console.error("Failed to copy:", err)
      })
  }

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <Link href="/scan" className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <span className="font-medium">Back to Scanner</span>
          </Link>
        </div>
      </header>

      <div className="container py-8">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold mb-6">Barcode Debug Tool</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upload Barcode Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a photo of a barcode to analyze it and extract the code.
                </p>

                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                <Button onClick={handleUploadClick} className="w-full" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Camera className="h-5 w-5 mr-2 animate-pulse" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Upload Barcode Image
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {imageUrl && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Uploaded Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <img
                    src={imageUrl || "/placeholder.svg"}
                    alt="Uploaded barcode"
                    className="max-w-full max-h-64 object-contain border rounded"
                  />
                </div>

                {/* Hidden canvas for processing */}
                <canvas ref={canvasRef} className="hidden" />
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="mb-6 border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detected Barcodes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-mono text-lg">{result.text}</p>
                          <p className="text-sm text-muted-foreground">Format: {result.format}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(result.text)}
                          title="Copy to clipboard"
                        >
                          {copied === result.text ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <Copy className="h-5 w-5" />
                          )}
                        </Button>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <Link href={`/product/${result.text}`}>
                          <Button className="w-full">Look Up Product</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}

