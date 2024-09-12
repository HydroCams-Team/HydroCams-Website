const canvas = document.getElementById("image-canvas");
const context = canvas.getContext("2d");
let image = new Image();
let isDrawing = false;
let isDrawingEnabled = false;
let startX, startY, currentX, currentY;
let selectedRectIndex = null;
const rectangles = [];
const padding = 5; // Padding for the text
let lineWidth = 1; // Variable for line width
let textSize = 16; // Variable for text size
const minSelectableSize = 1; // Minimum size of selectable rectangle
const tolerance = 5; // Tolerance zone around the rectangle
let uploadedFiles = []; // To store the uploaded files (for single and multiple)
let currentImageIndex = 0; // For tracking which image is being displayed

// Handle single image upload
document.getElementById("upload-button").addEventListener("click", () => {
    document.getElementById("file-input").click();
});

document.getElementById("file-input").addEventListener("change", (event) => {
    uploadedFiles = [event.target.files[0]]; // Store single uploaded file
    currentImageIndex = 0;
    updateCanvasImage(currentImageIndex);
    updateNavigationButtons(); // Update button visibility

    if (uploadedFiles.length > 0) {
        document.getElementById("submit-button").style.display = 'inline-block';
    } else {
        document.getElementById("submit-button").style.display = 'none';
    }
});

const submitPrefsBtn = document.getElementById('submit-prefs');
const toleranceSlider = document.getElementById('toleranceSlider');
const toleranceValue = document.getElementById('toleranceValue');
const colorPicker = document.getElementById('colorPicker');

// Initialize variables to store selected preferences
let selectedColor = colorPicker.value;
let selectedTolerance = toleranceSlider.value;

// Get the contour input field and preview button
const contourInput = document.getElementById('contourArea');
const previewContourBtn = document.getElementById('previewContourBtn');
let previewVisible = false; // Track the visibility of the preview circle

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

// Update the displayed tolerance value as the slider is adjusted
toleranceSlider.addEventListener('input', function() {
    toleranceValue.textContent = toleranceSlider.value;
    selectedTolerance = toleranceSlider.value;  // Update selected tolerance value
    submitPrefsBtn.textContent = 'Save';
    submitPrefsBtn.disabled = false;
    submitPrefsBtn.classList.remove('grayed-out');  
});

// Event handler for color selection and tolerance submission
document.getElementById('colorForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Prevent the default form submission
    selectedColor = colorPicker.value;  // Update selected color
    selectedTolerance = toleranceSlider.value;  // Update selected tolerance

    submitPrefsBtn.textContent = 'Saved';
    submitPrefsBtn.disabled = true;  // Disable the button
    submitPrefsBtn.classList.add('grayed-out');

    // Save preferences for later CV processing
    console.log("Selected color for CV processing: " + selectedColor);
    console.log("Selected tolerance for CV processing: " + selectedTolerance);
    console.log("Selected contour area for CV processing: " + contourInput.value);
});

// Re-enable the submit button if the color is changed
colorPicker.addEventListener('input', function() {
    submitPrefsBtn.textContent = 'Save';
    submitPrefsBtn.disabled = false;  // Enable the button
    submitPrefsBtn.classList.remove('grayed-out');  // Remove the gray-out class
});


// Handle multiple image uploads
document.getElementById("upload-multiple-button").addEventListener("click", () => {
    document.getElementById("multi-file-input").click();
});

document.getElementById("multi-file-input").addEventListener("change", (event) => {
    uploadedFiles = Array.from(event.target.files).slice(0, 6); // Store up to 6 files
    currentImageIndex = 0;
    updateCanvasImage(currentImageIndex);
    updateNavigationButtons(); // Update button visibility
    if (uploadedFiles.length > 1) {
        document.getElementById("sfm-upload-button").style.display = 'inline-block';
        document.getElementById("submit-button").style.display = 'inline-block';
    } 
    else if (uploadedFiles.length == 1) {
        document.getElementById("submit-button").style.display = 'inline-block';
    } else {
        document.getElementById("sfm-upload-button").style.display = 'none';
    }
});

// Function to update the canvas with the current image
function updateCanvasImage(index) {
    const file = uploadedFiles[index];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            image.src = e.target.result;
            image.onload = function () {
                rectangles.length = 0;
                selectedRectIndex = null;
                canvas.width = image.width;
                canvas.height = image.height;
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0);
                const smallerDim = Math.min(image.width, image.height);
                lineWidth = Math.max(1, smallerDim / 300);
                textSize = Math.max(10, smallerDim / 25);
                drawAll();
                document.getElementById('image-counter').innerText = `${index + 1} / ${uploadedFiles.length}`;
            };
        };
        reader.readAsDataURL(file);
    }
}

// Arrow navigation for multiple images
document.getElementById("prev-image").addEventListener("click", () => {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        updateCanvasImage(currentImageIndex);
        updateNavigationButtons();
    }
});

