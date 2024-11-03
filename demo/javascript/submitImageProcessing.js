// submitImageProcessing.js

// Function to submit the current image for processing
function submitImageForProcessing() {
    const file = uploadedFiles[currentImageIndex]; // Get the current image
    const selectedColor = document.getElementById('colorPicker').value;  // Get the selected color
    //const selectedTolerance = document.getElementById('tolerance-slider').value;  // Get the selected tolerance
    const selectedContourArea = document.getElementById('contourArea').value;  // Get the selected contour area
    const markerSize = document.getElementById('markerSize').value;  // Get the marker size in inches

    if (file) {
        console.log("Uploading file:", file);
        console.log("Selected color:", selectedColor);  // Log the selected color
        //console.log("Selected tolerance:", selectedTolerance);  // Log the selected tolerance
        console.log("Selected contour area:", selectedContourArea);  // Log the selected contour area
        console.log("Marker size (in inches):", markerSize);  // Log the marker size

        // Add blur and show loading spinner
        document.getElementById("image-canvas").classList.add("blurred");
        document.getElementById("loading-spinner").style.display = "block";

        const formData = new FormData();
        formData.append("file", file);
        formData.append("color", selectedColor);  // Append selected color
        //formData.append("tolerance", selectedTolerance);  // Append selected tolerance
        formData.append("contour_area", selectedContourArea);  // Append selected contour area
        formData.append("marker_size", markerSize);  // Append marker size to form data

        // Send the image and selected color to the Flask server for processing
        fetch("http://54.218.238.180:5000/upload", {
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
            const fullImageUrl = "http://54.218.238.180/" + imageUrl;

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
