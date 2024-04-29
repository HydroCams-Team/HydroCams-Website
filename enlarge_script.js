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
  