document.getElementById("next-image").addEventListener("click", () => {
    if (currentImageIndex < uploadedFiles.length - 1) {
        currentImageIndex++;
        updateCanvasImage(currentImageIndex);
        updateNavigationButtons();
    }
});

// Function to update the visibility of navigation buttons
function updateNavigationButtons() {
    const prevButton = document.getElementById("prev-image");
    const nextButton = document.getElementById("next-image");
    const imageCounter = document.getElementById('image-counter');
    
    // Show/hide buttons based on the number of uploaded images
    if (uploadedFiles.length > 1) {
        prevButton.style.display = currentImageIndex > 0 ? "block" : "none";
        nextButton.style.display = currentImageIndex < uploadedFiles.length - 1 ? "block" : "none";
    } else {
        prevButton.style.display = "none";
        nextButton.style.display = "none";
    }
    imageCounter.style.display = uploadedFiles.length > 1 ? "block" : "none";
}

// Submit the current image for processing
document.getElementById("submit-button").addEventListener("click", () => {
    const file = uploadedFiles[currentImageIndex]; // Get the current image
    const selectedColor = document.getElementById('colorPicker').value;  // Get the selected color
    const selectedTolerance = document.getElementById('toleranceSlider').value;  // Get the selected tolerance
    const selectedContourArea = document.getElementById('contourArea').value;  // Get the selected contour area

    if (file) {
        console.log("Uploading file:", file);
        console.log("Selected color:", selectedColor);  // Log the selected color
        console.log("Selected tolerance:", selectedTolerance);  // Log the selected tolerance
        console.log("Selected contour area:", selectedContourArea);  // Log the selected contour area

        // Add blur and show loading spinner
        document.getElementById("image-canvas").classList.add("blurred");
        document.getElementById("loading-spinner").style.display = "block";

        const formData = new FormData();
        formData.append("file", file);
        formData.append("color", selectedColor);  // Append selected color
        formData.append("tolerance", selectedTolerance);  // Append selected tolerance
        formData.append("contour_area", selectedContourArea);  // Append selected contour area

        // Send the image and selected color to the Flask server for processing
        fetch("http://35.90.9.213:5000/upload", {
            method: "POST",
            body: formData,
            mode: 'cors',
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to process the image');
            }
            return response.json();
        })
        .then(data => {
            console.log("Blobs detected:", data.blobs);

            const imageUrl = data.image_url;
            const fullImageUrl = "http://35.90.9.213" + imageUrl;

            image.src = fullImageUrl;
            image.onload = function () {
                canvas.width = image.width;
                canvas.height = image.height;
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0);
                rectangles.length = 0;

                data.blobs.forEach((blob, index) => {
                    const marker = {
                        x: blob.x,
                        y: blob.y,
                        width: blob.width,
                        height: blob.height,
                        contour: blob.contour
                    };
                    rectangles.push(marker);
                });

                drawAll();
                console.log("Canvas updated with processed image and markers.");

                // Remove blur and hide loading spinner after processing
                document.getElementById("image-canvas").classList.remove("blurred");
                document.getElementById("loading-spinner").style.display = "none";
            };
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Failed to process the image.");

            // Remove blur and hide loading spinner after processing
            document.getElementById("image-canvas").classList.remove("blurred");
            document.getElementById("loading-spinner").style.display = "none";
        });
    } else {
        alert("Please upload an image first!");
    }
});

// Update color preview dynamically when color is selected
document.getElementById('colorPicker').addEventListener('input', function(event) {
    const selectedColor = event.target.value;
});

document.getElementById("sfm-upload-button").addEventListener("click", () => {
    if (uploadedFiles.length > 1) {
        console.log("Submitting files for SfM:", uploadedFiles);
        // Add blur and show loading spinner
        document.getElementById("image-canvas").classList.add("blurred");
        document.getElementById("loading-spinner").style.display = "block";

        const formData = new FormData();
        uploadedFiles.forEach((file, index) => {
            formData.append("file" + index, file); // Append each image to the FormData object
        });

        // Send the images to the Flask server for SfM processing
        fetch("http://35.90.9.213:5000/sfm_upload", {
            method: "POST",
            body: formData,
            mode: 'cors'  // Mode to handle CORS
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to process images for SfM');
            }
            return response.json(); // Parse the JSON response
        })
        .then(data => {
            console.log("SfM result received:", data);
            document.getElementById("image-canvas").classList.remove("blurred");
            document.getElementById("loading-spinner").style.display = "none";
            const points3D = data["3D_points"];
            display3DPoints(points3D);  // Display or handle the 3D points
            window.location.href = "http://35.90.9.213:5000/visualize";
        })
        .catch(error => {
            console.error("Error:", error);
            document.getElementById("image-canvas").classList.remove("blurred");
            document.getElementById("loading-spinner").style.display = "none";
            alert("Failed to process images for SfM.");
        });
        
    } else {
        alert("Please upload multiple images first!");
    }
});

