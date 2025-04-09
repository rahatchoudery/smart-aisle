"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, AlertTriangle, Info, ShoppingCart, ThumbsUp, Loader2, Check, X, ChevronDown, HelpCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { fetchProductByBarcode, type Product } from "@/services/product-api"
import { healthCriteria, type CriteriaResult } from "@/services/ingredient-analyzer"

// Import all mock products
import { mockProduct, mockChocolateChipCookies, mockOrganicSpinach } from "@/services/mock-product"

export default function ProductPage() {
  const params = useParams()
  const barcode = params.barcode as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [usedFallback, setUsedFallback] = useState(false)
  const [activeIngredient, setActiveIngredient] = useState<string | null>(null)

  // In the useEffect where we fetch the product
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      setNotFound(false)
      setUsedFallback(false)

      console.log(`Attempting to fetch product with barcode: ${barcode}`)

      try {
        // For demo barcodes, use our mock products directly without API call
        if (barcode === "9780201379624" || barcode === "123456789012" || barcode === "987654321098") {
          console.log(`Using mock data for demo barcode: ${barcode}`)

          // Select the appropriate mock product based on barcode
          let selectedMockProduct: Product

          if (barcode === "9780201379624") {
            selectedMockProduct = mockProduct // Organic Granola
          } else if (barcode === "123456789012") {
            selectedMockProduct = mockChocolateChipCookies // Chocolate Chip Cookies
          } else {
            selectedMockProduct = mockOrganicSpinach // Organic Spinach
          }

          setProduct(selectedMockProduct)
          setUsedFallback(true)
          setLoading(false)
        } else {
          // For non-demo barcodes, try the API
          const response = await fetch(`/api/product/${barcode}`)
          
          if (!response.ok) {
            throw new Error(`API returned status ${response.status}`)
          }

          const productData = await response.json()

          if (productData.error) {
            throw new Error(productData.error)
          }

          console.log(`Successfully retrieved product: ${productData.name}`)
          setProduct(productData)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        // Only set notFound if we actually couldn't find the product
        if (error instanceof Error && error.message.includes("Product not found")) {
          setNotFound(true)
        }
        setLoading(false)
      }
    }

    fetchProduct()
  }, [barcode])

  // Single polling mechanism for ingredient updates
  useEffect(() => {
    if (!product || loading || usedFallback) return

    console.log("Starting polling for ingredient updates...")
    const pollInterval = setInterval(() => {
      console.log("Checking for ingredient updates...")
      fetch(`/api/check-product-updates?barcode=${barcode}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.hasUpdates && data.product) {
            console.log("Received updated product data:", {
              hasUpdates: data.hasUpdates,
              loadingState: data.product.loading,
              ingredientsCount: data.product.ingredients?.length,
              ingredients: data.product.ingredients
            })
            
            // If we have ingredients and they're not loading, update the product state
            if (data.product.ingredients && data.product.ingredients.length > 0 && !data.product.loading?.ingredients) {
              console.log("Ingredients are processed, updating product state...")
              clearInterval(pollInterval)
              setProduct({
                ...data.product,
                loading: {
                  ...data.product.loading,
                  ingredients: false
                }
              })
            } else {
              // Still loading, update the loading state
              console.log("Ingredients still processing...")
              setProduct(prevProduct => {
                if (!prevProduct) return data.product
                return {
                  ...data.product,
                  loading: {
                    ...prevProduct.loading,
                    ingredients: true
                  }
                }
              })
            }
          } else {
            console.log("No updates available yet")
          }
        })
        .catch((error) => {
          console.error("Error checking for product updates:", error)
        })
    }, 1000)

    return () => {
      console.log("Cleaning up polling interval")
      clearInterval(pollInterval)
    }
  }, [product, barcode, loading, usedFallback])

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="container flex h-16 items-center">
            <Link href="/scan" className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Button>
              <span className="font-medium">Back to Scanner</span>
            </Link>
          </div>
        </header>
        <div className="container flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-brand-primary" />
            <p className="text-lg">Loading product information...</p>
            <p className="text-sm text-muted-foreground mt-2">Barcode: {barcode}</p>
          </div>
        </div>
      </main>
    )
  }

  if (notFound || !product) {
    return (
      <main className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="container flex h-16 items-center">
            <Link href="/scan" className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Button>
              <span className="font-medium">Back to Scanner</span>
            </Link>
          </div>
        </header>
        <div className="container py-8">
          <div className="mx-auto max-w-md text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <p className="mb-2">We couldn't find information for this product in our database.</p>
            <p className="text-sm text-muted-foreground mb-6">Barcode: {barcode}</p>
            <div className="flex flex-col gap-4 sm:flex-row justify-center">
              <Link href="/scan">
                <Button>Scan Again</Button>
              </Link>
              <Link href="/search">
                <Button variant="outline">Search Products</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-health-good"
    if (score >= 60) return "text-health-moderate"
    return "text-health-poor"
  }

  const getHealthScoreRing = (score: number) => {
    if (score >= 80) return "stroke-health-good"
    if (score >= 60) return "stroke-health-moderate"
    return "stroke-health-poor"
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "very good":
        return "text-emerald-600"
      case "good":
        return "text-health-good"
      case "neutral":
        return "text-amber-500"
      case "poor":
        return "text-health-poor"
      case "very poor":
        return "text-red-800"
      default:
        return "text-muted-foreground"
    }
  }

  const getQualityBadgeVariant = (quality: string) => {
    switch (quality) {
      case "very good":
        return "outline"
      case "good":
        return "secondary"
      case "neutral":
        return "default"
      case "poor":
        return "destructive"
      case "very poor":
        return "destructive"
      default:
        return "default"
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <Link href="/scan" className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <span className="font-medium">Back to Scanner</span>
          </Link>
        </div>
      </header>

      <div className="container py-8">
        <div className="mx-auto max-w-3xl">
          {usedFallback && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
              <p className="text-sm">
                <strong>Note:</strong> Using demo data for this product. In a production app, this would show real data
                from the Open Food Facts database.
              </p>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="flex-shrink-0 flex justify-center">
              <Image
                src={product.image || "/placeholder.svg?height=300&width=300"}
                alt={product.name}
                width={200}
                height={200}
                className="rounded-lg border"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
              <p className="text-muted-foreground mb-4">{product.brand}</p>

              <div className="flex items-center gap-4 mb-6">
                <div className="health-score-ring">
                  <svg viewBox="0 0 120 120" width="120" height="120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      className={getHealthScoreRing(product.healthScore)}
                      strokeWidth="12"
                      strokeDasharray="339.292"
                      strokeDashoffset={339.292 * (1 - product.healthScore / 100)}
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div className={`health-score-text ${getHealthScoreColor(product.healthScore)}`}>
                    {product.loading?.ingredients ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <span className={getHealthScoreColor(product.healthScore)}>
                        {product.healthScore}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Health Score</h2>
                  <p className="text-muted-foreground">
                    {product.healthScore >= 80
                      ? "Excellent choice!"
                      : product.healthScore >= 60
                        ? "Good option with some concerns"
                        : "Several health concerns"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {product.price > 0 && (
                  <div className="flex items-center gap-1">
                    <ShoppingCart className="h-4 w-4" />
                    <span>
                      ${product.price.toFixed(2)} {product.store !== "Unknown" && `at ${product.store}`}
                    </span>
                  </div>
                )}

                {product.allergens.length > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Contains Allergens
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground">Barcode: {product.id}</p>
            </div>
          </div>

          <Tabs defaultValue="ingredients">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
              <TabsTrigger value="allergens">Allergens</TabsTrigger>
            </TabsList>

            <TabsContent value="ingredients" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ingredient Analysis</CardTitle>
                  <CardDescription>Breakdown of ingredients and their health impact</CardDescription>
                </CardHeader>
                <CardContent>
                  {product.loading?.ingredients ? (
                    <div className="flex items-center justify-center p-8 text-center">
                      <div>
                        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-brand-primary" />
                        <h3 className="text-lg font-medium mb-2">Analyzing Ingredients</h3>
                        <p className="text-muted-foreground">Analyzing each ingredient for health concerns...</p>
                      </div>
                    </div>
                  ) : product.ingredients.length > 0 ? (
                    <div>
                      <ul className="space-y-4">
                        {product.ingredients.map((ingredient, index) => (
                          <li
                            key={index}
                            className={`flex flex-col p-4 rounded-lg cursor-pointer transition-colors ${
                              ingredient.quality === "good"
                                ? "bg-green-50 hover:bg-green-100"
                                : ingredient.quality === "neutral"
                                ? "bg-amber-50 hover:bg-amber-100"
                                : ingredient.quality === "poor"
                                ? "bg-red-50 hover:bg-red-100"
                                : "bg-gray-50 hover:bg-gray-100"
                            }`}
                            onClick={() => setActiveIngredient(activeIngredient === ingredient.name ? null : ingredient.name)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${
                                    ingredient.quality === "good"
                                      ? "text-green-800"
                                      : ingredient.quality === "neutral"
                                      ? "text-amber-800"
                                      : ingredient.quality === "poor"
                                      ? "text-red-800"
                                      : "text-gray-800"
                                  }`}>{ingredient.name}</span>
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${
                                      ingredient.quality === "good"
                                        ? "bg-green-100 text-green-800"
                                        : ingredient.quality === "neutral"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : ingredient.quality === "poor"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {ingredient.quality.charAt(0).toUpperCase() + ingredient.quality.slice(1)}
                                  </span>
                                </div>
                                <p className={`mt-1 text-sm ${
                                  ingredient.quality === "good"
                                    ? "text-green-700"
                                    : ingredient.quality === "neutral"
                                    ? "text-amber-700"
                                    : ingredient.quality === "poor"
                                    ? "text-red-700"
                                    : "text-gray-700"
                                }`}>{ingredient.description}</p>
                              </div>
                              <ChevronDown
                                className={`h-5 w-5 transition-transform ${
                                  activeIngredient === ingredient.name ? "transform rotate-180" : ""
                                } ${
                                  ingredient.quality === "good"
                                    ? "text-green-600"
                                    : ingredient.quality === "neutral"
                                    ? "text-amber-600"
                                    : ingredient.quality === "poor"
                                    ? "text-red-600"
                                    : "text-gray-600"
                                }`}
                              />
                            </div>

                            {activeIngredient === ingredient.name && ingredient.analysis && (
                              <div className={`mt-4 pt-4 border-t ${
                                ingredient.quality === "good"
                                  ? "border-green-200"
                                  : ingredient.quality === "neutral"
                                  ? "border-amber-200"
                                  : ingredient.quality === "poor"
                                  ? "border-red-200"
                                  : "border-gray-200"
                              }`}>
                                <h4 className={`text-sm font-medium mb-2 ${
                                  ingredient.quality === "good"
                                    ? "text-green-900"
                                    : ingredient.quality === "neutral"
                                    ? "text-amber-900"
                                    : ingredient.quality === "poor"
                                    ? "text-red-900"
                                    : "text-gray-900"
                                }`}>Health Criteria Analysis:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {healthCriteria.map((criteria) => (
                                    <div
                                      key={criteria.name}
                                      className={`flex items-center gap-2 p-2 rounded-md ${
                                        ingredient.analysis?.criteriaResults[criteria.name as keyof CriteriaResult]
                                          ? ingredient.quality === "good"
                                            ? "bg-green-100"
                                            : ingredient.quality === "neutral"
                                            ? "bg-amber-100"
                                            : ingredient.quality === "poor"
                                            ? "bg-red-100"
                                            : "bg-gray-100"
                                          : ingredient.quality === "unknown"
                                          ? "bg-gray-100"
                                          : ingredient.quality === "good"
                                          ? "bg-red-50"
                                          : ingredient.quality === "neutral"
                                          ? "bg-red-50"
                                          : ingredient.quality === "poor"
                                          ? "bg-red-50"
                                          : "bg-gray-50"
                                      }`}
                                    >
                                      {ingredient.analysis?.criteriaResults[criteria.name as keyof CriteriaResult] ? (
                                        <Check className={`h-4 w-4 ${
                                          ingredient.quality === "good"
                                            ? "text-green-600"
                                            : ingredient.quality === "neutral"
                                            ? "text-amber-600"
                                            : ingredient.quality === "poor"
                                            ? "text-red-600"
                                            : "text-gray-600"
                                        }`} />
                                      ) : ingredient.quality === "unknown" ? (
                                        <HelpCircle className="h-4 w-4 text-gray-600" />
                                      ) : (
                                        <X className="h-4 w-4 text-red-600" />
                                      )}
                                      <span className={`text-xs ${
                                        ingredient.quality === "good"
                                          ? "text-green-700"
                                          : ingredient.quality === "neutral"
                                          ? "text-amber-700"
                                          : ingredient.quality === "poor"
                                          ? "text-red-700"
                                          : "text-gray-700"
                                      }`}>{criteria.description}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-6 p-4 bg-slate-100 rounded-md border border-slate-200">
                        <h3 className="text-sm font-medium mb-2 text-slate-900">How to read this analysis:</h3>
                        <ul className="text-xs space-y-1 text-slate-800">
                          <li className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-health-good"></span>
                            <span>
                              <strong>Good:</strong> Minimally processed with health benefits
                            </span>
                          </li>
                          <li className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                            <span>
                              <strong>Neutral:</strong> No significant health benefits or concerns
                            </span>
                          </li>
                          <li className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-health-poor"></span>
                            <span>
                              <strong>Poor:</strong> Some health concerns
                            </span>
                          </li>
                          <li className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                            <span>
                              <strong>Unknown:</strong> Insufficient information to make a confident assessment
                            </span>
                          </li>
                        </ul>
                        <p className="text-xs mt-2 text-slate-700">
                          Click on any ingredient to see detailed analysis against our health criteria.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-8 text-center">
                      <div>
                        <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Ingredient Data Available</h3>
                        <p className="text-muted-foreground">
                          We couldn't find detailed ingredient information for this product.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="allergens" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Allergen Information</CardTitle>
                  <CardDescription>Potential allergens and sensitivities</CardDescription>
                </CardHeader>
                <CardContent>
                  {product.allergens.length > 0 ? (
                    <ul className="space-y-4">
                      {product.allergens.map((allergen, index) => (
                        <li key={index} className="border p-4 rounded-md">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <AlertTriangle
                                className={
                                  allergen.severity === "high"
                                    ? "text-health-poor"
                                    : allergen.severity === "medium"
                                      ? "text-health-moderate"
                                      : "text-muted-foreground"
                                }
                              />
                              <span>{allergen.name}</span>
                            </div>
                            <Badge
                              variant={
                                allergen.severity === "high"
                                  ? "destructive"
                                  : allergen.severity === "medium"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {allergen.severity} risk
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center justify-center p-8 text-center">
                      <div>
                        <ThumbsUp className="h-12 w-12 text-health-good mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Allergens Detected</h3>
                        <p className="text-muted-foreground">
                          This product doesn't contain common allergens based on our analysis.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}

