var winston = require('winston'),
	fs = require('fs'),
	readline = require('readline'),
	google = require('googleapis'),
	googleAuth = require('google-auth-library'),
	calendar = google.calendar('v3'),
	moment = require('moment'),
	cron = require('cron').CronJob
;

var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
		process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'TeslaGcalAC-gcal-api-token.json';

Calendar = function() {
	this.credentials = require('./calendar_client_secret.json');
	this.oauth2Client;
	this.eventJobs = [];
	this.initialCheckDone = false;
};
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {function} callback The callback to call with the authorized client.
 */
Calendar.prototype.authorize = function(callback) {
	var clientSecret = this.credentials.installed.client_secret;
	var clientId = this.credentials.installed.client_id;
	var redirectUrl = this.credentials.installed.redirect_uris[0];
	var auth = new googleAuth();
	this.oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
	this.calendarId;
	var that = this;
	// Check if we have previously stored a token.
	fs.readFile(TOKEN_PATH, function(err, token) {
		if (err) {
			that.getNewToken(callback);
		} else {
			that.oauth2Client.credentials = JSON.parse(token);
			//retreive calendar id from piggybacked token file.
			that.calendarId = that.oauth2Client.credentials.calendarId;
			callback();
		}
	});
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
  * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
Calendar.prototype.getNewToken = function(callback) {
	var authUrl = this.oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES
	});
	console.log('Authorize this app by visiting this url: ', authUrl);
	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	var that = this;
	rl.question('Enter the code from that page here: ', function(code) {
		rl.close();
		that.oauth2Client.getToken(code, function(err, token) {
			if (err) {
				winston.error('Error while trying to retrieve access token', err);
				return;
			}
			that.oauth2Client.credentials = token;
			selectCalendar(function(calendarId) {
				//Piggybacking calendar id on the token file...
				token.calendarId = calendarId;
				that.calendarId = calendarId;
				that.storeToken(token);
				that.oauth2Client.credentials = token;
				callback();	
			});
		});
	});
}

/**
 * Store token to disk to be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
Calendar.prototype.storeToken = function(token) {
	try {
		fs.mkdirSync(TOKEN_DIR);
	} catch (err) {
		if (err.code != 'EEXIST') {
			throw err;
		}
	}
	fs.writeFile(TOKEN_PATH, JSON.stringify(token));
	winston.info('Token stored to %s', TOKEN_PATH);
}

/**
 * Lets the user select which calendar to use for events.
 * This is only run once, when initializing calendar.
 * All following runs of program will fetch this from .credentials/token file
 * To reset this, delete the token file.
 * @params {function} callback What to do next when user has selected
 */
Calendar.prototype.selectCalendar = function(callback) {
	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	var calendars = {};
	calendar.calendarList.list({auth: this.oauth2Client}, function(err, response) {
		if(err) {
			winston.error('Error fetching calendar list: %s', err);
			return;
		}
		response.items.forEach(function(entry, i) {
			console.log('%d: %s', i, entry.summary);
		});
		rl.question('Select the car climate calendar: ', function(calendarNumber) {
			rl.close();
			if(typeof response.items[calendarNumber] === 'undefined') {
				console.log('No calendar with that number');
				return;
			}
			callback(response.items[calendarNumber].id);
		});
	});
};

/**
 * Gets the next 10 events on the user's car climate calendar.
 * @todo Get a token to use for following cron requests. These will only contain updates!
 * aka incremental updates.
 * For a prototype this is the simple, brute and fault resistant approach.
 * 
 * @param {function} callback A function that decides what to do on each event. A date is given as parameter to this callback.
 */
Calendar.prototype.getEvents = function(callback) {
	this.clearEvents();
	var auth = this.oauth2Client;
	calendar.events.list({
		auth: auth,
		calendarId: this.calendarId,
		timeMin: (new Date()).toISOString(),
		maxResults: 10,
		singleEvents: true,
		orderBy: 'startTime'
	}, function(err, response) {
		if (err) {
			winston.error('There was an error contacting the calendar service: %s', err);
			return;
		}
		var events = response.items;
		if (events.length == 0) {
			windton.info('No upcoming events found.');
		} else {
			winston.debug('Upcoming 10 events:');
			for (var i = 0; i < events.length; i++) {
				var event = events[i];
				var start = moment(event.start.dateTime || event.start.date);
				var end = moment(event.end.dateTime || event.end.date);
				winston.silly('Event duration is: %s', end.diff(start));
				callback(start.toDate());
				if(end.diff(start) > 3600000) {
					winston.debug('Duration exceeds one hour. Adding events every 29 minutes until end time.');
					while(start.add(29, 'minutes') < end) {
						callback(start.toDate());
					}
				}
			}
		}
	});
};

/**
 * Clear event job queue
 */
Calendar.prototype.clearEvents = function() {
	winston.debug('Clearing all events');
	this.eventJobs.forEach(function(job) {
		job.stop();
	});
	this.eventJobs = [];
};

/**
 * Set an event job
 * @param {Date} date The time of the event
 * @param {function} callback What to do at event
 */
Calendar.prototype.setEvent = function(date, callback) {
	if(date < Date.now()) {
		//No need to set events in the past for ongoing started events.
		winston.silly('Skipping %s', date.toLocaleString());
		return;
	}
	winston.debug('Setting event for: %s', date.toLocaleString());
	this.eventJobs.push(new cron(date, function() {
		winston.info('Running at', new Date());
		callback();
	}, null, true));
};

/**
 * Check calendar at a given interval in cron format
 * If it is the first time run, it will do the callback imidiatley.
 * @param {String} interval Cron like interval description (including seconds) '0 * * * * *'
 * @param {function} callback The thing to do at that interval
 */
Calendar.prototype.intervalCheck = function(interval, callback) {
	if(!this.initialCheckDone) {
		callback();
	}
	var checkCalendarRegularly = new cron(interval, callback, null, true);
};

module.exports = new Calendar();