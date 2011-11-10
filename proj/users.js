/**********************************************************************
 * Filename: 		users.js										
 * By: 				Waqas Burney
 * Date: 			2011
 Description :   	
 	Utility Class for manipulating Users data from database
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
	    db.all(sql, function(error, rows) {
		     if (error) throw error;
		    db.close(function(error){});
		    callback(rows);
		});
	});
};

//Function is used to authenticate users based on username and password
module.exports.authenticate = function(User, pass,callback) {
    var checkPass;
    var checkStatus;
    var isAdmin;
    var retVal;
	
	var sql = 'SELECT * from tblUsers t where t.UserName="'+User+'"';	    
    sqlQuery(sql, function (result) {
	    if (result.length !== 0) {
			checkPass = result[0].Password;
			checkStatus = result[0].LoggedIn;
			isAdmin = result[0].IsAdmin;
			if (checkStatus == 'N' && checkPass == pass) retVal = 1;			
			if (checkStatus == 'Y') retVal = 2;
	   	}
		callback(retVal,isAdmin);
	});
};

//Function to check if a user is an admin user
module.exports.userIsAdmin = function(User,callback) {
    var adminFlag;
	
	var sql = 'SELECT * from tblUsers t where t.UserName="'+User+'"';	    
    sqlQuery(sql, function (result) {
	    if (result.length !== 0) {
			adminFlag = result[0].IsAdmin;
	   	}
		callback(adminFlag);
	});
};
