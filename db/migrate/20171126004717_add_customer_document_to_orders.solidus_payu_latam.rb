# This migration comes from solidus_payu_latam (originally 20170916072806)
class AddCustomerDocumentToOrders < ActiveRecord::Migration[5.1]
  def change
    add_column :spree_orders, :customer_document, :string
  end
end
