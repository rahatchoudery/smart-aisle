"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Import the app configuration
import { APP_CONFIG } from "@/config/app-config"

// Update the TEST_BARCODES constant to use the configured demo barcodes
const TEST_BARCODES = APP_CONFIG.scanner.demoBarcodes

interface ManualBarcodeEntryProps {
  onSubmit: (barcode: string) => void
}

export function ManualBarcodeEntry({ onSubmit }: ManualBarcodeEntryProps) {
  const [barcode, setBarcode] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Update the handleSubmit function to use the configured validation pattern
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!barcode.trim()) {
      setError("Please enter a barcode")
      return
    }

    // Check if it's a valid barcode format using the configured pattern
    if (!APP_CONFIG.scanner.options.barcodeValidationPattern.test(barcode.trim())) {
      setError("Please enter a valid barcode (8-14 digits)")
      return
    }

    setError(null)
    onSubmit(barcode.trim())
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter Barcode Manually</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter barcode number"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full"
              />
              {error && <p className="text-sm text-destructive mt-1">{error}</p>}
            </div>
            <Button type="submit" className="w-full">
              Look Up Product
            </Button>

            {/* Add test barcode quick select */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-muted-foreground mb-2">Quick select test barcodes:</p>
              <div className="flex flex-wrap gap-2">
                {TEST_BARCODES.map((item) => (
                  <Button
                    key={item.code}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBarcode(item.code)
                      setError(null)
                      onSubmit(item.code)
                    }}
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

