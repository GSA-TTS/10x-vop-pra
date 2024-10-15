(function () {
  let slideIndex = 0; // Starting with 0 index
  const slidesContainer = document.getElementById("slides-container");
  const slides = document.querySelectorAll(".slide"); // Get all slides
  const prevButton = document.querySelector(".prev");
  const nextButton = document.querySelector(".next");
  const dots = document.querySelectorAll(".dot-nav");
  const slideWidth = slides[0].clientWidth; // Width of one slide

  function updateActiveDot() {
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === slideIndex);
    });
  }

  function goToSlide(index) {
    slidesContainer.scrollLeft = slideWidth * index;
    slideIndex = index;
    updateActiveDot(); // Update dot active state
  }

  // Click event for next button
  nextButton.addEventListener("click", () => {
    slideIndex = (slideIndex + 1) % slides.length; // Wrap around when reaching the last slide
    goToSlide(slideIndex);
  });

  // Click event for previous button
  prevButton.addEventListener("click", () => {
    slideIndex = (slideIndex - 1 + slides.length) % slides.length;
    goToSlide(slideIndex);
  });

  // Click event for dots navigation
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      goToSlide(index);
    });
  });

  //Makes dots clickable with a keyboard
  document.querySelectorAll(".prev, .next, .dot-nav").forEach((item) => {
    item.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault(); // Prevent space from scrolling the page
        item.click(); // Trigger the click event when Enter or Space is pressed
      }
    });
  });

  // Initialize the slider with the first slide and active dot
  goToSlide(slideIndex);
})();