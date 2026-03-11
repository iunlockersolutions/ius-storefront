"use client"

import React from "react"
import Link from "next/link"

import {
  BarChart3,
  Boxes,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Store,
  SwatchBook,
  Tags,
  Users,
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon?: React.ComponentType
  isActive?: boolean
  items?: NavItem[]
}

const items: NavItem[] = [
  {
    title: "Dashboard",
    url: "/ops",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Products",
    url: "/ops/products",
    icon: Package,
  },
  {
    title: "Product Models",
    url: "/ops/product-model-groups",
    icon: SwatchBook,
  },
  {
    title: "Product Menu",
    url: "/ops/product-menu-configs",
    icon: SwatchBook,
  },
  {
    title: "Brands",
    url: "/ops/brands",
    icon: Store,
  },
  {
    title: "Categories",
    url: "/ops/categories",
    icon: Tags,
  },
  {
    title: "Inventory",
    url: "/ops/inventory",
    icon: Boxes,
  },
  {
    title: "Orders",
    url: "/ops/orders",
    icon: ShoppingCart,
  },
  {
    title: "Payments",
    url: "/ops/payments",
    icon: CreditCard,
  },
  {
    title: "Customers",
    url: "/ops/customers",
    icon: Users,
  },
  {
    title: "Reviews",
    url: "/ops/reviews",
    icon: MessageSquare,
  },
  {
    title: "Reports",
    url: "/ops/reports",
    icon: BarChart3,
    items: [
      {
        title: "Sales",
        url: "/ops/reports/sales",
      },
      {
        title: "Inventory",
        url: "/ops/reports/inventory",
      },
    ],
  },
  {
    title: "Settings",
    url: "/ops/settings",
    icon: Settings,
  },
]

type ParentNavItemProps = {
  item: NavItem
  subItems: NavItem[]
}

function LeafNavMenuItem({ item }: { item: NavItem }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
        <Link href={item.url}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function CollapsibleParentNavMenuItem({ item, subItems }: ParentNavItemProps) {
  return (
    <Collapsible
      asChild
      defaultOpen={item.isActive}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={item.isActive}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {subItems.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton asChild>
                  <Link href={subItem.url}>
                    <span>{subItem.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function DropdownParentNavMenuItem({
  item,
  subItems,
  isMobile,
}: ParentNavItemProps & { isMobile: boolean }) {
  const [open, setOpen] = React.useState(false)
  const closeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  function clearCloseTimeout() {
    if (!closeTimeoutRef.current) {
      return
    }

    clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = null
  }

  function handleDesktopHoverOpen() {
    if (isMobile) {
      return
    }

    clearCloseTimeout()
    setOpen(true)
  }

  function handleDesktopHoverClose() {
    if (isMobile) {
      return
    }

    clearCloseTimeout()
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false)
      closeTimeoutRef.current = null
    }, 120)
  }

  React.useEffect(() => {
    return () => {
      clearCloseTimeout()
    }
  }, [])

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <SidebarMenuItem
        onMouseEnter={handleDesktopHoverOpen}
        onMouseLeave={handleDesktopHoverClose}
      >
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton isActive={item.isActive}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
      </SidebarMenuItem>
      <DropdownMenuContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-56 min-w-56"
        onMouseEnter={handleDesktopHoverOpen}
        onMouseLeave={handleDesktopHoverClose}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
        {subItems.map((subItem) => (
          <DropdownMenuItem
            key={subItem.title}
            asChild
            className="cursor-pointer"
          >
            <Link href={subItem.url}>{subItem.title}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AppSidebar() {
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>IUS</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => {
              const subItems = item.items ?? []
              const hasSubItems = subItems.length > 0

              if (!hasSubItems) {
                return <LeafNavMenuItem key={item.title} item={item} />
              }

              if (isCollapsed) {
                return (
                  <DropdownParentNavMenuItem
                    key={item.title}
                    item={item}
                    subItems={subItems}
                    isMobile={isMobile}
                  />
                )
              }

              return (
                <CollapsibleParentNavMenuItem
                  key={item.title}
                  item={item}
                  subItems={subItems}
                />
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>{/* <NavUser user={data.user} /> */}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
