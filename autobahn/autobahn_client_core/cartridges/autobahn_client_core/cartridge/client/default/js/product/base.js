'use strict';

var base = require('integrations/product/base');

base.addToCart = function () {
    var scope = this;

    $(document).on('click', 'button.add-to-cart, button.add-to-cart-global', function (e) {
        e.stopPropagation();  // prevent the click from reaching the <a>
        e.preventDefault();   // prevent the <a> default if it's triggered somehow
        var addToCartUrl;
        var pid;
        var pidsObj;
        var setPids;
        var $button = $(this);
        var getCartUrl = $(this).siblings('.get-cart-url').val();

        $('body').trigger('product:beforeAddToCart', this);

        if ($('.set-items').length && $(this).hasClass('add-to-cart-global')) {
            setPids = [];

            $('.product-detail').each(function () {
                if (!$(this).hasClass('product-set-detail')) {
                    setPids.push({
                        pid: $(this).find('.product-id').text(),
                        qty: $(this).find('.quantity-select').val(),
                        options: scope.methods.getOptions($(this)),
                    });
                }
            });
            pidsObj = JSON.stringify(setPids);
        }

        pid = $(this).data('pid') || scope.methods.getPidValue($(this));

        var $productContainer = $(this).closest('.product-detail');
        if (!$productContainer.length) {
            $productContainer = $(this).closest('.quick-view-dialog').find('.product-detail');
            var $productModalbody = $(this).closest('.modal-content');
            addToCartUrl = scope.methods.getAddToCartUrl($productModalbody);
        } else {
            addToCartUrl = scope.methods.getAddToCartUrl($productContainer);
        }

        var form = {
            pid: pid,
            pidsObj: pidsObj,
            childProducts: scope.methods.getChildProducts(),
            quantity: scope.methods.getQuantitySelected($(this)),
        };

        // handle add-to-cart on PLP page --start
        if(!form.pid){
            pid = $(this).data('pid');
            form.pid = pid;
        }
        if(!addToCartUrl){
            addToCartUrl = $(this).siblings('.add-to-cart-url').val();
        }
        if(!form.quantity){
            form.quantity = 1;
        }
        // handle add-to-cart on PLP page --end

        //Handle Frenzy search add to cart --start
        if(!getCartUrl){
            getCartUrl = $("#getCartUrl").val();
        }
        if(!addToCartUrl){
            addToCartUrl = $("#addToCartUrl").val();
        }
        //Handle Frenzy search add to cart --end

        if (!$('.bundle-item').length) {
            form.options = scope.methods.getOptions($productContainer);
        }

        $(this).trigger('updateAddToCartFormData', form);
        if (addToCartUrl) {
            $.ajax({
                url: addToCartUrl,
                method: 'POST',
                data: form,
                success: function (data) {
                    scope.methods.handlePostCartAdd(data);
                    $('body').trigger('product:afterAddToCart', data);
                    $('body').trigger('product:afterAddToCartQuickview', data); //cart page quickview only
                    $('body').trigger('product:preloadCartImages', data); //Preload the cart images
                    scope.methods.miniCartReportingUrl(data.reportingURL);

                    if (!data.error) {
                        $button.text('Added To Cart').prop('disabled', true);
                        window.showAddToCartStatus?.();
                    }
                },
                error: function (error) {
                    scope.methods.handlePostCartAdd(error.responseJSON)
                    $.spinner().stop();
                },
            });
        }
    });

    // On page load to check for each button on PLP to verify if products already added to cart or not...
    checkLoadedProductsForCartData();

    // on cart update, when product removed from cart from PLP page
    $('body').on('cart:update', function(e, data, uuid, productID){
        $('button.add-to-cart:disabled').each(function(index){
            var pid = scope.methods.getPidValue($(this));
            if(!pid){
                pid = $(this).data('pid');
            }
            if (productID && pid && pid == productID) {
                var cartUrl = $(this).siblings('.get-cart-url').val();
                if(!cartUrl){
                    cartUrl = $("#getCartUrl").val();
                }
                showAddToCartStatus(cartUrl, pid, this);
            }
        });
    });

    $('body').on('search:showMore--success', function(){
        checkLoadedProductsForCartData();
    });

    function checkLoadedProductsForCartData(){
        var addToCartButton = $('button.add-to-cart');
        var cartUrl = addToCartButton.siblings('.get-cart-url').val();
        if(!cartUrl){
            cartUrl = $("#getCartUrl").val();
        }

        if(addToCartButton.length > 0){
            const data = sendRequestGetResponse(cartUrl, "GET", null);
            if(data === null){
                return;
            }
            const cartProducts = data.items;
            const cartProductIds = cartProducts.map(product => product.id);
            $.each(cartProductIds, function(index, pId){
                var addToCartButton = $(`button.add-to-cart[data-pid='${pId}']`);
                if(addToCartButton.length > 0){
                    addToCartButton.html(`<i class="fa fa-shopping-bag"></i>`+ "Added to Cart");
                    addToCartButton.attr('disabled', 'disabled');
                }
            });
        }
    }

    function sendRequestGetResponse(getCartUrl, method, reqBody=null){
        var xhr = new XMLHttpRequest();
        xhr.open(method, getCartUrl, false);
        try {
            xhr.send(reqBody);
            if (xhr.status === 200) {
                return JSON.parse(xhr.responseText);
            } else {
                console.error("Request failed with status: " + xhr.status);
                return null;
            }
        } catch (error) {
            console.error('Failed to check if the product is in the cart:', error);
            return null;
        }
    }

    function isAddedToCart(getCartUrl, pid){
        const data = sendRequestGetResponse(getCartUrl, "GET", null);
        if(data === null){
            return false;
        }
        const cartProducts = data.items;
        const cartProductIds = cartProducts.map(product => product.id); //storing only IDs
        return cartProductIds.includes(pid);
    }

    function showAddToCartStatus(getCartUrl, pid, cartButton){
        const isProductInCart = isAddedToCart(getCartUrl, pid);
        const stickyBarElementBtn = document.querySelector('#addtocart-sticky-bar-isml button');
        let addToCartButton = document.querySelector('#add-to-cart-template .add-to-cart');
        if(!addToCartButton){
            addToCartButton = cartButton;
        }
        try {
            let buttonText = isProductInCart ? 'Added to Cart' : 'Add to Cart';
            if(stickyBarElementBtn){
                stickyBarElementBtn.innerHTML = buttonText;
                stickyBarElementBtn.disabled = isProductInCart;
            }
            if(addToCartButton){
                addToCartButton.innerHTML = `<i class="fa fa-shopping-bag"></i>`+ buttonText;
                addToCartButton.disabled = isProductInCart;
            }
        } catch (error) {
            console.log(error);
        }
    }
};

module.exports = base;
