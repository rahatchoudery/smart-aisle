import { searchFoodItems, getFoodDetails } from "./usda-api"

/**
 * Test utility for the USDA API integration
 */
export async function testUsdaApi(query = "apple"): Promise<{
  success: boolean
  searchResults?: any[]
  detailsResult?: any
  error?: string
}> {
  try {
    console.log(`Testing USDA API with query: "${query}"`)

    // Test search functionality
    const searchResults = await searchFoodItems(query, 3)

    if (!searchResults || searchResults.length === 0) {
      return {
        success: false,
        error: "No search results found. The API key may be invalid or the query returned no results.",
      }
    }

    console.log(`Found ${searchResults.length} results for "${query}"`)

    // Test details functionality with the first result
    const firstResult = searchResults[0]
    console.log(`Getting details for: ${firstResult.description} (FDC ID: ${firstResult.fdcId})`)

    const detailsResult = await getFoodDetails(firstResult.fdcId)

    if (!detailsResult) {
      return {
        success: false,
        searchResults,
        error: "Failed to get food details. The API key may be invalid or the FDC ID is incorrect.",
      }
    }

    console.log("Successfully retrieved food details")

    return {
      success: true,
      searchResults,
      detailsResult,
    }
  } catch (error) {
    console.error("Error testing USDA API:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

