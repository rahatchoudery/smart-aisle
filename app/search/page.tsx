"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Search, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { searchProducts, clearCaches, type Product } from "@/services/product-api"

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      // Call the API to search for products
      const searchResults = await searchProducts(query)
      setResults(searchResults)
    } catch (error) {
      console.error("Error searching products:", error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleProductClick = (id: string) => {
    router.push(`/product/${id}`)
  }

  const handleRefreshCache = async () => {
    setRefreshing(true)

    try {
      // Clear all caches
      clearCaches()

      // Re-run the search to get fresh results
      if (query.trim()) {
        const searchResults = await searchProducts(query)
        setResults(searchResults)
      }
    } catch (error) {
      console.error("Error refreshing cache:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-health-good"
    if (score >= 60) return "text-health-moderate"
    return "text-health-poor"
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <span className="font-medium">Back</span>
          </Link>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshCache}
              disabled={refreshing || !searched}
              title="Refresh results"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 text-2xl font-bold">Search Products</h1>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search for products (e.g., granola, cereal, milk)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </form>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-primary" />
              <p>Searching products...</p>
            </div>
          ) : searched && results.length === 0 ? (
            <div className="text-center py-12">
              <p className="mb-4">No products found matching "{query}"</p>
              <p className="text-muted-foreground">Try a different search term or scan a barcode instead.</p>
              <Link href="/scan" className="mt-4 inline-block">
                <Button variant="outline" className="mt-4">
                  Scan Barcode
                </Button>
              </Link>
            </div>
          ) : results.length > 0 ? (
            <div>
              <h2 className="text-lg font-medium mb-4">Search Results</h2>
              <ul className="space-y-4">
                {results.map((result) => (
                  <li key={result.id}>
                    <Card
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleProductClick(result.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <Image
                            src={result.image || "/placeholder.svg?height=100&width=100"}
                            alt={result.name}
                            width={80}
                            height={80}
                            className="rounded-md border"
                          />
                          <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-medium leading-tight">{result.name}</h3>
                                <p className="text-sm text-muted-foreground">{result.brand}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/product/${result.id}`)}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span>{result.store}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {!searched && (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-lg font-medium mb-2">Search for Products</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Enter a product name, brand, or category to find and analyze grocery items.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

