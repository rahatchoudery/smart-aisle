import { searchFoodItems, getFoodDetails } from "./usda-api"

// Types
export interface NutrientProfile {
  calories?: number
  protein?: number
  fat?: number
  saturatedFat?: number
  transFat?: number
  carbs?: number
  sugar?: number
  fiber?: number
  sodium?: number
  vitamins?: Record<string, number>
  minerals?: Record<string, number>
  additives?: string[]
}

export interface IngredientAnalysis {
  name: string
  quality: "very good" | "good" | "neutral" | "poor" | "very poor"
  description: string
  nutrients?: NutrientProfile
  processingLevel?: "minimal" | "moderate" | "high"
  organic?: boolean
  concerns?: string[]
  benefits?: string[]
  fdcId?: string
}

// Cache for ingredient analyses
const analysisCache: Record<string, IngredientAnalysis> = {}

/**
 * Analyze an ingredient using USDA nutritional data
 */
export async function analyzeIngredient(ingredientName: string): Promise<IngredientAnalysis> {
  const name = ingredientName.toLowerCase().trim()

  // Check cache first
  if (analysisCache[name]) {
    return analysisCache[name]
  }

  // Check for organic qualifier
  const isOrganic = name.includes("organic")
  const cleanName = isOrganic ? name.replace("organic", "").trim() : name

  // Apply quick rule-based checks for common problematic ingredients
  if (isHighlyProcessed(name)) {
    const analysis = createAnalysis(name, "poor", isOrganic)
    analysisCache[name] = analysis
    return analysis
  }

  // Search USDA database
  const searchResults = await searchFoodItems(cleanName, 3)

  if (searchResults.length === 0) {
    // No USDA data found, fall back to rule-based analysis
    const analysis = fallbackAnalysis(name, isOrganic)
    analysisCache[name] = analysis
    return analysis
  }

  // Use the first (best) match
  const bestMatch = searchResults[0]

  // Get detailed nutritional data if available
  let detailedData = null
  if (bestMatch.fdcId) {
    detailedData = await getFoodDetails(bestMatch.fdcId)
  }

  // Extract nutrient profile
  const nutrients = extractNutrientProfile(bestMatch, detailedData)

  // Determine processing level
  const processingLevel = determineProcessingLevel(name, bestMatch)

  // Analyze nutritional profile to determine quality
  const { quality, concerns, benefits } = evaluateNutritionalQuality(nutrients, processingLevel, isOrganic)

  // Generate description
  const description = generateDescription(quality, nutrients, processingLevel, isOrganic, concerns, benefits)

  // Create and cache the analysis
  const analysis: IngredientAnalysis = {
    name: ingredientName,
    quality,
    description,
    nutrients,
    processingLevel,
    organic: isOrganic,
    concerns,
    benefits,
    fdcId: bestMatch.fdcId,
  }

  analysisCache[name] = analysis
  return analysis
}

/**
 * Extract nutrient profile from USDA data
 */
function extractNutrientProfile(foodItem: any, detailedData?: any): NutrientProfile {
  const nutrients: NutrientProfile = {
    vitamins: {},
    minerals: {},
    additives: [],
  }

  // Use detailed data if available, otherwise use search result data
  const nutrientData = detailedData?.foodNutrients || foodItem.foodNutrients || []

  // Map nutrient IDs to our profile
  for (const nutrient of nutrientData) {
    const nutrientId = nutrient.nutrientId || nutrient.nutrient?.id
    const value = nutrient.value || nutrient.amount || 0

    switch (nutrientId) {
      case 208: // Energy (kcal)
        nutrients.calories = value
        break
      case 203: // Protein
        nutrients.protein = value
        break
      case 204: // Total lipid (fat)
        nutrients.fat = value
        break
      case 606: // Fatty acids, total saturated
        nutrients.saturatedFat = value
        break
      case 605: // Fatty acids, total trans
        nutrients.transFat = value
        break
      case 205: // Carbohydrate, by difference
        nutrients.carbs = value
        break
      case 269: // Sugars, total including NLEA
        nutrients.sugar = value
        break
      case 291: // Fiber, total dietary
        nutrients.fiber = value
        break
      case 307: // Sodium, Na
        nutrients.sodium = value
        break
      // Vitamins
      case 401: // Vitamin C
        nutrients.vitamins!["C"] = value
        break
      case 318: // Vitamin A
        nutrients.vitamins!["A"] = value
        break
      // Minerals
      case 301: // Calcium
        nutrients.minerals!["calcium"] = value
        break
      case 303: // Iron
        nutrients.minerals!["iron"] = value
        break
      case 304: // Magnesium
        nutrients.minerals!["magnesium"] = value
        break
      case 305: // Phosphorus
        nutrients.minerals!["phosphorus"] = value
        break
      case 306: // Potassium
        nutrients.minerals!["potassium"] = value
        break
    }
  }

  // Check for additives in the ingredient name
  const additiveTerms = [
    "artificial",
    "flavor",
    "color",
    "dye",
    "preservative",
    "sweetener",
    "emulsifier",
    "stabilizer",
    "thickener",
    "msg",
    "nitrate",
    "nitrite",
    "bha",
    "bht",
  ]

  for (const term of additiveTerms) {
    if (foodItem.description?.toLowerCase().includes(term)) {
      nutrients.additives?.push(term)
    }
  }

  return nutrients
}

