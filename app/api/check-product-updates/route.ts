// Update the route to use our mock API handler

import { NextResponse } from "next/server"
import { getProductCache } from "@/services/mock-api-handler"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const barcode = searchParams.get("barcode")

  if (!barcode) {
    return NextResponse.json({ error: "Barcode is required" }, { status: 400 })
  }

  try {
    // Get the product cache
    const productCache = getProductCache()

    // Check if we have this product in the cache
    const cachedProduct = productCache[barcode]

    if (!cachedProduct) {
      // If not in cache, return no updates
      return NextResponse.json({ hasUpdates: false })
    }

    // Return the cached product with hasUpdates flag
    return NextResponse.json({
      hasUpdates: true,
      product: cachedProduct,
    })
  } catch (error) {
    console.error("Error checking product updates:", error)
    return NextResponse.json({ error: "Failed to check product updates" }, { status: 500 })
  }
}

