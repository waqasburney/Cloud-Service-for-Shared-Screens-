/**********************************************************************
 * Filename: 		server.js										
 * By: 				Waqas Burney
 * Date: 			2011
 Description :   	
 	Main Module for creating HTTP server and deploying socket engine
 *********************************************************************/


/**
 * Module dependencies.
 */
var express = require('express');

var app = express.createServer(),
 	sio = require('socket.io'),
    MemoryStore = express.session.MemoryStore,
    sessionStore = new MemoryStore();


/**
 * App configuration.
 */
app.configure(function () {
	//Set '/public' folder as static location for Express
  	app.use(express.static(__dirname + '/public'));
	//Set Root Directory as location of Views (Web pages)
  	app.set('views', __dirname);
	//Set Jade as the Template Engine
  	app.set('view engine', 'jade');
	//Configure Express to use cookies
  	app.use(express.cookieParser());
	app.use(express.bodyParser());
	//Create a Session store for session cookies in Server Memory
    app.use(express.session({store: sessionStore
        , secret: 'secret'
        , key: 'express.sid'}));
});


/**
 * Create Server and Listen on Port 8080
 */
app.listen(8080, function () {
  var addr = app.address();
  console.log('   app listening on http://' + addr.address + ':' + addr.port);
});


/**
 * User Authentication for Standard Users
 */
function requiresLogin(req,res,next){
	if(req.session.user){
		next();
	}else{
		res.redirect('/login?redir='+req.url);
	}
};

/**
 * User Authentication for Admin Users
 */
function requiresAdminLogin(req,res,next){
	if(req.session.adminuser){
		next();
	}else{
		res.redirect('/login?redir='+req.url);
	}
};

app.dynamicHelpers(
	{
		session: function(req,res){
			return req.session;
		},
		
		flash: function(req,res){
			return req.flash();
		}
	}
	);

//Function to generate a Random String.
//Used for generating Screen IDs and Random FileNames for Plugins
function generateRandomString() {
	    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghijklmnopqrstuvwxyz";
	    var rndStrg = '';
	    for (var i = 0; i < 9; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		rndStrg += chars.substring(rnum,rnum+1);
	    }
	    return rndStrg;
};

