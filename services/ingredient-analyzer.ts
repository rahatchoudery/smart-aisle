import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

/**
 * Rule-based ingredient analyzer
 * This is the primary analyzer used for ingredient quality assessment
 */
// Define the criteria for ingredient analysis
export interface IngredientCriteria {
  name: string
  description: string
  severity: "low" | "medium" | "high"
  weight: number
}

export const healthCriteria: IngredientCriteria[] = [
  {
    name: "organic",
    description: "Organic certification indicates absence of synthetic pesticides and fertilizers",
    severity: "high",
    weight: 10
  },
  {
    name: "seed_oils",
    description: "Contains seed oils which may promote inflammation",
    severity: "high",
    weight: 10
  },
  {
    name: "refined_sugars",
    description: "Contains refined sugars which can impact blood sugar levels",
    severity: "high",
    weight: 10
  },
  {
    name: "preservatives",
    description: "Contains preservatives that may have health implications",
    severity: "high",
    weight: 10
  },
  {
    name: "gmo",
    description: "May be genetically modified",
    severity: "high",
    weight: 10
  },
  {
    name: "artificial_flavors",
    description: "Contains artificial or 'natural' flavors",
    severity: "high",
    weight: 10
  },
  {
    name: "pesticides",
    description: "May contain pesticide residues",
    severity: "high",
    weight: 10
  },
  {
    name: "food_colorings",
    description: "Contains artificial food colorings",
    severity: "high",
    weight: 10
  },
  {
    name: "ultra_processed",
    description: "Is highly processed",
    severity: "high",
    weight: 10
  },
  {
    name: "toxins",
    description: "May contain potentially harmful compounds",
    severity: "high",
    weight: 10
  },
  {
    name: "fragrances",
    description: "Contains added fragrances",
    severity: "high",
    weight: 10
  }
]

// Define processing levels and their characteristics
const processingLevels = {
  "minimal": {
    keywords: ["raw", "fresh", "whole", "unprocessed", "natural"],
    patterns: [
      /^whole\s+/,
      /^raw\s+/,
      /^fresh\s+/,
      /^organic\s+/
    ]
  },
  "lightly_processed": {
    keywords: ["dried", "frozen", "canned", "jarred", "fermented"],
    patterns: [
      /^dried\s+/,
      /^frozen\s+/,
      /^canned\s+/,
      /^jarred\s+/,
      /^fermented\s+/
    ]
  },
  "processed": {
    keywords: ["refined", "enriched", "fortified", "bleached", "bromated"],
    patterns: [
      /^refined\s+/,
      /^enriched\s+/,
      /^fortified\s+/,
      /^bleached\s+/,
      /^bromated\s+/
    ]
  },
  "ultra_processed": {
    keywords: ["hydrogenated", "modified", "isolated", "hydrolyzed", "artificial"],
    patterns: [
      /^hydrogenated\s+/,
      /^partially\s+hydrogenated\s+/,
      /^modified\s+/,
      /^isolated\s+/,
      /^hydrolyzed\s+/,
      /^artificial\s+/
    ]
  }
}

// Define additive categories
const additiveCategories = {
  "preservatives": {
    patterns: [
      /bha|bht|tbhq|nitrite|nitrate|benzoate|sorbate|propionate|erythorbate|gallate|paraben/i
    ]
  },
  "artificial_colors": {
    patterns: [
      /red\s*40|yellow\s*5|yellow\s*6|blue\s*1|blue\s*2|green\s*3|artificial\s*color|color\s*added/i
    ]
  },
  "artificial_flavors": {
    patterns: [
      /artificial\s*flavor|natural\s*flavor|flavoring|extract/i
    ]
  },
  "sweeteners": {
    patterns: [
      /sugar|syrup|hfcs|aspartame|sucralose|acesulfame|saccharin|neotame|advantame/i
    ]
  },
  "thickeners": {
    patterns: [
      /gum|starch|cellulose|carrageenan|xanthan|guar/i
    ]
  }
}

