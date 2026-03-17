import { orders } from "@/lib/db/schema"

export interface QueryParams {
  [key: string]: string | number | boolean | undefined
}

const generateQueryString = (params: QueryParams): string => {
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&")
  return queryString ? `?${queryString}` : ""
}

export const routes = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
  },
  storefront: {
    root: "/",
    prodcuts: {
      root: "/products",
      id: (id: string) => `/products/${id}`,
    },
    categories: {
      root: "/categories",
    },
    brands: {
      root: "/brands",
      id: (id: string) => `/brands/${id}`,
    },
    deals: {
      root: "/deals",
    },
    cart: {
      root: "/cart",
    },
    favorites: {
      root: "/favorites",
    },
    orders: {
      root: "/orders",
      id: (id: string) => `/orders/${id}`,
    },
    profile: {
      root: "/profile",
    },
    search: (params: QueryParams) => `/search${generateQueryString(params)}`,
  },
  ops: {
    root: "/ops",
    profile: "/ops/profile",
    settings: "/ops/settings",
    products: {
      root: "/ops/products",
      new: "/ops/products/new",
      id: (id: string) => `/ops/products/${id}`,
    },
    brands: {
      root: "/ops/brands",
      new: "/ops/brands/new",
      id: (id: string) => `/ops/brands/${id}`,
    },
  },
  errors: {
    forbidden: "/forbidden",
  },
}
