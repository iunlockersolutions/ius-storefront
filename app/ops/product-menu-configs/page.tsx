import { ProductMenuConfigsTable } from "@/app/ops/product-menu-configs/_components/product-menu-configs-table"
import { getCategoryBrandMenuConfigs } from "@/lib/actions/category-brand-menu-config"

export const metadata = {
  title: "Product Menu Configs | Operations",
  description:
    "Manage brand visibility and order within each storefront product category.",
}

export default async function ProductMenuConfigsPage() {
  const configs = await getCategoryBrandMenuConfigs()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Product Menu Configs</h1>
        <p className="text-muted-foreground">
          Control which brands appear under each top-level category in the
          storefront Products menu.
        </p>
      </div>

      <ProductMenuConfigsTable
        rows={configs.map((config) => ({
          id: config.id,
          categoryId: config.categoryId,
          categoryName: config.categoryName,
          brandId: config.brandId,
          brandName: config.brandName,
          showInProductMenu: config.showInProductMenu,
          menuPriority: config.menuPriority,
          modelGroupCount: config.modelGroupCount,
          productCount: config.productCount,
        }))}
      />
    </div>
  )
}
