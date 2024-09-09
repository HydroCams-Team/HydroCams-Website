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

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        response = make_response(jsonify({'error': 'No file part in the request'}), 400)
        response.headers['Access-Control-Allow-Origin'] = '*'  # Adding CORS header explicitly
        return response
    
    file = request.files['file']
    if file.filename == '':
        response = make_response(jsonify({'error': 'No selected file'}), 400)
        response.headers['Access-Control-Allow-Origin'] = '*'  # Adding CORS header explicitly
        return response

    # Save the uploaded file
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    # Process the image using detect_red_blobs function
    processed_file_path = os.path.join(PROCESSED_FOLDER, 'processed_' + file.filename)
    image = cv2.imread(file_path)

    # Call detect_red_blobs instead of process_image
    processed_image, detected_blobs = detect_red_blobs(image)

    # Save the processed image
    cv2.imwrite(processed_file_path, processed_image, [cv2.IMWRITE_JPEG_QUALITY, 75])

    # Return both the processed image (as a file) and the detected blobs (as JSON)
    response = {
        'blobs': detected_blobs,  # Include blob data in response
        'image_url': '/demo/processed/processed_' + file.filename  # Path to processed image
    }
    return jsonify(response)

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

def detect_red_blobs(image):
    """Detect red blobs and draw rectangles around them."""
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # Define the range for red color in HSV
    lower_red1 = (0, 150, 150)
    upper_red1 = (10, 255, 255)
    lower_red2 = (170, 150, 150)
    upper_red2 = (180, 255, 255)

    # Create masks for red detection
    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    red_mask = cv2.bitwise_or(mask1, mask2)

    # Find contours (blobs) in the mask
    contours, _ = cv2.findContours(red_mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    # Log the number of detected blobs
    detected_blobs = []  # This will hold the blob details to return to the client

    # Draw rectangles around significant blobs and collect their positions
    for i, contour in enumerate(contours):
        if cv2.contourArea(contour) > 500:  # Only consider significant blobs
            x, y, w, h = cv2.boundingRect(contour)
            cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
            
            # Add blob details to the list
            detected_blobs.append({
                'blob_number': i + 1,
                'x': x,
                'y': y,
                'width': w,
                'height': h,
                'area': cv2.contourArea(contour)
            })

    return image, detected_blobs  # Return both the processed image and blob details

def run_sfm(images):
    """
    Run Structure-from-Motion on a set of images and return the 3D reconstruction.
    """
    try:
        # Convert images to grayscale and extract features using SIFT (or ORB, etc.)
        image_points = []
        keypoints_list = []
        descriptors_list = []

        for image in images:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            sift = cv2.SIFT_create()
            keypoints, descriptors = sift.detectAndCompute(gray, None)
            keypoints_list.append(keypoints)
            descriptors_list.append(descriptors)
            points = np.array([kp.pt for kp in keypoints], dtype=np.float32)
            image_points.append(points)

        # Match features between images using FLANN based matcher
        flann = cv2.FlannBasedMatcher_create()
        matches = flann.knnMatch(descriptors_list[0], descriptors_list[1], k=2)

        # Apply ratio test to filter matches
        good_matches = []
        for m, n in matches:
            if m.distance < 0.75 * n.distance:
                good_matches.append(m)

        # Extract the matched keypoints
        pts1 = np.float32([keypoints_list[0][m.queryIdx].pt for m in good_matches])
        pts2 = np.float32([keypoints_list[1][m.trainIdx].pt for m in good_matches])

        # Camera intrinsic matrix
        K = np.eye(3)
        K[0, 0] = K[1, 1] = 1000  # Focal length (adjust as needed)
        K[0, 2] = images[0].shape[1] / 2  # Principal point x
        K[1, 2] = images[0].shape[0] / 2  # Principal point y

        # Essential matrix
        E, mask = cv2.findEssentialMat(pts1, pts2, K, method=cv2.RANSAC, prob=0.999, threshold=1.0)

        # Recover pose
        _, R, t, mask = cv2.recoverPose(E, pts1, pts2, K)

        # Triangulate points
        proj_matrix1 = np.hstack((np.eye(3), np.zeros((3, 1))))
        proj_matrix2 = np.hstack((R, t))
        points_4d = cv2.triangulatePoints(proj_matrix1, proj_matrix2, pts1.T, pts2.T)

        # Convert from homogeneous to 3D coordinates
        points_3d = points_4d[:3] / points_4d[3]

        return True, points_3d.T  # Transpose to get points in the correct format

    except Exception as e:
        print(f"Error in SfM: {e}")
        return False, []

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
