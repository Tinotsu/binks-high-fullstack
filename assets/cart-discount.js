class CartDiscount extends HTMLElement {
  constructor() {
    super();
    this.applyButton = this.querySelector(".cart-discount_button");
    this.input = this.querySelector(".cart-discount_input");
    //Connect Listeners
    this.applyButton.addEventListener("click", (event) => this.submitDiscount(event));
    this.querySelector(".cart-discount__remove-discount").addEventListener("click", this.removeDiscount.bind(this));
    this.addEventListener("discount:remove", this.removeDiscount.bind(this));
  }

  async submitDiscount(event) {
    event.preventDefault();
    this.applyButton.disabled = true;
    if (localStorage.getItem("discountCode") != null) {
      this.removeDiscount();
      return;
    }
    const discountCode = this.input.value;
    if (discountCode === "") {
      this.setErrorMode("Veuillez saisir un code");
    } else {
      this.applyCode(discountCode);
    }
  }

  async removeDiscount() {
    if (this.querySelector(".cart-discount_badge").classList.contains("loading")) return;
    this.setButtonLoading();
    this.querySelector(".cart-discount_badge").classList.add("loading");
    localStorage.removeItem("discountCode");
    await fetch("/discount/CLEAR");
    setTimeout(() => {
      this.updateCart(null);
      this.setButtonLoaded();
    }, 200);
  }

  async applyCode(discountCode) {
    this.setButtonLoading();
    fetch("/payments/config", { method: "GET" })
      .then(function (response) {
        return response.json();
      })
      .then(
        function (data) {
          const checkout_json_url = "/wallets/checkouts/";
          let authorization_token = btoa(data.paymentInstruments.accessToken);
          fetch(window.Shopify.routes.root + "cart.js", {})
            .then(function (res) {
              return res.json();
            })
            .then(
              function (data) {
                let body = {
                  checkout: {
                    country: Shopify.country,
                    discount_code: discountCode,
                    line_items: data.items,
                    presentment_currency: Shopify.currency.active,
                  },
                };
                fetch(checkout_json_url, {
                  headers: { accept: "*/*", "cache-control": "no-cache", authorization: "Basic " + authorization_token, "content-type": "application/json, text/javascript", pragma: "no-cache", "sec-fetch-dest": "empty", "sec-fetch-mode": "cors", "sec-fetch-site": "same-origin" },
                  referrerPolicy: "strict-origin-when-cross-origin",
                  method: "POST",
                  mode: "cors",
                  credentials: "include",
                  body: JSON.stringify(body),
                })
                  .then(function (response) {
                    return response.json();
                  })
                  .then(
                    async function (data) {
                      if (data.checkout && data.checkout.applied_discounts.length > 0) {
                        let d = data.checkout.applied_discounts.find((d) => d.title.toUpperCase() === discountCode.toUpperCase());
                        if (d) {
                          let discountApplyUrl = "/discount/" + discountCode;
                          await fetch(discountApplyUrl, {}).then(function (response) {
                            return response.text();
                          });
                          let localStorageValue = {
                            code: d.title.trim(),
                            totalCart: data.checkout.total_line_items_price,
                          };
                          localStorage.setItem("discountCode", JSON.stringify(localStorageValue));
                          setTimeout(() => {
                            this.updateCart(discountCode + "=" + d.amount);
                            this.setButtonLoaded();
                          }, 500);
                        } else {
                          this.setErrorMode();
                          this.removeDiscount();
                        }
                      } else {
                        this.setErrorMode();
                        this.removeDiscount();
                      }
                    }.bind(this)
                  )
                  .finally(() => {})
                  .catch((e) => {
                    console.error(e);
                    this.setErrorMode("Une erreur est survenue");
                  });
              }.bind(this)
            );
        }.bind(this)
      );
  }

  setErrorMode(message = "Veuillez saisir un code valide") {
    // Reset the button state
    this.applyButton.disabled = false;
    this.applyButton.classList.remove("loading");
    this.applyButton.querySelector(".loading-overlay__spinner").classList.add("hidden");
    // Set the input in error mode
    this.input.focus();
    this.input.classList.add("cart-discount_input-error");
    this.input.placeholder = message;
    this.input.value = "";
    setTimeout(() => {
      this.input.classList.remove("cart-discount_input-error");
      this.input.placeholder = this.input.dataset.defaultPlaceholder;
    }, 2000);
  }

  setButtonLoading() {
    this.applyButton.disabled = true;
    this.applyButton.classList.add("loading");
    this.applyButton.querySelector(".loading-overlay__spinner").classList.remove("hidden");
  }

  setButtonLoaded() {
    this.applyButton.disabled = false;
    this.applyButton.classList.remove("loading");
    this.applyButton.querySelector(".loading-overlay__spinner").classList.add("hidden");
  }

  async updateCart(discount) {
    return await fetch(window.Shopify.routes.root + "cart/update.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attributes: {
          discount: discount,
        },
        sections: "cart-drawer",
        sections_url: window.location.pathname,
      }),
    }).then(() => {
      // Cart page
      if (window.location.pathname.includes("/cart")) {
        window.location.reload();
      }

      // Cart Drawer
      fetch(window.Shopify.routes.root + "?sections=cart-drawer")
        .then((res) => res.json())
        .then((data) => {
          document.querySelector("cart-drawer").innerHTML = new DOMParser().parseFromString(data["cart-drawer"], "text/html").querySelector("cart-drawer").innerHTML;
          setTimeout(() => {
            this.querySelector("#CartDrawer-Overlay").addEventListener("click", this.close.bind(this));
            this.open();
          });
          if (typeof initUpsellSlider === "function") {
            initUpsellSlider();
          }
        });
    });
  }
}

customElements.define("cart-discount", CartDiscount);
