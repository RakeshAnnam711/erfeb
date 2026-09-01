
let authUrl_Frenzy = "https://wgaca.search.frenzy.ai/most-clicked-skus";
let eventsUrl_Frenzy = "https://wgaca.search.frenzy.ai/events";

let number_days_ago = 5
let num_matching = 15;

let currency_symbol_Frenzy = '';
let filter_order_Frenzy = [];
let money_format_Frenzy = function (t, r) { function e(t, r) { return void 0 === t ? r : t } function a(t, r, a, o) { if (r = e(r, 2), a = e(a, ","), o = e(o, "."), isNaN(t) || null == t) return 0; t = (t / 100).toFixed(r); var n = t.split("."); return n[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + a) + (n[1] ? o + n[1] : "") } "string" == typeof t && (t = t.replace(".", "")); var o = "", n = /\{\{\s*(\w+)\s*\}\}/, i = r || this.money_format; switch (i.match(n)[1]) { case "amount": o = a(t, 2); break; case "amount_no_decimals": o = a(t, 0); break; case "amount_with_comma_separator": o = a(t, 2, ".", ","); break; case "amount_with_space_separator": o = a(t, 2, " ", ","); break; case "amount_with_period_and_space_separator": o = a(t, 2, " ", "."); break; case "amount_no_decimals_with_comma_separator": o = a(t, 0, ".", ","); break; case "amount_no_decimals_with_space_separator": o = a(t, 0, ".", ""); break; case "amount_with_space_separator": o = a(t, 2, ",", ""); break; case "amount_with_apostrophe_separator": o = a(t, 2, "'", ".") }return i.replace(n, o) };


let frenzy_setting_recomm_data = {
    "layout_type": "2",
    "grid_items_per_row": "6",
    "total_items": "10",
    "grid_show_secondary_image": "1",
    "grid_title": "YOU MAY ALSO LIKE",
    "grid_align_text": "3",
    "title_align": "3"
};

let frenzy_setting_recomm_css = {
    "card_border_color": "ffffff",
    "arrow_color": "#000000",
    "text_color": "#000000",
    "price_color": "#999999",
    "compare_price_color": "#000000"
};

window.addEventListener('click', function (e) {
    try {
        const target = e.target.closest('.frenzy_product_item');
        if (target) {
            const productId = target.dataset.id;
            const queryId = target.getAttribute('data-query-id');

            if (productId && queryId) {
                send_events(productId, queryId);
            } else {
                console.warn('Missing productId or queryId for Frenzy tracking.');
            }
        }
    } catch (error) {
        console.error('Error handling Frenzy product click event:', error);
    }
});

