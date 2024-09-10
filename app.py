from flask import Flask, request, send_file, jsonify, send_from_directory, make_response, render_template
from flask_cors import CORS
import os
import cv2
import numpy as np
from cv2 import sfm  # Assuming OpenCV SfM module is available

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

# Process image and detect blobs with the selected color
@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return make_response(jsonify({'error': 'No file part in the request'}), 400)
    
    file = request.files['file']
    if file.filename == '':
        return make_response(jsonify({'error': 'No selected file'}), 400)

    # Get the selected color from the form
    hex_color = request.form.get('color')
    tolerance = int(request.form.get('tolerance', 7))  # Default tolerance is 7 if not provided
    contour_area = int(request.form.get('contour_area', 350))  # Default contour area is 350 if not provided

    if not hex_color:
        return make_response(jsonify({'error': 'No color selected'}), 400)

    # Convert hex to RGB, then to HSV
    rgb_color = hex_to_rgb(hex_color)
    hsv_color = cv2.cvtColor(np.uint8([[rgb_color]]), cv2.COLOR_RGB2HSV)[0][0]

    # Save the uploaded file
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    # Process the image using blob detection with the selected color
    processed_file_path = os.path.join(PROCESSED_FOLDER, 'processed_' + file.filename)
    print(f"Processing image with color: {hex_color} and tolerance: {tolerance}")  # Debugging statement
    print(f"Selected contour area: {contour_area}")  # Debugging statement
    print(f"Saving processed image to: {processed_file_path}")  # Debugging statement

    image = cv2.imread(file_path)
    processed_image, detected_blobs = detect_blobs_with_color(image=cv2.imread(file_path), 
                                                              hsv_color=hsv_color, 
                                                              tolerance=tolerance, 
                                                              contour_area=contour_area)

    # Save the processed image
    cv2.imwrite(processed_file_path, processed_image)

    if not os.path.exists(processed_file_path):
        print(f"Error: Processed image was not saved to: {processed_file_path}")
    else:
        print(f"Processed image successfully saved to: {processed_file_path}")

    response = {
        'blobs': detected_blobs,
        'image_url': '/demo/processed/' + 'processed_' + file.filename
    }
    return jsonify(response)

# Blob detection function based on the selected color
def detect_blobs_with_color(image, hsv_color, tolerance, contour_area):
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    # Define a color range based on the selected color
    lower_bound = np.array([hsv_color[0] - tolerance, 100, 100])
    upper_bound = np.array([hsv_color[0] + tolerance, 255, 255])

    mask = cv2.inRange(hsv, lower_bound, upper_bound)
    contours, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    detected_blobs = []
    for i, contour in enumerate(contours):
        if cv2.contourArea(contour) > contour_area:  # Use dynamic contour area threshold
            x, y, w, h = cv2.boundingRect(contour)
            
            # Check if the width and height are within a factor of 2
            if 0.67 <= w / h <= 1.5:  # 1 / 1.5 = 0.67
                cv2.drawContours(image, [contour], -1, (0, 255, 0), 2)
                
                # Add the contour points to the list
                contour_points = contour[:, 0, :].tolist()  # Extract (x, y) points
                detected_blobs.append({
                    'blob_number': i + 1,
                    'x': x,
                    'y': y,
                    'width': w,
                    'height': h,
                    'contour': contour_points
                })

    return image, detected_blobs



@app.route('/sfm_upload', methods=['POST'])
def sfm_upload():
    uploaded_files = request.files  # Get the uploaded files
    images = []

    # Save and read all uploaded images
    for file_key in uploaded_files:
        file = uploaded_files[file_key]
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        images.append(cv2.imread(file_path))  # Read the images using OpenCV

    # Run the SfM algorithm on the set of images
    sfm_result, points_3d = run_sfm(images)

    global points_3d_global
    points_3d_global = points_3d.tolist()  # Save the points globally for visualization

    # Return the 3D points (or other relevant data) back to the client
    return jsonify({'message': 'SfM process completed', '3D_points': points_3d_global})

@app.route('/get_3d_points', methods=['GET'])
def get_3d_points():
    """Serve the 3D points in JSON format."""
    global points_3d_global
    if not points_3d_global:
        return jsonify({'error': 'No 3D points available'}), 404
    return jsonify({'3D_points': points_3d_global})