/**
 * Determine processing level based on food description and category
 */
function determineProcessingLevel(name: string, foodItem: any): "minimal" | "moderate" | "high" {
  // Check for highly processed terms
  const highlyProcessedTerms = [
    "hydrogenated",
    "hydrolyzed",
    "isolate",
    "modified",
    "extract",
    "concentrate",
    "refined",
    "bleached",
    "enriched",
    "fortified",
    "artificial",
    "processed",
  ]

  for (const term of highlyProcessedTerms) {
    if (name.includes(term) || foodItem.description?.toLowerCase().includes(term)) {
      return "high"
    }
  }

  // Check for minimally processed foods
  const minimallyProcessedCategories = ["fresh", "raw", "whole", "natural", "pure", "unprocessed", "organic"]

  for (const category of minimallyProcessedCategories) {
    if (name.includes(category) || foodItem.description?.toLowerCase().includes(category)) {
      return "minimal"
    }
  }

  // Default to moderate processing
  return "moderate"
}

/**
 * Evaluate nutritional quality based on nutrient profile
 */
function evaluateNutritionalQuality(
  nutrients: NutrientProfile,
  processingLevel: "minimal" | "moderate" | "high",
  isOrganic: boolean,
): { quality: "very good" | "good" | "neutral" | "poor" | "very poor"; concerns: string[]; benefits: string[] } {
  const concerns: string[] = []
  const benefits: string[] = []

  // Check for nutritional concerns
  if (nutrients.sugar && nutrients.sugar > 10) {
    concerns.push("high sugar content")
  }

  if (nutrients.sodium && nutrients.sodium > 400) {
    concerns.push("high sodium content")
  }

  if (nutrients.saturatedFat && nutrients.saturatedFat > 5) {
    concerns.push("high saturated fat")
  }

  if (nutrients.transFat && nutrients.transFat > 0) {
    concerns.push("contains trans fats")
  }

  if (nutrients.additives && nutrients.additives.length > 0) {
    concerns.push(`contains additives: ${nutrients.additives.join(", ")}`)
  }

  // Check for nutritional benefits
  if (nutrients.fiber && nutrients.fiber > 3) {
    benefits.push("good source of fiber")
  }

  if (nutrients.protein && nutrients.protein > 5) {
    benefits.push("good source of protein")
  }

  // Check vitamins and minerals
  const hasVitamins = nutrients.vitamins && Object.keys(nutrients.vitamins).length > 0
  const hasMinerals = nutrients.minerals && Object.keys(nutrients.minerals).length > 0

  if (hasVitamins) {
    benefits.push("contains essential vitamins")
  }

  if (hasMinerals) {
    benefits.push("contains essential minerals")
  }

  // Determine quality based on benefits, concerns, and processing level
  let quality: "very good" | "good" | "neutral" | "poor" | "very poor"

  if (processingLevel === "high" && concerns.length > 2) {
    quality = "very poor"
  } else if (processingLevel === "high" || concerns.length > 1) {
    quality = "poor"
  } else if (processingLevel === "minimal" && benefits.length > 1) {
    quality = isOrganic ? "very good" : "good"
  } else if (benefits.length > 0) {
    quality = "good"
  } else {
    quality = "neutral"
  }

  // Organic boost
  if (isOrganic && quality === "neutral") {
    quality = "good"
  } else if (isOrganic && quality === "poor") {
    quality = "neutral"
  }

  return { quality, concerns, benefits }
}

/**
 * Generate a description based on the analysis
 */
function generateDescription(
  quality: "very good" | "good" | "neutral" | "poor" | "very poor",
  nutrients: NutrientProfile,
  processingLevel: "minimal" | "moderate" | "high",
  isOrganic: boolean,
  concerns: string[],
  benefits: string[],
): string {
  let description = ""

  // Base description by quality
  switch (quality) {
    case "very good":
      description = "Highly nutritious ingredient with significant health benefits."
      break
    case "good":
      description = "Nutritious ingredient with beneficial properties."
      break
    case "neutral":
      description = "Generally harmless ingredient without significant health benefits or concerns."
      break
    case "poor":
      description = "Ingredient with some nutritional or processing concerns."
      break
    case "very poor":
      description = "Highly processed ingredient with significant health concerns."
      break
  }

  // Add processing level
  if (processingLevel === "minimal") {
    description += " Minimally processed."
  } else if (processingLevel === "high") {
    description += " Highly processed."
  }

  // Add organic status
  if (isOrganic) {
    description += " Organic certification indicates absence of synthetic pesticides and fertilizers."
  }

  // Add benefits
  if (benefits.length > 0) {
    description += ` Benefits: ${benefits.slice(0, 2).join("; ")}.`
  }

  // Add concerns
  if (concerns.length > 0) {
    description += ` Concerns: ${concerns.slice(0, 2).join("; ")}.`
  }

  return description
}

