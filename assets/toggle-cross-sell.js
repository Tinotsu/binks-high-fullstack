if (!customElements.get("toggle-cross-sell")) {
  customElements.define(
    "toggle-cross-sell",

    class ToggleCrossSell extends HTMLElement {
      constructor() {
        super();

        this.main_product_form = document.querySelector('.product-form form[action="/cart/add"]') || document.querySelector('.product__page form[action="/cart/add"]') || document.querySelector('.product form[action="/cart/add"]') || document.querySelector('form[action="/cart/add.js"]') || document.querySelector('form[action="/cart/add"]');
        if (this.main_product_form === null) return console.error("ToggleCrossSell: No product form found");
      }

      connectedCallback() {
        this.addEventListener("click", this.onToggleProduct.bind(this));
        this.querySelectorAll(".toggle-cross-sell__product").forEach((product) => {
          if (product.querySelector(".toggle-cross-sell__variant-select") != null) {
            product.querySelector(".toggle-cross-sell__variant-select").addEventListener("change", this.variantChanged.bind(this, product));
          }
        });
      }

      disconnectedCallback() {
        this.removeEventListener("click", this.onToggleProduct.bind(this));
        this.querySelectorAll(".toggle-cross-sell__product").forEach((product) => {
          if (product.querySelector(".toggle-cross-sell__variant-select") != null) {
            product.querySelector(".toggle-cross-sell__variant-select").removeEventListener("change", this.variantChanged.bind(this, product));
          }
        });
      }

      onToggleProduct(event) {
        var checkbox = event.target.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = !checkbox.checked;
        var product = event.target.closest(".toggle-cross-sell__product");
        if (event.target.classList.contains("toggle-cross-sell__product")) {
          product = event.target;
        }

        this.updateSelectedState(product);
        this.updateMainFormInputs();
      }

      variantChanged(product) {
        const select = product.querySelector(".toggle-cross-sell__variant-select");
        const optionSelected = select.options[select.selectedIndex];
        this.updateProductPrice(product, optionSelected);
        this.updateProductImage(product, optionSelected);
        this.updateVariantId(product, optionSelected);
        this.updateSelectedState(product);
      }

      updateSelectedState(product) {
        if (product.querySelector(".toggle-cross-sell__product-checkbox").checked) {
          product.classList.add("toggle-cross-sell__product--selected");
        } else {
          product.classList.remove("toggle-cross-sell__product--selected");
        }
      }

      updateProductPrice(product, optionSelected) {
        const variantPrice = optionSelected.dataset.price;
        product.querySelector(".toggle-cross-sell__product-price").innerHTML = variantPrice;

        if (optionSelected.dataset.compareAtPrice != null) {
          product.querySelector(".toggle-cross-sell__product-compare-at-price").innerHTML = optionSelected.dataset.compareAtPrice;
          product.querySelector(".toggle-cross-sell__product-badge-discount").innerHTML = optionSelected.dataset.discountPercentage;
          product.querySelector(".toggle-cross-sell__product-compare-at-price").style.display = "block";
          product.querySelector(".toggle-cross-sell__product-badge-discount").style.display = "flex";
        } else {
          product.querySelector(".toggle-cross-sell__product-compare-at-price").style.display = "none";
          product.querySelector(".toggle-cross-sell__product-badge-discount").style.display = "none";
        }
      }

      updateProductImage(product, optionSelected) {
        if (optionSelected.dataset.variantImage != null && product.querySelector(".toggle-cross-sell__product-image") != null) {
          const variantImage = optionSelected.dataset.variantImage;
          product.querySelector(".toggle-cross-sell__product-image img").src = variantImage;
        }
      }

      updateVariantId(product, optionSelected) {
        const variantId = optionSelected.value;
        product.querySelector(".toggle-cross-sell__product-checkbox").dataset.variantId = variantId;
        product.querySelector(".toggle-cross-sell__product-checkbox").checked = true;
        this.updateMainFormInputs();
      }

      resetMainFormInputs() {
        document.querySelectorAll(".from-toggle-cross-sell").forEach((input) => input.remove());
      }

      updateMainFormInputs() {
        this.resetMainFormInputs();

        this.querySelectorAll(".toggle-cross-sell__product").forEach((product, index) => {
          const checkbox = product.querySelector('input[type="checkbox"]');
          if (checkbox && checkbox.checked) {
            this.main_product_form.insertAdjacentHTML("beforeend", `<input type="hidden" class="from-toggle-cross-sell" name="items[${index + 1}][id]" value="${checkbox.dataset.variantId}">`);
          }
        });
      }
    }
  );
}
