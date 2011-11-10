/**********************************************************************
 * Filename: 		sessions.js										
 * By: 				Waqas Burney
 * Date: 			2011
 Description :   	
 	Utility Class for manipulating Sessions and Documents data from database
 *********************************************************************/


"use strict";

var sqlite3 = require('sqlite3');

/* Location of database */
var dbLocation = "./database/myDB.sqlite3";

var db;

//Function returns rows as a result of executing a query
function sqlQuery(sql,callback){
	db = new sqlite3.Database(dbLocation, function(error) {
	    if (error) throw error;
		db.serialize(function() {	
		    db.all(sql, function(error, rows) {
			     if (error) throw error;
			    db.close(function(error){});
			    callback(rows);
			});
		});
	});
};

//Function to add a new session in the database
module.exports.addSession= function(SessionName,SessionPassword){
	var sql = 'insert into tblSessions values("'+SessionName+'","'+SessionPassword+'");';	    
	db = new sqlite3.Database(dbLocation);
	db.run(sql,function(error){
		if (error)
			console.log('Session Insertion failed.');
		else
			console.log('New Session added.');		
	});
    db.close();	
};

//Function to retrieve an existing session using the session name
module.exports.getSession=function(SessionName,callback) {
	var retVal=false;
	var sessionPass;
	var sql = 'SELECT * from tblSessions where SessionName="'+SessionName+'"';	    
    sqlQuery(sql, function (result) {
	    if (result.length > 0)
		{
			sessionPass=result[0].SessionPass;
			retVal= true;			
		}
		else
			retVal= false;
		callback(retVal,sessionPass);
	});	
};

//For a given Alias check if a Document Alias already exists 
//for a given session in the database
module.exports.checkDocAlias=function(SessionName,Alias,callback) {
	var retVal=false;
	var sql = 'SELECT * from tblDocs where SessionName="'+SessionName+'" and DocAlias="'+Alias+'";';	    
    sqlQuery(sql, function (result) {
	    if (result.length > 0)
		{
			retVal= true;			
		}
		else
			retVal= false;
		callback(retVal);
	});
};

//For a given Session, retrieve all the Documents associated with it
module.exports.getSessionDocuments=function(SessionName,callback) {
	var sql = 'select * from tblDocs where SessionName = "'+SessionName+'"';	    
	sqlQuery(sql, function (rows) {
		callback(rows);
	});	
};	

//Add a new document along with details
module.exports.addDocument= function(DocName,DocType,SessionName,DocAlias,callback){
	var sql = 'insert into tblDocs values("'+DocName+'","'+SessionName+'","'+DocType+'","'+DocAlias+'");';	    
	db = new sqlite3.Database(dbLocation);
	db.run(sql,function(error){
		if (error)
			console.log('Document Insertion failed.');
		else{
			console.log('New Document added.');		
			callback();
		}
	});
	db.close();					
};