function display3DPoints(points3D) {
    // Example: Log the 3D points (this can be replaced with a 3D visualization library like three.js)
    console.log("3D points from SfM:", points3D);
}



document.getElementById("download-button").addEventListener("click", () => {
    canvas.toBlob((blob) => {
        const link = document.createElement("a");
        link.download = "edited-image.jpg";
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, "image/jpeg", 0.95);
});

const drawButton = document.getElementById("draw-button");
drawButton.addEventListener("click", () => {
    isDrawingEnabled = !isDrawingEnabled;
    drawButton.textContent = isDrawingEnabled ? "Disable Drawing" : "Enable Drawing";
    canvas.style.cursor = isDrawingEnabled ? "crosshair" : "pointer";
});

canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    if (isDrawingEnabled) {
        startX = x;
        startY = y;
        isDrawing = true;
    } else {
        const clickedRectIndex = getClickedRectangle(x, y);
        if (clickedRectIndex !== null) {
            selectedRectIndex = clickedRectIndex;
            drawAll();
        } else {
            selectedRectIndex = null;
            drawAll();
        }
    }
});

canvas.addEventListener("mousemove", (event) => {
    if (isDrawingEnabled && isDrawing) {
        const rect = canvas.getBoundingClientRect();
        currentX = (event.clientX - rect.left) * (canvas.width / rect.width);
        currentY = (event.clientY - rect.top) * (canvas.height / rect.height);
        drawAll();
        context.strokeStyle = "orange";
        context.lineWidth = lineWidth;
        context.strokeRect(startX, startY, currentX - startX, currentY - startY);
    }
});

canvas.addEventListener("mouseup", () => {
    if (isDrawingEnabled) {
        isDrawing = false;
    }
});

document.getElementById("save-button").addEventListener("click", () => {
    if (isDrawingEnabled) {
        rectangles.push({
            x: startX,
            y: startY,
            width: currentX - startX,
            height: currentY - startY,
        });
        drawAll();
    }
});

document.getElementById("delete-button").addEventListener("click", () => {
    if (selectedRectIndex !== null) {
        rectangles.splice(selectedRectIndex, 1);
        selectedRectIndex = null;
        drawAll();
    }
});

function drawAll() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    context.lineWidth = lineWidth;
    context.font = `${textSize}px Arial`;

    rectangles.forEach((rect, index) => {
        context.strokeStyle = index === selectedRectIndex ? "red" : "green";
        context.lineWidth = lineWidth;

        // Begin a new path for each contour
        context.beginPath();
        const contour = rect.contour;  // Assuming rect now has 'contour' instead of x, y, width, height
        if (contour == null) {
            context.strokeRect(rect.x, rect.y, rect.width, rect.height);
        } else if (contour.length > 0) {
            context.moveTo(contour[0][0], contour[0][1]);  // Move to the first point in the contour
            contour.forEach(point => {
                context.lineTo(point[0], point[1]);  // Draw lines between the points
            });
            context.closePath();  // Close the path
            context.stroke();  // Actually draw the contour
        }

        // Now draw the marker text near the contour
        const text = `M${index + 1}`;
        const textWidth = context.measureText(text).width;
        const textHeight = textSize;

        // Position the text near the first point in the contour (you can adjust as needed)
        const firstPoint = contour[0];
        context.fillStyle = "black";
        context.fillRect(
            firstPoint[0] + padding,
            firstPoint[1] - padding - textHeight,
            textWidth + 4,
            textHeight + 4
        );

        context.fillStyle = "white";
        context.fillText(text, firstPoint[0] + padding + 2, firstPoint[1] - padding - 2);
    });
}


function getClickedRectangle(x, y) {
    for (let i = 0; i < rectangles.length; i++) {
        const rect = rectangles[i];
        const x1 = Math.min(rect.x, rect.x + rect.width) - tolerance;
        const x2 = Math.max(rect.x, rect.x + rect.width) + tolerance;
        const y1 = Math.min(rect.y, rect.y + rect.height) - tolerance;
        const y2 = Math.max(rect.y, rect.y + rect.height) + tolerance;
        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
            return i;
        }
    }
    return null;
}

// Event handler for marker clicks
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    const clickedRectIndex = getClickedRectangle(x, y);
    if (clickedRectIndex !== null) {
        selectedRectIndex = clickedRectIndex;
        const clickedRect = rectangles[clickedRectIndex];
        const area = clickedRect.width * clickedRect.height;

        document.getElementById("marker-details").innerHTML = `
            <p>Marker ${clickedRectIndex + 1} Details:</p>
            <p>X: ${clickedRect.x}px</p>
            <p>Y: ${clickedRect.y}px</p>
            <p>Width: ${clickedRect.width}px</p>
            <p>Height: ${clickedRect.height}px</p>
            <p>Area: ${area}px²</p>
        `;
        drawAll();
    } else {
        selectedRectIndex = null;
        document.getElementById("marker-details").innerHTML = "<p>No marker selected</p>";
    }
});
