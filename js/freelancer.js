(function() {
  "use strict"; // Start of use strict

  var mainNav = document.getElementById('mainNav');
  var scrollToTop = document.querySelector('.scroll-to-top');

  // Shrink navbar and show scroll to top button when page is not at top
  var onScroll = function() {
    mainNav.classList.toggle('navbar-shrink', window.scrollY > 100);
    scrollToTop.classList.toggle('visible', window.scrollY > 100);
  };
  onScroll();
  document.addEventListener('scroll', onScroll);

  // Activate scrollspy to add active class to navbar items on scroll
  new bootstrap.ScrollSpy(document.body, {
    target: '#mainNav',
    rootMargin: '0px 0px -40%'
  });

  // Closes responsive menu when a navbar link is clicked
  var navbarCollapse = document.getElementById('navbarResponsive');
  document.querySelectorAll('#navbarResponsive .nav-link').forEach(function(link) {
    link.addEventListener('click', function() {
      if (navbarCollapse.classList.contains('show')) {
        bootstrap.Collapse.getOrCreateInstance(navbarCollapse).hide();
      }
    });
  });

})(); // End of use strict
