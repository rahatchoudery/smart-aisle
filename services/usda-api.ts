/**
 * USDA FoodData Central API Service
 * Documentation: https://fdc.nal.usda.gov/api-guide.html
 */

// Cache for API responses to minimize calls
const apiCache: Record<string, any> = {}

// USDA API key - you'll need to register for one at https://fdc.nal.usda.gov/api-key-signup.html
const USDA_API_KEY = process.env.USDA_API_KEY || "demo-key" // Replace with your actual key

/**
 * Search for food items in the USDA database
 */
export async function searchFoodItems(query: string, pageSize = 5): Promise<any[]> {
  // Check cache first
  const cacheKey = `search:${query}:${pageSize}`
  if (apiCache[cacheKey]) {
    console.log(`Using cached USDA search results for "${query}"`)
    return apiCache[cacheKey]
  }

  try {
    console.log(`Searching USDA database for "${query}"`)
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(
        query,
      )}&pageSize=${pageSize}&dataType=Foundation,SR%20Legacy,Survey%20(FNDDS)`,
    )

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status}`)
    }

    const data = await response.json()
    const results = data.foods || []

    // Cache the results
    apiCache[cacheKey] = results
    return results
  } catch (error) {
    console.error("Error searching USDA database:", error)
    return []
  }
}

/**
 * Get detailed food data by FDC ID
 */
export async function getFoodDetails(fdcId: string): Promise<any | null> {
  // Check cache first
  const cacheKey = `details:${fdcId}`
  if (apiCache[cacheKey]) {
    console.log(`Using cached USDA food details for ID ${fdcId}`)
    return apiCache[cacheKey]
  }

  try {
    console.log(`Fetching USDA food details for ID ${fdcId}`)
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${USDA_API_KEY}&nutrients=203,204,205,208,291,301,303,304,305,306,307,318,401,601,605,606`,
    )

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status}`)
    }

    const data = await response.json()

    // Cache the results
    apiCache[cacheKey] = data
    return data
  } catch (error) {
    console.error(`Error fetching USDA food details for ID ${fdcId}:`, error)
    return null
  }
}

/**
 * Clear the API cache
 */
export function clearCache(): void {
  Object.keys(apiCache).forEach((key) => {
    delete apiCache[key]
  })
  console.log("USDA API cache cleared")
}

