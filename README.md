# TeslaGcalAC
Google Calendar control for the Tesla Model S air condition

Ever wanted to control the timing of the Air Condition?
Wouldn't it be nice to be able to control it from any device with a browser or a calendar app?
Like from the cars browser, phone, tablet or computer? At home, work or the airport?

The principal of the program is, that it is a service monitoring a specific given Google calendar. Any changes made to the calendar, unrelated to device used, will eventually start the AC on the car at that given event start time. The program needs to be run on a computer that is running 24h a day, for it to work properly. A raspberry PI, a nas or router with proper linux on them could do the job. Otherwise you would have to use your own computer.

The installation process is not straight forward (yet).
This was just a couple of nights of coding, to get a proof of concept up and running. And it worked so well, that the incentives to continue improving was simply not strong enough.

## Installation
* [Install Node](https://nodejs.org/)
* Clone or download project into a folder of your choosing
* Run *npm install* in that folder. This will install all needed 3rd party libraries.
* Run application

## Run application

    nodejs TeslaGcalAC.js

You will be prompted for nescessary details needed to run the app.

## Room for improvements
* Run as a proper daemon
* Add a tray icon, with current status and upcoming events
* Support longer events, and turn on AC every half hour. Could replace *Camper Mode*
