class Spree::StoreController
  before_action :load_taxonomies, :load_featured
  
  def load_taxonomies
      @taxonomies = Spree::Taxonomy.includes(root: :children)
  end
  

  def paginate(resource)
    resource.
      page(params[:page]).
      per(params[:per_page] || default_per_page)
  end

  def default_per_page
    500
  end

  def load_featured
    @featured_taxon = Spree::Taxon.find("31") 
    taxon = @featured_taxon
    @featured_products = paginate(taxon.products.ransack(params[:q]).result)
    @featured_products = @featured_products.includes(master: :default_price)
   if params[:simple]
          @exclude_data = {
            variants: true,
            option_types: true,
            product_properties: true,
            classifications: true
          }
          @product_attributes = %i(id name display_price)
        end

  end

end