// Define nutrient density indicators
const nutrientDensityIndicators = {
  "high": {
    keywords: ["whole", "organic", "wild", "grass-fed", "pasture-raised"],
    patterns: [
      /^whole\s+/,
      /^organic\s+/,
      /^wild\s+/,
      /^grass-fed\s+/,
      /^pasture-raised\s+/
    ]
  },
  "medium": {
    keywords: ["fresh", "raw", "natural", "unprocessed"],
    patterns: [
      /^fresh\s+/,
      /^raw\s+/,
      /^natural\s+/,
      /^unprocessed\s+/
    ]
  },
  "low": {
    keywords: ["refined", "processed", "artificial", "synthetic"],
    patterns: [
      /^refined\s+/,
      /^processed\s+/,
      /^artificial\s+/,
      /^synthetic\s+/
    ]
  }
}

// Define lists for each quality category
const veryGoodIngredients = [
  // Organic qualifiers
  "organic",
  "certified organic",

  // Quality animal products
  "grass-fed",
  "grass fed",
  "pasture-raised",
  "pasture raised",
  "wild-caught",
  "wild caught",
  "free-range",
  "free range",
  "grass-fed beef",
  "grass-fed butter",
  "wild-caught fish",
  "pasture-raised chicken",
  "pasture-raised eggs",

  // Quality oils
  "extra virgin olive oil",
  "olive oil",
  "avocado oil",
  "coconut oil",
  "single-origin oil",

  // Minimally processed sweeteners
  "raw honey",
  "maple syrup",
  "coconut sugar",
  "date sugar",
  "monk fruit",

  // Organic produce and grains
  "organic produce",
  "organic grains",
  "organic vegetables",
  "organic fruits",
  "organic quinoa",
  "organic oats",
  "organic rice",
  "organic wheat",
  "organic flour",
  "organic corn",
  "organic beans",
  "organic lentils",
  "organic nuts",
  "organic seeds",
]

const goodIngredients = [
  // Non-organic but still whole foods
  "quinoa",
  "oats",
  "rice",
  "wheat",
  "flour",
  "corn",
  "beans",
  "lentils",
  "nuts",
  "seeds",
  "vegetables",
  "fruits",
  "eggs",
  "milk",
  "yogurt",
  "cheese",
  "beef",
  "chicken",
  "fish",
  "turkey",
  "lamb",
  "pork",
  "tofu",
  "tempeh",
  "seitan",
  "whole grain",
  "whole wheat",
]

const neutralIngredients = [
  // Spices and herbs
  "salt",
  "pepper",
  "cinnamon",
  "turmeric",
  "ginger",
  "garlic",
  "onion",
  "basil",
  "oregano",
  "thyme",
  "rosemary",
  "parsley",
  "cilantro",
  "cumin",
  "paprika",
  "cayenne",
  "nutmeg",
  "cloves",
  "cardamom",
  "coriander",
  "dill",
  "mint",
  "sage",
  "bay leaf",
  "vanilla",
  "cacao",
  "cocoa",
  "spices",
  "herbs",

  // Baking ingredients
  "baking soda",
  "baking powder",
  "cream of tartar",
  "yeast",
  "sea salt",
  "himalayan salt",
  "celtic salt",
  "vinegar",
  "apple cider vinegar",
  "lemon juice",
  "lime juice",
]

const poorIngredients = [
  // Refined sugars
  "sugar",
  "cane sugar",
  "brown sugar",
  "white sugar",
  "powdered sugar",
  "confectioners sugar",
  "turbinado sugar",
  "raw sugar",
  "corn syrup",
  "glucose",
  "fructose",
  "dextrose",
  "maltose",
  "sucrose",

  // Refined flours
  "white flour",
  "enriched flour",
  "bleached flour",
  "all-purpose flour",
  "flour",
  "wheat flour",
  "unbleached flour",
  "unorganic flour",

  // Seed oils
  "vegetable oil",
  "canola oil",
  "soybean oil",
  "corn oil",
  "sunflower oil",
  "safflower oil",
  "cottonseed oil",
  "grapeseed oil",
  "rice bran oil",
  "palm kernel oil",

  // Additives
  "natural flavor",
  "natural flavors",
  "natural flavoring",
  "natural flavorings",
]

