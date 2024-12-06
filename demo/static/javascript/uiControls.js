const colorPickerContainer = document.getElementById('colorPickerContainer');

// Initialize array to store selected colors
let colors = Array.from(document.getElementsByClassName('color-input')).map(input => input.value);

const previewContourBtn = document.getElementById('previewContourBtn');
const contourInputMin = document.getElementById('contourArea');
const contourInputMax = document.getElementById('contourAreaMax');

// Function to calculate radius based on contour area
function getCircleRadiusFromArea(area) {
    return Math.sqrt(area / Math.PI);
}

previewContourBtn.addEventListener('click', () => {
    const contourAreaMin = parseFloat(contourInputMin.value); // Get the min contour area
    const contourAreaMax = parseFloat(contourInputMax.value); // Get the max contour area

    if (isNaN(contourAreaMin) || contourAreaMin <= 0 || isNaN(contourAreaMax) || contourAreaMax <= 0) {
        alert("Please enter valid contour areas for both min and max.");
        return;
    }

    if (!previewVisible) {
        // Store the preview areas and trigger a redraw
        previewMinArea = contourAreaMin;
        previewMaxArea = contourAreaMax;

        drawAll(); // Redraw the canvas to include preview circles

        previewContourBtn.textContent = 'Hide';
        previewVisible = true;
        console.log(`Previewing circles for min area: ${contourAreaMin}px² (yellow) and max area: ${contourAreaMax}px² (orange)`);
    } else {
        // Clear the preview areas and trigger a redraw
        previewMinArea = null;
        previewMaxArea = null;

        drawAll(); // Redraw the canvas to hide preview circles

        previewContourBtn.textContent = 'Preview';
        previewVisible = false;
        console.log("Hiding preview circles");
    }
});

contourInputMin.addEventListener('input', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);  // Redraw the original image without the circle
    previewContourBtn.textContent = 'Preview';
    previewVisible = false;
    console.log("Hiding preview circle");
});

contourInputMax.addEventListener('input', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);  // Redraw the original image without the circle
    previewContourBtn.textContent = 'Preview';
    previewVisible = false;
    console.log("Hiding preview circle");
});

// Event handler for color selection submission
document.getElementById('colorForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Prevent the default form submission

    // Collect all current color values into the colors
    colors = Array.from(document.getElementsByClassName('color-input')).map(input => input.value);

    // Save preferences for later CV processing
    console.log("Selected colors for CV processing: ", colors);
    console.log("Selected min and max contour areas: ", contourInputMin.value, contourInputMax.value);
});
