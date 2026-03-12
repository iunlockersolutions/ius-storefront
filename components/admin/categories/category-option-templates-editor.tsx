"use client"

import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export interface CategoryOptionTemplateValue {
  id?: string
  key: string
  name: string
}

interface CategoryOptionTemplatesEditorProps {
  value: CategoryOptionTemplateValue[]
  onChange: (value: CategoryOptionTemplateValue[]) => void
}

function createTemplateValue(): CategoryOptionTemplateValue {
  return {
    key: crypto.randomUUID(),
    name: "",
  }
}

export function CategoryOptionTemplatesEditor({
  value,
  onChange,
}: CategoryOptionTemplatesEditorProps) {
  const addTemplate = () => {
    onChange([...value, createTemplateValue()])
  }

  const updateTemplate = (
    templateKey: string,
    updates: Partial<CategoryOptionTemplateValue>,
  ) => {
    onChange(
      value.map((template) =>
        template.key === templateKey ? { ...template, ...updates } : template,
      ),
    )
  }

  const removeTemplate = (templateKey: string) => {
    onChange(value.filter((template) => template.key !== templateKey))
  }

  return (
    <FieldSet>
      <FieldGroup>
        <Field orientation="horizontal" className="items-center">
          <FieldContent>
            <FieldTitle>Variant Names</FieldTitle>
            <FieldDescription>
              Define the reusable variant names for this category, such as
              Color, Storage, or RAM.
            </FieldDescription>
          </FieldContent>
          <Button type="button" variant="outline" onClick={addTemplate}>
            <Plus className="mr-2 h-4 w-4" />
            Add variant name
          </Button>
        </Field>

        {value.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No variant names yet. Products in this category can still use custom
            option names later.
          </div>
        ) : (
          value.map((template, index) => (
            <div
              key={template.key}
              className="rounded-lg border bg-background p-4"
            >
              <Field orientation="horizontal" className="items-start gap-4">
                <FieldContent>
                  <FieldLabel htmlFor={`category-template-${template.key}`}>
                    Variant Name {index + 1}
                  </FieldLabel>
                  <Input
                    id={`category-template-${template.key}`}
                    value={template.name}
                    onChange={(event) =>
                      updateTemplate(template.key, { name: event.target.value })
                    }
                    placeholder="Color"
                  />
                </FieldContent>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTemplate(template.key)}
                  aria-label={`Remove variant name ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Field>
            </div>
          ))
        )}
      </FieldGroup>
    </FieldSet>
  )
}
