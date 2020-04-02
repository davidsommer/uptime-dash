window.myApp = window.myApp || {};


myApp.dashboard = (function($) {

	var _template = "",
		_loaded = 0,
		$_container = {},
		$_prograss = {},
		$_countdown = {}

	function init() {
		google.charts.load('current', {packages: ['gauge', 'controls']});
		_template = $('#server-template').html();
		$_container = $('#server-container').html('');
		$_prograss = $('.loading');
		$_countdown = $('#progressBar');

		for (var i in __apiKeys) {
			getUptime(__apiKeys[i]);
		}

		attachListners($('html'));
		countdown();
	}

	function attachListners($target) {

		$target.find('.tip').tooltip({
			placement: 'bottom'
		});

		$target.find('body').mouseup(function(event) {
			if ($('.popover-inner').length) {
				$('button.log').popover('hide');
			}
		});
	}

	/* load uptime variables from uptimerobot
	* this calls jsonUptimeRobotApi() when loaded  
	*/
	function getUptime(apikey) {
		var url = "https://api.uptimerobot.com/getMonitors?apiKey=" + apikey + "&customUptimeRatio=1-7-30-365&format=json&logs=1";
		$.ajax({
			url: url,
			context: document.body,
			dataType: 'jsonp'
		});
	}

	/* experimental, isn't working yet
	*/
	function getUptimeV2(apikey) {
	
		var myHeaders = new Headers();
		myHeaders.append("Accept", "application/x-www-form-urlencoded");
		myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
		
		var formdata = new FormData();
		formdata.append("api_key", apikey);
		formdata.append("format", "json");
		formdata.append("custom_uptime_ratios", "1-7-30-365");
		formdata.append("logs", "1");
		
		var requestOptions = {
		  method: 'POST',
		  headers: myHeaders,
		  body: formdata,
		  redirect: 'follow'
		};
		
		fetch("https://api.uptimerobot.com/v2/getMonitors", requestOptions)
		  .then(response => response.text())
		  .then(result => console.log(result))
		  .catch(error => console.log('error', error));

		// TODO call jsonUptimeRobotApi() when loaded  
	}

	/* places the html on the page */
	function placeServer(data) {
		data.alert = "alert";
		switch (parseInt(data.status)) {
			case 0:
				data.statustxt = "Up-Time paused";
				data.label = "info";
				break;
			case 1:
				data.statustxt = "Not checked yet";
				data.label = "default";
				break;
			case 2:
				data.statustxt = "Online";
				data.label = "success";
				data.alert = "";
				break;
			case 8:
				data.statustxt = "Seems offline";
				data.label = "warning";
				break;
			case 9:
				data.statustxt = "Offline";
				data.label = "danger";
				data.alert = "alert alert-error";
				break;
		}

		//ony show last month of logs
		var lastMonth = Date.parse('-1month');
		for (var i in data.log) {
			var log = data.log[i],
				dateTime = Date.parse(log.datetime + " GMT+0300");

			if (dateTime < lastMonth) {
				data.log.splice(i, i + 1);
			} else {
				data.log[i].datetime = dateTime.toString("dd-MM-yyyy H:mm:ss");
			}
		}
		data.log = $.merge([], data.log); //make sure log is set

		// interface of log-stuf like icons
		data.typeicon = getLogIcon;
		data.labeltype = getLogType;
		
		//render the sh!t
		var $output = $(Mustache.render(_template, data));

		//attach popover listners
		$output.find('a.log').click(function() {
			$(this).tooltip('hide');
		}).popover({
			placement: 'bottom',
			html: true,
			content: $output.find('div.log' + data.id).html()
		});
		attachListners($output);

		//append it in the container
		$_container.append($output);

		//load/place the graphs
		var values = data.customuptimeratio.split("-");
		values.push(data.alltimeuptimeratio);
		placeCharts(values, data.id);


		updateProgressBar();
	}

	/* place the chart */
	function placeCharts(values, id) {

		var data = new google.visualization.DataTable();
		data.addColumn('string','Timerange');
		data.addColumn('number','Value');
		data.addRows([
				['Last Day', parseFloat(values[0])],
				['Last Week', parseFloat(values[1])],
				['Last Month', parseFloat(values[2])],
				['Last year', parseFloat(values[3])],
				['All Time', parseFloat(values[4])]
			]);

	  // Define a category picker for the 'Metric' column.
	  var categoryPicker = new google.visualization.ControlWrapper({
	    'controlType': 'CategoryFilter',
	    'containerId': 'control_' + id,
	    'options': {
	      'filterColumnLabel': 'Timerange',
	      'ui': {
	        'allowTyping': false,
	        'allowMultiple': false,
	        'selectedValuesLayout': 'belowStacked'
	      }
	    },
	    // Define an initial state, i.e. a set of metrics to be initially selected.
	    'state': {'selectedValues': ['All Time']}
	  });

	  // Define a gauge chart.
	  var gaugeChart = new google.visualization.ChartWrapper({
	    'chartType': 'Gauge',
	    'containerId': 'chart_' + id,
	    'options': {
				width: 500,
				height: 200,
				min: 90,
				max: 100,
				redFrom: 90,
				redTo: 95,
				yellowFrom: 95,
				yellowTo: 99,
				greenFrom: 99,
				greenTo: 100,
				minorTicks: 5,
	    }
	  });

      var dashboard = new google.visualization.Dashboard(document.getElementById('chart_' + id));

      dashboard.bind(categoryPicker, gaugeChart);

      // Draw the dashboard.
      dashboard.draw(data);
  }

	/* update progress bar of loaded servers */
	function updateProgressBar() {
		_loaded++;
		$_prograss.css('width', Math.round(_loaded / __apiKeys.length) * 100 + '%');
		if (_loaded >= __apiKeys.length) {
			$_prograss.parent().slideUp();
		}
	}

	/* count down till next refresh */
	function countdown() {
		progress(150, 150, $_countdown);
	}

	function progress(timeleft, timetotal, $element) {
		var progressBarWidth = timeleft * $element.width() / timetotal;

		$element.find('div').animate({ width: progressBarWidth }, 100).html(Math.floor(timeleft/60) + ":"+ timeleft%60);

		if(timeleft > 0) {
			setTimeout(function() {
				progress(timeleft - 1, timetotal, $element);
			}, 600);
		} else {
			init();
		}
	};

	/* set the icon in front of every log-line */
	function getLogIcon() {
		switch (parseInt(this.type)) {
			case 1:
				return "chevron-down";
				break;
			case 2:
				return "chevron-up";
				break;
			case 99:
				return "eject";
				break;
			case 98:
				return "expand";
				break;
			default:
				return this.type;
		}
	}

	/* give the icon in front of log line a nice color */
	function getLogType() {
		switch (parseInt(this.type)) {
			case 1:
				return "danger";
				break;
			case 2:
				return "success";
				break;
			case 99:
				return "warning";
				break;
			case 98:
				return "info";
				break;
			default:
				return this.type;
		}
	}

	//expose dashboard (PUBLIC API)
	return {
		init: init,
		placeServer: placeServer
	};
}(jQuery));
jQuery(document).ready(myApp.dashboard.init);

/* function called from the uptimerequest */
function jsonUptimeRobotApi(data) {
	
	for (var i in data.monitors.monitor.sort()) {
		myApp.dashboard.placeServer(data.monitors.monitor[i]);
	}
}
