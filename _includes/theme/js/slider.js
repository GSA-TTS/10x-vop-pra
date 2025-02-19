(function () {
  let slideIndex = 0; // Starting at the first slide
  const slidesContainer = document.getElementById("slides-container");
  const slides = document.querySelectorAll(".slide");
  const prevButton = document.querySelector(".prev");
  const nextButton = document.querySelector(".next");
  const dots = document.querySelectorAll(".dot-nav");

  // Function to calculate and set the height of the container to match the tallest slide
  function setContainerHeight() {
    let tallestSlideHeight = 0;

    // Temporarily set all slides to visible for height calculation
    slides.forEach((slide) => {
      slide.style.display = "block";
      tallestSlideHeight = Math.max(tallestSlideHeight, slide.scrollHeight);
      slide.style.display = "none"; // Hide the slide again after measuring
    });

    // Apply the tallest height to the container
    slidesContainer.style.height = `${tallestSlideHeight}px`;
  }

  // Function to update active dot navigation
  function updateActiveDot() {
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === slideIndex);
    });
  }

  // Function to go to a specific slide
  function goToSlide(index) {
    slides.forEach((slide, i) => {
      slide.style.display = i === index ? "block" : "none";
      slide.setAttribute("aria-hidden", i === index ? "false" : "true");
    });
    slideIndex = index;
    updateActiveDot();
  }

  // Event listener for the next button
  nextButton.addEventListener("click", () => {
    slideIndex = (slideIndex + 1) % slides.length; // Loop back to the first slide if at the end
    goToSlide(slideIndex);
  });

  // Event listener for the previous button
  prevButton.addEventListener("click", () => {
    slideIndex = (slideIndex - 1 + slides.length) % slides.length; // Loop to the last slide if at the beginning
    goToSlide(slideIndex);
  });

  // Event listener for dot navigation
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      goToSlide(index);
    });
  });

  // Add keyboard navigation for buttons and dots
  document.querySelectorAll(".prev, .next, .dot-nav").forEach((item) => {
    item.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        item.click(); // Trigger the click event
      }
    });
  });

  // Initialize the slider
  function initializeSlider() {
    setContainerHeight(); // Set the container height to match the tallest slide
    goToSlide(slideIndex); // Display the first slide
  }

  // Adjust the container height dynamically on window resize
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      setContainerHeight();
      goToSlide(slideIndex); // Ensure the current slide remains visible
    }, 200); // Throttle resize handling for performance
  });

  // Run the initialization
  initializeSlider();
})();