async function send_events(product_id, query_id) {
    try {
        let frenzyUserID = window.Customer?.customerNo || getCookieValue('__frenzy_user_id');        
        let data_json = JSON.stringify([{
            sku: product_id,
            event_name: "most_clicked_skus_carousel_product_click",
            query_id: query_id,
            user_id: frenzyUserID
        }]);
        const response = await fetch(eventsUrl_Frenzy, {
            method: 'POST',
            body: data_json,
            headers: {
                'Content-Type': 'application/json',
                'x-frenzy-authorization': 'b423c0ba-a5f5-4c32-b369-ad7bdc94a1b5'
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending event:', error);
    }
}


let frenzy_setting_recomm_html = "<div class='frenzy_product_item' data-id='[[product_id]]' data-query-id='[[query_id]]' onclick='send_events(\"[[product_id]]\", \"[[query_id]]\")'>" +
    "<figure>" +
    "<a href='[[product_url]]'>" +
    "<img class='frenzy_img frenzy_img_first' src='[[product_featured_image]]' alt='[[product_title]]'>" +
    "</a>" +
    "</figure>" +
    "</div>";



/*
* Append stylesheet
*/
let head_Frenzy = document.getElementsByTagName('HEAD')[0];
let search_link_Frenzy = document.createElement('link');
search_link_Frenzy.rel = 'stylesheet';
search_link_Frenzy.type = 'text/css';
search_link_Frenzy.href = 'https://shopify.plugin.frenzy.ai/api/public/assets/css/frenzy-search.css';

let swiper_link_Frenzy = document.createElement('link');
swiper_link_Frenzy.rel = 'stylesheet';
swiper_link_Frenzy.type = 'text/css';
swiper_link_Frenzy.href = 'https://shopify.plugin.frenzy.ai/api/public/assets/css/swiper.min.css';

head_Frenzy.appendChild(search_link_Frenzy);
head_Frenzy.appendChild(swiper_link_Frenzy);

const script_Frenzy = document.createElement('script');
script_Frenzy.src = 'https://shopify.plugin.frenzy.ai/api/public/assets/js/swiper.min.js';
// Append to the `head` element
document.head.appendChild(script_Frenzy);


/*
* Product Recommendation Section
*/
function getHomepageProducts(productData, settingData, gridHtml, query_id) {
    let product_grid_html = gridHtml;
    let recommendation_layout_mode = settingData.layout_type;
    if (productData.length === 0) {
        get_frenzy_home_page_section.style.display = "none"
    } else {
        get_frenzy_home_page_section.style.display = "block"
    }
    const title_align = settingData.title_align === '1' ? 'text_align-left' : settingData.title_align === '2' ? 'text_align-right' : 'text_align-center';
    {
        const shop_currency = get_frenzy_home_page_section.getAttribute('data-currency');
        let recommendationProductHTML = '';
        (productData || []).map((x, i) => {
            recommendationProductHTML += getProductGridItem(product_grid_html, x, settingData, shop_currency, query_id);
        })
        let recommendation_html = '<div class="frenzy_container">';
        recommendation_html += '<div class="frenzy_recommendation_contain">';
        recommendation_html += '<div class="recommendation_product_items frenzy_product_row">' + recommendationProductHTML + '</div>';
        recommendation_html += '</div>';
        recommendation_html += '</div>';
        get_frenzy_home_page_section.innerHTML = recommendation_html;
        if (recommendation_layout_mode === '2') {
            document.querySelector('.frenzy_home_page_section .recommendation_product_items').classList.add('swiper-wrapper', 'ltg_' + settingData.grid_items_per_row + '');
            document.querySelectorAll('.frenzy_home_page_section .frenzy_recommendation_contain')[0].insertAdjacentHTML('beforeend', '<span class="swiper-button-prev"></span><span class="swiper-button-next"></span>');
            setTimeout(function () {
                var swiper = new Swiper(".frenzy_home_page_section .frenzy_recommendation_contain", {
                    slidesPerView: 'auto',
                    spaceBetween: 0,
                    navigation: {
                        nextEl: ".swiper-button-next",
                        prevEl: ".swiper-button-prev"
                    },
                    freeMode: true,
                    pagination: {
                        el: ".swiper-pagination",
                        clickable: true,
                    }
                });
            }, 100);
        } else {
            document.querySelector('.frenzy_home_page_section .recommendation_product_items').classList.add('layout_type_grid', 'ltg_' + settingData.grid_items_per_row + '');
        }
    }
}


let get_frenzy_home_page_section = document.querySelector('.frenzy_home_page_section');

function getProductGridItem(html, x, settingData, shop_currency, query_id) {
    let product_grid_html = html;
    let main_grid_image = 'https://shopify.plugin.frenzy.ai/api/public/assets/images/placeholder_img.jpg';

    if (x.org_image_url) {
        if (x.org_image_url.includes(' ')) {
            let pro_image = (x.org_image_url).split(/(?=https?:\/\/)/);
            main_grid_image = pro_image[0].trim();
        } else {
            main_grid_image = x.org_image_url;
        }
    }
    // Domain and Locale modifications
    let prod_url = window?.CachedData?.isProduction === false ? x.org_prod_url.replace(/.*\/\/.*\.com\//gi, '/') : x.org_prod_url;
    if ([undefined, null, 'en-us'].indexOf(window.CachedData?.seoLocale) === -1) prod_url = prod_url.replace('en-us', window.CachedData?.seoLocale);
    let stock_available = x.org_stock_available === 'True' ? 'false' : 'true';
    let grid_class_name = settingData.layout_type === '1' ? 'frenzy_grid' : 'frenzy_grid swiper-slide';
    let grid_text_align = settingData.grid_align_text === '1' ? 'text_align_left' : settingData.grid_align_text === '2' ?
        'text_align_right' : 'text_align_center';

    product_grid_html = '<div class="' + grid_class_name + ' out_of_stock_' + stock_available + ' ' + grid_text_align + ' ' + '" >' + product_grid_html;
    product_grid_html = product_grid_html.replaceAll('[[query_id]]', query_id);
    product_grid_html = product_grid_html.replaceAll('[[product_featured_image]]', main_grid_image);
    product_grid_html = product_grid_html.replaceAll('[[product_id]]', x.sku);
    product_grid_html = product_grid_html.replaceAll('[[product_title]]', x.org_product);
    product_grid_html = product_grid_html.replaceAll('[[product_brand]]', x.org_brand);

    product_grid_html = product_grid_html.replaceAll('[[product_url]]', prod_url);
    product_grid_html = product_grid_html.replaceAll('[[product_sale_price]]', money_format_Frenzy((x.org_price *
        100), shop_currency));
    product_grid_html = product_grid_html + '</div>';
    return product_grid_html;
}

function getCookieValue(name) {
    let cookieName = name + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let cookieArray = decodedCookie.split(';');
    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i];
        while (cookie.charAt(0) == ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(cookieName) == 0) {
            return cookie.substring(cookieName.length, cookie.length);
        }
    }
    return "";
}

const getHomepageProductsApi = async () => {
    var present_date = new Date();
    var past_date = new Date(present_date);
    past_date.setDate(past_date.getDate() - number_days_ago);

    present_date = present_date.toISOString().split('T')[0]
    past_date = past_date.toISOString().split('T')[0]
    let frenzyUserID = window.Customer?.customerNo || getCookieValue('__frenzy_user_id');    
    var data_json = JSON.stringify({
        num_matching: num_matching,
        full_description: true,
        user_id: frenzyUserID,
    });
    try {
        const response = await fetch(authUrl_Frenzy, {
            method: 'POST',
            body: data_json,
            headers: {
                'Content-Type': 'application/json',
                'x-frenzy-authorization': 'b423c0ba-a5f5-4c32-b369-ad7bdc94a1b5'
            }
        });

        const data = await response.json();
        getHomepageProducts(data.matching_products, frenzy_setting_recomm_data, frenzy_setting_recomm_html, data.request_id);
        const recommendationCss = frenzy_setting_recomm_css;
        const cssdata = '.frenzy_home_page_section {margin-top: 2%;}' +
            '.frenzy_home_page_section .frenzy_product_item figure{border-color: #ffffff;} ' +
            '.frenzy_home_page_section .frenzy_product_item_detail, .frenzy_home_page_section .frenzy_product_item_detail h3 a{color:#000000} ' + '.frenzy_home_page_section .frenzy_product_price_sale{color:#222} ' +
            '.frenzy_home_page_section .frenzy_product_price_compare{color:#999999} ' +
            '.frenzy_home_page_section .frenzy_product_item {box-shadow: 0 0 10px #d4d4d4; border-radius: 5px;}' +
            '.frenzy_product_row .frenzy_grid {padding: 10px 10px;}' +
            '.swiper-button-prev, .swiper-rtl .swiper-button-next {left: -10px;}' +
            '.swiper-button-next, .swiper-rtl .swiper-button-prev {right: -10px;}' +
            '.frenzy_home_page_section .swiper-button-next:after, .frenzy_home_page_section .swiper-button-prev:after{color:#000000}';


        let head_Frenzy = document.head || document.getElementsByTagName('head')[0], style_Frenzy =
            document.createElement('style');
        head_Frenzy.appendChild(style_Frenzy);
        style_Frenzy.type = 'text/css';
        if (style_Frenzy.styleSheet) {
            style_Frenzy.styleSheet.cssText = cssdata;
        } else {
            style_Frenzy.appendChild(document.createTextNode(cssdata));
        }
    } catch (error) {
        console.error('Error fetching homepage products or rendering styles:', error);
    }
}

window.addEventListener("load", function () {
    let get_frenzy_home_page_section = document.querySelector('.frenzy_home_page_section');
    // Load Recommendation Section
    if (get_frenzy_home_page_section) {
        getHomepageProductsApi();
    }
});