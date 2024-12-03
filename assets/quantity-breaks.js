class QuantityBreaks extends HTMLElement {
  constructor() {
    super();
    this.main_product_form = document.querySelector('.product-form form[action="/cart/add"]') || document.querySelector('.product__page form[action="/cart/add"]') || document.querySelector('.product form[action="/cart/add"]') || document.querySelector('form[action="/cart/add.js"]') || document.querySelector('form[action="/cart/add"]');
    this.main_product_section_id = this.dataset.sectionId;
    this.show_variant_picker = this.getAttribute("data-show-variant-picker") == "true" ? true : false;

    if (this.main_product_form === null) return console.error("No product form found");

    // update when variant changes (works with Broadcast, Prestige, Dawn & co, Impulse)
    if (this.main_product_form.querySelector('input[name="id"]') !== null) {
      this.main_product_form.querySelector('input[name="id"]').addEventListener("change", (event) => {
        this.renderQuantityBreaks(event.target.value);
      });
    } else {
      if (typeof subscribe === "function") {
        this.variantChangeSubscriber = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
          this.renderQuantityBreaks(event.data.variant.id);
        });
      } else {
        document.addEventListener("variant:change", (event) => {
          this.renderQuantityBreaks(event.detail.variant.id);
        });
      }
    }
  }

  connectedCallback() {
    this.updateFormInputs(this.getSelectedQuantity());

    if (this.show_variant_picker === false) {
      // update when quantity changes
      this.querySelectorAll(".quantity-break").forEach((quantity_break) => {
        quantity_break.addEventListener("click", () => {
          this.selectQuantity(quantity_break);
          this.updateFormInputs(quantity_break);
        });
      });
    } else {
      // update when variant changes in quantity break
      this.querySelectorAll(".quantity-break").forEach((quantity_break) => {
        quantity_break.addEventListener("click", () => {
          this.selectQuantity(quantity_break);
          setTimeout(() => {
            this.checkSelectedVariantsAvailability(quantity_break);
            this.updateFormInputs(quantity_break);
          });
        });

        quantity_break.querySelectorAll(".quantity-break_variant-picker--select").forEach((select) => {
          select.addEventListener("change", () => {
            setTimeout(() => {
              this.checkSelectedVariantsAvailability(quantity_break);
              this.updateFormInputs(quantity_break);
            });
          });
        });
      });
    }
  }

  renderQuantityBreaks(variant_id) {
    this.classList.add("loading");
    var variant_param = "?variant=" + variant_id + "&";
    if (variant_id === undefined) variant_param = "?";

    fetch(window.location.pathname + variant_param + "section_id=" + this.main_product_section_id)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, "text/html");

        const QuantityBreaksSource = html.querySelector("quantity-breaks");
        const QuantityBreaksDestination = document.querySelector("quantity-breaks");

        if (QuantityBreaksSource && QuantityBreaksDestination) {
          QuantityBreaksDestination.innerHTML = QuantityBreaksSource.innerHTML;
          QuantityBreaksDestination.connectedCallback();
        }
      })
      .then(() => {
        this.classList.remove("loading");
      });
  }

  selectQuantity(quantity_break) {
    if (quantity_break.classList.contains("disabled-quantity-break")) return;
    this.resetSelectedQuantity();
    quantity_break.classList.add("selected-quantity-break");
  }

  resetSelectedQuantity() {
    this.querySelectorAll(".quantity-break").forEach((quantity_break) => {
      quantity_break.classList.remove("selected-quantity-break");
    });
  }

  updateFormInputs(quantity_break) {
    this.clearFormInputs();
    if (this.show_variant_picker === false) {
      if (this.main_product_form.querySelector('input[name="quantity"]')) {
        this.main_product_form.querySelector('input[name="quantity"]').value = quantity_break.getAttribute("data-quantity");
      } else {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "quantity";
        input.value = quantity_break.getAttribute("data-quantity");
        this.main_product_form.appendChild(input);
      }
    } else {
      const variantsPickers = quantity_break.querySelectorAll("quantity-break-variant-picker");
      if (variantsPickers.length > 0) {
        variantsPickers.forEach((variantsPicker, index) => {
          if (index === 0) {
            this.main_product_form.querySelector('input[name="id"]').value = variantsPicker.dataset.id;
          } else {
            const inputName = `items[${index}][id]`;
            const inputValue = variantsPicker.dataset.id;
            const inputElement = document.createElement("input");
            inputElement.type = "hidden";
            inputElement.name = inputName;
            inputElement.value = inputValue;
            this.main_product_form.appendChild(inputElement);
          }
        });
      }
    }
  }

  clearFormInputs() {
    // remove all the inputs in the form that the name starts with "items"
    const inputs = this.main_product_form.querySelectorAll('input[name^="items"]');
    inputs.forEach((input) => {
      this.main_product_form.removeChild(input);
    });
  }

  getSelectedQuantity() {
    return this.querySelector(".selected-quantity-break");
  }

  checkSelectedVariantsAvailability(quantity_break) {
    const variantsSelectedAvailable = Array.from(quantity_break.querySelectorAll("quantity-break-variant-picker")).every((fieldset) => fieldset.dataset.available === "true");
    if (variantsSelectedAvailable) {
      this.toggleAddButton(false, "", false);
    } else {
      this.toggleAddButton(true, "", false);
    }
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = this.main_product_form;
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] .addbtntext');
    if (!addButton) return;

    if (disable) {
      addButton.setAttribute("disabled", "disabled");
      if (text) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute("disabled");
      addButtonText.textContent = window.variantStrings.addToCart;
    }
    if (!modifyClass) return;
  }
}