const veryPoorIngredients = [
  // Artificial sweeteners
  "high fructose corn syrup",
  "corn syrup solids",
  "aspartame",
  "sucralose",
  "saccharin",
  "acesulfame",
  "neotame",
  "advantame",

  // Artificial flavors
  "artificial flavor",
  "artificial flavors",
  "artificial flavoring",
  "artificial flavorings",

  // Artificial colors
  "artificial color",
  "artificial colors",
  "red 40",
  "yellow 5",
  "yellow 6",
  "blue 1",
  "blue 2",
  "green 3",
  "red dye",
  "yellow dye",
  "blue dye",
  "caramel color",
  "color added",

  // Preservatives
  "bha",
  "bht",
  "tbhq",
  "sodium nitrite",
  "sodium nitrate",
  "sodium benzoate",
  "potassium sorbate",
  "calcium propionate",
  "sodium erythorbate",
  "propyl gallate",
  "propylene glycol",
  "sodium phosphate",
  "calcium disodium edta",
  "propylparaben",

  // Ultra-processed ingredients
  "hydrogenated",
  "partially hydrogenated",
  "interesterified",
  "modified food starch",
  "modified corn starch",
  "textured vegetable protein",
  "isolated soy protein",
  "soy protein isolate",
  "whey protein isolate",
  "hydrolyzed",
  "hydrolyzed protein",
  "maltodextrin",
  "dextrin",

  // GMO indicators
  "gmo",
  "genetically modified",
  "genetically engineered",

  // Toxins
  "aluminum",
  "brominated",
  "brominated vegetable oil",
  "potassium bromate",
  "titanium dioxide",
  "silicon dioxide",
  "carrageenan",
  "monosodium glutamate",
  "msg",

  // Fragrances
  "fragrance",
  "parfum",
  "perfume",
  "aroma",
  "scent",
]

// Add a comprehensive list of fruits to detect
const fruitsList = [
  "apple",
  "apricot",
  "avocado",
  "banana",
  "berry",
  "blackberry",
  "blueberry",
  "cantaloupe",
  "cherry",
  "citrus",
  "coconut",
  "cranberry",
  "date",
  "dragonfruit",
  "durian",
  "elderberry",
  "fig",
  "fruit",
  "grape",
  "grapefruit",
  "guava",
  "honeydew",
  "jackfruit",
  "kiwi",
  "kumquat",
  "lemon",
  "lime",
  "lychee",
  "mango",
  "melon",
  "nectarine",
  "orange",
  "papaya",
  "passion fruit",
  "peach",
  "pear",
  "persimmon",
  "pineapple",
  "plum",
  "pomegranate",
  "pomelo",
  "quince",
  "raspberry",
  "strawberry",
  "tangerine",
  "watermelon",
]

// Non-ingredient phrases to filter out
export const nonIngredientPhrases = [
  "contains 2% or less of",
  "contains 2 percent or less of",
  "contains less than 2% of",
  "contains less than 2 percent of",
  "2% or less of",
  "2 percent or less of",
  "less than 2% of",
  "less than 2 percent of",
  "may contain",
  "contains",
  "ingredients:",
  "ingredient list:",
  "manufactured in a facility that also processes",
  "manufactured on equipment that processes",
  "made in a facility that also processes",
  "made on equipment that processes",
  "processed in a facility that also handles",
  "for color",
  "for freshness",
  "as a preservative",
  "to preserve freshness",
  "to maintain color",
  "to maintain freshness",
  "added for freshness",
  "added for color",
  "added as a preservative",
]

// Cache for ingredient analysis to avoid repeated processing
const analysisCache: Record<string, IngredientAnalysis> = {}

// Flag to disable API calls if we hit a quota limit
const apiQuotaExceeded = false

// Add a type for the criteria results
export type CriteriaResult = {
  organic: boolean
  seed_oils: boolean
  refined_sugars: boolean
  preservatives: boolean
  gmo: boolean
  artificial_flavors: boolean
  pesticides: boolean
  food_colorings: boolean
  ultra_processed: boolean
  toxins: boolean
  fragrances: boolean
}

