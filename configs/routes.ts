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
    installmentPlans: {
      root: "/installment-plans",
      id: (slug: string) => `/installment-plans/${slug}`,
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
    support: {
      freeSetupAndDelivery: "/free-setup-and-delivery",
      askAnExpert: "/ask-an-expert",
      shippingAndReturns: "/shipping-and-returns",
      contact: "/contact",
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
    installmentPlans: {
      root: "/ops/installment-plans",
      new: "/ops/installment-plans/new",
      id: (id: string) => `/ops/installment-plans/${id}`,
    },
  },
  errors: {
    forbidden: "/forbidden",
  },
}
