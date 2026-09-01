// Performance: Use DOMContentLoaded with early return and optimized observer
document.addEventListener('DOMContentLoaded', function() {
  var giftInput = document.getElementById('giftcertificateid');
  if (!giftInput) return;

  var alreadyFocused = false;

  // Performance: Use MutationObserver with optimized callback
  var observer = new MutationObserver(function(mutations) {
    // Only process if class attribute changed
    var hasInvalidClass = giftInput.classList.contains('is-invalid');
    
    if (hasInvalidClass && !alreadyFocused) {
      giftInput.setAttribute('aria-invalid', 'true');
      giftInput.setAttribute('aria-label', 'Please enter a valid Gift Certificate.');
      // Use requestAnimationFrame for smoother focus
      requestAnimationFrame(function() {
        giftInput.focus();
      });
      alreadyFocused = true;
    } else if (!hasInvalidClass) {
      alreadyFocused = false;
    }
  });

  // Performance: Only observe class attribute changes
  observer.observe(giftInput, {
    attributes: true,
    attributeFilter: ['class']
  });
});