/**
 * Check if an ingredient is likely highly processed
 */
function isHighlyProcessed(name: string): boolean {
  const highlyProcessedTerms = [
    "hydrogenated",
    "high fructose corn syrup",
    "artificial flavor",
    "artificial color",
    "msg",
    "sodium nitrate",
    "sodium nitrite",
    "bha",
    "bht",
    "tbhq",
    "propyl gallate",
    "potassium bromate",
    "brominated",
    "interesterified",
    "partially hydrogenated",
  ]

  return highlyProcessedTerms.some((term) => name.includes(term))
}

/**
 * Fallback analysis when USDA data is not available
 */
function fallbackAnalysis(name: string, isOrganic: boolean): IngredientAnalysis {
  // Simple rule-based classification
  let quality: "very good" | "good" | "neutral" | "poor" | "very poor" = "neutral"
  const concerns: string[] = []
  const benefits: string[] = []

  // Check for problematic terms
  const problematicTerms = {
    artificial: "contains artificial ingredients",
    flavor: "may contain undisclosed compounds",
    color: "contains food coloring",
    dye: "contains synthetic dyes",
    syrup: "may contain added sugars",
    sugar: "contains added sugar",
    hydrogenated: "contains trans fats",
    modified: "highly processed",
    msg: "contains flavor enhancer",
    "sodium nitrate": "contains preservatives linked to health concerns",
    "sodium nitrite": "contains preservatives linked to health concerns",
  }

  // Check for beneficial terms
  const beneficialTerms = {
    "whole grain": "contains whole grains",
    "whole wheat": "contains whole grains",
    fiber: "source of dietary fiber",
    protein: "source of protein",
    vitamin: "contains vitamins",
    mineral: "contains minerals",
    antioxidant: "contains antioxidants",
    probiotic: "contains beneficial bacteria",
    "omega-3": "contains healthy fats",
  }

  // Check for problematic terms
  for (const [term, concern] of Object.entries(problematicTerms)) {
    if (name.includes(term)) {
      concerns.push(concern)
    }
  }

  // Check for beneficial terms
  for (const [term, benefit] of Object.entries(beneficialTerms)) {
    if (name.includes(term)) {
      benefits.push(benefit)
    }
  }

  // Determine quality based on concerns and benefits
  if (concerns.length > 2) {
    quality = "poor"
  } else if (concerns.length > 0) {
    quality = "neutral"
  } else if (benefits.length > 1) {
    quality = "good"
  } else if (benefits.length > 0) {
    quality = "neutral"
  }

  // Organic boost
  if (isOrganic && quality === "neutral") {
    quality = "good"
  } else if (isOrganic && quality === "good") {
    quality = "very good"
  } else if (isOrganic && quality === "poor") {
    quality = "neutral"
  }

  // Generate description
  let description = ""

  switch (quality) {
    case "very good":
      description = "Highly nutritious ingredient with significant health benefits."
      break
    case "good":
      description = "Nutritious ingredient with beneficial properties."
      break
    case "neutral":
      description = "Generally harmless ingredient without significant health benefits or concerns."
      break
    case "poor":
      description = "Ingredient with some nutritional or processing concerns."
      break
    case "very poor":
      description = "Highly processed ingredient with significant health concerns."
      break
  }

  if (isOrganic) {
    description += " Organic certification indicates absence of synthetic pesticides and fertilizers."
  }

  if (benefits.length > 0) {
    description += ` Benefits: ${benefits.slice(0, 2).join("; ")}.`
  }

  if (concerns.length > 0) {
    description += ` Concerns: ${concerns.slice(0, 2).join("; ")}.`
  }

  return {
    name,
    quality,
    description,
    organic: isOrganic,
    concerns,
    benefits,
    processingLevel: concerns.length > 1 ? "high" : isOrganic ? "minimal" : "moderate",
  }
}

/**
 * Create a basic analysis object
 */
function createAnalysis(
  name: string,
  quality: "very good" | "good" | "neutral" | "poor" | "very poor",
  isOrganic: boolean,
): IngredientAnalysis {
  let description = ""

  switch (quality) {
    case "very good":
      description = "Highly nutritious ingredient with significant health benefits."
      break
    case "good":
      description = "Nutritious ingredient with beneficial properties."
      break
    case "neutral":
      description = "Generally harmless ingredient without significant health benefits or concerns."
      break
    case "poor":
      description = "Ingredient with some nutritional or processing concerns."
      break
    case "very poor":
      description = "Highly processed ingredient with significant health concerns."
      break
  }

  if (isOrganic) {
    description += " Organic certification indicates absence of synthetic pesticides and fertilizers."
  }

  return {
    name,
    quality,
    description,
    organic: isOrganic,
    processingLevel: quality === "poor" || quality === "very poor" ? "high" : isOrganic ? "minimal" : "moderate",
  }
}

