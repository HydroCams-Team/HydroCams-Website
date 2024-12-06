// imageUpload.js

// Handle single image upload
document.getElementById("upload-button").addEventListener("click", () => {
    document.getElementById("file-input").click();
});

document.getElementById("file-input").addEventListener("change", (event) => {
    uploadedFiles = [event.target.files[0]]; // Store single uploaded file
    currentImageIndex = 0;
    updateCanvasImage(currentImageIndex);

    if (uploadedFiles.length > 0) {
        document.getElementById("submit-button").style.display = 'inline-block';
        document.getElementById("reset-button").style.display = 'inline-block';
        document.getElementById("upload-button").style.display = 'none';
    } else {
        document.getElementById("submit-button").style.display = 'none';
        document.getElementById("reset-button").style.display = 'none';
    }
});

// Reset button
document.getElementById("reset-button").addEventListener("click", () => {
    console.log("Resetting the canvas");
    window.location.reload();
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

// Function to generate JSON file and trigger download
function downloadMarkersAsJSON(includeMarkerToMarkerDistances = true) {
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
            },
            hsvColor: marker.hsvColor || "N/A", // Assuming hsvColor is stored in marker object
            
            verticalDistance: recalculateDistances()
                .filter(distance => distance.marker1 === index + 1 || distance.marker2 === index + 1)
                .map(distance => ({
                    markerPair: `M${distance.marker1} - M${distance.marker2}`,
                    distance_inches: distance.distance_inches.toFixed(2)
                }))
        };
    });

    // Optionally, recalculate marker-to-marker distances if required
    let distancesData = [];
    if (includeMarkerToMarkerDistances) {
        distancesData = recalculateDistances().map(distance => ({
            marker1: distance.marker1,
            marker2: distance.marker2,
            distance_inches: distance.distance_inches.toFixed(2)
        }));
    }

    // Combine markers and distances into one object
    const jsonData = {
        markers: markersData,
        ...(includeMarkerToMarkerDistances && { distances: distancesData })
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
