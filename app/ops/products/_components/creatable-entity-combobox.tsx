"use client"

import { useDeferredValue, useMemo, useState } from "react"

import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { normalizeEntityName } from "@/lib/utils/catalog"

type ComboboxOption = {
  id: string
  name: string
  description?: string | null
}

interface CreatableEntityComboboxProps {
  value: string
  options: ComboboxOption[]
  placeholder: string
  searchPlaceholder: string
  emptyLabel: string
  disabled?: boolean
  allowClear?: boolean
  createLabel: (query: string) => string
  canCreate?: (query: string) => boolean
  onValueChange: (value: string) => void
  onCreate?: (query: string) => Promise<void>
}

export function CreatableEntityCombobox({
  value,
  options,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  disabled = false,
  allowClear = true,
  createLabel,
  canCreate,
  onValueChange,
  onCreate,
}: CreatableEntityComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = normalizeEntityName(deferredQuery)

  const selectedOption = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value],
  )

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) {
      return options
    }

    return options
      .filter((option) => {
        const normalizedOption = normalizeEntityName(option.name)
        return (
          normalizedOption.includes(normalizedQuery) ||
          option.name.toLowerCase().includes(normalizedQuery)
        )
      })
      .sort((left, right) => {
        const leftName = normalizeEntityName(left.name)
        const rightName = normalizeEntityName(right.name)
        const leftStarts = leftName.startsWith(normalizedQuery)
        const rightStarts = rightName.startsWith(normalizedQuery)

        if (leftStarts !== rightStarts) {
          return leftStarts ? -1 : 1
        }

        return left.name.localeCompare(right.name)
      })
  }, [normalizedQuery, options])

  const hasExactMatch = useMemo(() => {
    if (!normalizedQuery) {
      return false
    }

    return options.some(
      (option) => normalizeEntityName(option.name) === normalizedQuery,
    )
  }, [normalizedQuery, options])

  const showCreate =
    Boolean(onCreate) &&
    Boolean(normalizedQuery) &&
    !hasExactMatch &&
    (canCreate ? canCreate(query) : true)

  const handleSelect = (nextValue: string) => {
    onValueChange(nextValue)
    setOpen(false)
    setQuery("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {allowClear && value ? (
              <CommandGroup heading="Selection">
                <CommandItem onSelect={() => handleSelect("")}>
                  Clear selection
                </CommandItem>
              </CommandGroup>
            ) : null}

            {filteredOptions.length > 0 ? (
              <CommandGroup heading="Matches">
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.id}
                    onSelect={() => handleSelect(option.id)}
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{option.name}</span>
                      {option.description ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      ) : null}
                    </div>
                    <Check
                      className={cn(
                        "ml-auto size-4",
                        value === option.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {showCreate ? (
              <>
                {(filteredOptions.length > 0 || (allowClear && value)) && (
                  <CommandSeparator />
                )}
                <CommandGroup heading="Create">
                  <CommandItem
                    onSelect={async () => {
                      if (!onCreate) {
                        return
                      }

                      await onCreate(query)
                      setOpen(false)
                      setQuery("")
                    }}
                  >
                    <Plus className="size-4" />
                    <span className="truncate">{createLabel(query)}</span>
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}

            {filteredOptions.length === 0 && !showCreate ? (
              <div className="px-3 py-6 text-sm text-muted-foreground">
                {emptyLabel}
              </div>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
