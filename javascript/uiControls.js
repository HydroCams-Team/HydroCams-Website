// uiControls.js

const submitPrefsBtn = document.getElementById('submit-prefs');
//const toleranceSlider = document.getElementById('tolerance-slider');
//const toleranceValue = document.getElementById('toleranceValue');
const colorPicker = document.getElementById('colorPicker');

// Initialize variables to store selected preferences
selectedColor = colorPicker.value;
//selectedTolerance = toleranceSlider.value;

// Get the contour input field and preview button
const contourInput = document.getElementById('contourArea');
const previewContourBtn = document.getElementById('previewContourBtn');

// Function to calculate radius based on contour area
function getCircleRadiusFromArea(area) {
    return Math.sqrt(area / Math.PI);
}

// Event listener for the preview button
previewContourBtn.addEventListener('click', () => {
    const contourArea = parseFloat(contourInput.value);  // Get the contour area from the input

    if (isNaN(contourArea) || contourArea <= 0) {
        alert("Please enter a valid contour area.");
        return;
    }

    if (!previewVisible) {
        // Calculate the radius of the circle
        const radius = getCircleRadiusFromArea(contourArea);

        // Clear previous drawings and draw the image
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);

        // Draw a yellow circle to represent the contour size
        context.beginPath();
        context.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI);
        context.strokeStyle = 'yellow';
        context.lineWidth = 3;
        context.stroke();
        context.closePath();

        // Update button to say "Hide"
        previewContourBtn.textContent = 'Hide';
        previewVisible = true;
        console.log(`Previewing circle with radius: ${radius}px for contour area: ${contourArea}px²`);
    } else {
        // Clear the preview (hide the circle)
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);  // Redraw the original image without the circle

        // Update button to say "Preview"
        previewContourBtn.textContent = 'Preview';
        previewVisible = false;
        console.log("Hiding preview circle");
    }
});

contourInput.addEventListener('input', () => {
    submitPrefsBtn.textContent = 'Save';
    submitPrefsBtn.disabled = false;
    submitPrefsBtn.classList.remove('grayed-out');  // Remove the gray-out class
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);  // Redraw the original image without the circle
    previewContourBtn.textContent = 'Preview';
    previewVisible = false;
    console.log("Hiding preview circle");
});


// Event handler for color selection and tolerance submission
document.getElementById('colorForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Prevent the default form submission
    selectedColor = colorPicker.value;  // Update selected color
    //selectedTolerance = toleranceSlider.value;  // Update selected tolerance

    submitPrefsBtn.textContent = 'Saved';
    submitPrefsBtn.disabled = true;  // Disable the button
    submitPrefsBtn.classList.add('grayed-out');

    // Save preferences for later CV processing
    console.log("Selected color for CV processing: " + selectedColor);
    //console.log("Selected tolerance for CV processing: " + selectedTolerance);
    console.log("Selected contour area for CV processing: " + contourInput.value);
});

// Re-enable the submit button if the color is changed
colorPicker.addEventListener('input', function() {
    submitPrefsBtn.textContent = 'Save';
    submitPrefsBtn.disabled = false;  // Enable the button
    submitPrefsBtn.classList.remove('grayed-out');  // Remove the gray-out class
});

// Update color preview dynamically when color is selected
document.getElementById('colorPicker').addEventListener('input', function(event) {
    selectedColor = event.target.value;
});
