"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { updateSiteSettings } from "@/lib/actions/settings"
import type {
  SettingCategory,
  SettingDefinition,
} from "@/lib/utils/settings-config"

interface SettingsFormProps {
  settings: Record<string, string>
  categories: SettingCategory[]
}

export function SettingsForm({ settings, categories }: SettingsFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>(() => {
    // Initialize with current values or defaults
    const initial: Record<string, string> = {}
    categories.forEach((cat) => {
      cat.settings.forEach((setting) => {
        initial[setting.key] = settings[setting.key] ?? setting.default
      })
    })
    return initial
  })
  const [isSaving, setIsSaving] = useState(false)
  const [savedCategory, setSavedCategory] = useState<string | null>(null)

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveCategory = async (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return

    setIsSaving(true)
    setSavedCategory(null)

    try {
      const categorySettings: Record<string, string> = {}
      category.settings.forEach((setting) => {
        categorySettings[setting.key] = values[setting.key] ?? setting.default
      })

      const result = await updateSiteSettings(categorySettings)
      if (result.success) {
        setSavedCategory(categoryId)
        setTimeout(() => setSavedCategory(null), 2000)
        router.refresh()
      }
    } catch (error) {
      console.error("Save error:", error)
      alert("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const renderSettingInput = (setting: SettingDefinition) => {
    const value = values[setting.key] ?? setting.default

    switch (setting.type) {
      case "boolean":
        return (
          <div className="flex items-center justify-between">
            <Label htmlFor={setting.key}>{setting.label}</Label>
            <Switch
              id={setting.key}
              checked={value === "true"}
              onCheckedChange={(checked) =>
                handleChange(setting.key, checked ? "true" : "false")
              }
            />
          </div>
        )

      case "select":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{setting.label}</Label>
            <Select
              value={value}
              onValueChange={(v) => handleChange(setting.key, v)}
            >
              <SelectTrigger id={setting.key}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {setting.options?.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case "textarea":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{setting.label}</Label>
            <Textarea
              id={setting.key}
              value={value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              rows={3}
            />
          </div>
        )

      case "number":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{setting.label}</Label>
            <Input
              id={setting.key}
              type="number"
              value={value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
            />
          </div>
        )

      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{setting.label}</Label>
            <Input
              id={setting.key}
              type={setting.type}
              value={value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
            />
          </div>
        )
    }
  }

  return (
    <Tabs defaultValue={categories[0]?.id} className="space-y-4">
      <TabsList className="flex-wrap h-auto gap-2">
        {categories.map((category) => (
          <TabsTrigger key={category.id} value={category.id}>
            {category.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {categories.map((category) => (
        <TabsContent key={category.id} value={category.id}>
          <Card>
            <CardHeader>
              <CardTitle>{category.name}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {category.settings.map((setting) => (
                <div key={setting.key}>{renderSettingInput(setting)}</div>
              ))}

              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => handleSaveCategory(category.id)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : savedCategory === category.id ? (
                    "Saved!"
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save {category.name}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  )
}