// Update the IngredientAnalysis interface to use the new type
export interface IngredientAnalysis {
  name: string
  quality: "good" | "neutral" | "poor" | "unknown"
  description: string
  processing_level: "minimal" | "moderate" | "high"
  criteriaResults: CriteriaResult
  failedCriteria: string[]
  passedCriteria: string[]
}

// Define type for ingredient quality
export type IngredientQuality = "good" | "neutral" | "poor" | "unknown"

// Define type for ingredient
export interface Ingredient {
  name: string
  quality: IngredientQuality
  description: string
  analysis?: IngredientAnalysis
}

// Define type for quality criteria
interface QualityCriteria {
  keywords: string[]
  weight: number
}

// Define type for quality criteria map
type QualityCriteriaMap = {
  [K in IngredientQuality]: QualityCriteria
}

/**
 * Clean up ingredient text by removing common annotations and formatting
 */
export function cleanIngredientText(text: string): string {
  let cleaned = text.trim()

  // Remove parenthetical descriptions
  cleaned = cleaned.replace(/$$[^)]*$$/g, "").trim()

  // Remove asterisks and other common annotation markers
  cleaned = cleaned.replace(/\*/g, "").trim()

  // Remove percentage indicators
  cleaned = cleaned.replace(/\d+(\.\d+)?%/g, "").trim()

  return cleaned
}

/**
 * Check if a string is a non-ingredient phrase
 */
export function isNonIngredient(text: string): boolean {
  const lowerText = text.toLowerCase().trim()
  return nonIngredientPhrases.some((phrase) => lowerText === phrase || lowerText.startsWith(phrase))
}

// Update the quality criteria with stricter rules
const qualityCriteria: QualityCriteriaMap = {
  "good": {
    keywords: [
      // Organic qualifiers
      "organic",
      "certified organic",

      // Quality animal products
      "grass-fed",
      "grass fed",
      "pasture-raised",
      "pasture raised",
      "wild-caught",
      "wild caught",
      "free-range",
      "free range",
      "grass-fed beef",
      "grass-fed butter",
      "wild-caught fish",
      "pasture-raised chicken",
      "pasture-raised eggs",

      // Quality oils
      "extra virgin olive oil",
      "olive oil",
      "avocado oil",
      "coconut oil",
      "single-origin oil",

      // Minimally processed sweeteners
      "raw honey",
      "maple syrup",
      "coconut sugar",
      "date sugar",
      "monk fruit",

      // Organic produce and grains
      "organic produce",
      "organic grains",
      "organic vegetables",
      "organic fruits",
      "organic quinoa",
      "organic oats",
      "organic rice",
      "organic wheat",
      "organic flour",
      "organic corn",
      "organic beans",
      "organic lentils",
      "organic nuts",
      "organic seeds",
    ],
    weight: 1.0,
  },
  "neutral": {
    keywords: [
      // Spices and herbs
      "salt",
      "pepper",
      "cinnamon",
      "turmeric",
      "ginger",
      "garlic",
      "onion",
      "basil",
      "oregano",
      "thyme",
      "rosemary",
      "parsley",
      "cilantro",
      "cumin",
      "paprika",
      "cayenne",
      "nutmeg",
      "cloves",
      "cardamom",
      "coriander",
      "dill",
      "mint",
      "sage",
      "bay leaf",
      "vanilla",
      "cacao",
      "cocoa",
      "spices",
      "herbs",

      // Basic cooking ingredients
      "baking soda",
      "baking powder",
      "cream of tartar",
      "yeast",
      "sea salt",
      "himalayan salt",
      "celtic salt",
      "vinegar",
      "apple cider vinegar",
      "lemon juice",
      "lime juice",
    ],
    weight: 0.5,
  },
  "poor": {
    keywords: [
      // Everything else is poor by default
      "*"
    ],
    weight: 0.0,
  },
  "unknown": {
    keywords: ["*"], // Catch-all for ingredients not matching other criteria
    weight: 0.3, // Neutral weight for unknown ingredients
  },
}

