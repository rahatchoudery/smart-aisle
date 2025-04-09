import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Camera, Search, User, Database } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-brand-primary">
              Smart<span className="text-brand-accent">[Ai]</span>sle
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">Profile</span>
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="container flex-1 py-12 md:py-24 lg:py-32">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-8 text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
            Make <span className="text-brand-primary">Healthier</span> Grocery Choices
          </h1>
          <p className="max-w-[700px] text-lg text-muted-foreground md:text-xl">
            Scan product barcodes to get instant health scores, ingredient analysis, and better alternatives.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/scan">
              <Button size="lg" className="gap-2">
                <Camera className="h-5 w-5" />
                Scan Product
              </Button>
            </Link>
            <Link href="/search">
              <Button size="lg" variant="outline" className="gap-2">
                <Search className="h-5 w-5" />
                Search Products
              </Button>
            </Link>
          </div>

          {/* USDA API testing */}
          <div className="mt-4">
            <Link href="/test-usda">
              <Button size="lg" variant="secondary" className="gap-2">
                <Database className="h-5 w-5" />
                Test USDA API
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-12 md:py-24 lg:py-32 bg-muted">
        <div className="mx-auto grid max-w-[980px] gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="rounded-full bg-brand-primary p-3">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold">Scan Products</h3>
            <p className="text-muted-foreground">Quickly scan barcodes to get detailed ingredient information.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="rounded-full bg-brand-primary p-3">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L4 6V12C4 15.31 7.58 19.8 12 22C16.42 19.8 20 15.31 20 12V6L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Analyze Ingredients</h3>
            <p className="text-muted-foreground">Get color-coded analysis of ingredients and potential allergens.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="rounded-full bg-brand-primary p-3">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Get Recommendations</h3>
            <p className="text-muted-foreground">Discover healthier and budget-friendly alternatives.</p>
          </div>
        </div>
      </section>

      <section className="container py-12 md:py-24 lg:py-32">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-8">
          <h2 className="text-3xl font-bold leading-tight tracking-tighter md:text-4xl">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-xl font-bold text-white">
                1
              </div>
              <h3 className="text-xl font-bold">Scan a Product</h3>
              <p className="text-muted-foreground">Use your phone camera to scan the barcode of any grocery product.</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-xl font-bold text-white">
                2
              </div>
              <h3 className="text-xl font-bold">View Analysis</h3>
              <p className="text-muted-foreground">
                Get a detailed breakdown of ingredients with health scores and warnings.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-xl font-bold text-white">
                3
              </div>
              <h3 className="text-xl font-bold">Find Alternatives</h3>
              <p className="text-muted-foreground">
                Discover healthier options that match your dietary preferences and budget.
              </p>
            </div>
          </div>
          <Link href="/scan">
            <Button size="lg" className="gap-2">
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t bg-muted">
        <div className="container flex flex-col gap-4 py-10 md:flex-row md:items-center md:justify-between">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 Smart[Ai]sle. All rights reserved.
          </p>
          <nav className="flex items-center justify-center gap-4 md:justify-end">
            <Link href="/terms" className="text-sm text-muted-foreground underline underline-offset-4">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground underline underline-offset-4">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  )
}

