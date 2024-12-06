let colorArray = []; // Array to store selected colors

function updateColorArray() {
    colorArray = Array.from(document.getElementsByClassName("color-input")).map(picker => picker.value);
}

function updateRemoveButtons() {
    const removeButtons = document.querySelectorAll('.remove-color');
    removeButtons.forEach(button => {
        button.style.display = colorArray.length > 1 ? 'inline' : 'none';
    });
}

document.getElementById("addColorButton").addEventListener("click", () => {
    const colorPickerContainer = document.getElementById("colorPickerContainer");

    // Create a container div for the color picker and the remove button
    const colorItem = document.createElement("div");
    colorItem.className = "color-item";

    // Create the color picker input
    const newColorPicker = document.createElement("input");
    newColorPicker.type = "color";
    newColorPicker.className = "color-input";
    newColorPicker.name = `colorPicker${colorArray.length + 1}`;
    newColorPicker.value = "#ff0000"; // Set default color

    // Update color array with new color
    colorArray.push(newColorPicker.value);

    // Add an event listener to update the color array whenever a color is changed
    newColorPicker.addEventListener("input", (event) => {
        const index = Array.from(colorPickerContainer.children).indexOf(colorItem);
        colorArray[index] = event.target.value;
    });

    // Create the "X" button to remove the color picker
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-color";
    removeButton.textContent = "X";
    removeButton.addEventListener("click", () => {
        // Remove the color picker and update the array
        colorItem.remove();
        updateColorArray();
        updateRemoveButtons();
    });

    // Append the color picker and remove button to the color item div
    colorItem.appendChild(newColorPicker);
    colorItem.appendChild(removeButton);

    // Append the color item div to the container
    colorPickerContainer.appendChild(colorItem);

    // Update the remove button visibility based on the number of color inputs
    updateRemoveButtons();
});

// Initialize color array and remove button visibility
updateColorArray();
updateRemoveButtons();

// Function to submit the current image for processing
function submitImageForProcessing() {
    const file = uploadedFiles[currentImageIndex]; // Get the current image
    const selectedContourArea = document.getElementById('contourArea').value;  // Get the selected contour area (min area)
    const selectedContourAreaMax = document.getElementById('contourAreaMax').value; // Get the selected contour upper bound (max area)
    const markerSize = document.getElementById('markerSize').value;  // Get the marker size in inches

    // Update colorArray with values from color inputs
    colorArray = Array.from(document.getElementsByClassName("color-input")).map(picker => picker.value);

    if (file) {
        console.log("Uploading file:", file);
        console.log("Selected colors:", colorArray);
        console.log("Selected contour area (min):", selectedContourArea);
        console.log("Selected contour area (max):", selectedContourAreaMax);
        console.log("Marker size (in inches):", markerSize);

        // Add blur and show loading spinner
        document.getElementById("image-canvas").classList.add("blurred");
        document.getElementById("loading-spinner").style.display = "block";

        const formData = new FormData();
        formData.append("file", file);
        colorArray.forEach(color => formData.append("colors[]", color)); // Append each color individually
        formData.append("contour_area", selectedContourArea); // Min contour area
        formData.append("contour_area_max", selectedContourAreaMax); // Max contour area
        formData.append("marker_size", markerSize);

        // Send the image and selected color to the Flask server for processing
        fetch("http://localhost:" + FLASK_PORT + "/upload", {
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
            console.log("Markers detected:", data.markers);

            // Add new markers to existing ones without clearing
            addMarkersToExisting(data.markers);

            const imageUrl = data.image_url;
            const fullImageUrl = "http://localhost:" + FLASK_PORT + imageUrl;

            console.log(fullImageUrl);

            image.src = fullImageUrl;
            image.onload = function () {
                canvas.width = image.width;
                canvas.height = image.height;
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0);

                drawAll();
                console.log("Canvas updated with processed image and markers.");

                document.getElementById("download-json-button").style.display = 'inline-block'; // Show the download button
                console.log("Download button displayed.");

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
}


// Function to add new markers to the existing ones (without clearing)
function addMarkersToExisting(newMarkers) {
    const duplicateThreshold = 10; // Define a threshold in pixels

    newMarkers.forEach(newMarker => {
        // Check for duplicates based on proximity
        const exists = rectangles.some(existingMarker => {
            const dx = existingMarker.x - newMarker.x;
            const dy = existingMarker.y - newMarker.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < duplicateThreshold;
        });

        console.log(newMarker)

        if (!exists) {
            rectangles.push({
                x: newMarker.x,
                y: newMarker.y,
                width: newMarker.width,
                height: newMarker.height,
                contour: newMarker.contour
            });
        } else {
            console.log(`Marker at (${newMarker.x.toFixed(2)}, ${newMarker.y.toFixed(2)}) is a duplicate and will not be added.`);
        }
    });

    drawAll(); // Redraw the canvas with updated markers
    updateMarkerInfo(); // Update marker information and distances
}

// Add event listener to submit button
document.getElementById("submit-button").addEventListener("click", submitImageForProcessing);
