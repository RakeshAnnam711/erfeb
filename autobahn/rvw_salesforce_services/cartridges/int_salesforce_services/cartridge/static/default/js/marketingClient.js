'use strict';

$('document').ready(function() {
	var accountId = $('#marketing-cloud').data('account-id');
	var etmcActive = false;
	if (typeof _etmc !== 'undefined' && _etmc !== null) {
		etmcActive = true;
	}
	var metadataArray = $('#marketing-cloud').data('metadata');

	try {
		for (var index = 0; index < metadataArray.length; index++) {
			var currentMetadata = metadataArray[index];
			if (etmcActive) {
				_etmc.push(currentMetadata);
			}
		}
	} catch (ex) {
		etmcActive = false;
	}

	if (etmcActive) {
		$('body').on('cart:update', function(e, data, uuid) {
			cartUpdated();
		});

		$('body').on('product:afterAddToCart', function(e, data, uuid) {
			cartUpdated();
		});
	}
});

function cartUpdated() {
	var accountId = $('#marketing-cloud').data('account-id');
	var cartQuantity = $('.minicart-quantity').first().text();
	try {
		_etmc.push(["setOrgId", accountId]);
	} catch (ex) {
	}
	if (cartQuantity == 0) {
		try {
			_etmc.push(["trackCart", { "clear_cart": true } ]);
		} catch (ex) {
		}
	} else {
		console.log('cart not empty - qty: ' + cartQuantity);
		var url = $('#marketing-cloud').data('cart-info-url');
		$.ajax({
			url: url,
			type: 'get',
			dataType: 'json',
			success: function (data) {
				if (data.collectInfos) {
					var cartInfo = data.collectInfos[0];
					_etmc.push(cartInfo);
				}
			},
			error: function (err) {
			}
		});
	}
}
