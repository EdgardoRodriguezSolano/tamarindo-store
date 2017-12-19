class Spree::CheckoutController
  before_action :check_order

  def check_order

      if params[:transactionState]=="4" && @order.can_complete?
        @order.complete
        finalize_order
      end
  end

  def ensure_valid_state


  if (!params[:transactionState]=="4") # Si transactionState es 4, aprobado, viene del webcheckout de payUlatam
      unless skip_state_validation?
        if (params[:state] && !@order.has_checkout_step?(params[:state])) ||
          (!params[:state] && !@order.has_checkout_step?(@order.state))
          @order.state = 'cart'
          redirect_to checkout_state_path(@order.checkout_steps.first)
        end
      end
          # Fix for https://github.com/spree/spree/issues/4117
        # If confirmation of payment fails, redirect back to payment screen
        if params[:state] == "confirm" && @order.payment_required? && @order.payments.valid.empty?
          flash.keep
          redirect_to checkout_state_path("payment")
        end
      end
  end

  def set_state_if_present
      if params[:transactionState]=="4"
          skip_state_validation = true
          @order.state = "confirm"  # Si transactionState es 4, aprobado, viene del webcheckout de payUlatam
          binding.pry
      else
        if params[:state] 
          redirect_to checkout_state_path(@order.state) if @order.can_go_to_state?(params[:state]) && !skip_state_validation?
          @order.state = params[:state]
        end
      end
  end

end