customElements.define("quantity-breaks", QuantityBreaks);

class QuantityBreakVariantPicker extends HTMLElement {
  constructor() {
    super();
    this.quantityBreaks = document.querySelector("quantity-breaks");
    this.inputs = this.querySelectorAll('input[type="radio"]');
    this.selects = this.querySelectorAll("select");
    this.optionsNames = this.querySelectorAll("legend span");
    this.options = [];
    this.currentVariant = this.dataset.id;
    this.variantData = JSON.parse(this.quantityBreaks.querySelector('[type="application/json"]').textContent);
  }

  connectedCallback() {
    this.updateOptions();
    this.updateVariantStatuses();
    this.inputs.forEach((input) => {
      input.addEventListener("change", (event) => {
        this.onChange(event);
      });
    });
    this.selects.forEach((select) => {
      select.addEventListener("change", (event) => {
        this.onChange(event);
      });
    });
  }

  onChange() {
    this.updateOptions();
    this.updateDataId();
    this.updateOptionsNames();
    this.updateVariantStatuses();
  }

  updateOptions() {
    this.options = [];
    this.options.push(
      ...Array.from(this.querySelectorAll('input[type="radio"]:checked'), (element) => {
        if (element.tagName === "INPUT") {
          return element.value;
        }
      })
    );
    this.options.push(
      ...Array.from(this.querySelectorAll("select"), (element) => {
        if (element.tagName === "SELECT") {
          return element.value;
        }
      })
    );
  }

  updateDataId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
    this.dataset.id = this.currentVariant.id;
    if (this.currentVariant.available === false) {
      this.dataset.available = "false";
    } else {
      this.dataset.available = "true";
    }
  }

  updateVariantStatuses() {
    const selectedOptions = this.querySelectorAll(":checked");
    const inputWrappers = [...this.querySelectorAll("fieldset")];
    let selectedOptionOneVariants = null;
    let selectedOptionTwoVariants = null;
    let selectedOptionThreeVariants = null;
    if (selectedOptions[0]) {
      selectedOptionOneVariants = this.variantData.filter((variant) => selectedOptions[0].value === variant.option1);
    }
    if (selectedOptions[1]) {
      selectedOptionTwoVariants = this.variantData.filter((variant) => selectedOptions[1].value === variant.option2);
    }
    if (selectedOptions[2]) {
      selectedOptionThreeVariants = this.variantData.filter((variant) => selectedOptions[2].value === variant.option3);
    }
    inputWrappers.forEach((option, index) => {
      if (selectedOptions.length <= 1) return;
      if (index === 0) {
        const optionInputs = [...option.querySelectorAll('input[type="radio"], option')];
        const previousOptionSelected = inputWrappers[index + 1].querySelector(":checked").value;
        const availableOptionInputsValue = selectedOptionTwoVariants.filter((variant) => variant.available && variant[`option${index + 2}`] === previousOptionSelected).map((variantOption) => variantOption[`option${index + 1}`]);
        this.setInputAvailability(optionInputs, availableOptionInputsValue);
      } else {
        const optionInputs = [...option.querySelectorAll('input[type="radio"], option')];
        const previousOptionSelected = inputWrappers[index - 1].querySelector(":checked").value;
        const availableOptionInputsValue = selectedOptionOneVariants.filter((variant) => variant.available && variant[`option${index}`] === previousOptionSelected).map((variantOption) => variantOption[`option${index + 1}`]);
        this.setInputAvailability(optionInputs, availableOptionInputsValue);
      }
    });
  }

  setInputAvailability(elementList, availableValuesList) {
    elementList.forEach((element) => {
      const value = element.getAttribute("value");
      const availableElement = availableValuesList.includes(value);

      if (element.tagName === "INPUT") {
        if (availableElement) {
          element.classList.remove("disabled");
        } else {
          element.classList.add("disabled");
        }
      } else if (element.tagName === "OPTION") {
        element.innerText = availableElement ? value : window.variantStrings.unavailable_with_option.replace("[value]", value);
      }
    });
  }

  updateOptionsNames() {
    this.optionsNames.forEach((optionName, index) => {
      optionName.innerText = this.options[index];
    });
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.quantityBreaks.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}
customElements.define("quantity-break-variant-picker", QuantityBreakVariantPicker);