//Function to convert a URL that is compatible with the QR Code API
function updateURLforQRCode(url){
	var updatedURL = url.replace(/:/g,"%3A");
	updatedURL = updatedURL.replace(/\//g,"%2F");
	return updatedURL;
}


/**
 * App routes.
 */

//Route to Main Screen (lists all the active screens)
app.get('/', function (req, res) {
	screens.getActiveScreens(function(AvailableScreens)
	{
		res.render('index3',{ layout: false,
			usernames:usernames,
			screens:AvailableScreens});
	});
});

//Route for individual screens
app.get('/screen/:id',requiresLogin, function (req, res) {
	var ScreenLoc = req.url.split('/')[2];
	var retVal;
	var status;
	
	//This URL will need to be changed according to the network settings
	var BaseURL = 'http://192.168.77.92:8080';
	//Check if screen is Available and has been deployed by an Admin User
	screens.checkScreen(ScreenLoc,function(retVal,status){
		//Render Screen if Screen is active
		if(retVal==1 && status==='Y'){
			//Render screen for Admin Users
			if(req.session.adminuser){
		  		res.render('index', 	{ layout: false , locals:{spVal: true, 
										User:req.session.adminuser,
										CollabSess:req.params.id,
										qrURL:'http://chart.apis.google.com/chart?cht=qr&chs=180x180&chl='+
										updateURLforQRCode(BaseURL+req.url)
										}});	
			}
			//Render screen for Normal Users
			else{
				res.render('index', 	{ layout: false , locals:{spVal: false, 
										User:req.session.user,
										CollabSess:req.params.id,											
										qrURL:''
										}});					
			}
		}
		else
		{
			//Display error message if a screen is not available
			res.send('<p>No Screen available !!!</p>');			
		}													
	});		
});

//Render Login Page
app.get('/login',function(req,res){
	res.render('index2',{ layout: false, locals:{
		redir:req.query.redir,
		}});
});

//Render Logout Page
app.get('/logout',function(req,res){
	if(req.session.adminuser)
	{
		//If user is admin then disable screen
		screens.updateScreenStatus(req.session.screenid,'N');		
		delete req.session.adminuser;
		delete req.session.screenid;
	}
	delete req.session.user;		
	res.redirect('/');				
});

//Render Admin Screen
app.get('/admin', requiresAdminLogin,function(req, res){
	//If screen has already been deployed
	if (req.cookies.remember) {
		var ScreenID = req.cookies.remember;
		var ScreenLoc = req.cookies.loc;
		var ScreenLat = req.cookies.latitude;
		var ScreenLong = req.cookies.longitude;	
		var retVal;
		var status;	
		//Check to see if screen exists
		screens.checkScreen(ScreenID,function(retVal,status){
			if(retVal==0){
				//Add new screen if it does not exist
				screens.addScreen(ScreenID,ScreenLoc,ScreenLat,ScreenLong);
			}
			else{
				//If screen exists then update status
				screens.updateScreenStatus(ScreenID,'Y');
			}
		});
		req.session.screenid=ScreenID;	
		res.send('<p>Screen Deployed.</p>'
		+'<p><a href="/screen/'+ScreenID+'">Show shared display</a></p>');
	} 
	//If page has not been deployed
	else {
		res.send('<p>Welcome Administrator, </p><form method="post"><p>Check to <label>'
		+ '<input type="checkbox" name="remember"/> deploy as shared display.</label></p> '
		+ '<p>Location: <input type="text" name="location"/></p>'
		+ '<p>Latitude: <input type="text" name="Lat"/></p>'
		+ '<p>Longitude: <input type="text" name="Long"/></p>'
		+ '<p><input type="submit" value="Submit"/></p></form>');
	}
});

//Capture details when admin screen POSTs
app.post('/admin',requiresAdminLogin, function(req, res){
	var minute = 60000000*10000000;
	if (req.body.remember) 
	{
		//Store screen details as cookies
		var randVal = generateRandomString();
		var ScreenLoc = req.body.location;
		var ScreenLat = req.body.Lat;
		var ScreenLong = req.body.Long;
		res.cookie('remember', randVal, { maxAge: minute });
		res.cookie('loc', ScreenLoc, { maxAge: minute });
		res.cookie('latitude', ScreenLat, { maxAge: minute });
		res.cookie('longitude', ScreenLong, { maxAge: minute });	
	}
	res.redirect('back');
});

//Capture POST details from the login page
app.post('/session',function(req,res){
	var usr = req.body.login;
	var pass= req.body.password;
	//Autheticate UserName and Password for login
	users.authenticate(usr,pass,function(userval,isAdmin){
		//If User is valid
		if(userval==1){
			req.session.user = req.body.login;
			//If user is Admin then redirect to admin screen
			if (isAdmin=='Y'){
				req.session.adminuser = req.body.login;
				res.redirect('/admin/');
			}
			//If user is a normal user then redirect accordingly
			else{
				res.redirect(req.body.redir);
			}
		}else if(userval==2){
			req.flash('warn','User is already logged in.');
			res.render('index2',{ layout: false, locals:{
				redir:req.body.redir,
				}});
		}
		//Show Error Message if Login details are invalid
		else{
			req.flash('warn','Login failed');
			res.render('index2',{ layout: false, locals:{
				redir:req.body.redir,
				}});
		}
	});
});


var users = require('./users');
var screens = require('./screens');
var sessions = require('./sessions');

var io = sio.listen(app);

var usernames = [];			//List for all usernames using the Service
var UserViews = [];			//Mapping for Users and Current View
var DocShares = [];		//List of Docs which are being shared
var roomSessions = [];		//Room and Session pairings
var primaryUsers = [];		//Room and Primary User pairings

//Check if User is listed as already logged in
function UserLoggedIn(usernames,user,room){
	for (var i = 0; i < usernames.length; i++) {
		if (usernames[i].user == user && usernames[i].room == room) 
		{
			return true;
		}
	}
	return false;
}

var Room = io
.of('/room')
.on('connection', function (socket) {
	var currentView = null;
	var joinedRoom = null;
	var isAdmin = false;	
	
	//Socket method, called when a client joins a room
	socket.on('join room', function(data,fn) {
		socket.join(data.room);
		joinedRoom = data.room;
		//Check if user is an Admin user
		users.userIsAdmin(data.user,function(adminFlag){
			//Do not add user details if user is an admin
			if(adminFlag=='Y'){			
				isAdmin = true;
			}
			else{
				//Check if this user is already logged in elsewhere
				//or on another screen
				if (UserLoggedIn(usernames,data.user,data.room)) {
					fn(true);
					socket.emit('userAleadyLoggedIn');
				}
				else{
					fn(false);
					//Get list of Users in this room
					var roomUsers=[];
					for(var i in usernames){
						//Get List of Room/Channel Users for the socket channel
						if(usernames[i].room == data.room){
							var roomUser = {room:usernames[i].room,
											user:usernames[i].user};
							roomUsers.push(roomUser);
						}
					}
				
					var primaryUser;
					//search for a primary user for the session
					for(var i in primaryUsers){
						if(primaryUsers[i].room == data.room){
							primaryUser = primaryUsers[i];
							break;
						}
					}

					var isFirstUser=false;				
					//If Primary User for the Room/Channel has not been set
					if (!primaryUser){
						primaryUser = {room:data.room,user:data.user};
						//update primary user for the room
						primaryUsers.push(primaryUser);
						//Set as first user
						isFirstUser = true;
					}
				
					//Get the room-session pairing
					var roomPass;
					var roomSess;
					for(var i in roomSessions){
						if(roomSessions[i].room == data.room){
							roomPass = roomSessions[i].pass;
							roomSess = roomSessions[i].sess;						
						}
					}
					
					//Update client with User info to inform that user has joined
					socket.emit('joined', {room:data.room,
											user:data.user,
											isFirstUser:isFirstUser,
											roomPass:roomPass,
											roomSess:roomSess});
					socket.data = data;
					socket.username = data.user;
					socket.room = data.room;
					usernames.push(data);
					//Socket Message "Announcement" is not being used at the moment
					socket.broadcast.to(joinedRoom).emit('announcement',{user: data.user,
																		action: 'connect'});				
					//Update list of Room/Channel Users
					var roomUser = {room:data.room,
									user:data.user};
					roomUsers.push(roomUser);
				}
				//Send client list of Room/Channel Users
				socket.emit('usernames', {usernames:roomUsers});
				screens.getScreenCount(joinedRoom,function(screenCount){
					screens.updateScreenCount(joinedRoom,screenCount+1);
				});
				socket.broadcast.to(joinedRoom).emit('usernames', {usernames:roomUsers});		
			}
		});
	}); 
	
	//Socket Message for retrieving an Existing Session
  	socket.on('existingSession', function(data) {
		//Retrieve Session Info using Session Name
		sessions.getSession(data.sess,function(sessionExists,sessionPass){
			//Check Session Password saved in the database
			if(sessionExists && sessionPass==data.pass){
				//Retrieve List of Documents associated with the session
				sessions.getSessionDocuments(data.sess,function(docs){
					//Save Session info in memory
					roomSessions.push({room:joinedRoom,sess: data.sess, pass:data.pass});
					//Update all room/channel clients with new session details
					socket.emit('retrieveSession',{sess: data.sess,sessExists:true,docs:docs});			
					socket.broadcast.to(joinedRoom).emit('retrieveSession',{sess: data.sess,sessExists:true,docs:docs});				
				});
			}
			else{
				//Update client accordingly when session does not exist or password is invalid
				socket.emit('retrieveSession',{sess: data.sess,sessExists:false,docs:null});				
			}
		});
	});	

	//Socket Message to allow clients to control Shared Screen Scrolling
	socket.on('ControlSharedDisplay', function(data) {
		socket.broadcast.to(joinedRoom).emit(data.action);				
	});
	
	//Socket Message for creating a New Session
  	socket.on('newSession', function(data) {
		//Check if session exists
		sessions.getSession(data.sess,function(sessionExists,sessionPass){
			//Add a new session only if there is currently no session using the name 
			if(!sessionExists){
				sessions.addSession(data.sess,data.pass);
				//Save Session Info in memory
				roomSessions.push({room:joinedRoom,sess: data.sess, pass:data.pass});
				//Update all room/channel clients with new session details
				socket.emit('retrieveSession',{sess: data.sess,sessExists:true,docs:null});			
				socket.broadcast.to(joinedRoom).emit('retrieveSession',{sess: data.sess,sessExists:true,docs:null});				
			}
			else{
				//Update client accordingly when session does not exist or password is invalid
				socket.emit('retrieveSession',{sess: null,sessExists:false,docs:null});							
			}
		});
	});
	
	//For secondary users to connect to an already existing session that is active
	socket.on('connectSession', function(data) {
		//Get documents associated with the session
		sessions.getSessionDocuments(data.sess,function(docs){
			//Update Client for the session
			socket.emit('retrieveSession',{sess:data.sess,sessExists:true,docs:docs});				
		});
		
	});

	//Function to check the Alias of a newly created document
	//to make sure that each session document has a unique Alias
	socket.on('checkAlias',function(data){
		//Get name of session active in this room
		var sessName;
		//Get session name for the current Room/Channel
		for (var k in roomSessions)
		{
			if(roomSessions[k].room == socket.room)
			{
				sessName = roomSessions[k].sess;
				break;
			}
		}
		//Check in database if the Document Alias already exists
		sessions.checkDocAlias(sessName,data.alias,function(docExists){
			//Check in database if the Document Alias already exists
			if(docExists){
				socket.emit('addDocument',{addFlag:false,alias:data.alias,view:data.view});
			}
			else{
				socket.emit('addDocument',{addFlag:true,alias:data.alias,view:data.view});
			}
		});
			
	});
	
	//Update the User's main Content View according to selected document
	socket.on('updateContentView', function(data) {	
		var sessName;
		//Get name of session active in this room
		for (var k in roomSessions)
		{
			if(roomSessions[k].room == socket.room)
			{
				sessName = roomSessions[k].sess;
				break;
			}
		} 		

		var docName;
		//If data.DocName is empty then the user selected to add a new document
		if(!data.DocName){
			//Create a random name for a new document
			docName = generateRandomString();
			//Save the document along with the validated Alias
			sessions.addDocument(docName,data.view,sessName,data.alias,function(){
				//Since new document is being added, the Share Document Checkbox is unchecked
				socket.emit('markSharedAsChecked',{op:'Delete'});				
				updateContents(joinedRoom,socket.username,data,docName,sessName);
			});
		}
		//If an existing document is selected by the user
		else
		{
			//Check if in the current session, the document is shared
			docName = data.DocName;
			isShared=false;
			for(var i in DocShares){
				if(DocShares[i].DocName == docName){
					isShared=true;
					break;
				}
			}

			if(isShared){
				//If the document is currently being shared in the session then check the Share Document Checkbox
				socket.emit('markSharedAsChecked',{op:'Add'});				
			}			
			else{
				//If the document is not shared in the session then uncheck the Share Document Checkbox
				socket.emit('markSharedAsChecked',{op:'Delete'});				
			}
			updateContents(joinedRoom,socket.username,data,docName,sessName);				
		}
	});
	
	//Socket method to update the User's content view and the documents list on other clients
	function updateContents(joinedRoom,username,data,docName,sessName){
		var idx = -1;
		//Find the current User View
		for (var i in UserViews)
		{
			if(UserViews[i].room == joinedRoom && UserViews[i].user==username)
			{
				idx = i;
				break;
			}
		}
		//Delete the user view so that the new View can be inserted
		if(idx > -1){
			UserViews.splice(idx,1);
		}		
		UserViews.push({room:joinedRoom,user:username,contentView:data.view,DocName:docName,alias:data.alias});		
		currentView = {room:joinedRoom,user:username,contentView:data.view,DocName:docName,alias:data.alias};
		//Get the updated documents list for the room only
		sessions.getSessionDocuments(sessName,function(docs){
			//Send an updated list of session documents to the clients in the room
			socket.emit('retrieveSession',{sess: sessName,sessExists:true,docs:docs});			
			socket.broadcast.to(joinedRoom).emit('retrieveSession',{sess: sessName,sessExists:true,docs:docs});		
			//Update the view for this Client only
			socket.emit(data.view,{alias:data.alias,name:docName});
			socket.emit('enabledShareButton');
		});
	}	
	
	//Socket method to update the list of Documents that are being shared in all the sessions
	socket.on('shareView',function(data){
		var viewData;
		//If data.Viewdata is provided then command is for delete
		if(data.ViewData && data.op=='Delete'){
			viewData = data.ViewData;
		}
		else{
			//Set viewData to currentView if the command is for enabling a document share
			//currentView can be null
			viewData=currentView;
		}
		
		//Check if viewData is empty
		//This can be null as currentView can be null
		if(viewData){
			if(data.op=='Add'){
				//Add document to list of Shared Documents
				DocShares.push({room:joinedRoom,view:viewData.contentView,DocName:viewData.DocName});
				//Add the document to the shared display scroll
				socket.broadcast.to(joinedRoom).emit('shareViewforAdmin',{view:viewData.contentView,DocName:viewData.DocName,op:data.op});
			}
			else
			{
				//Delete the document from the shared display scroll
				for(var i in DocShares){
					if(DocShares[i].DocName == viewData.DocName){
						DocShares.splice(i,1);
						socket.broadcast.to(joinedRoom).emit('shareViewforAdmin',{view:viewData.contentView,DocName:viewData.DocName,op:data.op});						
						break;
					}
				}					
			}
		}
	});
	
	//Socket method which checks the share-view checkbox if another client is viewing the same document
	socket.on('checkForCurrentDoc',function(data){
		if(currentView){
			if(data.view == currentView.contentView && data.DocName == currentView.DocName){
				socket.emit('markSharedAsChecked',{op:data.op});
			}
		}
	});
	
	//Socket method to update the Users and documents list on each client and shared display
	socket.on('UpdateListsforAdmin',function(data){
		//Get document name using the div id of the scroll div
		var docName = data.divID.split('_')[1];
		DocUsers=[];
		for (var i in UserViews)
		{
			if(UserViews[i].DocName == docName){
				DocUsers.push(UserViews[i].user);
			}
		}
		//For each scroll page update Document Name and List of Users working on the document
		socket.emit('UpdateUserAndDocListsforAdm',{docName:docName,divID:data.divID,users:DocUsers})
	});
	
	//Socket Message received when a client disconnects
	socket.on('disconnect', function () {	
		//Don't take any action if the user is an admin user	
		if (!socket.username) return;
		var idx = usernames.indexOf(socket.data);
		usernames.splice(idx, 1); 

		//Get updated List of User using the current room/channel
		var roomUsers=[];
		for(var i in usernames){
			if(usernames[i].room == socket.room){
				var roomUser = {room:usernames[i].room,
					user:usernames[i].user};
					roomUsers.push(roomUser);
				}
			}

		//Announecment is not being used currently
		socket.broadcast.to(joinedRoom).emit('announcement', {user: socket.username,
			action: 'disconnect'});
		//Update list of users on other clients and shared display
		socket.broadcast.to(joinedRoom).emit('usernames', {usernames:roomUsers});								

		//Update UserViews because this user is now leaving
		for (var k in UserViews)
		{
			if(UserViews[k].room == socket.room && UserViews[k].user == socket.username)
			{
				UserViews.splice(k, 1); 
				break;
			}
		}
		
		for (var i in primaryUsers)
		{
			//If this user is a primary User than update the global primary user for this room
			if(primaryUsers[i].room == socket.room && primaryUsers[i].user==socket.username)
			{					
				//Remove current user as primary user
				primaryUsers.splice(i, 1);
				//Update global list of primary users only if room has users left
				if(roomUsers.length>0){
					primaryUsers.push({room:joinedRoom,user:roomUsers[0].user});	
				}
				else{
					//Clear Doc Shares information for the disconnecting Primary User because it was the last User
					for(var k in DocShares){
						if(DocShares[k].room ==joinedRoom){
							DocShares.splice(k,1);
						}
					}
					
					//Remove Room and session pairing because primary user is also leaving room
					for (var k in roomSessions)
					{
						if(roomSessions[k].room == socket.room)
						{
							roomSessions.splice(k, 1); 
							socket.broadcast.to(joinedRoom).emit('clearSession');															
						}
					}												
				}
				break;
			}
		}
	});
});