// Cache for OpenAI ingredient analysis
const openAIAnalysisCache: Record<string, IngredientAnalysis> = {}

/**
 * Analyze an ingredient using OpenAI
 */
async function analyzeIngredientWithOpenAI(ingredientName: string): Promise<IngredientAnalysis> {
  // Check cache first
  if (openAIAnalysisCache[ingredientName]) {
    return openAIAnalysisCache[ingredientName]
  }

  try {
    const prompt = `
      Analyze the following ingredient and categorize it as "good", "neutral", "poor", or "unknown" based on these criteria:

      "good" ingredients are:
      - Whole, unprocessed foods (fruits, vegetables, whole grains, nuts, seeds, legumes)
      - Organic, grass-fed, pasture-raised, or wild-caught ingredients
      - Natural, minimally processed ingredients without harmful additives
      - Traditional cooking ingredients (herbs, spices, natural sweeteners)

      "neutral" ingredients are:
      - Basic cooking ingredients (salt, pepper, herbs, spices)
      - Common baking ingredients (baking soda, baking powder, yeast)
      - Natural acids (vinegar, lemon juice)
      - Minimally processed ingredients with no significant health concerns

      "poor" ingredients are:
      - Contains any harmful ingredients (seed oils, refined sugars, artificial additives)
      - Highly processed or refined ingredients
      - Artificial additives or preservatives
      - GMO ingredients
      - Ingredients with known health concerns

      "unknown" ingredients are:
      - Ingredients that don't clearly fit into other categories
      - Ingredients with insufficient information to make a confident assessment
      - Ingredients that could be either good or neutral depending on their source/processing

      Ingredient to analyze: "${ingredientName}"

      Respond in JSON format with:
      {
        "quality": "good" | "neutral" | "poor" | "unknown",
        "description": "Brief explanation of why this ingredient falls into this category",
        "processing_level": "minimal" | "moderate" | "high",
        "criteriaResults": {
          "organic": boolean,
          "seed_oils": boolean,
          "refined_sugars": boolean,
          "preservatives": boolean,
          "gmo": boolean,
          "artificial_flavors": boolean,
          "pesticides": boolean,
          "food_colorings": boolean,
          "ultra_processed": boolean,
          "toxins": boolean,
          "fragrances": boolean
        }
      }
    `

    const { text } = await generateText({
      model: openai("gpt-4"),
      prompt,
      temperature: 0.3,
      maxTokens: 300,
    })

    // Parse the response
    const analysis = JSON.parse(text) as IngredientAnalysis
    analysis.name = ingredientName

    // Cache the result
    openAIAnalysisCache[ingredientName] = analysis

    return analysis
  } catch (error) {
    console.error("Error analyzing ingredient with OpenAI:", error)
    // Return a neutral analysis if OpenAI fails
    return createAnalysis(ingredientName, "unknown", false)
  }
}

/**
 * Analyze an ingredient using either OpenAI or rule-based system
 */
export async function analyzeIngredient(ingredientName: string): Promise<IngredientAnalysis> {
  // If API quota is exceeded, use rule-based system
  if (apiQuotaExceeded) {
    return createAnalysis(ingredientName, "unknown", false)
  }

  try {
    return await analyzeIngredientWithOpenAI(ingredientName)
  } catch (error) {
    console.error(`Error in analyzeIngredient for "${ingredientName}":`, error)
    return createAnalysis(ingredientName, "unknown", false)
  }
}

// Add rate limiting configuration
const RATE_LIMIT = {
  requestsPerMinute: 30,
  delayBetweenRequests: 2000, // 2 seconds
}

// Add batch processing configuration
const BATCH_CONFIG = {
  maxBatchSize: 5,
  delayBetweenBatches: 1000, // 1 second
}

// Add a queue for rate limiting
let requestQueue: Promise<any>[] = []
let lastRequestTime = 0

/**
 * Rate-limited API call wrapper
 */
