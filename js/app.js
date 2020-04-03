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
		$target.find('.accordion').on('hidden.bs.collapse', toggleIcon);
		$target.find('.accordion').on('shown.bs.collapse', toggleIcon);
	}		

	function toggleIcon(e) {
		$(e.target)
			.prev('.card-header')
			.find(".more-less")
			.toggleClass('fa-plus fa-minus');
	}
	
	/* load uptime variables from uptimerobot
	*/
	function getUptime(apikey) {
		var url = "https://api.uptimerobot.com/v2/getMonitors";
	
		$.post(url, {
			"api_key": apikey,
			"format": "json",
			"custom_uptime_ratios": "1-7-30-365",
			"all_time_uptime_ratio": "1",
			"logs": "1"
		}, function(response) {
			jsonUptimeRobotApi(response);
		}, 'json')
		.fail(function(response) {
			console.log("ERROR - connecting to uptimerobot API failed (" + url + ") - " + response);
			$("#error").html("ERROR - connecting to uptimerobot API failed, check your key (" + url + "). More infos in the console").show();
		});;
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

		var y = 0;
		for (var i in data.logs) {
			var log = data.logs[i], dateTime = Date.parse(new Date(data.logs[i].datetime * 1000));
			data.logs[i].datetime = dateTime.toString("dd-MM-yyyy HH:mm:ss");
			data.logs[i].idx = (function(in_i){return in_i+1;})(y);
			y++;
		}
		data.logs = $.merge([], data.logs); //make sure log is set

		// interface of log-stuf like icons
		data.typeicon = getLogIcon;
		data.labeltype = getLogType;
		
		//render the sh!t
		var $output = $(Mustache.render(_template, data));

		//append it in the container
		$_container.append($output);

		//load/place the graphs
		var values = data.custom_uptime_ratio.split("-");
		values.push(data.all_time_uptime_ratio);
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
		var minutes = Math.floor(timeleft / 60);
		var seconds = timeleft % 60;
		$element.find('div').animate({ width: progressBarWidth }, 100).html(minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0'));

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
	if (data.stat === "fail") {
		$('#error').html("ERROR connecting to the API - " + data.error.message).show();
		console.error("<b>ERROR</b> connecting to the API - " + data.error.message);
	} else {
		$('#error').hide();
		for (var i=0; i<data.monitors.length; i++) {
			var listItem = data.monitors[i]; 
			myApp.dashboard.placeServer(listItem);
	   }

	}
}
