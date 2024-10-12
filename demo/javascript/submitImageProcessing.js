// submitImageProcessing.js

// Function to submit the current image for processing
function submitImageForProcessing() {
    const file = uploadedFiles[currentImageIndex]; // Get the current image
    const selectedColor = document.getElementById('colorPicker').value;  // Get the selected color
    const selectedTolerance = document.getElementById('tolerance-slider').value;  // Get the selected tolerance
    const selectedContourArea = document.getElementById('contourArea').value;  // Get the selected contour area
    const markerSize = document.getElementById('markerSize').value;  // Get the marker size in inches

    if (file) {
        console.log("Uploading file:", file);
        console.log("Selected color:", selectedColor);  // Log the selected color
        console.log("Selected tolerance:", selectedTolerance);  // Log the selected tolerance
        console.log("Selected contour area:", selectedContourArea);  // Log the selected contour area
        console.log("Marker size (in inches):", markerSize);  // Log the marker size

        // Add blur and show loading spinner
        document.getElementById("image-canvas").classList.add("blurred");
        document.getElementById("loading-spinner").style.display = "block";

        const formData = new FormData();
        formData.append("file", file);
        formData.append("color", selectedColor);  // Append selected color
        formData.append("tolerance", selectedTolerance);  // Append selected tolerance
        formData.append("contour_area", selectedContourArea);  // Append selected contour area
        formData.append("marker_size", markerSize);  // Append marker size to form data

        // Send the image and selected color to the Flask server for processing
        fetch("http://34.209.140.249:5000/upload", {
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
            console.log("Distances between markers (in inches):", data.distances);

            const imageUrl = data.image_url;
            const fullImageUrl = "http://34.209.140.249" + imageUrl;

            image.src = fullImageUrl;
            image.onload = function () {
                canvas.width = image.width;
                canvas.height = image.height;
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0);
                rectangles.length = 0;

                if (Array.isArray(data.markers) && data.markers.length > 0) {
                    data.markers.forEach((marker, index) => {
                        const marker_obj = {
                            x: marker.x,
                            y: marker.y,
                            width: marker.width,
                            height: marker.height,
                            contour: marker.contour
                        };
                        rectangles.push(marker_obj);
                    });
                } else {
                    console.log("No markers detected or data is undefined.");
                }

                drawAll();
                console.log("Canvas updated with processed image and markers.");

                // Now call updateMarkerInfo() after rectangles are updated
                updateMarkerInfo(data.distances);

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

// Add event listener to submit button
document.getElementById("submit-button").addEventListener("click", submitImageForProcessing);
