let variantElms = document.querySelectorAll('.product-variant');
let variantsObj = [];

variantElms.forEach(function(variantElm) {
  variantsObj.push(
    {
      id: variantElm.dataset.variantId,
      inventory_qty: variantElm.dataset.variantInventoryQty
    })
});

