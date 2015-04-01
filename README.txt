Setup Instructions:


1. Deploying on Mac OS X requires g++ or c++:
   Prior installation of Xcode will be needed

Test
Test 2

2. Install Node.JS


3. Install node dependencies: 
	
	npm install jade

	npm install express

	npm install socket.io

	npm install sqlite3



4.Configure links for plugins and QR-Code URL:


4.1 Open Code/Main Project/server.js
	set variable BaseURL to IP address of localhost


4.2 Open Code/Main Project/public/etherpad/etherpad.js

	change value of settings.host to IP address of Etherpad Lite server


4.3 Open Code/Main Project/public/quiz/quiz.js

	change value of settings.host to IP address of Quiz server

5. Deploy servers:

	node Code/Main Project/server.js

	node Code/Quiz/quiz.js

	Code/Pita-etherpad-lite/bin/run.sh
