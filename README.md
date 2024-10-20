Project Vision: **Interactive Collaborative Space**

Our project envisions an engaging and interactive collaborative space, centered around a whiteboard where users can share and develop ideas through real-time doodling. A standout feature of our application is the ability to draw using hand gestures, enhancing the interactivity and usability of the platform.

To bring this vision to life, we utilized several technologies:

npm features to create the foundational space of the board.
Canvas (ctx) for implementing drawing capabilities.
Socket.io-client to enable real-time interaction among users.
CV2,CVzone for camera detection of hand gestures, which can be incorporated into the drawing functionality using Flask.
Initially, our plan was to develop these components separately and then integrate them. Unfortunately, we encountered some challenges during the merging process. However, we are pleased to report that both the hand gesture cursor control and the whiteboard functionalities are working flawlessly on their own.

here are the libraries required to run the handgesture control python file:cv2,cvzone,mediapipe,math,pyautogui and pynput.
Functions:single finger tip just hovers the cursor on screen while double finger(when index and middle finger tips touches) simulates mouse down action.When mouse down for just an instant(touched and seperated quickly) it simulates a click.Finally,pressing q exits fron the program.

We invite you to explore our repository and would greatly appreciate any feedback or reviews on our work. Thank you for your time!
