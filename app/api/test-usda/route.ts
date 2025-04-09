import { NextResponse } from "next/server"
import { testUsdaApi } from "@/services/test-usda-api"
import { analyzeIngredient } from "@/services/ingredient-analyzer"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") || "apple"

  try {
    // Test the USDA API
    const apiTest = await testUsdaApi(query)

    // If the API test was successful, also test the ingredient analyzer
    let ingredientAnalysis = null
    if (apiTest.success) {
      ingredientAnalysis = await analyzeIngredient(query)
    }

    return NextResponse.json({
      apiTest,
      ingredientAnalysis,
    })
  } catch (error) {
    console.error("Error in test-usda API route:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 },
    )
  }
}

