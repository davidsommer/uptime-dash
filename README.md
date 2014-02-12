uptime-dash
===========

A Dashboard that gives you a nice responsive overview of your uptimerobot monitored sites.
This Project is based on the work of https://github.com/digibart/upscuits.

Frameworks used:
-------------
* [Bootstrap 3.0](http://getbootstrap.com)
* [UptimeRobot API](http://www.uptimerobot.com/api)
* [Google Charts](https://developers.google.com/chart)
* [Mustaches](https://github.com/janl/mustache.js/)

Tools needed:
---------------
* A webserver
* A free account at [UptimeRobot](http://uptimerobot.com)
* A text-editor

Preparations:
---------------
_You can skip step 1 and 2 if you've already got a monitor at Uptime Robot_

1. Login at UptimeRobot.
2. Add a new monitor
3. Go to [MySettings](http://www.uptimerobot.com/mySettings.asp)
4. Eather get the "Main API Key" if you want all created monitors to show or get the "Monitor-Specific API Keys" and copy them

Directions:
---------------
1. Copy all files to your webserver
2. Rename/Copy `js/config.example.js` to `js/config.js`
3. Paste one ore more API keys as an array in `config.js`

[![Buy me a beer](http://api.flattr.com/button/flattr-badge-large.png)](https://flattr.com/submit/auto?user_id=david.sommer&url=https://github.com/davidsommer/uptime-dash&title=uptime-dash&language=&tags=github&category=software) 