async function rateLimitedCall<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  const delayNeeded = RATE_LIMIT.delayBetweenRequests - timeSinceLastRequest

  if (delayNeeded > 0) {
    await new Promise(resolve => setTimeout(resolve, delayNeeded))
  }

  lastRequestTime = Date.now()
  return fn()
}

/**
 * Process ingredients in batches
 */
async function processBatch(ingredients: string[]): Promise<IngredientAnalysis[]> {
  const batchPromises = ingredients.map(ingredientName =>
    rateLimitedCall(() => analyzeIngredientWithOpenAI(ingredientName))
  )
  
  return Promise.all(batchPromises)
}

/**
 * Batch analyze multiple ingredients at once
 */
export async function batchAnalyzeIngredients(ingredientNames: string[]): Promise<Record<string, IngredientAnalysis>> {
  const results: Record<string, IngredientAnalysis> = {}
  const batches: string[][] = []
  
  // Split ingredients into batches
  for (let i = 0; i < ingredientNames.length; i += BATCH_CONFIG.maxBatchSize) {
    batches.push(ingredientNames.slice(i, i + BATCH_CONFIG.maxBatchSize))
  }
  
  // Process each batch
  for (const batch of batches) {
    const batchResults = await processBatch(batch)
    batchResults.forEach(analysis => {
      results[analysis.name] = analysis
    })
    
    // Add delay between batches
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.delayBetweenBatches))
    }
  }

  return results
}

/**
 * Parse ingredient text into a clean list of ingredients
 */
export function parseIngredientText(text: string): string[] {
  if (!text) return []

  // Replace common separators with commas
  const normalizedText = text
    .replace(/\s*\|\s*/g, ", ") // Replace pipe separators
    .replace(/\s*;\s*/g, ", ") // Replace semicolons
    .replace(/\s*\.\s*/g, ", ") // Replace periods
    .replace(/\s*•\s*/g, ", ") // Replace bullet points
    .replace(/\s*-\s*/g, ", ") // Replace hyphens used as separators

  // Split by commas
  const rawIngredients = normalizedText
    .split(",")
    .map((i) => i.trim())
    .filter((i) => i.length > 0)

  // Filter out non-ingredient phrases and clean up the text
  return rawIngredients
    .filter((ing) => !isNonIngredient(ing))
    .map((ing) => cleanIngredientText(ing))
    .filter((ing) => ing.length > 0)
}

// Update the scoring system to be more strict
export function calculateHealthScoreFromIngredients(ingredients: Ingredient[]): number {
  let score = 100 // Start with a perfect score

  // Calculate weighted average of ingredient qualities
  const totalWeight = ingredients.reduce((sum, ing) => {
    const quality = ing.quality
    const weight = qualityCriteria[quality].weight
    return sum + weight
  }, 0)

  if (totalWeight === 0) return 0 // If all ingredients are very poor

  const averageWeight = totalWeight / ingredients.length

  // Deduct points based on the average quality
  if (averageWeight < 0.2) {
    score -= 50 // Poor average
  } else if (averageWeight < 0.4) {
    score -= 30 // Neutral average
  } else if (averageWeight < 0.6) {
    score -= 15 // Mixed average (including unknown)
  } else if (averageWeight < 0.8) {
    score -= 5 // Good average
  }
  // Very good average gets no deduction

  // Additional deductions for poor ingredients only
  const poorCount = ingredients.filter((ing) => ing.quality === "poor").length
  if (poorCount > 0) {
    score -= poorCount * 10 // Deduct 10 points for each poor ingredient
  }

  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)))
}

