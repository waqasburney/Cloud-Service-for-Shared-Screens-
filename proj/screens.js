/**********************************************************************
 * Filename: 		screens.js										
 * By: 				Waqas Burney
 * Date: 			2011
 Description :   	
 	Utility Class for manipulating Screens data from database
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

//Function is used to deploy a new Screen
module.exports.addScreen= function(ScreenID,ScreenLoc,ScreenLat,ScreenLong){
	var sql = 'insert into tblScreens values("'+ScreenID+'","Y","'+ScreenLoc+'",0,"'+ScreenLat+'","'+ScreenLong+'")';	    
	db = new sqlite3.Database(dbLocation);
	db.run(sql,function(error){
		if (error){
			console.log('Screen Insertion failed.');
		}
		else
			console.log('New Screen added.');		
	});
};

//Function is used to update the current Status of a Screen.
//This is required when an admin user logs out of the Screen
//causing the screen to be disabled
module.exports.updateScreenStatus= function(ScreenID,Status){
	var sql = 'update tblScreens set IsActive = "'+Status+'" where ScreenID="'+ScreenID+'"';	    
	db = new sqlite3.Database(dbLocation);
	db.run(sql,function(error){
		if (error){
			console.log('Screen Status Update failed.');
		}
		else
			console.log('Screen Status updated.');		
	});
};

//Function used to check the status of a screen when a user is logging on
module.exports.checkScreen=function(ScreenID,callback) {
	var retVal=0;
    var checkStatus;	
	var sql = 'SELECT * from tblScreens where ScreenID="'+ScreenID+'"';	    
    sqlQuery(sql, function (result) {
	    if (result.length > 0)
		{
			//Return a status only if a screen record is found
			checkStatus = result[0].IsActive;
			retVal= 1;			
		}
		else
			retVal= 0;
		callback(retVal,checkStatus);
	});
};

//This function is used to update the count for the number of users
//who have accessed a screen
module.exports.updateScreenCount= function(ScreenID,ScreenCount){
	var sql = 'update tblScreens set ScreenCount = "'+ScreenCount+'" where ScreenID="'+ScreenID+'"';	    
	db = new sqlite3.Database(dbLocation);
	db.run(sql,function(error){
		if (error){
			console.log('Screen Count Update failed.');
		}
		else
			console.log('Screen Count updated.');		
	});
};

//This function returns the current screen count that is stored in the database
module.exports.getScreenCount=function(ScreenID,callback) {
	var screenCount;
	var sql = 'SELECT * from tblScreens where ScreenID="'+ScreenID+'"';	    
    sqlQuery(sql, function (result) {
		//Return a valid screen count if a record is found in the database
	    if (result.length > 0)
		{
			screenCount=result[0].ScreenCount;
		}
		else
			screenCount=0;
		callback(screenCount);
	});
};

//This function is used to list all the current active screens
module.exports.getActiveScreens=function(callback) {
	var sql = 'select * from tblScreens t where t.IsActive = "Y"';	    
	sqlQuery(sql, function (rows) {
		callback(rows);
	});
};

