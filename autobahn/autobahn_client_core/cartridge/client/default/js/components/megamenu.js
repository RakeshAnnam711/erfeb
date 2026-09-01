'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Use event delegation for better performance
    document.body.addEventListener('click', (event) => {
        // Check if the clicked element matches the dropdown-link class
        if (event.target.matches('.dropdown-link')) {
            const parentMenu = event.target.closest('ul[aria-label]');
            if (parentMenu) {
                const categoryId = parentMenu.getAttribute('aria-label');
                const categoryURL = parentMenu.getAttribute('categoryURL');

                // Set the active nav link in sessionStorage
                console.log('function called', categoryURL);
                sessionStorage.setItem('activeNavLink', categoryURL);
            }
        }
    });

    //Rendering active nav-link
    const navLinks = document.querySelectorAll('.nav-link'); // Get all navigation links
    navLinks.forEach(link => {
        if (link.getAttribute('href') === window.location.pathname || link.getAttribute('href') === window.location.href) {
            link.classList.add('nav-link-active'); // Add the "active" class to the clicked link
            sessionStorage.setItem('activeNavLink', link.getAttribute('href')); // Store the ID of the clicked link in sessionStorage
        }
    });


    // Add click event listeners to each navigation link
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            navLinks.forEach(link => link.classList.remove('nav-link-active')); // Remove the "active" class from all nav links
            link.classList.add('nav-link-active'); // Add the "active" class to the clicked link
            sessionStorage.setItem('activeNavLink', this.getAttribute('href')); // Store the ID of the clicked link in sessionStorage
        });
    });

    const activeLinkHref = sessionStorage.getItem('activeNavLink'); // Check if there's an active link stored in sessionStorage

    // If an active link was stored, add the "active" class to it
    if (activeLinkHref) {
        const queryElement = `a[href="` + activeLinkHref + `"]`;
        const activeLink = document.querySelector(queryElement);
        if (activeLink) {
            activeLink.classList.add('nav-link-active');
        }
    }

    //setting active link ig SHOP NOW of catg is clicked
    const shopNowLinks = document.querySelectorAll('.shop-now-link');
    shopNowLinks.forEach(link => {
        link.addEventListener('click', () => {
            sessionStorage.setItem('activeNavLink', link.getAttribute('href')); // Store the ID of the clicked link in sessionStorage
        })
    });

    // code optimization on 23 Apr 2025
    const logoLinks = document.getElementById('header-nav').querySelectorAll('a');
    logoLinks.forEach(link => {
        if (!link.classList.contains('dropdown-link') && link.getAttribute('id') !== 'dropdownAccountSelector') {
            link.addEventListener('click', () => {
                sessionStorage.setItem('activeNavLink', '');
            });
        }
    })

    //script to render initial state of suggestion wrapper onClicking on search icon
    document.getElementById('search-icon-btn-mobile').addEventListener('click', () => {
        const q = '';
        const url = window.SearchSuggestionsURL + q;

        const xhr = new XMLHttpRequest(); // Create a new XMLHttpRequest object

        // Set up the `onreadystatechange` event handler
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    // Parse and log the response JSON
                    const response = xhr.responseText;
                    const suggestionsWrapper = document.querySelector('.suggestions-wrapper');
                    suggestionsWrapper.innerHTML = xhr.responseText;
                } else {
                    console.error('Error:', xhr.status, xhr.statusText);
                }
            }
        };

        try {
            xhr.open('GET', url, true); // Open the request
            xhr.setRequestHeader('Content-Type', 'application/json'); // Set headers if needed
            xhr.send(); // Send the request
        } catch (error) {
            console.log(error);
        }
    });

    const inputField = document.querySelector('.suggestions-search-input');
    const submitButton = document.querySelector('button[name="search-results"]');

    // Function to toggle the button visibility
    function toggleButtonVisibility() {
        if (inputField.value.trim() === '') {
            submitButton.style.display = 'none'; // Hide the button
        } else {
            submitButton.style.display = 'block'; // Show the button
        }
    }

    toggleButtonVisibility();   // Initially hide the button if the input is empty
    inputField.addEventListener('input', toggleButtonVisibility);   // Listen for input events on the text field

    // Performance: Lazy load megamenu images using Intersection Observer
    function lazyLoadMegamenuImages() {
        const lazyImages = document.querySelectorAll('.megamenu-image-lazy[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const dataSrc = img.getAttribute('data-src');
                        if (dataSrc) {
                            img.src = dataSrc;
                            img.removeAttribute('data-src');
                            img.classList.remove('megamenu-image-lazy');
                            observer.unobserve(img);
                        }
                    }
                });
            }, {
                rootMargin: '50px' // Start loading 50px before image enters viewport
            });

            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for browsers without IntersectionObserver
            lazyImages.forEach(img => {
                const dataSrc = img.getAttribute('data-src');
                if (dataSrc) {
                    img.src = dataSrc;
                    img.removeAttribute('data-src');
                    img.classList.remove('megamenu-image-lazy');
                }
            });
        }
    }

    // Performance: Lazy load megamenu content assets when dropdown is shown
    function loadMegamenuAssets() {
        const assetContainers = document.querySelectorAll('.megamenu-asset-lazy-container');
        
        assetContainers.forEach(container => {
            const lazyDivs = container.querySelectorAll('.megamenu-asset-lazy');
            
            lazyDivs.forEach(lazyDiv => {
                // Lazy load images within content assets
                const images = lazyDiv.querySelectorAll('img[data-src], img[src*="placeholder"]');
                images.forEach(img => {
                    if (img.dataset.src && img.src.includes('placeholder')) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                });
            });
        });
    }

    // Initialize lazy loading for images
    lazyLoadMegamenuImages();
    
    // Load assets when megamenu dropdown is shown
    function handleMegamenuShow(event) {
        const dropdown = event.target.closest('.dropdown');
        if (dropdown && dropdown.querySelector('.megamenu')) {
            lazyLoadMegamenuImages();
            loadMegamenuAssets();
        }
    }
    
    // Listen for Bootstrap dropdown show event
    if (typeof $ !== 'undefined') {
        $(document).on('shown.bs.dropdown', handleMegamenuShow);
        // Also handle on hover for megamenu
        $('.megamenu').on('mouseenter', function() {
            lazyLoadMegamenuImages();
            loadMegamenuAssets();
        });
    }
    
    // Fallback for non-jQuery or if Bootstrap events don't fire
    document.addEventListener('DOMContentLoaded', function() {
        const megamenuDropdowns = document.querySelectorAll('.megamenu .dropdown-menu');
        megamenuDropdowns.forEach(dropdown => {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (dropdown.classList.contains('show')) {
                            lazyLoadMegamenuImages();
                            loadMegamenuAssets();
                        }
                    }
                });
            });
            
            observer.observe(dropdown, {
                attributes: true,
                attributeFilter: ['class']
            });
        });
    });
});