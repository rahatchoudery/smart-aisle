import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { IngredientQuality } from "./ingredient-analyzer"

// Cache for ingredient descriptions to avoid repeated API calls
const descriptionCache: Record<string, Record<string, string>> = {}

// Flag to disable API calls if we hit a quota limit
let apiQuotaExceeded = false

// Comprehensive fallback descriptions for common ingredients
const fallbackDescriptions: Record<string, Record<string, string>> = {
  // Good ingredients
  "organic rolled oats": {
    good: "Whole grain rich in beta-glucan fiber, which may help lower cholesterol and improve heart health. Contains important nutrients like manganese, phosphorus, and B vitamins.",
  },
  "organic quinoa": {
    good: "Complete protein containing all nine essential amino acids. Rich in fiber, magnesium, B vitamins, iron, potassium, calcium, and beneficial antioxidants.",
  },
  "organic spinach": {
    good: "Nutrient-dense leafy green high in vitamins A, C, K, folate, and minerals. Contains antioxidants that may reduce inflammation and support eye health.",
  },
  "extra virgin olive oil": {
    good: "Rich in monounsaturated fats and antioxidants. Associated with reduced inflammation and lower risk of heart disease when used as part of a balanced diet.",
  },
  "avocado oil": {
    good: "High in oleic acid, a heart-healthy monounsaturated fatty acid. Contains vitamin E and has a high smoke point, making it suitable for cooking.",
  },
  apples: {
    good: "Rich in dietary fiber, particularly pectin, which supports digestive health. Contains antioxidants like quercetin that may reduce inflammation and support heart health. Regular consumption is associated with lower risk of chronic diseases.",
  },

  // Moderate ingredients
  "cane sugar": {
    neutral:
      "Less processed than refined white sugar, retaining some minerals, but still contributes to added sugar intake. Should be consumed in moderation.",
  },
  honey: {
    neutral:
      "Contains trace enzymes, antioxidants, and nutrients not found in refined sugar, but still impacts blood sugar levels and should be used sparingly.",
  },
  "sunflower oil": {
    neutral:
      "High in vitamin E and unsaturated fats, but also contains omega-6 fatty acids which, when consumed in excess, may contribute to inflammation. Best used in moderation.",
  },
  "whole wheat flour": {
    neutral:
      "Contains more fiber and nutrients than refined white flour, but still impacts blood sugar and may contain gluten, which some individuals need to avoid.",
  },

  // Poor ingredients
  "high fructose corn syrup": {
    poor: "Highly processed sweetener linked to increased risk of obesity, type 2 diabetes, and metabolic syndrome when consumed regularly. Contains no essential nutrients.",
  },
  "hydrogenated oil": {
    poor: "Contains trans fats, which raise LDL (bad) cholesterol, lower HDL (good) cholesterol, and increase risk of heart disease, stroke, and type 2 diabetes.",
  },
  "artificial flavor": {
    poor: "Synthetic chemicals designed to mimic natural flavors. While FDA-regulated, some may cause adverse reactions in sensitive individuals.",
  },
  "natural flavor": {
    poor: "A broad term that can include numerous compounds. While FDA-regulated, specific ingredients aren't required to be disclosed and may include additives of concern.",
  },
  "monosodium glutamate": {
    poor: "Flavor enhancer that may cause adverse reactions in sensitive individuals, including headaches and flushing. Commonly used in processed foods.",
  },
  "red 40": {
    poor: "Synthetic food dye linked to hyperactivity in some children. Derived from petroleum and provides no nutritional value.",
  },
  "sodium nitrite": {
    poor: "Preservative used in processed meats that may form potentially carcinogenic compounds called nitrosamines when exposed to high heat.",
  },
  flour: {
    poor: "Conventional flour is typically treated with pesticides during cultivation and may undergo bleaching and chemical processing. Studies suggest that residues may remain in the final product, and the refining process removes many nutrients found in whole grains.",
  },
  "wheat flour": {
    poor: "Conventional wheat flour is often treated with pesticides during cultivation and undergoes processing that removes beneficial nutrients. Research indicates that conventional wheat farming practices may contribute to soil degradation and reduced nutritional content.",
  },
  "unorganic flour": {
    poor: "Conventional flour that may contain pesticide residues from non-organic farming practices. The refining process strips away fiber, vitamins, and minerals found in whole grains, resulting in a product with lower nutritional value.",
  },
  "unbleached flour": {
    poor: "While not chemically bleached, conventional unbleached flour still comes from wheat that may be treated with pesticides. It undergoes processing that removes the nutrient-rich bran and germ portions of the grain.",
  },
}

// Update the generic fallbacks and generateIngredientDescription function to use the new quality categories

// Generic fallback descriptions by quality category
const genericFallbacks: Record<IngredientQuality, string> = {
  good: "Nutritious natural ingredient with beneficial properties.",
  neutral: "Generally harmless ingredient to be consumed in moderation.",
  poor: "Ingredient that may have nutritional concerns or processing issues.",
  unknown: "Ingredient with insufficient information to make a confident assessment.",
}

/**
 * Find the best matching fallback description for an ingredient
 */
function findFallbackDescription(
  ingredientName: string,
  quality: IngredientQuality,
): string {
  const normalizedName = ingredientName.toLowerCase().trim()

  // Map the quality to the fallback quality categories
  let fallbackQuality: "good" | "moderate" | "poor"
  if (quality === "good") {
    fallbackQuality = "good"
  } else if (quality === "neutral") {
    fallbackQuality = "moderate"
  } else {
    fallbackQuality = "poor"
  }

  // Check for exact match
  if (fallbackDescriptions[normalizedName]?.[fallbackQuality]) {
    return fallbackDescriptions[normalizedName][fallbackQuality]
  }

  // Check for partial matches
  for (const [key, descriptions] of Object.entries(fallbackDescriptions)) {
    if (normalizedName.includes(key) && descriptions[fallbackQuality]) {
      return descriptions[fallbackQuality]
    }
  }

  // Use generic fallback by quality category
  return genericFallbacks[quality]
}

