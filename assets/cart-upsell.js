function addUpsellToCart(thisButton) {
  var cart = document.querySelector("cart-notification") || document.querySelector("cart-drawer") || document.querySelector("cart-items");
  var submitButton = thisButton;
  var form = document.querySelector('[id^="product-upsell-template-' + thisButton.dataset.formid + '--"]');
  if (document.querySelector("cart-drawer")) submitButton.setAttribute("aria-haspopup", "dialog");

  if (submitButton.getAttribute("aria-disabled") === "true") return;

  submitButton.setAttribute("aria-disabled", true);
  submitButton.classList.add("loading");
  submitButton.querySelector(".loading-overlay__spinner").classList.remove("hidden");

  const config = fetchConfig("javascript");
  config.headers["X-Requested-With"] = "XMLHttpRequest";
  delete config.headers["Content-Type"];

  const formData = new FormData(form);
  if (thisButton.dataset.cartType != "page") {
    formData.append(
      "sections",
      cart.getSectionsToRender().map((section) => section.id)
    );
    formData.append("sections_url", window.location.pathname);
    cart.setActiveElement(document.activeElement);
  }
  config.body = formData;

  fetch(`${routes.cart_add_url}`, config)
    .then((response) => response.json())
    .then((response) => {
      if (response.status) {
        submitButton.setAttribute("aria-disabled", true);
        submitButton.querySelector("span").classList.add("hidden");
        return;
      }
      thisButton.error = false;
      if (thisButton.dataset.cartType != "page") {
        cart.renderContents(response);
      } else {
        window.location.href = window.location.href;
      }
    })
    .catch((e) => {
      console.error(e);
    })
    .finally(() => {
      submitButton.classList.remove("loading");
      if (cart && cart.classList.contains("is-empty")) cart.classList.remove("is-empty");
      submitButton.querySelector(".loading-overlay__spinner").classList.add("hidden");
    });
}

function changeVariantEvent(thisVariant) {
  thisVariant.closest(".product-upsell-template").querySelector("#formUpsellId").value = thisVariant.value;
}

initUpsellSlider();

function initUpsellSlider() {
  var upsellsContainer = document.querySelector(".cart-drawer-upsell-wrapper");
  var upsells = document.querySelectorAll(".cart-drawer-upsell_container");
  var nbOfUpsells = upsells.length - 1;

  if (upsellsContainer == null) return;

  if (upsells.length == 1) {
    document.querySelectorAll(".sliderButton").forEach((button) => {
      button.style.display = "none";
    });
    document.querySelector(".cart-drawer-upsell_container").style.marginLeft = "0";
    document.querySelector(".cart-drawer-upsell_container").style.marginRight = "0";
  }

  if (upsells[0] != null) {
    upsells[0].style.display = "flex";
    upsellsContainer.dataset.currentSlide = 0;
    upsellsContainer.dataset.nextSlide = 1;
    upsellsContainer.dataset.prevSlide = nbOfUpsells;
    if (nbOfUpsells > 1) {
      document.querySelectorAll(".cart-drawer-upsell_container").forEach((item) => {
        item.classList.add("hasSlider");
      });
    }
  }
}

function prevSlide() {
  var upsellsContainer = document.querySelector(".cart-drawer-upsell-wrapper");
  var upsells = document.querySelectorAll(".cart-drawer-upsell_container");
  var nbOfUpsells = upsells.length - 1;
  upsells[upsellsContainer.dataset.currentSlide].style.display = "none";
  upsells[upsellsContainer.dataset.prevSlide].style.display = "flex";

  var mightBePrev = parseInt(upsellsContainer.dataset.currentSlide) - 1;

  if (mightBePrev == 0) {
    upsellsContainer.dataset.currentSlide = 0;
    upsellsContainer.dataset.nextSlide = 1;
    upsellsContainer.dataset.prevSlide = nbOfUpsells;
    return;
  }

  if (mightBePrev < 0) {
    upsellsContainer.dataset.currentSlide = nbOfUpsells;
    upsellsContainer.dataset.nextSlide = 0;
  } else {
    upsellsContainer.dataset.currentSlide--;
    upsellsContainer.dataset.nextSlide = parseInt(upsellsContainer.dataset.currentSlide) + 1;
  }
  upsellsContainer.dataset.prevSlide = parseInt(upsellsContainer.dataset.currentSlide) - 1;
}

function nextSlide() {
  var upsellsContainer = document.querySelector(".cart-drawer-upsell-wrapper");
  var upsells = document.querySelectorAll(".cart-drawer-upsell_container");
  var nbOfUpsells = upsells.length - 1;
  upsells[upsellsContainer.dataset.currentSlide].style.display = "none";
  upsells[upsellsContainer.dataset.nextSlide].style.display = "flex";

  var mightBeNext = parseInt(upsellsContainer.dataset.currentSlide) + 1;

  if (mightBeNext == nbOfUpsells) {
    upsellsContainer.dataset.currentSlide = nbOfUpsells;
    upsellsContainer.dataset.nextSlide = 0;
    upsellsContainer.dataset.prevSlide = nbOfUpsells - 1;
    return;
  }

  if (mightBeNext > nbOfUpsells) {
    upsellsContainer.dataset.currentSlide = 0;
    upsellsContainer.dataset.prevSlide = nbOfUpsells;
  } else {
    upsellsContainer.dataset.currentSlide++;
    upsellsContainer.dataset.prevSlide = parseInt(upsellsContainer.dataset.currentSlide) - 1;
  }
  upsellsContainer.dataset.nextSlide = parseInt(upsellsContainer.dataset.currentSlide) + 1;
}