function createAnalysis(
  name: string,
  quality: "good" | "neutral" | "poor" | "unknown",
  isOrganic: boolean,
): IngredientAnalysis {
  const criteriaResults: Record<string, boolean> = {}
  healthCriteria.forEach((criterion) => {
    criteriaResults[criterion.name] = true
  })

  // Mark criteria as failed based on ingredient quality
  if (quality === "poor") {
    if (name.includes("sugar") || name.includes("syrup")) {
      criteriaResults["refined_sugars"] = false
    }
    if (name.includes("oil") && !name.includes("olive") && !name.includes("avocado") && !name.includes("coconut")) {
      criteriaResults["seed_oils"] = false
    }
    if (name.includes("flavor")) {
      criteriaResults["artificial_flavors"] = false
    }
    if (name.includes("color") || name.includes("dye")) {
      criteriaResults["food_colorings"] = false
    }
    if (name.includes("hydrogenated") || name.includes("modified") || name.includes("isolate")) {
      criteriaResults["ultra_processed"] = false
    }
    if (name.includes("bha") || name.includes("bht") || name.includes("nitrite") || name.includes("benzoate")) {
      criteriaResults["preservatives"] = false
    }
    if (name.includes("gmo") || name.includes("genetically")) {
      criteriaResults["gmo"] = false
    }
    if (name.includes("aluminum") || name.includes("titanium") || name.includes("msg")) {
      criteriaResults["toxins"] = false
    }
    if (name.includes("fragrance") || name.includes("parfum") || name.includes("aroma")) {
      criteriaResults["fragrances"] = false
    }
  }

  if (!isOrganic) {
    criteriaResults["pesticides"] = false
    criteriaResults["gmo"] = false
  }

  const failedCriteria = Object.entries(criteriaResults)
    .filter(([_, passed]) => !passed)
    .map(([key, _]) => key)

  const passedCriteria = Object.entries(criteriaResults)
    .filter(([_, passed]) => passed)
    .map(([key, _]) => key)

  let description = ""
    switch (quality) {
      case "good":
      description = "Nutritious ingredient with beneficial properties."
        break
      case "neutral":
        description = "Generally harmless ingredient without significant health benefits or concerns."
        break
      case "poor":
        description = "Ingredient with some nutritional or processing concerns."
        break
      case "unknown":
        description = "Ingredient with insufficient information to confidently categorize."
        break
    }

  if (isOrganic) {
    description += " Organic certification indicates absence of synthetic pesticides and fertilizers."
  }

  // Determine processing level based on quality and criteria
  let processing_level: "minimal" | "moderate" | "high" = "moderate"
  if (quality === "good" && isOrganic) {
    processing_level = "minimal"
  } else if (quality === "poor" || criteriaResults["ultra_processed"] === false) {
    processing_level = "high"
  }

  return {
    name,
    quality,
    description,
    processing_level,
    criteriaResults: {
      organic: criteriaResults["organic"],
      seed_oils: criteriaResults["seed_oils"],
      refined_sugars: criteriaResults["refined_sugars"],
      preservatives: criteriaResults["preservatives"],
      gmo: criteriaResults["gmo"],
      artificial_flavors: criteriaResults["artificial_flavors"],
      pesticides: criteriaResults["pesticides"],
      food_colorings: criteriaResults["food_colorings"],
      ultra_processed: criteriaResults["ultra_processed"],
      toxins: criteriaResults["toxins"],
      fragrances: criteriaResults["fragrances"],
    },
    failedCriteria,
    passedCriteria,
  }
}

// Update analyzeIngredientsList to use batch processing
async function analyzeIngredientsList(ingredientsList: string[]): Promise<Ingredient[]> {
  try {
    // Process ingredients in batches
    const analyses = await batchAnalyzeIngredients(ingredientsList)
    
    // Convert analyses to ingredients
    return ingredientsList.map(ingredientName => {
      const analysis = analyses[ingredientName]
      if (analysis) {
        return {
          name: ingredientName,
          quality: analysis.quality,
          description: analysis.description,
          analysis: analysis,
        }
      }
      
      // Fallback for failed analyses
  return {
        name: ingredientName,
        quality: "unknown",
        description: "Insufficient data to analyze this ingredient.",
      }
    })
  } catch (error) {
    console.error("Error in batch ingredient analysis:", error)
    
    // Fallback to basic entries if batch processing fails
    return ingredientsList.map(ingredientName => ({
      name: ingredientName,
      quality: "unknown",
      description: "Unable to analyze this ingredient at this time.",
    }))
  }
}

// Export the analyzeIngredientsList function
export { analyzeIngredientsList }

