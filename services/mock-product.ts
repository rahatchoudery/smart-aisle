import type { Product, Ingredient } from "./product-api"

// Update the mock ingredients to use the new quality categories

// Mock ingredients with evidence-based descriptions
const mockIngredients: Ingredient[] = [
  {
    name: "Organic Rolled Oats",
    quality: "good",
    description:
      "Whole grain rich in beta-glucan fiber, which may help lower cholesterol and improve heart health. Contains important nutrients like manganese, phosphorus, and B vitamins. Research from the American Heart Association supports its cardiovascular benefits.",
  },
  {
    name: "Organic Cane Sugar",
    quality: "neutral",
    description:
      "Less processed than refined white sugar, retaining some minerals, but still contributes to added sugar intake. The American Dietary Guidelines recommend limiting added sugars to less than 10% of daily calories for optimal health.",
  },
  {
    name: "Organic Sunflower Oil",
    quality: "poor",
    description:
      "High in vitamin E and unsaturated fats, but also contains omega-6 fatty acids which, when consumed in excess, may contribute to inflammation according to research in the Journal of Nutrition & Metabolism. Best used in moderation.",
  },
  {
    name: "Natural Flavor",
    quality: "poor",
    description:
      "A broad term that can include numerous compounds. While FDA-regulated, specific ingredients aren't required to be disclosed. The Center for Science in the Public Interest notes some natural flavors may contain allergens or additives of concern.",
  },
  {
    name: "Organic Coconut",
    quality: "good",
    description:
      "Contains medium-chain triglycerides (MCTs) that may support metabolism. Rich in manganese, copper, and fiber. Research in the Journal of Nutrition shows MCTs may be metabolized differently than other fats, potentially supporting weight management.",
  },
  {
    name: "Organic Honey",
    quality: "neutral",
    description:
      "Contains antioxidants and antimicrobial properties according to research in the Journal of Agricultural and Food Chemistry, but is still a concentrated sweetener. The American Heart Association recommends limiting added sweeteners, including honey.",
  },
  {
    name: "Thiamine Mononitrate",
    quality: "poor",
    description:
      "Synthetic form of vitamin B1 (thiamine) added to enrich foods. Essential for energy metabolism and nervous system function. While synthetic, it's well-absorbed and helps prevent thiamine deficiency in populations consuming refined grains.",
  },
]

// Update the health scores in the mock products to reflect the new calculation

// For the organic granola (which has mostly good ingredients)
export const mockProduct: Product = {
  id: "9780201379624",
  name: "Organic Granola Cereal",
  brand: "Nature's Path",
  image: "/placeholder.svg?height=100&width=100",
  healthScore: 92,
  ingredients: mockIngredients,
  allergens: [
    {
      name: "Oats",
      severity: "medium",
    },
    {
      name: "Tree Nuts",
      severity: "high",
    },
  ],
  alternatives: [
    {
      id: "9780201379625",
      name: "Organic Ancient Grains Granola",
      brand: "Nature's Path",
      healthScore: 95,
      price: 6.99,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "9780201379626",
      name: "Organic Pumpkin Seed Granola",
      brand: "Nature's Path",
      healthScore: 94,
      price: 6.99,
      image: "/placeholder.svg?height=100&width=100",
    },
  ],
  price: 5.29,
  store: "Whole Foods",
}

// For the chocolate chip cookies (which has mostly poor ingredients)
export const mockChocolateChipCookies: Product = {
  id: "123456789012",
  name: "Chocolate Chip Cookies",
  brand: "Sweet Delights",
  image: "/placeholder.svg?height=100&width=100",
  healthScore: 45,
  ingredients: [
    {
      name: "Enriched Wheat Flour",
      quality: "poor",
      description: "Highly processed flour with added synthetic nutrients. May contain pesticide residues and lacks the beneficial fiber and nutrients found in whole grains.",
    },
    {
      name: "Sugar",
      quality: "poor",
      description: "Refined sugar that contributes to added sugar intake. The American Heart Association recommends limiting added sugars to protect heart health.",
    },
    {
      name: "Chocolate Chips",
      quality: "neutral",
      description: "Contains cocoa and sugar. While cocoa has antioxidant properties, the added sugar and processing reduce its health benefits.",
    },
    {
      name: "Vegetable Oil",
      quality: "poor",
      description: "Highly processed oil that may contain harmful trans fats and contribute to inflammation when consumed in excess.",
    },
    {
      name: "Eggs",
      quality: "neutral",
      description: "Good source of protein and nutrients, but conventional eggs may contain antibiotic residues and come from factory-farmed chickens.",
    },
  ],
  allergens: [
    {
      name: "Wheat",
      severity: "high",
    },
    {
      name: "Eggs",
      severity: "high",
    },
    {
      name: "Milk",
      severity: "high",
    },
  ],
  alternatives: [
    {
      id: "987654321",
      name: "Organic Chocolate Chip Cookies",
      brand: "Nature's Path",
      healthScore: 85,
      price: 5.99,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "456789123",
      name: "Gluten-Free Chocolate Chip Cookies",
      brand: "Enjoy Life",
      healthScore: 80,
      price: 6.99,
      image: "/placeholder.svg?height=100&width=100",
    },
  ],
  price: 3.99,
  store: "Target",
}

// For the organic spinach (which has mostly good ingredients)
export const mockOrganicSpinach: Product = {
  id: "987654321098",
  name: "Organic Baby Spinach",
  brand: "Earthbound Farm",
  image: "/placeholder.svg?height=100&width=100",
  healthScore: 98,
  ingredients: [
    {
      name: "Organic Baby Spinach",
      quality: "good",
      description: "Nutrient-rich leafy green vegetable. Excellent source of vitamins A, C, K, and folate. Contains beneficial antioxidants and minerals.",
    },
  ],
  allergens: [],
  alternatives: [],
  price: 3.99,
  store: "Whole Foods",
}

