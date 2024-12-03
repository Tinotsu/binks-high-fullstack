//Changement de variante -> Update image et ID
document.querySelectorAll('.bundle-select').forEach(select => {
  select.addEventListener('change', function () {
    select.closest('.bundle-item').querySelector('.bundle-product-image').src = this.options[this.selectedIndex].dataset.variantImgsrc
    select.closest('.bundle-item').querySelector('.bundle-product-price').innerHTML = this.options[this.selectedIndex].dataset.variantPrice
    if(select.dataset.type == "main" && document.querySelector('#mainProductIdInput') != null) document.querySelector('#mainProductIdInput').value = this.value
    if(select.dataset.type == "bundle" && document.querySelector('#bundleProductIdInput') != null) document.querySelector('#bundleProductIdInput').value = this.value
  })
})

if (!customElements.get('product-bundle-form')) {
    customElements.define('product-bundle-form', class ProductBundleForm extends HTMLElement {
      constructor() {
        super();
        this.form = this.querySelector('form');
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');
      }
  
      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;
  
        this.handleErrorMessage();
  
        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading-overlay__spinner').classList.remove('hidden');
  
        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];
  
        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id));
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;
  
        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              this.handleErrorMessage(response.description);
  
              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButton.querySelector('span').classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }
  
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener('modalClosed', () => {
                setTimeout(() => { this.cart.renderContents(response) });
              }, { once: true });
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading-overlay__spinner').classList.add('hidden');
          });
      }
  
      handleErrorMessage(errorMessage = false) {
        this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');
  
        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);
  
        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }
    });
  }