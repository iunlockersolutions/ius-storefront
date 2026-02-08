// Settings category definitions (non-server code)

export interface SettingDefinition {
  key: string
  label: string
  type:
    | "text"
    | "textarea"
    | "number"
    | "email"
    | "tel"
    | "url"
    | "select"
    | "boolean"
  default: string
  options?: string[]
}

export interface SettingCategory {
  id: string
  name: string
  description: string
  settings: SettingDefinition[]
}

export function getSettingCategories(): SettingCategory[] {
  return [
    {
      id: "general",
      name: "General",
      description: "Basic store information",
      settings: [
        {
          key: "site_name",
          label: "Site Name",
          type: "text",
          default: "IUS Shop",
        },
        {
          key: "site_description",
          label: "Site Description",
          type: "textarea",
          default: "",
        },
        { key: "site_logo_url", label: "Logo URL", type: "text", default: "" },
        {
          key: "contact_email",
          label: "Contact Email",
          type: "email",
          default: "",
        },
        {
          key: "contact_phone",
          label: "Contact Phone",
          type: "tel",
          default: "",
        },
      ],
    },
    {
      id: "currency",
      name: "Currency & Locale",
      description: "Currency and regional settings",
      settings: [
        {
          key: "default_currency",
          label: "Default Currency",
          type: "select",
          default: "LKR",
          options: ["LKR", "USD", "EUR", "GBP"],
        },
        {
          key: "currency_symbol",
          label: "Currency Symbol",
          type: "text",
          default: "Rs.",
        },
        {
          key: "currency_position",
          label: "Symbol Position",
          type: "select",
          default: "before",
          options: ["before", "after"],
        },
      ],
    },
    {
      id: "shipping",
      name: "Shipping",
      description: "Shipping rates and options",
      settings: [
        {
          key: "free_shipping_threshold",
          label: "Free Shipping Threshold",
          type: "number",
          default: "5000",
        },
        {
          key: "standard_shipping_rate",
          label: "Standard Shipping Rate",
          type: "number",
          default: "350",
        },
        {
          key: "express_shipping_rate",
          label: "Express Shipping Rate",
          type: "number",
          default: "750",
        },
        {
          key: "enable_cod",
          label: "Enable Cash on Delivery",
          type: "boolean",
          default: "true",
        },
        { key: "cod_fee", label: "COD Fee", type: "number", default: "100" },
      ],
    },
    {
      id: "orders",
      name: "Orders",
      description: "Order settings and policies",
      settings: [
        {
          key: "order_prefix",
          label: "Order Number Prefix",
          type: "text",
          default: "IUS",
        },
        {
          key: "low_stock_threshold",
          label: "Low Stock Alert Threshold",
          type: "number",
          default: "5",
        },
        {
          key: "auto_cancel_pending_orders_hours",
          label: "Auto-cancel pending orders (hours)",
          type: "number",
          default: "24",
        },
        {
          key: "enable_guest_checkout",
          label: "Enable Guest Checkout",
          type: "boolean",
          default: "true",
        },
      ],
    },
    {
      id: "reviews",
      name: "Reviews",
      description: "Review and rating settings",
      settings: [
        {
          key: "enable_reviews",
          label: "Enable Product Reviews",
          type: "boolean",
          default: "true",
        },
        {
          key: "auto_approve_reviews",
          label: "Auto-approve Reviews",
          type: "boolean",
          default: "false",
        },
        {
          key: "require_purchase_for_review",
          label: "Require Purchase to Review",
          type: "boolean",
          default: "true",
        },
      ],
    },
    {
      id: "payments",
      name: "Payments",
      description: "Payment gateway settings",
      settings: [
        {
          key: "enable_card_payments",
          label: "Enable Card Payments",
          type: "boolean",
          default: "true",
        },
        {
          key: "enable_bank_transfer",
          label: "Enable Bank Transfer",
          type: "boolean",
          default: "true",
        },
        {
          key: "bank_account_name",
          label: "Bank Account Name",
          type: "text",
          default: "",
        },
        {
          key: "bank_account_number",
          label: "Bank Account Number",
          type: "text",
          default: "",
        },
        { key: "bank_name", label: "Bank Name", type: "text", default: "" },
        { key: "bank_branch", label: "Bank Branch", type: "text", default: "" },
      ],
    },
    {
      id: "seo",
      name: "SEO & Social",
      description: "Search engine and social media settings",
      settings: [
        {
          key: "meta_title",
          label: "Default Meta Title",
          type: "text",
          default: "",
        },
        {
          key: "meta_description",
          label: "Default Meta Description",
          type: "textarea",
          default: "",
        },
        {
          key: "facebook_url",
          label: "Facebook URL",
          type: "url",
          default: "",
        },
        {
          key: "instagram_url",
          label: "Instagram URL",
          type: "url",
          default: "",
        },
        { key: "twitter_url", label: "Twitter URL", type: "url", default: "" },
      ],
    },
  ]
}
