/**
 * Module dependencies.
 */
var express = require('express');
var quizDb = require('./quizDb');

var app = express.createServer(),
 	sio = require('socket.io');


/**
 * App configuration.
 */	
app.configure(function () {
  	app.use(express.static(__dirname + '/public'));
  	app.use(express.cookieParser());
	app.use(express.bodyParser());
  	app.set('views', __dirname);
  	app.set('view engine', 'jade');
});


/**
 * App routes.
 */
app.get('/quiz/:id', function(req, res){
	if(req.query.userName=='Main Screen'){
  		res.render('index',{locals:{ layout: false,
									spVal: true, 
									QuizId:req.params.id,
									User:req.query.userName}});
	}
	else{
  		res.render('index',{locals:{ layout: false,
									spVal: false, 
									QuizId:req.params.id,
									User:req.query.userName}});		
	}
});

app.listen(3000);

var io = sio.listen(app);

var usernames=[];

//Setup Web Sockets
var Room = io
.of('/room')
.on('connection', function (socket) {
	var joinedQuiz = null;
	
	//Socket method, called when a client joins a room
	socket.on('join room', function(data) {
		//Store Client data
		socket.join(data.quizid);
		joinedQuiz = data.quizid;		
		socket.data = data;
		socket.username = data.user;
		socket.quizid = data.quizid;
				
		//Store Username and room/channel association
		usernames.push({quizid:data.quizid,
						user:data.user});
		var quizUsers=[];
		for(var i in usernames){
			if(usernames[i].quizid == data.quizid){
				var quizUser = {quizid:usernames[i].quizid,
								user:usernames[i].user};
				quizUsers.push(quizUser);
			}
		}			
		
		//Retrieve current Question (if any) on screen load
		quizDb.getCurrentQuestion(joinedQuiz,function(retVal,QuestionID,User,Question,NumChoices){
			//If current Question exists then load either multiple choice
			//question or Text-based question
			if(retVal){
				if(NumChoices>0){
					//Retrieve from database, choices for the multiple choice question
					quizDb.getChoices(QuestionID,function(choices)
					{
						//Update Question for clients
						socket.emit('UpdateQuestionForClients',{QuestionID:QuestionID,question:Question,User:User,numChoices:NumChoices,choices:choices});
						//For the current question that is loaded load the results
						quizDb.getAnswers(QuestionID,function(Answers){
							socket.emit('updateChoiceAnswers',{Answers:Answers,Question:Question,numChoices:NumChoices,choices:choices});									
						});
					});
				}
				else
				{
					//Update Question for clients
					socket.emit('UpdateQuestionForClients',{QuestionID:QuestionID,question:Question,User:User,numChoices:NumChoices,choices:null});
					//For the current question that is loaded load the results
					quizDb.getAnswers(QuestionID,function(Answers){
						socket.emit('updateTextAnswers',{Answers:Answers});		
					});
				}
			}
		});
		
		//Update list of current usernames on all clients of a room/channel
		socket.emit('usernames',{usernames:quizUsers});
		socket.broadcast.to(joinedQuiz).emit('usernames', {usernames:quizUsers});						
	});
	
	//Socket message to add a question in the database
	socket.on('submitquestion',function(data){
		quizDb.addQuestion(socket.username,joinedQuiz,data.question,data.numChoices,data.choices,function(QuestionID,isSubmitted){
			if(isSubmitted){
				socket.emit('QuestionSubmitted',{QuestionID:QuestionID,
												User:socket.username,
												question:data.question,
												numChoices:data.numChoices,
												choices:data.choices});		
			}
		});
	});
		
	socket.on('UpdateCurrentClients',function(data){
			socket.emit('UpdateQuestionForClients',data);
			socket.broadcast.to(joinedQuiz).emit('UpdateQuestionForClients',data);
	});
	
	socket.on('submitanswer',function(data){
		quizDb.addAnswer(data.AnswerText,data.QuestionID,socket.username,function(Answers){
			if(data.NumChoices>0){
				socket.emit('updateChoiceAnswers',{Answers:Answers,Question:data.Question,numChoices:data.NumChoices,choices:data.choices});		
				socket.broadcast.to(joinedQuiz).emit('updateChoiceAnswers',{Answers:Answers,Question:data.Question,numChoices:data.NumChoices,choices:data.choices});		
			}
			else{
				socket.emit('updateTextAnswers',{Answers:Answers});		
				socket.broadcast.to(joinedQuiz).emit('updateTextAnswers',{Answers:Answers});		
			}
		});
	});
	socket.on('disconnect', function () {		
		if (!socket.username) return;
		var idx;
		for(var i in usernames){
			if(usernames[i].quizid == socket.quizid && usernames[i].user==socket.username){
				idx = i;	
				break;
			}
		}
		usernames.splice(idx, 1); 

		var quizUsers=[];
		for(var i in usernames){
			if(usernames[i].quizid == socket.quizid)
			{
				var quizUser = {quizid:usernames[i].quizid,
					user:usernames[i].user};
					quizUsers.push(quizUser);
			}
		}
		socket.broadcast.to(joinedQuiz).emit('usernames', {usernames:quizUsers});								
	});
	
});
