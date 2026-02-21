// resetting active navigation
sessionStorage.setItem('activeNavLink', '');

let pagination_arrow_Frenzy = '<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path></svg>';
let close_arrow_Frenzy = '<svg viewBox="0 0 20 20"><path d="m11.414 10 4.293-4.293a.999.999 0 1 0-1.414-1.414L10 8.586 5.707 4.293a.999.999 0 1 0-1.414 1.414L8.586 10l-4.293 4.293a.999.999 0 1 0 1.414 1.414L10 11.414l4.293 4.293a.997.997 0 0 0 1.414 0 .999.999 0 0 0 0-1.414L11.414 10z"></path></svg>';
const filter_icon_Frenzy = '<span class="icon-filter"></span>'

const FRENZY_API_BASE_URL = "https://wgaca.search.frenzy.ai/";
let authUrl_Frenzy = FRENZY_API_BASE_URL;
var scrollTop = window.scrollY;
function getCookieValue(name) {
  let cookieName = name + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let cookieArray = decodedCookie.split(';');
  for(let i = 0; i < cookieArray.length; i++) {
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
let stripeMidValue = getCookieValue('__stripe_mid');

// settings for search results
let search_page_settings = {
  "layout_type": "1",
  "filter": "1",
  "filter_title": "Filters",
  "grid_align_text": "1",
  "grid_items_per_row": "3",
  "grid_show_secondary_image": "0",
  "results_per_page": "24",
  "sort": "1",
  "counts": "1",
  "image_border_show": "1"
};

// css for search page settings
let search_page_css = {
  "card_border_color": "ffffff",
  "text_color": "000000",
  "price_color": "999999",
  "compare_price_color": "000000",
  "title_font_size": "26"
};

// fallback image
let prodImgFallbackFrenzySearch = document.getElementById('prodImgFallbackFrenzySearch').value || '';
// single product card HTML
let grid_html = 
"<a href='[[product_url]]' aria-label='[[product_title]]'>" +
"<div class='frenzy_product_item' data-id='[[product_id]]'>"+
  "<figure>"+
  `<isif condition='${window.wishlistPref}'>
      <button data-href='${window.Wishlist_ToggleProduct}'
      class="wishlist wishlist-toggle-product"
      data-wishlistpid="[[product_id]]"
      data-productname="[[product_title]]"
      data-gtmdata="[[gggData]]"
      data-isinwishlist="[[data_product_isinwishlist]]"
      aria-label="Toggle wishlist for [[product_title]]">
          <div class="wishlist-icon wishlist-icon-div [[product_isinwishlist]]" data-id='[[product_id]]'></div>
      </button>
  </isif>`+
    "<div class='frenzy_img_area'>" +
      `<img class='frenzy_img frenzy_img_first lazyload' data-src='[[product_featured_image]]' alt='[[product_title]]' loading='lazy' onerror="this.onerror=null;this.src='${prodImgFallbackFrenzySearch}'">` +
      `<img class='frenzy_img frenzy_img_second lazyload' data-src='[[product_second_image]]' alt='[[product_title]]' loading='lazy' onerror="this.onerror=null;this.src='${prodImgFallbackFrenzySearch}'">` +
    "</div>" +
  "</figure>" +
  "<div class='frenzy_product_item_detail'>" +
    "<div class='frenzy_product_brand'>[[product_brand]]</div>" +
    "<h3 class='frenzy_product_title'>" +
      "<div>[[product_title]]</div>" +
    "</h3>" +
    "<div class='frenzy_product_price_meta'>" +
      "<div class='frenzy_product_price_sale' style='color: [[product_sale_price_color]]'>[[product_sale_price]]</div>" +
      "<div class='frenzy_product_price_compare' style='color: #575757;'>[[product_compare_price]]</div>"+ //sale
    "</div>" +
    "<div class='add_to_cart_btn'>" +
        "<button class='add-to-cart btn btn-primary' data-pid='[[product_id]]' aria-label='Add [[product_id]] to cart' data-gtmdata='[[gggData]]'>" +
            "<i class='fa fa-shopping-bag'></i>Add to Cart" +
        "</button>" +
    "</div>" +
  "</div>" +
"</div>"+
"</a>";

let show_more_html = `
<div id='frenzy-more-results-button' class="frenzy-show-more">
    <div class="text-center">
        <button class="btn btn-outline-primary col-12 col-sm-4 more" aria-label="show more button">
           More Results
        </button>
    </div>
</div>

<!--- View All Results --->
<div id='frenzy-view-all-results-button' class="frenzy-view-all-results">
    <div class="text-center">
        <button class="btn btn-primary col-12 col-sm-4 more"  aria-label="view all results button">
          View All Results
        </button>
    </div>
</div>`
// Frenzy Search API retuns many filters (key), you can select which one to display (status) and change the display value (value).
let filter_order = [
  {
    "key": "category",
    "value": "Category",
    "status": "0"
  },
  {
    "key": "first category",
    "value": "Category",
    "status": "1"
  },
  {
    "key": "brand",
    "value": "Brand",
    "status": "1"
  },
  {
    "key": "org color",
    "value": "Color",
    "status": "1"
  },
  {
    "key": "price range",
    "value": "Price",
    "status": "1"
  },
  {
    "key": "material",
    "value": "Material",
    "status": "1"
  },
  {
    "key": "condition",
    "value": "Condition",
    "status": "1"
  },
  {
    "key": "org location",
    "value": "Find In Store",
    "status": "1"
  },
  {
    "key": "pattern",
    "value": "Pattern",
    "status": "1"
  },
  {
    "key": "collections",
    "value": "Edits",
    "status": "0"
  },
  {
    "key": "size",
    "value": "Size",
    "status": "0"
  },
  {
    "key": "style",
    "value": "Style",
    "status": "1"
  },
  {
    "key": "org material",
    "value": "Material",
    "status": "0"
  },
  {
    "key": "gender",
    "value": "Gender",
    "status": "0"
  },
  {
    "key": "type",
    "value": "Type",
    "status": "0"
  },
  {
    "key": "second category",
    "value": "Second Category",
    "status": "0"
  },
  {
    "key": "closure",
    "value": "Closure",
    "status": "0"
  },
  {
    "key": "heel",
    "value": "Heel",
    "status": "0"
  },
  {
    "key": "toe",
    "value": "Toe",
    "status": "0"
  },
  {
    "key": "detail",
    "value": "Detail",
    "status": "0"
  },
  {
    "key": "fit",
    "value": "fit",
    "status": "0"
  },
  {
    "key": "leg style",
    "value": "leg style",
    "status": "0"
  },
  {
    "key": "inseam",
    "value": "inseam",
    "status": "0"
  },
  {
    "key": "model",
    "value": "Model",
    "status": "0"
  },
  {
    "key": "length",
    "value": "length",
    "status": "0"
  },
  {
    "key": "pattern type",
    "value": "Pattern Type",
    "status": "0"
  },
  {
    "key": "wash",
    "value": "wash",
    "status": "0"
  },
  {
    "key": "shape",
    "value": "shape",
    "status": "0"
  },
  {
    "key": "trim material",
    "value": "Trim Material",
    "status": "0"
  },
  {
    "key": "bracelet material",
    "value": "Bracelet Material",
    "status": "0"
  },
  {
    "key": "case material",
    "value": "Case Material",
    "status": "0"
  },
  {
    "key": "case diameter",
    "value": "Case Diameter",
    "status": "0"
  },
  {
    "key": "strap width",
    "value": "Strap Width",
    "status": "0"
  },
  {
    "key": "bracelet size",
    "value": "Bracelet Size",
    "status": "0"
  },
  {
    "key": "lining",
    "value": "lining",
    "status": "0"
  },
  {
    "key": "handle",
    "value": "Handle",
    "status": "0"
  },
  {
    "key": "strap",
    "value": "Strap",
    "status": "0"
  },
  {
    "key": "shoe type",
    "value": "Shoe Type",
    "status": "0"
  },
  {
    "key": "heel height",
    "value": "Heel height",
    "status": "0"
  },
  {
    "key": "neckline",
    "value": "neckline",
    "status": "0"
  },
  {
    "key": "sleeve length",
    "value": "sleeve length",
    "status": "0"
  },
  {
    "key": "sleeve type",
    "value": "sleeve type",
    "status": "0"
  },
  {
    "key": "shoulder type",
    "value": "shoulder type",
    "status": "0"
  },
  {
    "key": "rise",
    "value": "rise",
    "status": "0"
  },
  {
    "key": "hem",
    "value": "hem",
    "status": "0"
  },
  {
    "key": "pocket",
    "value": "pocket",
    "status": "0"
  },
  {
    "key": "frames",
    "value": "frames",
    "status": "0"
  },
  {
    "key": "lens",
    "value": "lens",
    "status": "0"
  },
  {
    "key": "occasion",
    "value": "occasion",
    "status": "0"
  },
  {
    "key": "formality",
    "value": "formality",
    "status": "0"
  },
  {
    "key": "availability",
    "value": "availability",
    "status": "0"
  }
]

let currency_symbol_Frenzy = '';
let selected_page_Frenzy = 1, is_frenzy_page_css = true, total_page_no_Frenzy = 0, isFilterApplyPrice_Frenzy = false, isDisabledApplyBtn_Frenzy = false, isSeletedSortValue_Frenzy = 'best match';
let filterArray_Frenzy = {};  //keeping it empty to track applied filter count 0 in initial state
let filter_order_Frenzy = [];
let money_format_Frenzy = function(t,r){function e(t,r){return void 0===t?r:t}function a(t,r,a,o){if(r=e(r,2),a=e(a,","),o=e(o,"."),isNaN(t)||null==t)return 0;t=(t/100).toFixed(r);var n=t.split(".");return n[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g,"$1"+a)+(n[1]?o+n[1]:"")}"string"==typeof t&&(t=t.replace(".",""));var o="",n=/\{\{\s*(\w+)\s*\}\}/,i=r||this.money_format;switch(i.match(n)[1]){case"amount":o=a(t,2);break;case"amount_no_decimals":o=a(t,0);break;case"amount_with_comma_separator":o=a(t,2,".",",");break;case"amount_with_space_separator":o=a(t,2," ",",");break;case"amount_with_period_and_space_separator":o=a(t,2," ",".");break;case"amount_no_decimals_with_comma_separator":o=a(t,0,".",",");break;case"amount_no_decimals_with_space_separator":o=a(t,0,".","");break;case"amount_with_space_separator":o=a(t,2,",","");break;case"amount_with_apostrophe_separator":o=a(t,2,"'",".")}return i.replace(n,o)};
let shopURL_Frenzy = window.location.origin;
let searchURL_Frenzy = window.location.pathname;
let searchPageProductList = '';
let urlParams_Frenzy = new URLSearchParams(window.location.search);
let currentPageCount = 0;
let total_records = 0;
let viewAllResultsVisible = true;
if(urlParams_Frenzy.get('page')){
  selected_page_Frenzy = parseInt(urlParams_Frenzy.get('page'));
  // currentPageCount = parseInt(urlParams_Frenzy.get('page'));
}
if(urlParams_Frenzy.get('sort')){
  isSeletedSortValue_Frenzy = urlParams_Frenzy.get('sort');
}

/* * * * * * * *
 * Pagination Object to create the pagination panel *
  * * * * * * */
let Pagination = {
  code: '',
  // converting initialize data
  Extend: function(data) {
    data = data || {};
    Pagination.size = data.size;
    Pagination.page = data.page;
    Pagination.step = data.step;
  },

  // add pages by number (from [s] to [f])
  Add: function(s, f) {
    for (let i = s; i < f; i++) {
      Pagination.code += `<a aria-label='Go to Page ${i}'>` + i + '</a>';
    }
  },
  // add last page with separator
  Last: function() {
    Pagination.code += `<i>...</i><a aria-label='Go to Page ${i}'>` + Pagination.size + '</a>';
  },
  // add first page with separator
  First: function() {
    Pagination.code += '<a aria-label="Go to first page">1</a><i>...</i>';
  },
  // change page
  Click: function() {
    Pagination.page = +this.innerHTML;
    Pagination.Start();
    if(get_frenzy_search_page_section){
      getSearchPAgeFilterChangeApi(filterArray_Frenzy,Pagination.page - 1, true);
    }

  },
  // previous page
  Prev: function() {
    Pagination.page--;
    if (Pagination.page < 1) {
      Pagination.page = 1;
    }
    Pagination.Start();
    if(get_frenzy_search_page_section){
      getSearchPAgeFilterChangeApi(filterArray_Frenzy,Pagination.page - 1, true);
    }

  },
  // next page
  Next: function() {
    Pagination.page++;
    if (Pagination.page > Pagination.size) {
      Pagination.page = Pagination.size;
    }
    Pagination.Start();
    if(get_frenzy_search_page_section){
      getSearchPAgeFilterChangeApi(filterArray_Frenzy,Pagination.page - 1, true);
    }

  },
  // binding pages
  Bind: function() {
    let a = Pagination.e.getElementsByTagName('a');
    for (let i = 0; i < a.length; i++) {
      if (+a[i].innerHTML === Pagination.page) a[i].className = 'current';
      a[i].addEventListener('click', Pagination.Click, false);
    }
    selected_page_Frenzy = Pagination.page;

  },
  // write pagination
  Finish: function() {
    try {
      Pagination.e.innerHTML = Pagination.code;
      Pagination.code = '';
      Pagination.Bind();
    } catch (error) {
      console.log(error);
    }
  },
  // find pagination type
  Start: function() {
    if (Pagination.size < Pagination.step * 2 + 6) {
      Pagination.Add(1, Pagination.size + 1);
    }
    else if (Pagination.page < Pagination.step * 2 + 1) {
      Pagination.Add(1, Pagination.step * 2 + 4);
      Pagination.Last();
    }
    else if (Pagination.page > Pagination.size - Pagination.step * 2) {
      Pagination.First();
      Pagination.Add(Pagination.size - Pagination.step * 2 - 2, Pagination.size + 1);
    }
    else {
      Pagination.First();
      Pagination.Add(Pagination.page - Pagination.step, Pagination.page + Pagination.step + 1);
      Pagination.Last();
    }
    Pagination.Finish();
  },
  // binding buttons
  Buttons: function(e) {
    let nav = e.getElementsByTagName('button');
    nav[0].addEventListener('click', Pagination.Prev, false);
    nav[1].addEventListener('click', Pagination.Next, false);
  },
  // create skeleton
  Create: function(e) {
    try {
      let html = [
        '<button type="button" class="frenzy_pagination_btn prev" aria-label="Previous Page" '+( Pagination.page<=1 ? "disabled" :'')+' >'+pagination_arrow_Frenzy+'</button>', // previous button
        '<div class="frenzy_pagination_contain"></div>',  // pagination container
        '<button type="button" class="frenzy_pagination_btn next" aria-label="Next Page"'+( Pagination.page == total_page_no_Frenzy ? "disabled" :'')+'>'+pagination_arrow_Frenzy+'</button>'  // next button
      ];
      e.innerHTML = html.join('');
      Pagination.e = e.getElementsByTagName('div')[0];
      Pagination.Buttons(e);
    } catch (error) {
      console.log(error);
    }
  },

  // init the pagination object
  Init: function(e, data) {
    Pagination.Extend(data);
    // Pagination.Create(e);
    Pagination.Start();
  }
};

// create the pagination panel
// let init = function(total_page_number) {
//   Pagination.Init(document.getElementById('pagination'), {
//     size: total_page_number, // pages size
//     page: selected_page_Frenzy > 0 ? selected_page_Frenzy : 1,  // selected page
//     step: 2   // pages before and after current
//   });
// };


// collecting PIDs of all the wishlist products
const wishlistPIDs = window.UncachedData?.wishlistPIDs || [];

// create the product grid
function getProductGridItem(html,x,settingData,shop_currency,frenzy_request_id,frenzy_product_click, index, gtmDataList,searchTerm, resultsCount){
  let product_grid_html = html;
  // placeholder for the default image
  let main_grid_image = 'https://shopify.plugin.frenzy.ai/api/public/assets/images/placeholder_img.jpg';
  let second_grid_image = 'https://shopify.plugin.frenzy.ai/api/public/assets/images/placeholder_img.jpg';
  let grid_secondary_image = '';
  if(settingData.grid_show_secondary_image == '1'){
    grid_secondary_image = 'grid_secondary_image'
  }
  if(x.org_image_url){
    if(x.org_image_url.includes(' ')){
      let pro_image = (x.org_image_url).split(/(?=https?:\/\/)/);
      main_grid_image = pro_image[0].trim();
      second_grid_image=  pro_image[1].trim();
    }else{
      main_grid_image = x.org_image_url;
      second_grid_image= x.org_image_url;
    }
    let imagspilt = main_grid_image.split('/on/');
    let secondimagspilt = second_grid_image.split('/on/');
	main_grid_image = 'https://www.whatgoesaroundnyc.com/dw/image/v2/BGND_PRD/on/'+ imagspilt[1] + '?sw=200&sh=300';
	second_grid_image = 'https://www.whatgoesaroundnyc.com/dw/image/v2/BGND_PRD/on/'+ secondimagspilt[1] + '?sw=200&sh=300';

  }
  //modify domain and locale
  let pro_url = window?.CachedData?.isProduction === false ? x.org_prod_url.replace(/.*\/\/.*\.com\//gi,'/') : x.org_prod_url;
  if ([undefined, null, 'en-us'].indexOf(window.CachedData?.seoLocale) === -1) pro_url = pro_url.replace('en-us', window.CachedData?.seoLocale);
  let stock_available = x.org_stock_available ==='True' ? 'false' : 'true';
  //sale
  let sale_available = (x.org_price <  x.org_msrp_price) ? 'true' : 'false';
  let grid_class_name = settingData.layout_type === '1' ? 'frenzy_grid max_tile_width' : 'frenzy_grid swiper-slide';
  let grid_text_align = settingData.grid_align_text ==='1'? 'text_align_left' : settingData.grid_align_text ==='2' ? 'text_align_right' : 'text_align_center';

  //GTM
  let gtmdata = {};
	let pName = x.org_product;
	let pBrand = x.org_brand;
	let position = ++index;
  let discount_percent = 0;
  let discount_price = 0;

  let comparePrice = (x && x.org_msrp_price && x.org_msrp_price > x.org_price) ? money_format_Frenzy((x.org_msrp_price * 100),shop_currency) : '' ;
  if(comparePrice != '') {
    discount_price = x.org_msrp_price - x.org_price;
    discount_percent = ((discount_price / x.org_price) * 100).toFixed(2);
  }
  gtmdata.item_id = x.sku;
	gtmdata.price = x.org_price;
	gtmdata.item_brand = pBrand.replaceAll(/["]/g, '');
	gtmdata.item_name = pName.replaceAll(/["]/g, '');
	gtmdata.stock_status = (x.org_stock_available == 'True') ? 'In Stock' : 'Out of Stock';
	gtmdata.product_gender  = (x.org_gender) ? x.org_gender : 'Women';
  gtmdata.item_list_id = 'frenzysearch';
  gtmdata.item_list_name = 'frenzysearch'
  gtmdata.sale_status = (comparePrice == '') ? 'No Offer':'On Offer';
  gtmdata.discount = discount_price;
  gtmdata.item_category = '';
  gtmdata.item_category2 = '';
  gtmdata.item_variant='';
  gtmdata.item_condition='';
  gtmdata.search_term = searchTerm;
  gtmdata.search_results_count = resultsCount;
	let gggData = JSON.stringify(gtmdata);
  gggData = gggData.replace(/"/g, '&quot;');
  if (index < 24){
    gtmDataList.push(gtmdata);
  }
  //sale
  product_grid_html = "<div class='frenzySearchgtm "+grid_class_name+" out_of_stock_"+stock_available+" sale_available_"+sale_available+" "+grid_text_align+" " +grid_secondary_image+"' data-gtm-data='" + gggData + "'>"+product_grid_html;
  product_grid_html = product_grid_html.replaceAll('[[product_featured_image]]', main_grid_image);
  product_grid_html = product_grid_html.replaceAll('[[product_second_image]]', second_grid_image);
  product_grid_html = product_grid_html.replaceAll('[[product_id]]', x.sku);
  product_grid_html = product_grid_html.replaceAll('[[product_title]]', x.org_product);
  product_grid_html = product_grid_html.replaceAll('[[product_brand]]', x.org_brand);
  product_grid_html = product_grid_html.replaceAll('[[gggData]]', gggData);

  const isSelected = wishlistPIDs.includes(x.sku) ? 'selected' : '';  // setting wishlist flag
  product_grid_html = product_grid_html.replaceAll('[[product_isinwishlist]]', isSelected);
  product_grid_html = product_grid_html.replaceAll('[[data_product_isinwishlist]]', wishlistPIDs.includes(x.sku));

  // send the click event to Frenzy
  product_grid_html = product_grid_html.replaceAll('[[product_url]]"', pro_url+'" data-href="'+pro_url+'" class="frenzy-product-name frenzy_item" data-sku="'+x.sku+'" data-name="'+frenzy_product_click+'" data-request_id="'+frenzy_request_id+'" ');
  product_grid_html = product_grid_html.replaceAll("[[product_url]]'", pro_url+"' data-href='"+pro_url+"' class='frenzy-product-name frenzy_item' data-sku='"+x.sku+"' data-name='"+frenzy_product_click+"' data-request_id='"+frenzy_request_id+"'");

  product_grid_html = product_grid_html.replaceAll('[[product_sale_price]]', money_format_Frenzy((x.org_price * 100),shop_currency).replace('$ ', '$'));
  //sale
  product_grid_html = product_grid_html.replaceAll('[[product_compare_price]]', (x && x.org_msrp_price && x.org_msrp_price > x.org_price) ? money_format_Frenzy((x.org_msrp_price * 100),shop_currency).replace('$ ', '$') : '' );

  // discounted price color
  if (x && x.org_msrp_price && x.org_msrp_price > x.org_price) {
    product_grid_html = product_grid_html.replaceAll('[[product_sale_price_color]]', '#A3080F');
  }else{
    product_grid_html = product_grid_html.replaceAll('[[product_sale_price_color]]', '#222222');
  }
  product_grid_html = product_grid_html+'</div>';
  return product_grid_html;
}



/*
 * Search Page
 */
let get_frenzy_search_page_section = document.querySelector('.frenzy_search_page');

// get the serach query from the URL parameters
let search_query = new URL(window.location.href).searchParams.get('q');
let corrected_query_text = '';
let products_found_count = '';

// make API call and display the results
const getSearchPageApi = async () => {

  search_query = new URL(window.location.href).searchParams.get('q');

  get_frenzy_search_page_section.innerHTML = '<div id="loading-bar-spinner"><span class="spinner-icon"></span></div>';

  let frenzyUserID = window.Customer.customerNo || getCookieValue('__frenzy_user_id');
  var data_json = JSON.stringify({
    raw_query: search_query,
    sort: isSeletedSortValue_Frenzy,
    user_id: frenzyUserID, //user_id_Frenzy.toString(),
    page_index: 0,
    mode: 'raw-query',
    currency: window.UncachedData?.currencyCode || 'USD',
    country: window.CachedData?.countryCode || 'US'
  });

  const response = await fetch(authUrl_Frenzy, {
    method: 'POST',
    body: data_json,
    headers: {
      'Content-Type': 'application/json',
      'x-frenzy-authorization': 'b423c0ba-a5f5-4c32-b369-ad7bdc94a1b5'
    }
  });

  if (response.statusText !== 'OK' && response.status !== 200){
    var url = $('form[name="simpleSearch"]').data('searchfallbackurl') + window.location.search;
    window.location.href = url;
    return false;
  }

  const data = await response.json();
  if (data?.redirect_url) {
    window.location.href = data.redirect_url;
  } else {
    // update the URL params
    // if(urlParams_Frenzy.get('q')){
    //   const getRawQuery = (urlParams_Frenzy.get('q')).replace(' ','+');
    //   window.history.pushState({}, '', shopURL_Frenzy+searchURL_Frenzy+'?q='+getRawQuery);
    // }
    let productResults = data.results;
    let productSearchPageSetting = search_page_settings;
    let productGridHtml = grid_html;
    let sideBarFields = data.facet_fields;
    let total_record = data.products_found;
    let total_page = data.page_count;


    (filter_order || []).map((x) =>{
      let boj = {
        ...x,
        selected: 0,
      }
      filter_order_Frenzy.push(boj);
    });

    const obj_filters = data.filters;
    const obj_facet_fields = data.facet_fields;
    Object.keys(obj_filters).map((key,index) => {
      if(obj_facet_fields[key] && key != 'price'){
        filterArray_Frenzy[key] = [];
        (obj_filters[key] || []).map((x,i) =>{
          filterArray_Frenzy[key].push(x);
        });
      }
    });

    const frenzy_request_id = data.request_id;
    const frenzy_product_click = 'search';
    corrected_query_text = data?.corrected_query;
    products_found_count = data?.products_found;
    getSearchPage(productResults,productSearchPageSetting,productGridHtml,sideBarFields,filter_order_Frenzy,total_record,total_page,filterArray_Frenzy,frenzy_request_id,frenzy_product_click);
    if(is_frenzy_page_css){
      const searchPageCss = search_page_css;
      let cssdata = '.frenzy_product_item figure{border-color: #'+ searchPageCss.card_border_color +';} '+
            '.frenzy_product_item_detail,.frenzy_product_item_detail h3 a{color:#'+ searchPageCss.text_color +'} '+
            '.frenzy_product_price_sale{color:#'+ searchPageCss.price_color +'} '+
            '.frenzy_product_price_compare{color:#'+ searchPageCss.compare_price_color +'}';
      if(productSearchPageSetting.image_border_show == '0'){
        cssdata += '.frenzy_product_item figure{border:none !important;}';
      }
      let head = document.head || document.getElementsByTagName('head')[0],
          style = document.createElement('style');
      head.appendChild(style);
      style.type = 'text/css';
      if (style.styleSheet){
        style.styleSheet.cssText = cssdata;
      } else {
        style.appendChild(document.createTextNode(cssdata));
      }
      is_frenzy_page_css = false;
    }
  }
  if(products_found_count === 0){
    if (window.dataLayer && typeof window.dataLayer.push === 'function') {
    dataLayer.push({
      event: 'view_search_result',
      ecommerce: {
      search_term: search_query || corrected_query_text,
      search_results_count: products_found_count || 0,
      items :[]
      }
    });
  }
  }
  $('body').trigger('frenzy:dataLoadComplete');
}



async function getPopularSearches() {
  const popularSearchesURL = FRENZY_API_BASE_URL + 'popular-searches'
  const maxLimit = 6;
  try {
    const response = await fetch(popularSearchesURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-frenzy-authorization': 'b423c0ba-a5f5-4c32-b369-ad7bdc94a1b5'
      }
    });
    const data = await response.json();
    if (data.popular_searches.length > maxLimit) {
      return data.popular_searches.slice(0, maxLimit);
    } else {
      return data.popular_searches;
    }
  } catch (error) {
    console.log(error);
  }
}


async function get_corrected_query() {
  search_query = new URL(window.location.href).searchParams.get('q') || '';

  var data_json = JSON.stringify({
    raw_query: search_query,
    mode: "raw-query",
  });

  const response = await fetch(authUrl_Frenzy, {
    method: 'POST',
    body: data_json,
    headers: {
      'Content-Type': 'application/json',
      'x-frenzy-authorization': 'b423c0ba-a5f5-4c32-b369-ad7bdc94a1b5'
    }
  });

  const data = await response.json();
  return data?.corrected_query || search_query;
}


async function getPopularSearchTemplate() {
  const frenzyUrl = window.FRENZY_URL;
  let popularSearchTemplate = '<div role="region" aria-label="popular searches"><div class="popular-header">popular searches</div><ul class="popular-searches-list">';
  try {
    const popularSearchesArray = await getPopularSearches();
    if (popularSearchesArray.length) {
      popularSearchesArray.forEach((term, i) => {
        popularSearchTemplate += `<li><a href="${frenzyUrl}?q=${term}" class="category-name" aria-label='${term}'>${term}</a>`;
        if (i < popularSearchesArray.length-1) {
          popularSearchTemplate += `<span class="separator">|</span>`;
        }
        popularSearchTemplate += `</li>`;
      });
    }
  } catch (error) {
    console.log(error);
  }
  popularSearchTemplate += `</ul></div>`;
  return popularSearchTemplate;
}

// keep applied filters accordions open
function openActiveFilters(activeFilters){
  const excludePriceValue = { "min": 0, "max": 1000000 };

  // Filter active filters, excluding price if it matches the exclude condition
  const activeFiltersArray = Object.keys(activeFilters).filter(key =>
      !(key === "price" && JSON.stringify(activeFilters[key]) === JSON.stringify(excludePriceValue))
  );

  const accordionBtns = document.querySelectorAll(".filter_widget_trigger");

  accordionBtns.forEach((accordion) => {
    let selectedKey = accordion.getAttribute("data-key");
    selectedKey = (selectedKey === 'price range') ? 'price' : selectedKey;
    const accordionContent = accordion.nextElementSibling;

    if(activeFiltersArray.includes(selectedKey)){
      accordion.classList.add("is-open");
      accordionContent.style.display = 'block';
      accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
    }else{
      accordion.classList.remove("is-open");
      accordionContent.style.maxHeight = null;
      accordionContent.style.display = 'none';
    }
  });
}

// make API call and display the results
const getSearchPAgeFilterChangeApi = async (filter,page_no, frenzy_url_push) =>{

  if(!filter.price){
    filter.price = {min:0,max:1000000}
  }
  search_query = new URL(window.location.href).searchParams.get('q');
  // document.querySelector('body').scrollIntoView({behavior: "smooth"});
  document.querySelector('.frenzy_search_page').insertAdjacentHTML('beforeend', '<div id="loading-bar-spinner"><span class="spinner-icon"></span></div>');
  
  let frenzyUserID = window.Customer.customerNo || getCookieValue('__frenzy_user_id');
  var data_json = JSON.stringify({
    raw_query: search_query,
    sort: isSeletedSortValue_Frenzy,
    user_id:frenzyUserID, //user_id_Frenzy.toString(),
    mode: "filter-change",
    page_index: page_no > 0 ? page_no : 0 ,
    filters:filter,
    currency: window.UncachedData?.currencyCode || 'USD',
    country: window.CachedData?.countryCode || 'US'
  });
  const response = await fetch(authUrl_Frenzy, {
    method: 'POST',
    body: data_json,
    headers: {
      'Content-Type': 'application/json',
      'x-frenzy-authorization': 'b423c0ba-a5f5-4c32-b369-ad7bdc94a1b5'
    }
  });
  const data = await response.json();

  if (response.statusText !== 'OK' && response.status !== 200){
    var url = $('form[name="simpleSearch"]').data('searchfallbackurl') + window.location.search;
    window.location.href = url;
    return false;
  }
  const productResults = data.results;
  products_found_count = data?.products_found;
  corrected_query_text = await get_corrected_query();
  const productSearchPageSetting = search_page_settings;
  const productGridHtml = grid_html;
  const sideBarFields = data.facet_fields;
  filter_order_Frenzy = filter_order;
  const total_record = data.products_found;
  const total_page = data.page_count;
  total_records = data.page_count;
  let getRawQuery = '';
  if(urlParams_Frenzy.get('q')){
    getRawQuery = (urlParams_Frenzy.get('q')).replace(' ','+');
  }
  const createQueryString = (data) => {
    return Object.keys(data).map(key => {
      let val = data[key]
      if (val !== null && typeof val === 'object') val = createQueryString(val)
      return `${key}=${encodeURIComponent(`${val}`)}`;
    }).join('&')
  }

  let urlfilterArray = filterArray_Frenzy;
  if(filterArray_Frenzy && filterArray_Frenzy.price && filterArray_Frenzy.price.min == '0' && filterArray_Frenzy && filterArray_Frenzy.price && filterArray_Frenzy.price.max == '1000000'){
    delete urlfilterArray.price;
  }
  let urlCreateQuery = createQueryString(urlfilterArray);
  if(frenzy_url_push){
    window.history.pushState({}, '', shopURL_Frenzy+searchURL_Frenzy+'?q='+getRawQuery+'&'+urlCreateQuery+'&filterchange=true&page='+selected_page_Frenzy+'&sort='+isSeletedSortValue_Frenzy);
  }

  const frenzy_request_id = data.request_id;
  const frenzy_product_click = 'search';
  getSearchPage(productResults,productSearchPageSetting,productGridHtml,sideBarFields,filter_order_Frenzy,total_record,total_page,filterArray_Frenzy,frenzy_request_id,frenzy_product_click);
  if(is_frenzy_page_css){
    const searchPageCss = search_page_css;
    let cssdata ='.frenzy_product_item figure{border-color: #'+ searchPageCss.card_border_color +';} '+
          '.frenzy_product_item_detail,.frenzy_product_item_detail h3 a{color:#'+ searchPageCss.text_color +'} '+
          '.frenzy_product_price_sale{color:#'+ searchPageCss.price_color +'} '+
          '.frenzy_product_price_compare{color:#'+ searchPageCss.compare_price_color +'} '
    ;
    if(productSearchPageSetting.image_border_show == '0'){
      cssdata += '.frenzy_product_item figure{border:none !important;}';
    }
    let head = document.head || document.getElementsByTagName('head')[0],
        style = document.createElement('style');
    head.appendChild(style);
    style.type = 'text/css';
    if (style.styleSheet){
      style.styleSheet.cssText = cssdata;
    } else {
      style.appendChild(document.createTextNode(cssdata));
    }
    is_frenzy_page_css = false;
  }
  $('body').trigger('frenzy:dataLoadComplete');

  // Freeze scrolling
  document.body.style.scrollBehavior = 'auto'; // prevent smooth scroll
  document.body.style.overflow = 'hidden';

  // Defer scroll until next frame
  requestAnimationFrame(() => {
    window.scrollTo(0, scrollTop);

    // Restore scroll behavior and unhide scroll
    requestAnimationFrame(() => {
      document.body.style.overflow = '';
      document.body.style.scrollBehavior = '';
    });
  });
}

var $frenzy_topbar_contain, $frenzy_topbar_contain_rect, $frenzy_topbar_top_value;
// function to calculate top value of frenzy topbar
function calculateFrenzyTopbarTopValue(){
  $frenzy_topbar_contain = $('.frenzy_topbar_contain');
  if($frenzy_topbar_contain.length && !$frenzy_topbar_top_value){
    $frenzy_topbar_contain_rect = $frenzy_topbar_contain.get(0).getBoundingClientRect();
    $frenzy_topbar_top_value = $frenzy_topbar_contain_rect.top - $frenzy_topbar_contain_rect.height;
  }
}

// create the search page results
async function getSearchPage(productData,settingData,gridHtml,sideBarFields,filter_order_Frenzy,total_record,total_page,filterArray_Frenzy,frenzy_request_id,frenzy_product_click){
  let product_grid_html = gridHtml;
  const shop_currency = get_frenzy_search_page_section.getAttribute('data-currency');
  const hide_frenzy_filter = settingData.filter == '0' ? 'hide_frenzy_filter' : '' ;
  currency_symbol_Frenzy = shop_currency.split('{')[0];
  let gtmDataList = [];
  (productData || []).map((x,i) =>{
    searchPageProductList += getProductGridItem(product_grid_html,x,settingData,shop_currency,frenzy_request_id,frenzy_product_click, i, gtmDataList,search_query || corrected_query_text ,
  products_found_count);
  });
  try {
    $('body').trigger('frenzysearch:productitem',JSON.stringify(gtmDataList));
  } catch (error) {
    console.log(error);
  }

  let siderbar_filter_section_html = '';
  if(settingData.filter == '1'){
    (filter_order_Frenzy || []).map((x,i) =>{
      let filter_name = x.key;
      let filter_label= x.value;
      let filter_data = sideBarFields[filter_name] ?? [];
      if((filter_data.length != 0 || filter_name === 'price range') && x.status == '1' ){
        siderbar_filter_section_html += sideBarFilter(filter_name,filter_data,x.selected,filter_label,settingData);
      }
    });
  }
  let filter_seleted_list = '';

  // get count of applied filters
  let filter_seleted_count = Object.entries(filterArray_Frenzy).reduce((count, [key, value]) => {
      if (key === 'price') {
        if (!(value.min === 0 && value.max === 1000000)) {  //to ignore default price range of frenzy
          return count + 1; // Treat 'price' as a single unit
        }
      } else if (Array.isArray(value)) {
          return count + value.length; // Count category filter array elements
      }
      return count;
  }, 0);

  if(settingData.filter == '1'){
    let displayClearAllBtn = false;
    Object.keys(filterArray_Frenzy).map((key,index) => {
      if(key == 'price'){
        const min_price = filterArray_Frenzy[key].min;
        const max_price = filterArray_Frenzy[key].max;
        if(min_price != '0'  || max_price != '1000000'){
          filter_seleted_list += '<li><div class="filter_clear_item">';
          filter_seleted_list += '<span class="filter_clear_label">'+currency_symbol_Frenzy + min_price+'-'+currency_symbol_Frenzy + max_price+'</span><label class="filter_clear_icon filter_price_clear_btn">'+close_arrow_Frenzy+'</label>';
          filter_seleted_list += '</div></li>';
          displayClearAllBtn = true;
        }
      } else{
        (filterArray_Frenzy[key] || []).map((x,i) =>{
          filter_seleted_list += '<li><div class="filter_clear_item">';
          filter_seleted_list += '<span class="filter_clear_label">'+x+'</span><label class="filter_clear_icon" for="'+key+'-'+x.replaceAll(' ','-')+'">'+close_arrow_Frenzy+'</label>';
          filter_seleted_list += '</div></li>';
        })
        displayClearAllBtn = true;
      }
    });
    if(displayClearAllBtn){
      filter_seleted_list += '<li><div class="filter_clear_item">';
      filter_seleted_list += '<span class="filter_clear_label filter_clear_all_btn" >Clear All</span>';
      filter_seleted_list += '</div></li>';
    }
  }
  let search_page_html = '<div class="frenzy_container"><div class="frenzy_header">';

  if(search_query != '' && search_query.toLowerCase() === corrected_query_text.toLowerCase()){
    search_page_html += '<h1 class="frenzy_search_title">Search results for "'+search_query+'"</h1>';
  } else {
    search_page_html += '<h1 class="frenzy_search_title">Search results for "'+corrected_query_text+'"</h1><div class="frenzy_searched_query">You Searched for: "<span>'+search_query+'<span>"</div>';
  }
  search_page_html += '</div>';

  // Frenzy TopBar
  search_page_html += '<div class="frenzy_topbar_placeholder"></div>';
  search_page_html += '<div class="frenzy_topbar_contain '+hide_frenzy_filter+'">';
  if(settingData.filter == '1' && searchPageProductList != ''){
    search_page_html += '<div class="frenzy_filter_btn_col"><button type="button" class="frenzy_filter_toggle" aria-label="Toggle Filters">'+filter_icon_Frenzy+'<span>'+settingData.filter_title;
    search_page_html += `${filter_seleted_count ? `(${filter_seleted_count})` : ''}`; //add filter count
    search_page_html += '</span></button></div>';
  }
  search_page_html += '<div class="frenzy_topbar_count_col" aria-live="polite"><span>Results found: '+products_found_count+'</span></div>';
  // handle showing selected filters
  let showSelectedFilters = false;
  if(showSelectedFilters && settingData.filter == '1'){
    search_page_html += '<div class="frenzy_topbar_seleted_Filter_col"><ul class="filterSeletedList">'+filter_seleted_list+'</ul></div>';
  }

  if(settingData.sort == '1' && searchPageProductList != ''){
    search_page_html += '<div class="sort-by-dropdown"><div class="custom-dropdown dropdown"><button id="sortBy" class="frenzy_topbar_sorting_col dropdown-toggle sort-by-options" aria-label="Sort By" aria-expanded="false"><span class="icon-sort"></span>Sort By</button>';
    search_page_html += '<div id="sortOptions" class="sort-options frenzy_sidebar_panel d-lg-none" aria-labelledby="dropdownSortBy"><div class="frenzy_sidebar_header_sort"><h3 class="sort_modal_heading">Sort By</h3><button aria-label="sort_close" id="frenzy_sort_close" type="button" class="frenzy_sort_close"><svg viewBox="0 0 20 20"><path d="m11.414 10 4.293-4.293a.999.999 0 1 0-1.414-1.414L10 8.586 5.707 4.293a.999.999 0 1 0-1.414 1.414L8.586 10l-4.293 4.293a.999.999 0 1 0 1.414 1.414L10 11.414l4.293 4.293a.997.997 0 0 0 1.414 0 .999.999 0 0 0 0-1.414L11.414 10z"></path></svg></button></div><ul role="radiogroup">';

    search_page_html += '<li class="dropdown-item" role="radio" value="best match" '+( isSeletedSortValue_Frenzy == 'best match' ? 'selected aria-checked="true"' :'aria-checked="false"')+'><button aria-label="Best Matches">'+( isSeletedSortValue_Frenzy == 'best match' ? '<i class="fa fa-check-circle"></i>' :'<i class="fa fa-circle-o"></i>')+'Best Matches</button></li>';

    search_page_html += '<li class="dropdown-item" role="radio" value="newest" '+( isSeletedSortValue_Frenzy == 'newest' ? 'selected aria-checked="true"' :'aria-checked="false"')+'><button aria-label="Top Sellers">'+( isSeletedSortValue_Frenzy == 'newest' ? '<i class="fa fa-check-circle"></i>' :'<i class="fa fa-circle-o"></i>')+'Top Sellers</button></li>';

    search_page_html += '<li class="dropdown-item" role="radio" value="price asc" '+( isSeletedSortValue_Frenzy == 'price asc' ? 'selected  aria-checked="true"' :'aria-checked="false"')+'><button aria-label="Price: Low - High">'+( isSeletedSortValue_Frenzy == 'price asc' ? '<i class="fa fa-check-circle"></i>' :'<i class="fa fa-circle-o"></i>')+'Price: Low - High</button></li>';

    search_page_html += '<li class="dropdown-item" role="radio" value="price desc" '+( isSeletedSortValue_Frenzy == 'price desc' ? 'selected aria-checked="true"' :'aria-checked="false"')+'><button aria-label="Price: High - Low">'+( isSeletedSortValue_Frenzy == 'price desc' ? '<i class="fa fa-check-circle"></i>' :'<i class="fa fa-circle-o"></i>')+'Price: High - Low</button></li>';
    search_page_html += '</ul>';
    search_page_html += '<div class="mobile_sort_cta_area"><button class="btn frenzy_sort_reset_btn" aria-label="Reset Sort Options">Reset</button><button class="btn btn-primary frenzy_sort_apply_btn" aria-label="Apply Sort Options">Apply</button></div>';
    search_page_html += '</div></div></div>';
  }
  search_page_html += '</div>';

  // toggle #sortOption on clicking over sortBy dropdown
  // Prevent duplicate event bindings by using .off() to remove any previously attached click handlers
  // for the ".custom-dropdown #sortBy" element before attaching a new one. This ensures the event
  // handler executes only once per click and avoids unintended multiple executions caused by duplicate bindings.
  $(document).off("click", ".custom-dropdown #sortBy").on("click", ".custom-dropdown #sortBy", function (e) {
    const $sortOptions = $(".custom-dropdown #sortOptions");
    const $sortByBtn = $(this);
    if ($sortOptions.length) {
      $sortOptions.removeClass("d-none");
      if (window.isMobile()){
        $sortOptions.css("transform", "translateX(0%)").addClass('sort_modal_open');
        $('#header-nav')?.addClass('d-none');    // to hide overlapping of header in fixed state and mobile sort modal
        $('.helpButton')?.addClass('d-none');    // handling the visibility of overlapping .helpButton
        $('body').addClass("lock-scroll");
      }else{
        $sortOptions.toggleClass("d-lg-none").css("transform", "none");
      }

      const isExpanded = window.isMobile()
      ? $sortOptions.hasClass("sort_modal_open")
      : !$sortOptions.hasClass("d-lg-none");
      $sortByBtn.attr('aria-expanded', isExpanded);
    }
  });


    //hide #sortOptions if clicked anywhere else
    $(document).on("click", function (e) {
      if (!$(e.target).closest('.custom-dropdown').length) {
        if (window.isMobile()){
          $(".custom-dropdown #sortOptions").css("transform", "translateX(-100%)");
          if ($(".custom-dropdown #sortOptions").hasClass('sort_modal_open')) {
            $('body').removeClass("lock-scroll");
            document.querySelector('.frenzy_overlay_wrap')?.remove();
          }
          $(".custom-dropdown #sortOptions").removeClass('sort_modal_open');
          $('.helpButton')?.removeClass('d-none');    // handling the visibility of overlapping .helpButton
        }else{
          $('.custom-dropdown #sortOptions').addClass('d-lg-none');
          $(".custom-dropdown #sortOptions").css("transform", "none");
        }
      }
    });

    //hide #sortOptions when clicked close icon
    $(document).on("click", "#frenzy_sort_close", function (e) {
      if (window.isMobile()){
        $(".custom-dropdown #sortOptions").css("transform", "translateX(-100%)");
        $(".custom-dropdown #sortOptions").removeClass('sort_modal_open');
        $("#header-nav")?.removeClass("d-none");
        $('.helpButton')?.removeClass('d-none');    // handling the visibility of overlapping .helpButton
        $('body').removeClass("lock-scroll");
        document.querySelector('.frenzy_overlay_wrap')?.remove();
      }else{
        $('.custom-dropdown #sortOptions').addClass('d-lg-none');
        $(".custom-dropdown #sortOptions").css("transform", "none");
      }
      $("#sortBy").attr("aria-expanded", "false");
  });

  // rendering sort results
  $(document).off("click", ".custom-dropdown .dropdown-item").on("click", ".custom-dropdown .dropdown-item", function () {
    $(".custom-dropdown #sortOptions")?.removeClass("d-none");
    var value = $(this).attr("value");
    isSeletedSortValue_Frenzy = value;

    //update sort option selection icon
    $(".dropdown-item i").removeClass("fa-check-circle").addClass("fa-circle-o"); //make all option unselected
    $(this).find("i").removeClass("fa-circle-o").addClass("fa-check-circle"); //make currently clicked option as selected

    if (!window.isMobile()) { // Allow only for desktop
      if(get_frenzy_search_page_section){
        searchPageProductList = '';
        currentPageCount = 0;
        scrollTop = 0; //resetting scroll position when sort is applied
        $(".custom-dropdown #sortOptions")?.addClass('d-lg-none');
        getSearchPAgeFilterChangeApi(filterArray_Frenzy,0, true);
      }
    }
  });

  //filter and sort Apply Button action
  $(document).off("click", ".mobile_filter_cta_area .frenzy_filter_apply_btn, .mobile_sort_cta_area .frenzy_sort_apply_btn").on("click", ".mobile_filter_cta_area .frenzy_filter_apply_btn, .mobile_sort_cta_area .frenzy_sort_apply_btn", function () {
    //updating price range before submitting
    searchPageProductList = '';
    let min_price = document.getElementById("filter_min_price")?.value;
    let max_price = document.getElementById("filter_max_price")?.value;
    if(min_price !== 0 && max_price !== 1000000){
      let filter_price = {
        min: min_price === '' ? 0 : min_price,
        max: max_price === '' ? 1000000 : max_price
      }
      // validate min and max values
      let filterPriceErrorHtml =  document.querySelector('.filter_price_error');
      if(parseFloat(filter_price.min) > parseFloat(filter_price.max)){
        filterPriceErrorHtml.innerHTML = '<span>Please add correct Price range.</span>';
        return;
      }
      filterArray_Frenzy.price = filter_price;
    }
    $(".custom-dropdown #sortOptions")?.css("transform", "translateX(-100%)");
    $(".custom-dropdown #sortOptions")?.removeClass('sort_modal_open');
    $(".custom-dropdown #sortOptions")?.removeClass("d-none");
    $("#header-nav")?.removeClass("d-none");
    $('body').removeClass("lock-scroll");
    if(get_frenzy_search_page_section){
      scrollTop = 0; //resetting scroll position when sort/filter is applied
      getSearchPAgeFilterChangeApi(filterArray_Frenzy,0, true);
      document.querySelector('body').classList.remove('is-open-filter');
      scrollToTop();  // scroll top when applied filters
    }
  });

  // resetting sort results
  $(document).on("click", ".frenzy_sort_reset_btn", function () {
    searchPageProductList = '';
    $(".custom-dropdown #sortOptions")?.css("transform", "translateX(-100%)");
    $(".custom-dropdown #sortOptions")?.removeClass('sort_modal_open');
    $(".custom-dropdown #sortOptions")?.removeClass("d-none");
    $("#header-nav")?.removeClass("d-none");
    $('body').removeClass("lock-scroll");
    isSeletedSortValue_Frenzy = 'best match';
    if(get_frenzy_search_page_section){
      searchPageProductList = '';
      currentPageCount = 0;
      scrollTop = 0; //resetting scroll position when sort is applied
      getSearchPAgeFilterChangeApi(filterArray_Frenzy,0, true);
      scrollToTop();  // scroll top when applied filters
    }
  });



  search_page_html += '<div class="frenzy_flex_row">';
  if(settingData.filter == '1' && searchPageProductList != ''){
    search_page_html += '<div id="frenzy-filter-view" class="frenzy_flex_col ffc_sidebar_col"><div class="frenzy_sidebar_panel">';
    search_page_html += '<div class="frenzy_sidebar_header"><h2 class="frenzy_sidebar_header_title">';
    if (!window.isMobile()){
      search_page_html += filter_icon_Frenzy;
    }
    search_page_html += settingData.filter_title;
    if(filter_seleted_count){
      search_page_html += ' <span>('+filter_seleted_count+')</span>'; // to render the filter count
    }
    search_page_html += '</h2><button type="button" class="frenzy_filter_close" aria-label="Close Filters">'+close_arrow_Frenzy+'</button><button type="button" class="frenzy_filter_reset_btn d-none d-lg-block" aria-label="Reset Filters">reset</button></div>';
    search_page_html += '<div class="filter_widget_section_contain">'+siderbar_filter_section_html+'</div>';
    search_page_html += '</div><div class="mobile_filter_cta_area"><button class="btn frenzy_filter_reset_btn" aria-label="Reset Filters">Reset</button><button class="btn btn-primary frenzy_filter_apply_btn" aria-label="Apply Filters">Apply</button></div></div>';
  }
  search_page_html += '<div class="frenzy_flex_col frenzy_flex_contain_area">';
  if(searchPageProductList != ''){
    search_page_html += '<div id="frenzy_product_grid" class="frenzy_search_page_contain frenzy_product_row">'+searchPageProductList+'</div>';
    search_page_html += '<div class="frenzy_pagination_nav d-none"><div class="pagination" id="pagination"></div></div>';
    search_page_html += '<div class="frenzy_show_more_wrapper">'+ show_more_html + '</div>';
  }else{
    search_page_html += '<div class="no_result_text">No results were found.</div>';
    // adding filter reset option when no results are found are applying the filters
    if (filter_seleted_count) {
      search_page_html += '<div class="reset_filters_text">Reset filters and try again. <button class="frenzy_filter_reset_btn" aria-label="Reset Filters">Reset</button></div>';
    }
    document.querySelector('.you_may_also_like').setAttribute('style', 'display: block !important;');
    displayYMAL();
  }
  search_page_html += '</div></div>';
  // parent div for popular searches element
  search_page_html += '<div class="popular-search"></div>';
  search_page_html += '</div>';
  get_frenzy_search_page_section.innerHTML = search_page_html;
  calculateFrenzyTopbarTopValue();  // calculate top value of frenzy topbar
  if (searchPageProductList != '') {
    document.querySelector('.frenzy_search_page_contain').classList.add('layout_type_grid','ltg_'+settingData.grid_items_per_row+'');
  }
  sideBarFilterScript();
  total_page_no_Frenzy = total_page;
   // Hide Show more buttons if there is no more products
   if(!viewAllResultsVisible || (currentPageCount + 1) === total_page_no_Frenzy) {
    $('.frenzy_show_more_wrapper').hide();
  }
  // Dynamic Header Height Calculated
  const headerNavHeight = $('#header-nav').outerHeight();
  if (!window.isMobile()){
    $(".frenzy_sidebar_panel").css("top", headerNavHeight + 10);
  }


  // init(total_page);
  if (isFilterApplyPrice_Frenzy) {
    const { min: minPrice, max: maxPrice } = filterArray_Frenzy.price;
    const DEFAULT_MIN_PRICE = '0';
    const DEFAULT_MAX_PRICE = '1000000';

    // Update DOM only if prices are not default values
    if (minPrice !== DEFAULT_MIN_PRICE || maxPrice !== DEFAULT_MAX_PRICE) {
      const minPriceInput = document.getElementById("filter_min_price");
      const maxPriceInput = document.getElementById("filter_max_price");

      if (minPriceInput && maxPriceInput) {
        minPriceInput.value = minPrice;
        maxPriceInput.value = maxPrice;
      }
    }
  }
  if ($(window).width() > 991) {
    $('.ffc_sidebar_col').stickit({top: 200});
  }

  // inserting popular searches template
  try {
    let popularSearchesHTML = await getPopularSearchTemplate();
    document.querySelector('.popular-search').innerHTML = popularSearchesHTML;
  } catch (error) {
    console.log(error);
  }
  openActiveFilters(filterArray_Frenzy);
}
function sideBarFilter(key,data,selected,filter_label,settingData){
  let filter_list = '';
  if(key === 'price range'){
    if(!filterArray_Frenzy.price){
      filterArray_Frenzy.price = {min:0,max:1000000};
    }
    filter_list += '<div class="filter_price_contain">';
    filter_list += '<div class="filter_price_wrapper">';
    filter_list += '<div class="filter_price_box"><span class="currency-symbol">$</span>';
    filter_list += `<input name="min" id="filter_min_price" type="number" class="filter_price_input" aria-label="Minimum price filter input" ${filterArray_Frenzy.price ? `value="${filterArray_Frenzy.price.min}"` : ''}>`;
    filter_list += '</div>';
    filter_list += '<div class="filter_price_span"> TO </div>';
    filter_list += '<div class="filter_price_box"><span class="currency-symbol"> $</span>';
    filter_list += `<input name="max" id="filter_max_price" type="number" class="filter_price_input" aria-label="Maximum price filter input" ${filterArray_Frenzy.price ? `value="${filterArray_Frenzy.price.max}"` : ''}>`;
    filter_list += '</div></div>';
    filter_list += '<div class="filter_price_group_btn"><div class="filter_price_error"><span style="visibility: hidden;">Please add correct Price range.</span></div></div>';
    filter_list += `<div class="slider">
                      <div class="progress"></div>
                    </div>
                    <div class="range-input">
                      <input type="range" class="range-min" min='0' max='1000000' step="1" aria-label="Minimum price range slider"  ${filterArray_Frenzy.price ? `value="${filterArray_Frenzy.price.min}"` : ''}/>
                      <input type="range" class="range-max" min='0' max='1000000' step="1" aria-label="Maximum price range slider" ${filterArray_Frenzy.price ? `value="${filterArray_Frenzy.price.max}"` : ''}/>
                    </div>`;
    filter_list += '</div>';
  }else{
    (data || []).map((x,i) =>{
      let filter_checked_val =  filterArray_Frenzy[key];
      let is_checked_val = '';
      if(filter_checked_val){
        if(filter_checked_val.includes(x[0])){
          is_checked_val = 'checked';
        }
      }
      filter_list += '<div class="fwc_filters_list">';
      filter_list += '<button for="'+key+'-'+x[0].replaceAll(' ','-')+'" data-type="'+key+'" data-value="'+x[0]+'" class="filter_checkbox filter_is_click" aria-label="'+x[0]+'" role="checkbox" aria-checked="'+(is_checked_val ? 'true' : 'false')+'">';
      filter_list += '<input id="'+key+'-'+x[0].replaceAll(' ','-')+'" class="filter_input_value" type="checkbox" '+is_checked_val+' value="'+x[0]+'">'
      filter_list += '<span class="filter_checkbox_icon"></span><span class="filter_checkbox_label">';
      // add color swatch circle to color filter
      if (key == 'org color') {
        filter_list += `<span class="swatch-circle-${x[0].toLowerCase()} swatch-circle color-value swatch-mark"></span>`;
      }
      filter_list += x[0]+'</span>';
      if(settingData.counts == '1'){
        // filter_list += '<span class="checkbox_count">'+x[1]+'</span>';
      }
      filter_list += '</button>';
      filter_list += '</div>';
    });
  }
  const defaultPriceValue = {min: 0, max: 1000000};
  let filter_checked_val_length =  (key === "price range" && JSON.stringify(filterArray_Frenzy['price']) !== JSON.stringify(defaultPriceValue)) ? '(1)' : (filterArray_Frenzy[key] && filterArray_Frenzy[key].length > 0 ? `(${filterArray_Frenzy[key].length})` : '');
  let selected_class = selected === 1 ? 'is-open' : '';
  let selected_acc_styke = selected === 1 ? 'initial' : '';
  let sideBarGridItem = '';
  sideBarGridItem += '<div class="filter_widget_section filter_type_'+key.replaceAll(' ','-')+'">';
  sideBarGridItem += '<button class="filter_widget_trigger '+ selected_class +'" data-key="'+key+'" aria-label="'+filter_label+'"><span class="filter_categories">'+filter_label+'</span><span class="filter_selectedCount">' + filter_checked_val_length + '</span><span class="filter_widget_trigger_icon"></span></button>';
  sideBarGridItem += '<div class="filter_widget_content" style="max-height:'+selected_acc_styke+'">';
  let fwc_filters_search_show = false;
  if(fwc_filters_search_show && data.length >= 10){
    sideBarGridItem += '<div class="fwc_filters_search"><input type="text" class="fwc_search_input" data-type="frenzy_'+key.replaceAll(' ','-')+'_input" /></div>';
  }

  sideBarGridItem += '<div class="fwc_filters_block frenzy_'+key.replaceAll(' ','-')+'_input">'+filter_list+'</div>';
  sideBarGridItem += '</div>';
  sideBarGridItem += '</div>';
  return sideBarGridItem;
}
function sideBarFilterScript(){
  // Filter Accordion
  const accordionBtns = document.querySelectorAll(".filter_widget_trigger");
  accordionBtns.forEach((accordion) => {
    accordion.onclick = function () {
      let selectedKey = this.getAttribute('data-key');

      let findIndex = filter_order_Frenzy.findIndex((x) => x.key === selectedKey);
      filter_order_Frenzy[findIndex] = {...filter_order_Frenzy[findIndex],selected : filter_order_Frenzy[findIndex].selected === 1 ? 0 : 1}
      this.classList.toggle("is-open");
      let content = this.nextElementSibling;
      if (content && content.style.maxHeight) {
        content.style.maxHeight = null;
        content.style.display = 'none';
      } else {
        content.style.display = 'block';
        content.style.maxHeight = content.scrollHeight + "px";
      }
    };
  });
  // Filter click
  document.querySelectorAll('.filter_is_click').forEach(function(this_click){
    this_click.addEventListener('click', function(){

      // Toggle the checked state
      const filter_input_checkbox = this_click.querySelector('input.filter_input_value');
      if (filter_input_checkbox) {
        filter_input_checkbox.checked = !filter_input_checkbox.checked;
      }

      searchPageProductList = '';
      currentPageCount = 0;
      let filter_type = this_click.getAttribute("data-type");
      let filter_value = this_click.getAttribute("data-value");
      if(filterArray_Frenzy[filter_type]){
        let index = filterArray_Frenzy[filter_type].findIndex((x) => x === filter_value);
        if(index === -1){
          filterArray_Frenzy[filter_type].push(filter_value)
        } else{
          filterArray_Frenzy[filter_type].splice(index, 1);
          if(filterArray_Frenzy[filter_type].length == 0){
            delete filterArray_Frenzy[filter_type];
          }
        }
      }else{
        filterArray_Frenzy[filter_type] = [filter_value];
      }
      if (!window.isMobile()) { // Allow only for desktop
        if(get_frenzy_search_page_section){
          scrollTop = 0; //resetting scroll position when filter is applied
          getSearchPAgeFilterChangeApi(filterArray_Frenzy, 0, true);
          scrollToTop();
        }
        selected_page_Frenzy = 1;
        document.querySelector('body').classList.remove('is-open-filter');
      }

    });
  });
  document.querySelectorAll('button.frenzy_filter_toggle').forEach(function(this_click){
    this_click.addEventListener('click', function(event){
      const body = document.querySelector('body');
      body.classList.add('is-open-filter');
      body.classList.add('lock-scroll');
      // document.querySelector('.frenzy_flex_row').insertAdjacentHTML('beforeend','<div class="frenzy_overlay_wrap"></div>');
      frenzyFilterClose();
    })
  });
  // Filter sort
  document.querySelectorAll('.frenzy_sorting_btn').forEach(function(this_click){
    this_click.addEventListener('change', function(event){
      isSeletedSortValue_Frenzy = event.target.value;
      if(get_frenzy_search_page_section){
        searchPageProductList = '';
        currentPageCount = 0;
        getSearchPAgeFilterChangeApi(filterArray_Frenzy,0, true);
      }

      selected_page_Frenzy = 1;
      document.querySelector('body').classList.remove('is-open-filter');
    });
  });

  // price section
  let min = '', max = '';
  const filterMinPrice = document.getElementById('filter_min_price');
  const filterMaxPrice = document.getElementById('filter_max_price');
  const rangeInput = document.querySelectorAll(".range-input input"),
  priceInput = document.querySelectorAll(".filter_price_input"),
  range = document.querySelector(".slider .progress");
  let priceGap = 1;

  //to update price slider progress element according to price input values
  const onChnagePriceVal = (e) =>{
    if( e.target.name == 'min'){
      min = e.target.value;
    }else{
      max = e.target.value;
    }
    if(min != '' || max != ''){
      isDisabledApplyBtn_Frenzy = true;
    }else{
      isDisabledApplyBtn_Frenzy = false;
    }

    let minPrice = parseInt(priceInput[0].value),
      maxPrice = parseInt(priceInput[1].value);

    if (maxPrice - minPrice >= priceGap && maxPrice <= rangeInput[1].max) {
      if (e.target.id === "filter_min_price") {
        rangeInput[0].value = minPrice;
        range.style.left = (minPrice / rangeInput[0].max) * 100 + "%";
      } else {
        rangeInput[1].value = maxPrice;
        range.style.right = 100 - (maxPrice / rangeInput[1].max) * 100 + "%";
      }
    }
  }

  //to update price slider progress
  function handleRangeProgress(e){
    let minVal = parseInt(rangeInput[0]?.value),
      maxVal = parseInt(rangeInput[1]?.value);

    if (maxVal - minVal < priceGap) {
      if (e && e.target.id === "filter_min_price-min") {
        rangeInput[0].value = maxVal - priceGap;
      } else {
        rangeInput[1].value = minVal + priceGap;
      }
    } else {
      if (priceInput[0] && priceInput[1]) {
        priceInput[0].value = minVal;
        priceInput[1].value = maxVal;
      }
      if (range) {
        range.style.left = (minVal / rangeInput[0].max) * 100 + "%";
        range.style.right = 100 - (maxVal / rangeInput[1].max) * 100 + "%";
      }
    }
  }
  handleRangeProgress();  //for initial page load

  // even handlers for price range slider
  rangeInput.forEach((range) => {
    range.addEventListener("input", handleRangeProgress); //update price values dynamically with slider
    if (!window.isMobile()) { // Allow only for desktop
      range.addEventListener("mouseup", handlePriceSubmit); //submit when price sliding is done
    }
  });

  filterMinPrice?.addEventListener('input',onChnagePriceVal);
  filterMaxPrice?.addEventListener('input',onChnagePriceVal);

  // Submit on hitting enter in price input boxes
  filterMinPrice?.addEventListener('keydown', (event)=>{
    if (event.key === 'Enter') {
      handlePriceSubmit();
    }
  });
  filterMaxPrice?.addEventListener('keydown', (event)=>{
    if (event.key === 'Enter') {
      handlePriceSubmit();
    }
  });

  // logic to apply price filter on losing price input focus for desktop
  if (!window.isMobile()) {
    function handlePriceInputChangeOnBlur(event) {
      const input = event.target;
      const newValue = input.value;

      // call the function only when input value is changed
      if (input.dataset.initialValue !== newValue) {
        handlePriceSubmit();
      }
    }

    // Store initial value
    filterMinPrice?.addEventListener('focus', (event) => {
      event.target.dataset.initialValue = event.target.value;
    });
    filterMaxPrice?.addEventListener('focus', (event) => {
      event.target.dataset.initialValue = event.target.value;
    });

    // Invoke price filter on Input blur
    filterMinPrice?.addEventListener('blur', handlePriceInputChangeOnBlur);
    filterMaxPrice?.addEventListener('blur', handlePriceInputChangeOnBlur);
  }

  // Submit action for price filter
  function handlePriceSubmit(){
      let min_price = document.getElementById("filter_min_price").value;
      let max_price = document.getElementById("filter_max_price").value;
      let filter_price = {
        min: min_price === '' ? 0 : min_price,
        max: max_price === '' ? 1000000 : max_price
      }

      // validate min and max values
      let filterPriceErrorHtml =  document.querySelector('.filter_price_error');
      if(parseFloat(filter_price.min) > parseFloat(filter_price.max)){
        filterPriceErrorHtml.innerHTML = '<span>Please add correct Price range.</span>';
        return;
      }

      filterArray_Frenzy.price = filter_price;
      isFilterApplyPrice_Frenzy = true;
      if(isDisabledApplyBtn_Frenzy || isFilterApplyPrice_Frenzy){
        if(get_frenzy_search_page_section){
          searchPageProductList = '';
          currentPageCount = 0;
          getSearchPAgeFilterChangeApi(filterArray_Frenzy,0, true);
          scrollToTop();
        }

        selected_page_Frenzy = 1;
        isFilterApplyPrice_Frenzy = true;
      }else{
        document.querySelector('.filter_type_price-range .filter_widget_content').style.maxHeight = 'initial';
        let filterPriceErrorHtml =  document.querySelector('.filter_price_error');
        filterPriceErrorHtml.innerHTML = '<span>Please add Min and Max Price.</span>';
      }
      document.querySelector('body').classList.remove('is-open-filter');
  }

  // Filter Clear price
  document.querySelectorAll('.filter_price_clear_btn').forEach(function(this_click){
    this_click.addEventListener('click', function(event){
      document.getElementById("filter_min_price").value = '';
      document.getElementById("filter_max_price").value = '';
      let filter_price = {
        min: 0,
        max: 1000000
      }
      filterArray_Frenzy.price = filter_price;
      if(get_frenzy_search_page_section){
        getSearchPAgeFilterChangeApi(filterArray_Frenzy,0, true);
      }
      selected_page_Frenzy = 1;
      isFilterApplyPrice_Frenzy = false;
      isDisabledApplyBtn_Frenzy = false;
      document.querySelector('body').classList.remove('is-open-filter');
    });
  });
  // Filter clear all
  document.querySelectorAll('.filter_clear_all_btn').forEach(function(this_click){
    this_click.addEventListener('click', function(event){
      filterArray_Frenzy = {'price':{min: 0 ,max:1000000}};
      const newfilterArray = {};
      search_query = '' ;
      if(get_frenzy_search_page_section){
        getSearchPAgeFilterChangeApi(newfilterArray,0, true);
      }
      selected_page_Frenzy = 1;
    });
  });

  // Filter clear all
  document.querySelectorAll('.frenzy_filter_reset_btn').forEach(function(this_click){
    this_click.addEventListener('click', function(event){
      searchPageProductList = '';
      currentPageCount = 0;
      filterArray_Frenzy = {'price':{min: 0 ,max:1000000}};
      const newfilterArray = {};
      search_query = '' ;
      if(get_frenzy_search_page_section){
        scrollTop = 0; //resetting scroll position when filter is applied
        getSearchPAgeFilterChangeApi(newfilterArray,0, true);
        document.querySelector('body').classList.remove('is-open-filter');
        $('body').removeClass("lock-scroll");
      }
      selected_page_Frenzy = 1;
    });
  });
  // Filter Search
  document.querySelectorAll('.fwc_search_input').forEach(function(this_click){
    this_click.addEventListener('keyup', function(event){
      const et_val = event.target.value.toUpperCase();
      const filter_type = this_click.getAttribute("data-type");
      document.querySelectorAll('.'+filter_type+' .filter_checkbox_label').forEach(function(e){
        if(e.textContent.toUpperCase().indexOf(et_val) > -1){
          e.parentElement.parentElement.style.display="";
        }else{
          e.parentElement.parentElement.style.display="none";
        }
      })
    });
  });

  document.querySelectorAll('.frenzy-product-name').forEach(function(this_click){
    this_click.addEventListener('click', function(event) {
      if ($(event.target).hasClass('add-to-cart')) {
        return;
      }
      var thiscurrent = event.target
      if ($(event.target).hasClass('frenzy_img')) {
          thiscurrent = event.target.parentElement;
      }
      if (this.classList.contains('frenzy-product-name')) {
        thiscurrent = this;
      }
      
      const dataSku = thiscurrent.getAttribute("data-sku");
      const dataName = thiscurrent.getAttribute("data-name");
      const dataRequestId = thiscurrent.getAttribute("data-request_id");
      const dataHref = thiscurrent.getAttribute("data-href");
      frenzyClickEventsApi(dataSku,dataName,dataRequestId,dataHref);
      return false;
    });
  });
}
function frenzyFilterClose(){
  document.querySelectorAll('.frenzy_overlay_wrap,button.frenzy_filter_close').forEach(function(this_click){
    this_click.addEventListener('click', function(event){
      document.querySelector('body').classList.remove('is-open-filter');
      $('body').removeClass("lock-scroll");
      document.querySelector('.frenzy_overlay_wrap')?.remove();
    })
  });
}

let debounceTimer;

// Enable Infinaite Scroll on View All Results click
function handleViewAllResultsBtn() {
  // Detect scroll to bottom
  $(document).on('click', '.frenzy-view-all-results button', function (e) {
    e.stopPropagation();
    e.preventDefault();
    $('.frenzy_show_more_wrapper').hide();
    viewAllResultsVisible = false;
    loadFrenzyProductsOnScroll();
    // Trigger a scroll event manually so the logic runs immediately
    $(window).trigger('scroll');
  })
}


// sticking frenzy_topbar_contain section while scrolling for mobile view
function loadFrenzyProductsOnScroll() {
  $(window).scroll(function () {
    // Detect scroll to bottom
    clearTimeout(debounceTimer);
    if ($(window).scrollTop() + $(window).height() >= $('#footercontent').offset().top) {
      debounceTimer = setTimeout(function () {
        if(currentPageCount + 1 < total_page_no_Frenzy && searchPageProductList.length > 0) {
              scrollTop = window.scrollY;
              currentPageCount++
              getSearchPAgeFilterChangeApi(filterArray_Frenzy,currentPageCount, true)
            }
        }, 200);
      }
  });
}
// sticking frenzy_topbar_contain section while scrolling for mobile view
$(document).ready(function(){
  scrollTop = window.scrollY;

  $(document).on('click', '.frenzy-show-more button', function (e) {
    e.stopPropagation();
    e.preventDefault();
    scrollTop = window.scrollY;
    if(currentPageCount < total_page_no_Frenzy && searchPageProductList.length > 0) {
        currentPageCount++
        getSearchPAgeFilterChangeApi(filterArray_Frenzy,currentPageCount, true)
    }
  });

  $(window).scroll(function(){
    if (window.isMobile()){
      if($frenzy_topbar_contain.length){
        var $resultCount = $('.frenzy_topbar_count_col'); //results count element
        var isPositionFixed = ($frenzy_topbar_contain.css('position') == 'fixed');

        if ($(this).scrollTop() > $frenzy_topbar_top_value && !isPositionFixed){
          const headerHeight = $('#header-nav').height(); //get header height
          //applying sticky stylings when scrolled beyond 'filter, sort section'
          $frenzy_topbar_contain.css({'position': 'fixed', 'top': `${headerHeight}px`, 'left': '10px',
          'padding': '10px 31px', 'width': 'inherit', 'background': 'white', 'z-index': '201'
          });
          $resultCount?.css({'display': 'none'});
          $('.frenzy_topbar_placeholder')?.css({'height': '96px'});
        }
        if ($(this).scrollTop() < $frenzy_topbar_top_value && isPositionFixed){
          $frenzy_topbar_contain.css({'position': 'relative', 'top': '0px', 'padding': 'revert-layer', 'background': 'initial'});
          $resultCount?.css({'display': 'initial'});
          $('.frenzy_topbar_placeholder')?.css({'height': '0'});
        }
      }else{
        calculateFrenzyTopbarTopValue();  // calculate top value of frenzy topbar
      }
    }
  });

  handleViewAllResultsBtn();
})

const frenzyClickEventsApi = async (sku,event_name,query_id,dataHref) => {
  let frenzyUserID = window.Customer.customerNo || getCookieValue('__frenzy_user_id');
  var data_json = JSON.stringify([{
    sku: sku,
    event_name: event_name+'_product_click',
    query_id: query_id,
    user_id:frenzyUserID //user_id_Frenzy.toString(),
  }]);
  const response = await fetch(authUrl_Frenzy + '/events', {
    method: 'POST',
    body: data_json,
    headers: {
      'Content-Type': 'application/json',
      'x-frenzy-authorization': 'b423c0ba-a5f5-4c32-b369-ad7bdc94a1b5'
    }
  });
  const data = await response.json();
  window.location.href = dataHref;
}

function frenzyEventsClick(this_click){
  const dataSku = this_click.getAttribute("data-sku");
  const dataName = this_click.getAttribute("data-name");
  const dataRequestId = this_click.getAttribute("data-request_id");
  const dataHref = this_click.getAttribute("data-href");
  frenzyClickEventsApi(dataSku,dataName,dataRequestId,dataHref);
  return false;
}

const frenzyAddToCartEventsApi = async () => {
  let frenzyUserID = window.Customer.customerNo || getCookieValue('__frenzy_user_id');
  const product_id =  __st && __st.rid;
  const variant_id = document.querySelector('[name="id"]').value;
  var data_json = JSON.stringify([{
    sku: product_id+'_'+variant_id,
    event_name: 'add to cart',
    user_id:frenzyUserID //user_id_Frenzy.toString()
  }]);
  const response = await fetch(authUrl_Frenzy + '/events', {
    method: 'POST',
    body: data_json,
    headers: {
      'Content-Type': 'application/json',
      'x-frenzy-authorization': 'b423c0ba-a5f5-4c32-b369-ad7bdc94a1b5'
    }
  });
  const data = await response.json();
}

function displayYMAL() {
  let frenzyUserID = window.Customer.customerNo || getCookieValue('__frenzy_user_id');
  let authUrl_Frenzy = FRENZY_API_BASE_URL + "personalized-recommendation?user_id=" + frenzyUserID + "&num_matching=100&full_description=true";
  let eventsUrl_Frenzy = FRENZY_API_BASE_URL +  "events";
  let sku = "${product.id}";
  let number_days_ago = 3
  let num_matching = 15;
  let currency_symbol_Frenzy = '';
  let filter_order_Frenzy = [];
  let money_format_Frenzy = function (t, r) {
  function e(t, r) {
  return void 0 === t ? r : t
  }
  function a(t, r, a, o) {
      if (r = e(r, 2), a = e(a, ","), o = e(o, "."), isNaN(t) || null == t) return 0;
      t = (t/100).toFixed(r);
      var n = t.split(".");
      return n[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + a) + (n[1] ? o + n[1] : "")
  }
  "string" == typeof t && (t = t.replace(".", ""));
  var o = "",
      n = /\{\{\s*(\w+)\s*\}\}/,
      i = r || this.money_format;
  switch (i.match(n)[1]) {
  case "amount":
      o = a(t, 2);
  break;
  case "amount_no_decimals":
      o = a(t, 0);
  break;
  case "amount_with_comma_separator":
      o = a(t, 2, ".", ",");
  break;
  case "amount_with_space_separator":
      o = a(t, 2, " ", ",");
  break;
  case "amount_with_period_and_space_separator":
      o = a(t, 2, " ", ".");
  break;
  case "amount_no_decimals_with_comma_separator":
      o = a(t, 0, ".", ",");
  break;
  case "amount_no_decimals_with_space_separator":
      o = a(t, 0, ".", "");
  break;
  case "amount_with_space_separator":
      o = a(t, 2, ",", "");
  break;
  case "amount_with_apostrophe_separator":
      o = a(t, 2, "'", ".")
  }
      return i.replace(n, o)
  };
  let frenzy_setting_recomm_data = {
      "layout_type": "2",
      "grid_items_per_row": "5",
      "total_items": "10",
      "grid_show_secondary_image": "1",
      "grid_title": "YOU MAY ALSO LIKE",
      "grid_align_text": "3",
      "title_align": "3"
  };
  let frenzy_setting_recomm_css = {
      "card_border_color": "ffffff",
      "arrow_color": "#ffffff",
      "text_color": "#565656",
      "price_color": "#999999",
      "compare_price_color": "#000000"
  };


  async function send_events(product_id, query_id){
      let frenzyUserID = window.Customer.customerNo || getCookieValue('__frenzy_user_id');      
      var data_json = JSON.stringify([{
      sku: product_id,
      event_name: "no_results_carosuel_product_click",
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
  }

  let addToCartUrl = $('input[name="add-to-cart-url"]').val();
  let getCartUrl = $('input[name="get-cart-url"]').val();    

  let addToCartButtonHTML = `
      <input type="hidden" class="add-to-cart-url" value="`+addToCartUrl+`"/>
      <input type="hidden" class="get-cart-url" value="`+getCartUrl+`"/>
      <button
          onclick="dataLayerPushAddtoCart()"
          class="add-to-cart btn btn-primary"
          data-toggle="modal"
          aria-label="Add [[product_title]] to Cart"
          data-target="#chooseBonusProductModal"
          data-gtmdata="[[gtmdata]]"
          data-pid="[[product_id]]" [[product_stock_status]] cypress-target="addToCartButton">
          Add To Cart
      </button>
  `;

  let frenzy_setting_recomm_html = `
    <div class='frenzy_product_item' data-id='[[product_id]]' data-query-id='[[query_id]]' onclick='send_events("[[product_id]]", "[[query_id]]")'>
      ${window.wishlistPref ?
        `<button data-href='${window.Wishlist_ToggleProduct}'
        class="wishlist wishlist-toggle-product"
        data-wishlistpid="[[product_id]]"
        data-productname="[[product_title]]"
        data-gtmdata="[[gtmdata]]"
        data-isinwishlist="[[data_product_isinwishlist]]"
        aria-label="Toggle Wishlist for [[product_title]]">
        <div class="wishlist-icon wishlist-icon-div [[product_isinwishlist]]" data-id='[[product_id]]'></div>
        </button>` : ''
      }
      </isif>
      <figure>
        <a href='[[product_url]]' aria-label='[[product_title]]'>
            <img class='frenzy_img frenzy_img_first lazyload' data-src='[[product_featured_image]]' alt='[[product_title]]' onerror="this.onerror=null;this.src='${prodImgFallbackFrenzySearch}'">
        </a>
      </figure>
      <div class='frenzy_product_desc'>
        <div class='frenzy_product_brand' style='line-height: 20px; margin: 0 0 6px 0; font-size: 16px; font-weight: 500; letter-spacing: .075em; text-transform: uppercase;'>
            [[product_brand]]
        </div>
        <h3 class='frenzy_product_title' style='font-family: brandon-grotesque, sans-serif; font-size: 16px; font-weight: 400; color: #565656; text-transform: capitalize;'>
            <a href='[[product_url]]' aria-label='[[product_title]]'>[[product_title]]</a>
        </h3>
        <div class='frenzy_product_price_meta'>
            <span class='frenzy_product_price_sale' style='font-size: 16px; color: #000; font-weight: 500;'>
            [[product_sale_price]]
            </span>
        </div>
      </div>
      `+ addToCartButtonHTML +`
    </div>
    `;
  /*
  * Append stylesheet
  */
  let head_Frenzy = document.getElementsByTagName('HEAD')[0];
  let swiper_link_Frenzy = document.createElement('link');
  swiper_link_Frenzy.rel = 'stylesheet';
  swiper_link_Frenzy.type = 'text/css';
  swiper_link_Frenzy.href = 'https://shopify.plugin.frenzy.ai/api/public/assets/css/swiper.min.css';
  head_Frenzy.appendChild(swiper_link_Frenzy);
  const script_Frenzy = document.createElement('script');
  script_Frenzy.src = 'https://shopify.plugin.frenzy.ai/api/public/assets/js/swiper.min.js';
  document.body.appendChild(script_Frenzy);
  let get_frenzy_recommendation_section = document.querySelector('.you_may_also_like');
  const getHomepageProductsApi = async () => {
      let frenzyUserID = window.Customer.customerNo || getCookieValue('__frenzy_user_id');
      var present_date = new Date();
      var past_date = new Date(present_date);
      past_date.setDate(past_date.getDate() - number_days_ago);
      present_date = present_date.toISOString().split('T')[0]
      past_date = past_date.toISOString().split('T')[0]
      var data_json = JSON.stringify({
      sku: sku,
      num_matching: num_matching,
      full_description: true,
      user_id: frenzyUserID
      });
      const response = await fetch(authUrl_Frenzy, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              'x-frenzy-authorization': 'b423c0ba-a5f5-4c32-b369-ad7bdc94a1b5'
          }
      });
      // const data = await response.json();
      const data2 = await response.json();
      const data = data2.data;

      getHomepageProducts(data.matching_products, frenzy_setting_recomm_data, frenzy_setting_recomm_html, data.request_id);
      const recommendationCss = frenzy_setting_recomm_css;
      const cssdata = '.frenzy_recommendation_section .frenzy_product_item figure{border-color: #ffffff;} ' + '.frenzy_recommendation_section .frenzy_product_item_detail, .frenzy_recommendation_section .frenzy_product_item_detail h3 a{color:#565656} ' + '.frenzy_recommendation_section .frenzy_product_price_sale{color:#999999} ' + '.frenzy_recommendation_section .frenzy_product_price_compare{color:#999999} ' + '.frenzy_recommendation_section .frenzy_container { margin-top: 0px; } .frenzy_recommendation_title {font-size: 24px !important;} .rectangle-bar {width: 100%;height: 2px;background-color: #C2C4C4; margin-top: 10px;}'+'.rectangle-bar-container {width: 100%; position: relative; margin-top: 10px;} .rectangle-bar-half {width: 80%; height: 10px; background-color: #000000; position: absolute; top: -2px;}';
      let head_Frenzy = document.head || document.getElementsByTagName('head')[0],
      style_Frenzy = document.createElement('style');
      head_Frenzy.appendChild(style_Frenzy);
      style_Frenzy.type = 'text/css';
      if (style_Frenzy.styleSheet) {
          style_Frenzy.styleSheet.cssText = cssdata;
      } else {
          style_Frenzy.appendChild(document.createTextNode(cssdata));
      }
  }

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


  function getHomepageProducts(productData, settingData, gridHtml, query_id) {
  let product_grid_html = gridHtml;
  let recommendation_layout_mode = settingData.layout_type;
  const title_align = settingData.title_align === '1' ? 'text_align-left' : settingData.title_align === '2' ? 'text_align-right' : 'text_align-center'; {
  const shop_currency = get_frenzy_recommendation_section.getAttribute('data-currency');
  let recommendationProductHTML = '';
  let gtmDatalist = [];
  (productData || []).map((x, i) => {
  recommendationProductHTML += getProductGridItem(product_grid_html, x, settingData, shop_currency, query_id, i, gtmDatalist, search_query || corrected_query_text,
    products_found_count);
  })
  $('body').trigger('frenzyRecommadtion:productitem',JSON.stringify(gtmDatalist));
  let recommendation_html = '<div class="frenzy_container">';
  recommendation_html += '<h2 class="frenzy_recommendation_title ' + title_align + '" style="font-family: Montserrat !important;">' + settingData.grid_title + '</h2>';
  recommendation_html += '<div class="frenzy_recommendation_wraper"><div class="frenzy_recommendation_contain" style="margin:0 30px;">';
  recommendation_html += '<div class="recommendation_product_items frenzy_product_row">' +   recommendationProductHTML + '</div>';
  // recommendation_html += '<div class="rectangle-bar-container">';
  // recommendation_html += '<div class="rectangle-bar"></div>';
  // recommendation_html += '<div class="rectangle-bar-half"></div>';
  // recommendation_html += '</div>';
  recommendation_html += '</div></div>';
  recommendation_html += '</div>';
  get_frenzy_recommendation_section.innerHTML = recommendation_html;
  $('body').trigger('frenzy:dataLoadComplete');


  if(recommendation_layout_mode === '2'){
      document.querySelector('.frenzy_recommendation_wraper').classList.add('frenzy_slider');
      document.querySelector('.recommendation_product_items').classList.add('swiper-wrapper','ltg_'+settingData.grid_items_per_row+'');
      setTimeout(function() {
      var swiper = new Swiper(".frenzy_recommendation_contain", {
      slidesPerView: 'auto',
      spaceBetween: 0,
      navigation: {
          nextEl: "#recommendation_next",
          prevEl: "#recommendation_prev"
      },
          freeMode: true,
          pagination: {
          el: ".swiper-pagination",
          clickable: true,
          }
          }); }, 100);
  } else {
  document.querySelector('.frenzy_recommendation_section .recommendation_product_items').classList.add('layout_type_grid', 'ltg_' + settingData.grid_items_per_row + '');
  }
  }
  }

  function getProductGridItem(html, x, settingData, shop_currency, query_id, index, gtmDatalist, searchTerm, resultsCount) {
  let product_grid_html = html;
  let main_grid_image = 'https://shopify.plugin.frenzy.ai/api/public/assets/images/placeholder_img.jpg';
  if (x.org_image_url) {
  if (x.org_image_url.includes(' ')) {
  let pro_image = (x.org_image_url).split(/(?=https?:\/\/)/);
  main_grid_image = pro_image[0].trim();
  } else {
  main_grid_image = x.org_image_url;
  }
  let imagspilt = main_grid_image.split('/on/');
  main_grid_image = 'https://www.whatgoesaroundnyc.com/dw/image/v2/BGND_PRD/on/'+ imagspilt[1] + '?sw=200&sh=300';

  }
  let prod_url = x.org_prod_url;
  let stock_available = x.org_stock_available === 'True' ? 'false' : 'true';
  let grid_class_name = settingData.layout_type === '1' ? 'frenzy_grid' : 'frenzy_grid swiper-slide';
  let grid_text_align = settingData.grid_align_text === '1' ? 'text_align_left' : settingData.grid_align_text === '2' ? 'text_align_right' : 'text_align_center';
  let gtmdata = {};
  let pName = x.org_product;
  let pBrand = x.org_brand;
  let position = index + 1;
  let discount_percent = 0;
  let discount_price = 0;

  let comparePrice = (x && x.org_msrp_price && x.org_msrp_price > x.org_price) ? money_format_Frenzy((x.org_msrp_price * 100),shop_currency) : '' ;
  if(comparePrice != '') {
      discount_price = x.org_msrp_price - x.org_price;
      discount_percent = ((discount_price / x.org_price) * 100).toFixed(2);
  }
  gtmdata.item_id = x.sku;
  gtmdata.price = x.org_price;
  gtmdata.item_brand = pBrand.replaceAll(/["]/g, '');
  gtmdata.item_name = pName.replaceAll(/["]/g, '');
  gtmdata.stock_status = (x.org_stock_available == 'True') ? 'In Stock' : 'Out of Stock';
  gtmdata.product_gender  = (x.org_gender) ? x.org_gender : 'Women';
  gtmdata.item_list_id = 'you_may_also_like';
  gtmdata.item_list_name = 'You may also like';
  gtmdata.sale_status = (comparePrice == '') ? 'No Offer':'On Offer';
  gtmdata.discount = discount_price;
  gtmdata.item_category = '';
  gtmdata.item_category2 = '';
  gtmdata.item_variant='';
  gtmdata.item_condition='';
  var gggData = JSON.stringify(gtmdata);
  gggData = gggData.replace(/"/g, '&quot;');
  gtmDatalist.push(gtmdata);
  product_grid_html = '<div class="' + grid_class_name + ' out_of_stock_' + stock_available + ' ' +  grid_text_align + ' ' + '">' + product_grid_html;
  product_grid_html = product_grid_html.replaceAll('[[query_id]]', query_id);
  product_grid_html = product_grid_html.replaceAll('[[product_featured_image]]', main_grid_image);
  product_grid_html = product_grid_html.replaceAll('[[product_id]]', x.sku);
  product_grid_html = product_grid_html.replaceAll('[[product_title]]', x.org_product);
  product_grid_html = product_grid_html.replaceAll('[[product_brand]]', x.org_brand);
  product_grid_html = product_grid_html.replaceAll('[[gtmdata]]', gggData);

  const isSelected = wishlistPIDs.includes(x.sku) ? 'selected' : '';  // setting wishlist flag
  product_grid_html = product_grid_html.replaceAll('[[product_isinwishlist]]', isSelected);
  product_grid_html = product_grid_html.replaceAll('[[data_product_isinwishlist]]', wishlistPIDs.includes(x.sku));

  product_grid_html = product_grid_html.replaceAll('[[product_url]]', prod_url);
  product_grid_html = product_grid_html.replaceAll('[[product_sale_price]]', money_format_Frenzy((x.org_price * 100), shop_currency));
  if (x.org_stock_available == 'True') {
    product_grid_html = product_grid_html.replaceAll('[[product_stock_status]]', '');
  }else{
    product_grid_html = product_grid_html.replaceAll('[[product_stock_status]]', 'disabled');
  }
  product_grid_html = product_grid_html + '</div>';
  return product_grid_html;
  }

  if (get_frenzy_recommendation_section) {
      getHomepageProductsApi();
  }
}

window.onload = function(){
  if(!filterArray_Frenzy.price){
    filterArray_Frenzy.price = {min:0,max:1000000}
  }

  let filterchange = urlParams_Frenzy.get('filterchange');
  if(filterchange == 'true'){
    let params = Object.fromEntries(urlParams_Frenzy);
    if(urlParams_Frenzy.get('q')){
      delete params.q;
    }
    if(urlParams_Frenzy.get('page')){
      delete params.page;
    }
    if(urlParams_Frenzy.get('filterchange')){
      delete params.filterchange;
    }
    if(urlParams_Frenzy.get('sort')){
      delete params.sort;
    }
    for (const [key, value] of Object.entries(params)) {
      let innerData=Object.fromEntries(new URLSearchParams(value))
      if(["price"].includes(key)){
        params[key]=innerData;
      }else{
        params[key]=Object.values(innerData);
      }
    }
    filterArray_Frenzy = params;
    if(!filterArray_Frenzy.price){
      filterArray_Frenzy.price = {min:0,max:1000000}
    }
  }

  if(get_frenzy_search_page_section){
    if(filterchange == 'true'){
      getSearchPAgeFilterChangeApi(filterArray_Frenzy,selected_page_Frenzy - 1, false)
    }else{
      getSearchPageApi();
    }
  }

  // keep sticky filter when new products are loaded
  // $('body').on('frenzy:dataLoadComplete', function () {
  //     const filterView = $("#frenzy-filter-view");
  //     const gridProduct = $('.frenzy_flex_row');
  //     // stickFilterViewOnScroll(filterView, gridProduct, false)
  // });
};

window.addEventListener('popstate', function (event) {
window.location.reload();
});
window.addEventListener('resize', function(event) {
  if($('body').find('.frenzy_container').length > 0) {
    if ($(window).width() > 991) {
      if($(window).width() > 2277 ) {
        $('.ffc_sidebar_col').stickit('destroy');
      } else {
        $('.ffc_sidebar_col').stickit('destroy');
        $('.ffc_sidebar_col').stickit({top: 200});
      }
    } else {
      $('.ffc_sidebar_col').stickit('destroy');
    }
  }
});

// applying sticky to side filter bar
window.addEventListener('scroll', function (event){
    //frenzy-filter-view
    //frenzy_product_grid

    const filterView = $("#frenzy-filter-view");
    const gridProduct = $('.frenzy_flex_row');
    // stickFilterViewOnScroll(filterView, gridProduct, false)
});

function scrollToTop(){
  $('html, body').animate({ scrollTop: 0 }, 'slow'); // Smoothly scroll to top
}