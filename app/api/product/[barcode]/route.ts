import { NextResponse } from "next/server"
import { fetchProductByBarcode } from "@/services/product-api"

export async function GET(request: Request, { params }: { params: { barcode: string } }) {
  try {
    const product = await fetchProductByBarcode(params.barcode)
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
} 