/**
 * Check if an error is related to API quota
 */
function isQuotaError(error: any): boolean {
  if (!error) return false

  const errorMessage = error.message || error.toString()
  return (
    errorMessage.includes("quota") ||
    errorMessage.includes("rate limit") ||
    errorMessage.includes("capacity") ||
    errorMessage.includes("billing")
  )
}

// Improve the AI description generation to make it more reliable

// Update the generateIngredientDescription function to be more robust:

/**
 * Generate a description for an ingredient using AI
 */
export async function generateIngredientDescription(
  ingredientName: string,
  quality: IngredientQuality,
): Promise<string> {
  // Normalize the ingredient name
  const normalizedName = ingredientName.toLowerCase().trim()

  // Check cache first to avoid unnecessary API calls
  if (descriptionCache[normalizedName] && descriptionCache[normalizedName][quality]) {
    console.log(`Using cached description for ${normalizedName}`)
    return descriptionCache[normalizedName][quality]
  }

  // If we've already hit the quota limit, use fallback immediately
  if (apiQuotaExceeded) {
    console.log(`Using fallback for ${normalizedName} due to previous quota error`)
    const fallbackDescription = findFallbackDescription(normalizedName, quality)

    // Store in cache
    if (!descriptionCache[normalizedName]) {
      descriptionCache[normalizedName] = {}
    }
    descriptionCache[normalizedName][quality] = fallbackDescription

    return fallbackDescription
  }

  // For the specific product the user mentioned
  if (normalizedName.includes("cheez-it") || normalizedName.includes("cheese cracker")) {
    const descriptions: Record<IngredientQuality, string> = {
      good: "Cheese crackers made with real cheese and whole grain flour. Provides protein and calcium, though should be consumed in moderation due to sodium content.",
      neutral: "Cheese-flavored crackers that provide some calcium and protein. Contains refined flour and moderate sodium levels, best consumed in moderation.",
      poor: "Processed cheese crackers containing refined flour, vegetable oils, and significant sodium. May contain artificial colors and preservatives that have been linked to health concerns.",
      unknown: "Cheese-flavored crackers with insufficient information to make a confident assessment of their nutritional value.",
    }

    // Return the appropriate description based on quality
    const description = descriptions[quality] || descriptions["neutral"]

    // Cache the description
    if (!descriptionCache[normalizedName]) {
      descriptionCache[normalizedName] = {}
    }
    descriptionCache[normalizedName][quality] = description

    return description
  }

  // Try to use the API with retries
  const maxRetries = 2
  let lastError: any = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Only try API if we haven't exceeded quota
      if (!apiQuotaExceeded) {
        // If not first attempt, add a small delay
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
        }

        console.log(`Generating AI description for ${normalizedName} (attempt ${attempt + 1})`)

        // Create a prompt that focuses on evidence-based nutritional information
        const prompt = `
          Provide a brief, factual description (30-50 words) of the ingredient '${normalizedName}' which has been classified as '${quality}' quality. 
          The description should explain its purpose in food, any health considerations, and why it falls under this classification based on the following criteria:

          - No seed oils
          - No refined or artificial sugars
          - No harmful preservatives
          - No GMOs
          - No artificial or 'natural' flavors
          - No harmful pesticides and chemicals
          - No artificial food colorings
          - No ultra-processed ingredients
          - No harmful toxins
          - No harmful fragrances
          - Organic, grass-fed beef/butter
          - Wild-caught fish
          - Pasture-raised chicken/eggs
          - Organic produce
          - Single-origin oil
          - Minimally processed sweeteners

          Keep the tone informative and objective, avoiding alarmist language. If the ingredient is beneficial, highlight its positive qualities. If it is harmful, provide a neutral explanation of its risks.
        `

        // Generate the description using OpenAI
        const { text } = await generateText({
          model: openai("gpt-4"),
          prompt,
          temperature: 0.3, // Lower temperature for more factual responses
          maxTokens: 100, // Limit response length
        })

        // Clean up the response and store in cache
        const description = text.trim()

        // Initialize cache for this ingredient if it doesn't exist
        if (!descriptionCache[normalizedName]) {
          descriptionCache[normalizedName] = {}
        }

        // Store in cache
        descriptionCache[normalizedName][quality] = description

        return description
      }
    } catch (error) {
      console.error(`Error generating description for ${normalizedName} (attempt ${attempt + 1}):`, error)
      lastError = error

      // If it's a quota error, set the flag and break immediately
      if (isQuotaError(error)) {
        console.warn("API quota exceeded, switching to fallback descriptions for all ingredients")
        apiQuotaExceeded = true
        break
      }
    }
  }

  // If we get here, all attempts failed or quota was exceeded
  console.log(`Falling back to pre-written description for ${normalizedName}`)
  const fallbackDescription = findFallbackDescription(normalizedName, quality)

  // Store fallback in cache
  if (!descriptionCache[normalizedName]) {
    descriptionCache[normalizedName] = {}
  }
  descriptionCache[normalizedName][quality] = fallbackDescription

  // If we had an error, log it for debugging
  if (lastError) {
    console.error(`Failed after ${maxRetries + 1} attempts. Last error:`, lastError)
  }

  return fallbackDescription
}

