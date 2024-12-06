import cv2
import numpy

from cv2 import typing

def detect_gauges(grayscale_scene: typing.MatLike, grayscale_feature: typing.MatLike):
    """
    Matches the feature to objects within a scene.

    Parameters:
        grayscale_scene: A grayscale OpenCV image of a scene.
        grayscale_feature: A grayscale OpenCV image of a feature. 
    """

    # initialize the SIFT detector object
    sift = cv2.SIFT_create()

    # extract the keypoints and descriptors from the feature and scene images
    feature_keypoints, feature_descriptors = sift.detectAndCompute(grayscale_feature, None)
    scene_keypoints, scene_descriptors = sift.detectAndCompute(grayscale_scene, None)

    # initialize the FLANN matching object
    index_params = dict(algorithm=1, trees=16)
    search_params = dict(checks=128)
    flann = cv2.FlannBasedMatcher(index_params, search_params)

    # find matches using KNN
    matches = flann.knnMatch(feature_descriptors, scene_descriptors, k=2)

    # apply Lowe's ratio test
    matches = [m for m, n in matches if m.distance < 0.7 * n.distance]

    # match points from feature to scene and show image
    matches_image = cv2.drawMatches(grayscale_feature, feature_keypoints, grayscale_scene, 
                                    scene_keypoints, matches, None, flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)
    cv2.imshow('', matches_image)
    cv2.waitKey(0)

    # compute homography matrix and apply perspective transformation
    src_pts = numpy.float32([feature_keypoints[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
    dst_pts = numpy.float32([scene_keypoints[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)
    M, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 3.0)
    h, w = grayscale_feature.shape
    pts = numpy.float32([[0, 0], [0, h-1], [w-1, h-1], [w-1, 0]]).reshape(-1, 1, 2)
    dst = cv2.perspectiveTransform(pts, M)

    # display image
    scene_img_with_box = cv2.polylines(grayscale_scene, [numpy.int32(dst)], 
                                       True, 255, 3, cv2.LINE_AA)
    cv2.imshow("Feature Matching", scene_img_with_box)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
