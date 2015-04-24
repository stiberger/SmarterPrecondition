var teslams = require('teslams'),
	winston = require('winston'),
	readline = require('readline')
	;

var Car = function () {
	//Private attributes of this module
	var username, password;

	/**
 	* Gets the nescessary credentials to be able to control AC
 	* Priviliged method, with access to private attributes (user credentials)
 	* @todo check if credentials are OK before continuing.
 	* @params {function} Callback functio to run after credentials are entered.
 	*/
	this.authorize = function (callback) {
		var rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		rl.question('Enter car username: ', function(_username) {
			hiddenInput('Enter car password: ', rl, function(_password) {
				rl.close();
				username = _username;
				password = _password;
				callback();
			});
		});		
	};

	/**
	 * Start the air condition of the car
	 * Priviliged method, to get access to user credentials
	 */
	this.startAircondition = function() {
		teslams.vehicles( { email: username, password: password }, function ( vehicles ) {
			if (vehicles.id == undefined) {
				winston.error("Error: Undefined vehicle id");
			} else {
				teslams.get_climate_state( vehicles.id, function ( cs ) {
					winston.debug("Current climate state", cs);
					if(cs.is_auto_conditioning_on === true) {
						winston.info("AC already on, won't do anything further.");
						return;
					}
					winston.debug("Setting temperature");
					teslams.set_temperature( {id: vehicles.id, dtemp: 18, ptemp: 18}, function(e) {
						winston.info("Temparature is set at 18C");
						winston.info("Starting air condition");
						teslams.auto_conditioning( { id: vehicles.id, climate: teslams.CLIMATE_ON }, function(d) {
							winston.debug("Feedback from car was", d);
						});
					});
				});
			}
		});
	};
};

/**
 * Hidden input method to conceal passwords from terminal view and/or backlogs.
 * @params {String} query The query string to present to user
 * @params {readline} rl The readline object
 * @params {function} callback What to do when done
 */
function hiddenInput(query, rl, callback) {
	var stdin = process.openStdin();
	var onDataHandler = function(char) {
		char = char + "";
		switch (char) {
			case "\n": case "\r": case "\u0004":
				// Remove this handler
				stdin.removeListener("data",onDataHandler); 
				break;//stdin.pause(); break;
			default:
				process.stdout.write("\033[2K\033[200D" + query + Array(rl.line.length+1).join("*"));
			break;
		}
	}
	process.stdin.on("data", onDataHandler);
	rl.question(query, function(value) {
		rl.history = rl.history.slice(1);
		callback(value);
	});
};

module.exports = new Car();