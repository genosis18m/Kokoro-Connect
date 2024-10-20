import cv2  
import math
import time
from cvzone.HandTrackingModule import HandDetector

import pyautogui
from pynput.mouse import Listener

# Initialize variables
mouse_x, mouse_y = 0, 0
is_clicked = False
dragging = False

def on_move(x, y):
    global mouse_x, mouse_y
    mouse_x, mouse_y = x, y

def on_click(x, y, button, pressed):
    global is_clicked
    is_clicked = pressed  # True if pressed, False if released

# Start the mouse listener
listener = Listener(on_move=on_move, on_click=on_click)
listener.start()


# Initialize the camera
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)  
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

# Set up the hand tracking object
detector = HandDetector(detectionCon=0.8)

# Start the while loop
while True:
    success, image = cap.read()
    image = cv2.flip(image, 1)
    hands, bboxInfo = detector.findHands(image)

    if len(hands) > 0:
        # Find the largest hand based on bounding box area
        bboxInfo=hands[0]['bbox']
        largest_hand_index = 0
        largest_area = bboxInfo[2] * bboxInfo[3]

        for i in range(1, len(hands)):
            bboxInfo=hands[i]['bbox']
            area = bboxInfo[2] * bboxInfo[3]
            if area > largest_area:
                largest_area = area
                largest_hand_index = i

        hand=hands[largest_hand_index]
        lmList = hand['lmList']

        # Access the index and middle finger tips (8th and 12th landmarks)
        index_tip = lmList[8]
        middle_tip = lmList[12]

        # Draw circles at the fingertips
        cv2.circle(image, (index_tip[0],index_tip[1]), 20, (255, 0, 255), cv2.FILLED)
        cv2.circle(image, (middle_tip[0],middle_tip[1]), 20, (255, 0, 255), cv2.FILLED)

        double_tip=False
        if math.dist(index_tip,middle_tip)<=30:
            double_tip=True
            if not dragging:  # Start dragging if not already dragging
                dragging = True
                pyautogui.mouseDown()  # Simulate mouse down (click)
        else:
            if dragging:  # Stop dragging if fingers are no longer touching
                dragging = False
                pyautogui.mouseUp()  # Simulate mouse up (release click)

        pyautogui.moveTo(2*index_tip[0],2*index_tip[1])

        str_tip="single_tip"
        if double_tip==True:
            str_tip="double_tip"

        str_fu=" "
        if (middle_tip[1]<lmList[9][1] and middle_tip[1]<lmList[10][1] and lmList[9][1]-lmList[8][1]<30 and lmList[9][1]-lmList[16][1]<30 and lmList[9][1]-lmList[20][1]<30):
            str_fu="Fuck You"
        
        # if double_tip:
        #     pyautogui.click()

        print('({h1},{b1}),({h2},{b2})'.format(h1=index_tip[0],b1=index_tip[1],h2=middle_tip[0],b2=middle_tip[1]),str_tip,str_fu)
    cv2.imshow("Image", image)  

    # Exit on key press
    if (cv2.waitKey(1) & 0xFF) == ord("q"):
        break
    
# Release the camera and close the window
cap.release()
cv2.destroyAllWindows()