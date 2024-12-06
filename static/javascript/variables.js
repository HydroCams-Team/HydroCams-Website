// variables.js

// Canvas and context
var canvas = document.getElementById("image-canvas");
var context = canvas.getContext("2d");
var image = new Image();

// State variables
var isDrawing = false;
var isDrawingEnabled = false;
var startX, startY, currentX, currentY;
var selectedRectIndex = null;
var rectangles = [];
var padding = 5; // Padding for the text
var lineWidth = 8; // Variable for line width
var textSize = 16; // Variable for text size
var minSelectableSize = 1; // Minimum size of selectable rectangle
var tolerance = 5; // Tolerance zone around the rectangle
var uploadedFiles = []; // To store the uploaded files (for single and multiple)
var currentImageIndex = 0; // For tracking which image is being displayed

// Zoom and pan variables
var lines = []; // Array to store line information
var scale = 1; // Scale factor for zooming
var zoomSpeed = 0.1; // Speed of zooming
var offsetX = 0; // Offset for panning horizontally
var offsetY = 0; // Offset for panning vertically
var isPanning = false; // Boolean to check if panning is active
var startPanX, startPanY; // Starting position for panning

// Preference variables
var selectedColor;
var previewVisible = false; // Track the visibility of the preview circle

// Retrieve constants fron constants.json
var FLASK_PORT;
fetch('/static/constants.json')
  .then(response => response.json())
  .then(constants => {
    FLASK_PORT = constants.FLASK_PORT;
  })
  .catch(error => console.error('Error loading constants:', error));