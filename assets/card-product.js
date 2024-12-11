document.addEventListener('DOMContentLoaded', function () {
  const observer = new MutationObserver(() => {
    const quantitySelectors = document.querySelectorAll('.quantity-selector');
    if (quantitySelectors.length > 0) {
      console.log('Elements found:', quantitySelectors);
      observer.disconnect(); // Arrêter l'observation une fois les éléments trouvés
      initScript(quantitySelectors); // Lancer ton script ici
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
});

function initScript(quantitySelectors) {
  quantitySelectors.forEach((selector) => {
    const container = selector.closest('.form_button_cart');
    const addToCartButton = container?.querySelector('.add-to-cart-button');
    const priceDisplay = container?.querySelector('.price-display');

    if (selector && addToCartButton && priceDisplay) {
      const updateButtonText = () => {
        const selectedOption = selector.options[selector.selectedIndex];
        const selectedPrice = selectedOption.getAttribute('data-price');
        const selectedComparePrice = selectedOption.getAttribute('data-compare-price');

        if (selectedPrice || selectedComparePrice) {
          priceDisplay.innerHTML = '';

          if (selectedComparePrice) {
            const comparePriceSpan = document.createElement('span');
            comparePriceSpan.classList.add('compare-price');
            comparePriceSpan.textContent = selectedComparePrice;
            priceDisplay.appendChild(comparePriceSpan);
          }

          if (selectedPrice) {
            const priceSpan = document.createElement('span');
            priceSpan.classList.add('current-price');
            priceSpan.textContent = ` ${selectedPrice}`;
            priceDisplay.appendChild(priceSpan);
          }
        } else {
          priceDisplay.textContent = '';
        }
      };

      updateButtonText();
      selector.addEventListener('change', updateButtonText);
    }
  });
}
