'use strict';

var siteIntegrations = require('integrations/integrations/siteIntegrationsUtils');
var toggleObject = siteIntegrations.getIntegrationSettings();

function autocomplete(inp, arr) {
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function (e) {
        var a, b, i, val = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
        /*for each item in the array...*/
        for (i = 0; i < arr.length; i++) {
            /*check if the item starts with the same letters as the text field value:*/

                /*create a DIV element for each matching element:*/
                b = document.createElement("DIV");
                /*make the matching letters bold:*/
                b.innerHTML += '<span class="icon-location"></span>'
                b.innerHTML += arr[i].street_line + ' ' +arr[i].secondary + ' ' +arr[i].city+ ' ' + arr[i].state+ ' ' + arr[i].zipcode;
                /*insert a input field that will hold the current array item's value:*/
                b.innerHTML += "<input type='hidden' value='" + arr[i].street_line + "'>";
                b.innerHTML += "<input type='hidden' value='" + arr[i].secondary + "'>";
                b.innerHTML += "<input type='hidden' value='" + arr[i].city + "'>";
                b.innerHTML += "<input type='hidden' value='" + arr[i].state + "'>";
                b.innerHTML += "<input type='hidden' value='" + arr[i].zipcode + "'>";
                /*execute a function when someone clicks on the item value (DIV element):*/
                b.addEventListener("click", function (e) {
                    /*insert the value for the autocomplete text field:*/
                    inp.value = this.getElementsByTagName("input")[0].value;
                    if ( $(this).parent().parent().find('[id^="billingAddressOne"]').length > 0) {
                        $('[id^="billingAddressTwo"]').val(this.getElementsByTagName("input")[1].value)
                        $('[id^="billingState"]').val(this.getElementsByTagName("input")[3].value);
                        $('[id^="billingAddressCity"]').val(this.getElementsByTagName("input")[2].value);
                        $('[id^="billingZipCode"]').val(this.getElementsByTagName("input")[4].value);
                    } else if ($(this).parent().parent().find('[id^="address1"]').length > 0) {
                        $('[id^="address2"]').val(this.getElementsByTagName("input")[1].value)
                        $('[id^="state"]').val(this.getElementsByTagName("input")[3].value);
                        $('[id^="city"]').val(this.getElementsByTagName("input")[2].value);
                        $('[id^="zipCode"]').val(this.getElementsByTagName("input")[4].value);
                    } else {
                        $('[id^="shippingAddressTwo"]').val(this.getElementsByTagName("input")[1].value)
                        $('[id^="shippingState"]').val(this.getElementsByTagName("input")[3].value);
                        $('[id^="shippingAddressCity"]').val(this.getElementsByTagName("input")[2].value);
                        $('[id^="shippingZipCode"]').val(this.getElementsByTagName("input")[4].value);
                    }

                    /*close the list of autocompleted values,
                    (or any other open lists of autocompleted values:*/
                    closeAllLists();
                });
                a.appendChild(b);

        }
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function (e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            currentFocus++;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 38) { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            currentFocus--;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 13) {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (currentFocus > -1) {
                /*and simulate a click on the "active" item:*/
                if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

function initSmartyUS() {
    if (toggleObject.smartyEnabled) {
        var timeout = null;
        $(document).on('keyup', '.smartyAddress', function (e) {
            clearTimeout(timeout);

    		// Make a new timeout set to go off in 1000ms (1 second)
    		timeout = setTimeout(function () {
                var serchTxt = $(e.target).val();
                var elementID = $(e.target).attr('id');
                if (serchTxt.trim() === ""){
                    return;
                }

                    var serchurl = toggleObject.smartyAPIUrl + serchTxt;
                    $.ajax({
                        url: serchurl,
                        method: 'GET',
                        success: function (response) {
                            autocomplete(document.getElementById(elementID), response.suggestions);
                        },
                        error: function () {

                        },
                    });

    		}, 300);

        });
    }

}

module.exports = {
    init: function () {
        initSmartyUS();
    }
}
