SolidusPaypalBraintree = {
  APPLE_PAY_API_VERSION: 1,

  config: {
    paths: {
      clientTokens: Spree.pathFor('solidus_paypal_braintree/client_token'),
      transactions: Spree.pathFor('solidus_paypal_braintree/transactions')
    },

    // Override to provide your own error messages.
    braintreeErrorHandle: function(braintreeError) {
      var $contentContainer = $("#content");
      var $flash = $("<div class='flash error'>" + braintreeError.name + ": " + braintreeError.message + "</div>");
      $contentContainer.prepend($flash);

      $flash.show().delay(5000).fadeOut(500);
    },

    classes: {
      hostedForm: function() {
        return SolidusPaypalBraintree.HostedForm;
      },

      client: function() {
        return SolidusPaypalBraintree.Client;
      },

      paypalButton: function() {
        return SolidusPaypalBraintree.PaypalButton;
      },

      applepayButton: function() {
        return SolidusPaypalBraintree.ApplepayButton;
      }
    }
  },

  createHostedForm: function() {
    return SolidusPaypalBraintree._factory(SolidusPaypalBraintree.config.classes.hostedForm(), arguments);
  },

  createClient: function() {
    return SolidusPaypalBraintree._factory(SolidusPaypalBraintree.config.classes.client(), arguments);
  },

  createPaypalButton: function() {
    return SolidusPaypalBraintree._factory(SolidusPaypalBraintree.config.classes.paypalButton(), arguments);
  },

  createApplePayButton: function() {
    return SolidusPaypalBraintree._factory(SolidusPaypalBraintree.config.classes.applepayButton(), arguments);
  },

  _factory: function(klass, args) {
    var normalizedArgs = Array.prototype.slice.call(args);
    return new (Function.prototype.bind.apply(klass, [null].concat(normalizedArgs)));
  }
};

/**
 * Constructor for PayPal button object
 * @constructor
 * @param {object} element - The DOM element of your PayPal button
 */

SolidusPaypalBraintree.PaypalButton = function(element, paypalOptions) {
  this._element = element;
  this._paypalOptions = paypalOptions || {};
  this._client = null;

  if(!this._element) {
    throw new Error("Element for the paypal button must be present on the page");
  }
}

/**
 * Creates the PayPal session using the provided options and enables the button
 *
 * @param {object} options - The options passed to tokenize when constructing
 *                           the PayPal instance
 *
 * See {@link https://braintree.github.io/braintree-web/3.9.0/PayPal.html#tokenize}
 */
SolidusPaypalBraintree.PaypalButton.prototype.initialize = function() {
  this._client = new SolidusPaypalBraintree.createClient({useDataCollector: true, usePaypal: true});

  return this._client.initialize().then(this.initializeCallback.bind(this));
};

SolidusPaypalBraintree.PaypalButton.prototype.initializeCallback = function() {
  this._paymentMethodId = this._client.paymentMethodId;

  this._element.removeAttribute('disabled');
  this._element.addEventListener('click', function(event) {
    this._client.getPaypalInstance().tokenize(this._paypalOptions, this._tokenizeCallback.bind(this));
  }.bind(this), false);
};

/**
 * Default callback function for when tokenization completes
 *
 * @param {object|null} tokenizeErr - The error returned by Braintree on failure
 * @param {object} payload - The payload returned by Braintree on success
 */
SolidusPaypalBraintree.PaypalButton.prototype._tokenizeCallback = function(tokenizeErr, payload) {
  if (tokenizeErr) {
    SolidusPaypalBraintree.config.braintreeErrorHandle(tokenizeErr);
    return;
  }

  var params = this._transactionParams(payload);

  return Spree.ajax({
    url: SolidusPaypalBraintree.config.paths.transactions,
    type: 'POST',
    dataType: 'json',
    data: params,
    success: function(response) {
      window.location.href = response.redirectUrl;
    },
    error: function(xhr) {
      console.error("Error submitting transaction")
    },
  });
};

/**
 * Builds the transaction parameters to submit to Solidus for the given
 * payload returned by Braintree
 *
 * @param {object} payload - The payload returned by Braintree after tokenization
 */
SolidusPaypalBraintree.PaypalButton.prototype._transactionParams = function(payload) {
  return {
    "payment_method_id" : this._paymentMethodId,
    "transaction" : {
      "email" : payload.details.email,
      "phone" : payload.details.phone,
      "nonce" : payload.nonce,
      "payment_type" : payload.type,
      "address_attributes" : this._addressParams(payload)
    }
  }
};

/**
 * Builds the address parameters to submit to Solidus using the payload
 * returned by Braintree
 *
 * @param {object} payload - The payload returned by Braintree after tokenization
 */
SolidusPaypalBraintree.PaypalButton.prototype._addressParams = function(payload) {
  var first_name, last_name;
  var payload_address = payload.details.shippingAddress || payload.details.billingAddress;

  if (payload_address.recipientName) {
    first_name = payload_address.recipientName.split(" ")[0];
    last_name = payload_address.recipientName.split(" ")[1];
  }

  if (!first_name || !last_name) {
    first_name = payload.details.firstName;
    last_name = payload.details.lastName;
  }

  return {
    "first_name" : first_name,
    "last_name" : last_name,
    "address_line_1" : payload_address.line1,
    "address_line_2" : payload_address.line2,
    "city" : payload_address.city,
    "state_code" : payload_address.state,
    "zip" : payload_address.postalCode,
    "country_code" : payload_address.countryCode
  };
};

$(document).ready(function() {
  if (document.getElementById("empty-cart")) {
    $.when(
      $.getScript("https://js.braintreegateway.com/web/3.22.1/js/client.min.js"),
      $.getScript("https://js.braintreegateway.com/web/3.22.1/js/paypal.min.js"),
      $.getScript("https://js.braintreegateway.com/web/3.22.1/js/data-collector.min.js")
    ).done(function() {
      $('<script/>').attr({
        'data-merchant' : "braintree",
        'data-id' : "paypal-button",
        'data-button' : "checkout",
        'data-color' : "blue",
        'data-size' : "medium",
        'data-shape' : "pill",
        'data-button_type' : "button",
        'data-button_disabled' : "true"
      }).
      load(function() {
        var paypalOptions = {
          flow: 'vault',
          enableShippingAddress: true
        }
        var button = new SolidusPaypalBraintree.createPaypalButton(document.querySelector("#paypal-button"), paypalOptions);
        return button.initialize();
      }).
      insertAfter("#content").
      attr('src', 'https://www.paypalobjects.com/api/button.js?')
    });
  }
});
