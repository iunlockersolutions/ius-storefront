import { generateQueryString, QueryParams } from "@/lib/utils/routes-utils"

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
