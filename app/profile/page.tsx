"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft, User, Settings, Bell, Shield } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProfilePage() {
  const [preferences, setPreferences] = useState({
    glutenFree: false,
    dairyFree: false,
    vegan: false,
    lowSugar: true,
    organic: false,
    nonGMO: true,
    notifications: true,
    dataCollection: true,
  })

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
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
        </div>
      </header>

      <div className="container py-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-16 w-16 rounded-full bg-brand-primary flex items-center justify-center text-white">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Your Profile</h1>
              <p className="text-muted-foreground">Manage your preferences and settings</p>
            </div>
          </div>

          <Tabs defaultValue="dietary">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dietary" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Dietary Preferences</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Privacy</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dietary" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dietary Preferences</CardTitle>
                  <CardDescription>Set your dietary preferences for personalized recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="gluten-free">Gluten Free</Label>
                      <p className="text-sm text-muted-foreground">Avoid products containing gluten</p>
                    </div>
                    <Switch
                      id="gluten-free"
                      checked={preferences.glutenFree}
                      onCheckedChange={() => handleToggle("glutenFree")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dairy-free">Dairy Free</Label>
                      <p className="text-sm text-muted-foreground">Avoid products containing dairy</p>
                    </div>
                    <Switch
                      id="dairy-free"
                      checked={preferences.dairyFree}
                      onCheckedChange={() => handleToggle("dairyFree")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="vegan">Vegan</Label>
                      <p className="text-sm text-muted-foreground">Avoid all animal products</p>
                    </div>
                    <Switch id="vegan" checked={preferences.vegan} onCheckedChange={() => handleToggle("vegan")} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="low-sugar">Low Sugar</Label>
                      <p className="text-sm text-muted-foreground">Prefer products with less added sugar</p>
                    </div>
                    <Switch
                      id="low-sugar"
                      checked={preferences.lowSugar}
                      onCheckedChange={() => handleToggle("lowSugar")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="organic">Organic</Label>
                      <p className="text-sm text-muted-foreground">Prefer organic products when available</p>
                    </div>
                    <Switch
                      id="organic"
                      checked={preferences.organic}
                      onCheckedChange={() => handleToggle("organic")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="non-gmo">Non-GMO</Label>
                      <p className="text-sm text-muted-foreground">Prefer non-GMO products</p>
                    </div>
                    <Switch id="non-gmo" checked={preferences.nonGMO} onCheckedChange={() => handleToggle("nonGMO")} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Manage how and when you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">App Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about product alerts and updates
                      </p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={preferences.notifications}
                      onCheckedChange={() => handleToggle("notifications")}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>Control your data and privacy preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="data-collection">Data Collection</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow anonymous data collection to improve recommendations
                      </p>
                    </div>
                    <Switch
                      id="data-collection"
                      checked={preferences.dataCollection}
                      onCheckedChange={() => handleToggle("dataCollection")}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}

