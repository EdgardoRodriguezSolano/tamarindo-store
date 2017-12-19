module Spree::CheckoutHelper
  def checkout_progress
    states = checkout_states
    items = states.map do |state|
      text = Spree.t("order_state.#{state}").titleize

      css_classes = ['disabled']
      current_index = states.index(@order.state)
      state_index = states.index(state)

      if state_index < current_index
        css_classes = []
        css_classes << 'completed'
        text = link_to text, checkout_state_path(state)
      else
        text = link_to text, '#'
      end

      css_classes << 'next' if state_index == current_index + 1
      css_classes << 'active' if state == @order.state
      css_classes << 'first' if state_index == 0
      css_classes << 'last' if state_index == states.length - 1
      # It'd be nice to have separate classes but combining them with a dash helps out for IE6 which only sees the last class
      content_tag('li', text, class: css_classes)
    end
    content_tag('ol', raw(items.join("\n")), class: 'progress-steps nav nav-pills nav-justified', id: "checkout-step-#{@order.state}")
  end

  def getSignature
     signature = Digest::MD5.hexdigest '4Vj8eK4rloUd272L48hsrarnUA~508029~'+@order.number.to_s+'~'+@order.total.to_s+'~'+@order.currency.to_s
     return signature
  end

  
end