@app.route('/visualize')
def visualize():
    """Serve the visualization page for the 3D points."""
    return render_template('visualize.html')

def run_sfm(images):
    """
    Run Structure-from-Motion on a set of images and return the 3D reconstruction.
    """
    try:
        # Camera intrinsic matrix for a typical Samsung Galaxy camera
        focal_length = 2750  # This is the focal length in pixels
        cx = 2000  # Principal point (half the width of a 4000px wide image)
        cy = 1500  # Principal point (half the height of a 3000px tall image)

        # Camera intrinsic matrix (K)
        K = np.array([[focal_length, 0, cx],
                      [0, focal_length, cy],
                      [0, 0, 1]])

        image_points = []
        keypoints_list = []
        descriptors_list = []

        # Convert images to grayscale and extract features using SIFT (or ORB, etc.)
        for image in images:
            print("Processing image...")
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            sift = cv2.SIFT_create()
            keypoints, descriptors = sift.detectAndCompute(gray, None)
            keypoints_list.append(keypoints)
            descriptors_list.append(descriptors)
            points = np.array([kp.pt for kp in keypoints], dtype=np.float32)
            image_points.append(points)
            print(f"Detected {len(keypoints)} keypoints in the image")

        # Match features between the first two images using FLANN based matcher
        flann = cv2.FlannBasedMatcher_create()
        matches = flann.knnMatch(descriptors_list[0], descriptors_list[1], k=2)

        # Apply ratio test to filter matches
        good_matches = []
        for m, n in matches:
            if m.distance < 0.75 * n.distance:
                good_matches.append(m)

        if len(good_matches) < 10:
            print(f"Not enough good matches between images.")
            return False, []

        # Extract the matched keypoints
        pts1 = np.float32([keypoints_list[0][m.queryIdx].pt for m in good_matches])
        pts2 = np.float32([keypoints_list[1][m.trainIdx].pt for m in good_matches])

        # Compute the Essential matrix using the camera intrinsic matrix
        E, mask = cv2.findEssentialMat(pts1, pts2, K, method=cv2.RANSAC, prob=0.999, threshold=1.0)

        # Recover the pose from the Essential matrix
        _, R, t, mask = cv2.recoverPose(E, pts1, pts2, K)

        # Check the translation magnitude
        translation_magnitude = np.linalg.norm(t)
        print(f"Translation magnitude: {translation_magnitude}")
        print(f"Translation vector: {t.ravel()}")


        # Triangulate points to obtain 3D coordinates
        proj_matrix1 = np.hstack((np.eye(3), np.zeros((3, 1))))  # Projection matrix of the first camera
        proj_matrix2 = np.hstack((R, t))  # Projection matrix of the second camera
        points_4d = cv2.triangulatePoints(proj_matrix1, proj_matrix2, pts1.T, pts2.T)

        # Convert from homogeneous coordinates to 3D coordinates
        points_3d = points_4d[:3] / points_4d[3]

        # Debugging: print some of the 3D points to check if they have depth
        print("Sample triangulated points (X, Y, Z):")
        for i in range(min(10, points_3d.shape[1])):
            print(f"Point {i}: X={points_3d[0][i]}, Y={points_3d[1][i]}, Z={points_3d[2][i]}")

        # Check if Z values are reasonable (i.e., not all very close to zero)
        z_values = points_3d[2, :]
        if np.all(np.abs(z_values) < 1e-3):  # If all Z values are near zero, print a warning
            print("Warning: All Z values are very small, indicating a flat reconstruction.")

        # Return the 3D points for visualization
        return True, points_3d.T  # Transpose to get points in the correct format

    except Exception as e:
        print(f"Error in SfM: {e}")
        return False, []

        
def adjust_scale_based_on_known_object(points_3d):
    """
    Optional: Adjust the scale of the reconstructed 3D points based on a known object or size.
    For example, if you know the real-world distance between two points, you can rescale the output.
    """
    # Implement your logic here (e.g., rescale the 3D points based on known distances)
    # For now, returning a scale factor of 1
    return 1.0


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
