"use client"

import { useCallback, useEffect, useRef } from "react"

import { Image as TiptapImage } from "@tiptap/extension-image"
import { Link as TiptapLink } from "@tiptap/extension-link"
import { Placeholder } from "@tiptap/extension-placeholder"
import { Table } from "@tiptap/extension-table"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableRow } from "@tiptap/extension-table-row"
import { TextAlign } from "@tiptap/extension-text-align"
import { Underline } from "@tiptap/extension-underline"
import { type Editor, EditorContent, useEditor } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import { upload } from "@vercel/blob/client"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn, slugify } from "@/lib/utils"

interface DescriptionEditorInnerProps {
  value: string
  onChange: (html: string) => void
  productId: string
}

export function DescriptionEditorInner({
  value,
  onChange,
  productId,
}: DescriptionEditorInnerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isUploadingRef = useRef(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      TiptapImage.configure({
        HTMLAttributes: { class: "rounded-xl my-4" },
      }),
      Placeholder.configure({
        placeholder:
          "Write a rich product description — use the toolbar to add headings, images, lists, and tables.",
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none min-h-[320px] px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML()
      onChange(html === "<p></p>" ? "" : html)
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const incoming = value || ""
    const normalizedCurrent = current === "<p></p>" ? "" : current
    if (normalizedCurrent !== incoming) {
      editor.commands.setContent(incoming, { emitUpdate: false })
    }
  }, [editor, value])

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return
      isUploadingRef.current = true
      try {
        const ext = (file.name.split(".").pop() || "bin").toLowerCase()
        const baseName = file.name.replace(/\.[^.]+$/, "")
        const safeName = slugify(baseName) || "image"
        const pathname = `products/${productId}/description/${crypto.randomUUID()}-${safeName}.${ext}`

        const blob = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/admin/media/upload",
          clientPayload: JSON.stringify({
            entityType: "product",
            entityId: productId,
            media: {
              pathname,
              mimeType: file.type,
              byteSize: file.size,
              originalFilename: file.name,
              access: "public",
              kind: "image",
              context: "inline",
            },
          }),
        })

        editor.chain().focus().setImage({ src: blob.url, alt: baseName }).run()
      } finally {
        isUploadingRef.current = false
      }
    },
    [editor, productId],
  )

  const onPickImage = () => fileInputRef.current?.click()

  const onAddLink = () => {
    if (!editor) return
    const previousUrl = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Enter URL", previousUrl ?? "https://")
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  if (!editor) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-md border bg-background text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading editor…
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-background">
      <Toolbar
        editor={editor}
        onPickImage={onPickImage}
        onAddLink={onAddLink}
      />
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImageUpload(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}

interface ToolbarProps {
  editor: Editor
  onPickImage: () => void
  onAddLink: () => void
}

function Toolbar({ editor, onPickImage, onAddLink }: ToolbarProps) {
  const insertTable = () =>
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run()

  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-2">
      <ToolbarBtn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        ariaLabel="Undo"
      >
        <Undo className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        ariaLabel="Redo"
      >
        <Redo className="h-4 w-4" />
      </ToolbarBtn>

      <Separator />

      <ToolbarBtn
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        ariaLabel="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        ariaLabel="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarBtn>

      <Separator />

      <ToolbarBtn
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        ariaLabel="Bold"
      >
        <Bold className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        ariaLabel="Italic"
      >
        <Italic className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        ariaLabel="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        ariaLabel="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
        ariaLabel="Inline code"
      >
        <Code className="h-4 w-4" />
      </ToolbarBtn>

      <Separator />

      <ToolbarBtn
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        ariaLabel="Bullet list"
      >
        <List className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        ariaLabel="Ordered list"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        ariaLabel="Quote"
      >
        <Quote className="h-4 w-4" />
      </ToolbarBtn>

      <Separator />

      <ToolbarBtn
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        ariaLabel="Align left"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        ariaLabel="Align center"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        ariaLabel="Align right"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarBtn>

      <Separator />

      <ToolbarBtn
        active={editor.isActive("link")}
        onClick={onAddLink}
        ariaLabel="Insert link"
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={onPickImage} ariaLabel="Insert image">
        <ImageIcon className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={insertTable} ariaLabel="Insert table">
        <TableIcon className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        ariaLabel="Horizontal rule"
      >
        <Minus className="h-4 w-4" />
      </ToolbarBtn>
    </div>
  )
}

function Separator() {
  return <span className="mx-1 h-6 w-px bg-border" aria-hidden />
}

interface ToolbarBtnProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  ariaLabel: string
  children: React.ReactNode
}

function ToolbarBtn({
  onClick,
  active,
  disabled,
  ariaLabel,
  children,
}: ToolbarBtnProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "h-8 w-8 p-0",
        active && "bg-accent text-accent-foreground",
      )}
    >
      {children}
    </Button>
  )
}
