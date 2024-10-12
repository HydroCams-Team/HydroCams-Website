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
