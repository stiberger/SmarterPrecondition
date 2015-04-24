/**
 * @todo
 * [ ] Use Token on getEvents, to only get updates. No need to clear and refresh entire job queue every time.
 * [x] If event more than one hour, set up multiple cron events for starting air condition every 29 mins.
 * [ ] Get temperatures from description or title
 * [ ] If available, check interior temperature, and decide if turning on is nescessary.
 * [ ] Check battery level, or connection status.
 * [ ] Get car credentials from command line, in case it is run as daemon from /etc/rc.something
 * [ ] Look into storing car username and password as encrypted in memory, 
 *     and only decrypt as nescessary. This to mitigate risk from memory scan for username and password pattern attacks.
 *     Not sure if this will help, because not sure how garbage collection is done on variables, and in underlying
 *     scopes where it is used unencrypted, ex. the authentication requests.
 *     Will a simple *var=undefined;* or *delete var;* be enough to remove from ram?
 *     Since strings in javascript is mutable, I would think it is...
 * [ ] Event emmiters for events. Updated calendar and AC startups.
 * [ ] Plugin system.
 *   [ ] Status lights on a PI for instance
 *   [ ] Update a LED or LCD display
 *   [ ] Beep on ac start
 *   [ ] Buttons for cancel or force start.
 * [ ] Multiple cars?
 */

var winston = require('winston');
winston.level = 'debug';

var car = require('./lib/car.js'),
    calendar = require('./lib/calendar.js')
;

//Checks if we already have needed tokens to get access to calendar.
//Will step through a procedure to get it otherwise.
//Runs the callback when access to calendar is OK.
calendar.authorize(function() {
	//Ask for car username and password
	//Really would want for Tesla to have a similar authentication service to google's API.
	//where you only get a token with limited access to the API
	//It is a big risk/responsibility handling the username and password
	//with access to unlock and start the car...
	car.authorize(function() {
		//Check for new events at regular intervals
		//In this case at 09,19,29,39,49,59 every hour
		//This way it is safe to add an event at nearest whole 10 minute time.
		calendar.intervalCheck('0 9-59/10 * * * *', function() {
			calendar.getEvents(function(dateTime) {
				calendar.setEvent(dateTime, car.startAircondition);
			});
		});
	});
});