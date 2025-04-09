"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function TestUsdaPage() {
  const [query, setQuery] = useState("apple")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testApi = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/test-usda?query=${encodeURIComponent(query)}`)

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`)
      }

      const data = await response.json()
      setResults(data)

      if (!data.apiTest.success) {
        setError(data.apiTest.error || "Unknown error testing USDA API")
      }
    } catch (error) {
      console.error("Error testing API:", error)
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Run the test on initial load
    testApi()
  }, [])

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <Link href="/" className="font-medium">
            Back to Home
          </Link>
        </div>
      </header>

      <div className="container py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold mb-6">USDA API Test</h1>

          <div className="flex gap-2 mb-6">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter an ingredient to test"
              className="flex-1"
            />
            <Button onClick={testApi} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Test API
            </Button>
          </div>

          {error && (
            <Card className="mb-6 border-destructive">
              <CardHeader className="pb-2">
                <CardTitle className="text-destructive flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{error}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Make sure your USDA API key is correctly set in the environment variables.
                </p>
              </CardContent>
            </Card>
          )}

          {results?.apiTest?.success && (
            <Card className="mb-6 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-600 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  USDA API Test Successful
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Successfully connected to the USDA FoodData Central API.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Found {results.apiTest.searchResults?.length} results for "{query}".
                </p>
              </CardContent>
            </Card>
          )}

          {results?.ingredientAnalysis && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Ingredient Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Ingredient: {results.ingredientAnalysis.name}</h3>
                    <div className="flex items-center mt-1">
                      <span className="font-medium mr-2">Quality:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${getQualityColor(results.ingredientAnalysis.quality)}`}
                      >
                        {results.ingredientAnalysis.quality}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="mt-1">{results.ingredientAnalysis.description}</p>
                  </div>

                  {results.ingredientAnalysis.organic !== undefined && (
                    <div>
                      <span className="font-medium">Organic:</span>
                      <span className="ml-2">{results.ingredientAnalysis.organic ? "Yes" : "No"}</span>
                    </div>
                  )}

                  {results.ingredientAnalysis.processingLevel && (
                    <div>
                      <span className="font-medium">Processing Level:</span>
                      <span className="ml-2">{results.ingredientAnalysis.processingLevel}</span>
                    </div>
                  )}

                  {results.ingredientAnalysis.benefits && results.ingredientAnalysis.benefits.length > 0 && (
                    <div>
                      <span className="font-medium">Benefits:</span>
                      <ul className="list-disc pl-5 mt-1">
                        {results.ingredientAnalysis.benefits.map((benefit: string, index: number) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {results.ingredientAnalysis.concerns && results.ingredientAnalysis.concerns.length > 0 && (
                    <div>
                      <span className="font-medium">Concerns:</span>
                      <ul className="list-disc pl-5 mt-1">
                        {results.ingredientAnalysis.concerns.map((concern: string, index: number) => (
                          <li key={index}>{concern}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {results?.apiTest?.searchResults && (
            <Card>
              <CardHeader>
                <CardTitle>Raw API Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-100 p-4 rounded-md overflow-auto max-h-96">
                  <pre className="text-xs">{JSON.stringify(results, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}

function getQualityColor(quality: string): string {
  switch (quality) {
    case "very good":
      return "bg-emerald-100 text-emerald-800"
    case "good":
      return "bg-green-100 text-green-800"
    case "neutral":
      return "bg-amber-100 text-amber-800"
    case "poor":
      return "bg-red-100 text-red-800"
    case "very poor":
      return "bg-red-200 text-red-900"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

