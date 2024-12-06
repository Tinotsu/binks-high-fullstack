document.addEventListener('DOMContentLoaded', function () {
    const quantitySelectors = document.querySelectorAll('.quantity-selector');
  
    quantitySelectors.forEach((selector) => {
      const container = selector.closest('.form_button_cart'); 
      const addToCartButton = container.querySelector('.add-to-cart-button');
      const priceDisplay = container.querySelector('.price-display');
  
      if (selector && addToCartButton && priceDisplay) {
        const updateButtonText = () => {
          const selectedOption = selector.options[selector.selectedIndex];
          const selectedPrice = selectedOption.getAttribute('data-price');
          priceDisplay.textContent = selectedPrice ? ` ${selectedPrice}` : '';
        };
  
        updateButtonText();
  
        selector.addEventListener('change', updateButtonText);
      }
    });
  });
  
  