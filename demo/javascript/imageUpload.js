// imageUpload.js

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

// Update canvas with the current image
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

// Update navigation buttons visibility
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

// Function to generate JSON file and trigger download
function downloadMarkersAsJSON() {
    // Create an array to store marker data
    const markersData = rectangles.map((marker, index) => {
        return {
            markerNumber: `M${index + 1}`,
            position: {
                x: marker.x.toFixed(2),
                y: marker.y.toFixed(2)
            },
            size: {
                width: marker.width.toFixed(2),
                height: marker.height.toFixed(2),
                area: (marker.width * marker.height).toFixed(2)
            }
        };
    });

    // Recalculate distances to include them in the JSON
    const distancesData = recalculateDistances();

    // Combine markers and distances into one object
    const jsonData = {
        markers: markersData,
        distances: distancesData.map(distance => ({
            marker1: distance.marker1,
            marker2: distance.marker2,
            distance_inches: distance.distance_inches.toFixed(2)
        }))
    };

    // Convert the JSON object to a string
    const jsonString = JSON.stringify(jsonData, null, 2);

    // Create a blob from the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'markers_data.json';
    link.click();
}

// Event listener for the download button
document.getElementById('download-json-button').addEventListener('click', downloadMarkersAsJSON);
