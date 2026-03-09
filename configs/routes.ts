import { categories } from "@/lib/db/schema"

interface QueryParams {
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
    cart: "/ops/cart",
    favorites: "/ops/favorites",
    search: (params: QueryParams) =>
      `/ops/search${generateQueryString(params)}`,
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
  },
  errors: {
    forbidden: "/forbidden",
  },
}
