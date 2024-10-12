document.addEventListener('DOMContentLoaded', function() {
  let lastScrollTop = 0; // Variable to store the last scroll position
  const header = document.querySelector('.header'); // Select the header by its class

  window.addEventListener('scroll', function() {
      let currentScroll = window.pageYOffset || document.documentElement.scrollTop; // Get current scroll position

      if (currentScroll > lastScrollTop && currentScroll > header.offsetHeight) {
          // Scrolling down
          header.style.top = `-${header.offsetHeight}px`; // Move header out of view
      } else if (currentScroll < lastScrollTop) {
          // Scrolling up
          header.style.top = '0'; // Move header into view
      }

      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; // Update last scroll position, setting it to 0 if it's negative
  });
});
document.addEventListener('DOMContentLoaded', (event) => {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('enlarged');
        } else {
          entry.target.classList.remove('enlarged');
        }
      });
    }, { threshold: 0.8 }); // 1.0 means 100% of the element is in view
  
    const divsToEnlarge = document.querySelectorAll('.enlarge');
  
    divsToEnlarge.forEach(div => {
      observer.observe(div);
    });
  });
  
