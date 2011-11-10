"use strict";

var sqlite3 = require('sqlite3');

/* Location of database */
var dbLocation = "./database/quizDB.sqlite3";

var db;

function sqlQuery(sql,callback){
	db = new sqlite3.Database(dbLocation, function(error) {
	    if (error) throw error;
	    db.all(sql, function(error, rows) {
		     if (error) 
				throw error;
		    db.close(function(error){});
		    callback(rows);
		});
	});
};

module.exports.addQuestion= function(UserName,QuizID,Question,NumChoices,choices,callback){
	var QuestionSubmitted = true;
	var QuestionID;
	var sql = 'insert into tblQuestions(UserName,QuizID ,Question,NumChoices)'+
		' values("'+UserName+'","'+QuizID+'","'+Question+'","'+NumChoices+'")';	    
	db = new sqlite3.Database(dbLocation);
	db.run(sql,function(error){
		if (error){
			QuestionSubmitted = false;			
			console.log('Question Insertion failed.');
		}
		else{
			console.log('New Question added.');
			var sql = 'select * from tblQuestions where QuizID = "'+QuizID+'" '+
			'order by QuestionID desc';	    
			sqlQuery(sql, function (result) {
				QuestionID = result[0].QuestionID;
				if(NumChoices>0){
					for(var i in choices){
						sql = 'insert into tblChoices(QuestionID ,ChoiceText)'+
							' values("'+QuestionID+'","'+choices[i]+'")';	    
						db = new sqlite3.Database(dbLocation);
						db.run(sql,function(error){
							if (error){
								QuestionSubmitted = false;
								console.log('Choice Insertion failed.');
							}
							else{
								console.log('New Choice added.');		
							}
						});			
					}					
				}
				if(QuestionSubmitted){
					callback(QuestionID,QuestionSubmitted);
				}				
			});
		}
	});
};


module.exports.getCurrentQuestion=function(QuizID,callback) {
	var retVal=false;
    var User,QuestionID,Question,NumChoices;
	
	var sql = 'select * from tblQuestions where QuizID = "'+QuizID+'" '+
	'order by QuestionID desc';	    
    sqlQuery(sql, function (result) {
	    if (result.length > 0)
		{
			QuestionID = result[0].QuestionID;			
			User = result[0].UserName;
			Question = result[0].Question;
			NumChoices = result[0].NumChoices;
			retVal= true;			
		}
		else
			retVal= false;
		callback(retVal,QuestionID,User,Question,NumChoices);
	});
};

module.exports.getChoices=function(QuestionID,callback) {
	var sql = 'select * from tblChoices where QuestionID = "'+QuestionID+'"';	    
	sqlQuery(sql, function (rows) {
		var choices = [];
		for (var i in rows){
			choices[i]=rows[i].ChoiceText;
		}
		callback(choices);
	});
};

module.exports.addAnswer= function(AnswerText,QuestionID,User,callback){
	console.log('Answer: '+AnswerText);
	var sql = 'insert into tblAnswers(AnswerText,QuestionID,User)'+
		' values("'+AnswerText+'","'+QuestionID+'","'+User+'")';	    
	db = new sqlite3.Database(dbLocation);
	db.run(sql,function(error){
		if (error){
			console.log('Answer Insertion failed.');
		}
		else{
			console.log('New Answer added.');
			var sql = 'select * from tblAnswers where QuestionID = "'+QuestionID+'"'+
			'order by AnswerID desc';
			sqlQuery(sql, function (rows) {
				var answers = [];
				for (var i in rows){
					answers[i]={AnswerText:rows[i].AnswerText,User:rows[i].User};
				}
				callback(answers);
			});
		}
	});
};

module.exports.getAnswers=function(QuestionID,callback) {
	var sql = 'select * from tblAnswers where QuestionID = "'+QuestionID+'"'+
	'order by AnswerID desc';
	sqlQuery(sql, function (rows) {
		var answers = [];
		for (var i in rows){
			answers[i]={AnswerText:rows[i].AnswerText,User:rows[i].User};
		}
		callback(answers);
	});
};