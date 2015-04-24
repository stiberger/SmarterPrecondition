# TeslaGcalAC
Google Calendar control for the Tesla Model S air condition

Ever wanted to control the timing of the Air Condition?
Wouldn't it be nice to be able to control it from any device with a browser or a calendar app?
Like from the cars browser, phone, tablet or computer? At home, work or the airport?

The principal of the program is, that it is a service monitoring a specific given Google calendar. Any changes made to the calendar, unrelated to device used, will eventually start the AC on the car at that given event start time. The program needs to be run on a computer that is running 24h a day, for it to work properly. A raspberry PI, a nas or router with proper linux on them could do the job. Otherwise you would have to use your own computer.

The installation process is not straight forward (yet).
This was just a couple of nights of coding, to get a proof of concept up and running.

## Installation
* [Install Node](https://nodejs.org/)
* Clone or download project into a folder of your choosing
* Run *npm install* in that folder. This will install all needed 3rd party libraries.
* Run application
  * Follow instructions to connect to calendar and car

### Run application

    nodejs TeslaGcalAC.js

## Use of calendar
For any events having the default duration of one hour, the AC is only turned on once, and left alone until shut down by itself or interrupted by user, by turning on the car or turning AC off from mobile app.

Every functionality of the calendar is supported.
* Reccuring events
* Reccuring event exceptions, like canceled or changed instances.
* Single events
* Whole day events, though - these could easily be entered by mistake, so should probably skip them?

For event durations more than an hour, a *turn on* request is made every 29 minute for as long the event is lasting. This is nice as a *camper mode* replacement. Since existing *camper mode* relies on the car being in *neutral*, you can not charge and in some countries, you can not turn of *daylight running lights* and will be on all the time, causing unwanted attention.
*Camper mode* set up through the calendar, does not rely on car being in *neutral*, so you can be connected to a charger and car, lights and center console can be completely off.

There is at the current time **no support for multiple cars**. Not sure how I would do that, and since I'm not in the fortunate position of owning several vehicles, I have not spent a lot of time thinking about it, or even less - test it.
Would it be best solved through multiple calendars or using name of car in *title* field for event?

## Future
Functionality on the drawing board
[ ] Use request token on *calendar.list.events*, to only get updates. No need to clear and refresh entire job queue every time.
[x] If event is more than the default one hour, trigger air condition every 29 mins.
[ ] Support multiple cars. Either through names in title or location or separate calendars.
[ ] Set wanted temperatures through description or title of event.
[ ] If available, check interior temperature, and decide if turning on is nescessary.
[ ] Check battery level, or connection status.
[ ] Get car credentials from command line, in case it is run as daemon from /etc/rc.something
[ ] Plugin system.
  [ ] Event emmiters for events. Trigger on updated calendar and AC startups.
  [ ] Status lights (on a PI)
  [ ] Update a LED or LCD display (on PI)
  [ ] Beep on ac start
  [ ] Buttons for cancel or force start. (on PI)
  [ ] Multiple cars?
