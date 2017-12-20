module Spree::TaxonsHelper
    # Retrieves the collection of products to display when "previewing" a taxon.  This is abstracted into a helper so
    # that we can use configurations as well as make it easier for end users to override this determination.  One idea is
    # to show the most popular products for a particular taxon (that is an exercise left to the developer.)
    def taxon_preview(taxon, max = 4)
      products = taxon.active_products.select("DISTINCT (spree_products.id), spree_products.*, spree_products_taxons.position").limit(max)
      binding.pry
      if products.size < max
        products_arel = Spree::Product.arel_table
        taxon.descendants.each do |descendent_taxon|
          to_get = max - products.length
          products += descendent_taxon.active_products.select("DISTINCT (spree_products.id), spree_products.*, spree_products_taxons.position").where(products_arel[:id].not_in(products.map(&:id))).limit(to_get)
          break if products.size >= max
        end
      end
      products
    end

    # max= 0 arroja toda la lista de productos. Max = número limita el número de productos mostrado por página.
    def taxon_preview_all(taxon, max = 0)
      if max > 0
        products = taxon.active_products.select("DISTINCT (spree_products.id), spree_products.*, spree_products_taxons.position").limit(max)
      else
        products = taxon.active_products.select("DISTINCT (spree_products.id), spree_products.*, spree_products_taxons.position")
      end
      if products.size < max
        products_arel = Spree::Product.arel_table
        taxon.descendants.each do |descendent_taxon|
          to_get = max - products.length
          products += descendent_taxon.active_products.select("DISTINCT (spree_products.id), spree_products.*, spree_products_taxons.position").where(products_arel[:id].not_in(products.map(&:id))).limit(to_get)
          break if products.size >= max
        end
      end
      products
    end
end
