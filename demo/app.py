from flask import Flask, request, send_file, jsonify, send_from_directory, make_response, render_template
from flask_cors import CORS
import os
import cv2
import numpy as np
import imutils

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
points_3d_global = []  # Global variable to store 3D points for visualization

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

# Serve processed images from the 'processed' folder
@app.route('/processed/<filename>')
def send_processed_file(filename):
    return send_from_directory(PROCESSED_FOLDER, filename)

# Utility function to convert hex color to RGB
def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

# Process image and detect markers with the selected color
@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return make_response(jsonify({'error': 'No file part in the request'}), 400)
    
    file = request.files['file']
    if file.filename == '':
        return make_response(jsonify({'error': 'No selected file'}), 400)

    # Get the selected color from the form
    hex_color = request.form.get('color')
    #tolerance = int(request.form.get('tolerance', 7))  # Default tolerance is 7 if not provided
    contour_area = int(request.form.get('contour_area', 350))  # Default contour area is 350 if not provided
    marker_size = float(request.form.get('marker_size', 5))  # Default to 5 inches if not provided

    if not hex_color:
        return make_response(jsonify({'error': 'No color selected'}), 400)

    # Convert hex to RGB, then to HSV
    rgb_color = hex_to_rgb(hex_color)
    hsv_color = cv2.cvtColor(np.uint8([[rgb_color]]), cv2.COLOR_RGB2HSV)[0][0]

    # Save the uploaded file
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    # Process the image using marker detection with the selected color
    processed_file_path = os.path.join(PROCESSED_FOLDER, 'processed_' + file.filename)
    print(f"Processing image with color: {hex_color} and tolerance")  # Debugging statement
    print(f"Selected contour area: {contour_area}")  # Debugging statement
    print(f"Saving processed image to: {processed_file_path}")  # Debugging statement

    image = cv2.imread(file_path)
    
    # (Optional) Camera calibration and distortion correction
    camera_matrix = np.array([[1000, 0, image.shape[1]//2],
                              [0, 1000, image.shape[0]//2],
                              [0, 0, 1]], dtype=np.float32)
    dist_coeffs = np.zeros((5, 1))  # Assuming no lens distortion; replace with actual calibration data if available

    # Undistort the image if using camera calibration
    undistorted_image = cv2.undistort(image, camera_matrix, dist_coeffs) if camera_matrix is not None else image

    processed_image, detected_markers = detect_markers(image=undistorted_image, 
                                                       hsv_color=hsv_color, 
                                                       contour_area=contour_area)

    # Save the processed image
    cv2.imwrite(processed_file_path, processed_image)

    if not os.path.exists(processed_file_path):
        print(f"Error: Processed image was not saved to: {processed_file_path}")
    else:
        print(f"Processed image successfully saved to: {processed_file_path}")
    
    distances = calculate_distances_between_markers(detected_markers, marker_diameter_in_inches=marker_size)

    response = {
        'markers': detected_markers,
        'distances': distances,
        'image_url': '/demo_test/processed/' + 'processed_' + file.filename
    }
    return jsonify(response)

def detect_markers(image, hsv_color, contour_area):
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # Define a color range based on the selected color
    # check if the color range will wrap
    if hsv_color[0] <= 9 or hsv_color[0] >= 171:
        # define the lower ranges
        lower_lower_range = np.array([hsv_color[0], 100, 100])
        lower_upper_range = np.array([(int(hsv_color[0]) + 10) % 180, 255, 255])

        # handle wrapping
        if lower_lower_range[0] > 0:
            lower_lower_range[0] = 0

        # create the lower mask from the HSV image and the lower ranges
        lower_mask = cv2.inRange(hsv, lower_lower_range, lower_upper_range)

        # define the upper ranges
        upper_lower_range = np.array([(int(hsv_color[0]) - 20) % 180, 100, 100])
        upper_upper_range = np.array([hsv_color[0], 255, 255])

        # handle wrapping
        if upper_upper_range[0] >= 0:
            upper_upper_range[0] = 180

        # create the upper mask from the HSV image and the upper ranges
        upper_mask = cv2.inRange(hsv, upper_lower_range, upper_upper_range)

        # combine the lower and upper masks
        full_mask = lower_mask + upper_mask
    else:
        # create the lower and upper ranges
        lower_range = np.array([int(hsv_color[0]) - 20, 100, 100])
        upper_range = np.array([int(hsv_color[0]) + 10, 255, 255])

        # create the mask from the lower and upper range
        full_mask = cv2.inRange(hsv, lower_range, upper_range)

    # clip the image using the mask
    result = cv2.bitwise_and(image, image, mask=full_mask)

    # blur the image to remove irregularities
    blurredImage = cv2.GaussianBlur(result, (5, 5), 0)

    # convert the image to grayscale and threshold it (idk what that does actually)
    grayscaleBlurredImage = cv2.cvtColor(blurredImage, cv2.COLOR_BGR2GRAY)
    thresholdImage = cv2.threshold(grayscaleBlurredImage, 35, 255, 
                               cv2.THRESH_BINARY)[1]

    # find the contours 
    contours = cv2.findContours(thresholdImage.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = imutils.grab_contours(contours)

    detected_markers = []
    for contour in contours:
        if cv2.contourArea(contour) >= contour_area:  # Use dynamic contour area threshold
            x, y, w, h = cv2.boundingRect(contour) # unneeded?

            # Check if the width and height are within a factor of 2
            # if 0.67 <= w / h <= 1.5:  # 1 / 1.5 = 0.67 # Is this necessary? Idrk what it does exactly
            (center_x, center_y), radius = cv2.minEnclosingCircle(contour)
            cv2.circle(image, (int(center_x), int(center_y)), int(radius), (0, 255, 0), 2)
            # cv2.drawContours(image, [contour], -1, (0, 255, 0), 2)
            
            # Add the contour points to the list
            contour_points = contour[:, 0, :].tolist()  # Extract (x, y) points
            detected_markers.append({
                'marker_number': len(detected_markers) + 1,  # Label sequentially based on the number of detected markers
                'x': int(center_x),  # Center x-coordinate of the marker
                'y': int(center_y),  # Center y-coordinate of the marker
                'radius': int(radius), 
                'width': w, # unneeded?
                'height': h, # unneeded?
                'contour': contour_points # unneeded, but still keep?
            })

    return image, detected_markers

# Conversion constant from inches to centimeters
INCH_TO_CM = 2.54

def calculate_distances_between_markers(detected_markers, marker_diameter_in_inches=5):
    """
    Calculate the distances between each detected marker in both pixels and inches.
    The marker_diameter_in_inches parameter can be updated to reflect the actual size of the markers.
    """
    distances = []
    if len(detected_markers) < 2:
        return distances

    # Calculate the scale factor from pixels to inches
    marker_diameter_in_pixels = np.mean([marker['width'] for marker in detected_markers])
    scale_factor = marker_diameter_in_inches / marker_diameter_in_pixels
    print(f"Marker diameter in pixels: {marker_diameter_in_pixels}, scale factor: {scale_factor} inches per pixel")

    for i, marker1 in enumerate(detected_markers):
        for j, marker2 in enumerate(detected_markers[i + 1:], start=i + 1):
            pixel_distance = np.sqrt((marker1['x'] - marker2['x']) ** 2 + (marker1['y'] - marker2['y']) ** 2)
            real_world_distance_inches = pixel_distance * scale_factor
            print(f"Distance between marker {marker1['marker_number']} and marker {marker2['marker_number']}: {real_world_distance_inches} inches")
            distances.append({
                'marker1': marker1['marker_number'],
                'marker2': marker2['marker_number'],
                'pixel_distance': pixel_distance,
                'distance_inches': real_world_distance_inches
            })

    return distances


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
