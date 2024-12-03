if (!customElements.get("sticky-add-cart")) {
  customElements.define(
    "sticky-add-cart",
    class StickyAddToCart extends HTMLElement {
      constructor() {
        super();
      }

      onVariantChangeUnsubscriber = undefined;

      connectedCallback() {
        this.onVariantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, () => {
          this.renderStickyAddToCart();
        });

        window.addEventListener("scroll", () => {
          this.displayStickyAddToCart();
        });

        this.displayStickyAddToCart();
      }

      renderStickyAddToCart() {
        const sectionId = this.closest(".shopify-section").id.replace("shopify-section-", "");
        var urlToFetch = window.location.href;
        if (urlToFetch.includes("?")) {
          urlToFetch = urlToFetch + "&sections=" + sectionId;
        } else {
          urlToFetch = urlToFetch + "?sections=" + sectionId;
        }
        fetch(urlToFetch)
          .then((res) => res.json())
          .then((data) => {
            this.querySelector("#stickyAddtocartContainer").innerHTML = new DOMParser().parseFromString(data[sectionId], "text/html").querySelector("#stickyAddtocartContainer").innerHTML;
          });
      }

      displayStickyAddToCart() {
        if (this.isElementInViewport(document.querySelectorAll(".product-form__submit")[0]) || this.isElementInViewport(document.getElementsByTagName("footer")[0])) {
          document.getElementById("stickyAddtocartContainer").setAttribute("class", "hideStickyAddtocart");
        } else {
          document.getElementById("stickyAddtocartContainer").setAttribute("class", "showStickyAddtocart");
        }
      }

      isElementInViewport(el) {
        var top = el.offsetTop;
        var height = el.offsetHeight;

        while (el.offsetParent) {
          el = el.offsetParent;
          top += el.offsetTop;
        }
        return top < window.pageYOffset + window.innerHeight && top + height > window.pageYOffset;
      }
    }
  );
}
