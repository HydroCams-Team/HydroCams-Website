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

// Hosting constants, ENSURE THESE MATCH THE CONSTANTS IN app.py
const FLASK_HOST = 'localhost';
const FLASK_PORT = 5000;
const HTTP_SERVER_PORT_STRING = ':8000';
