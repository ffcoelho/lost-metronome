var timer = null;
var interval = 33;

self.onmessage = function(event) {
	if (event.data === "start") {
		timer = setInterval(function() {
			postMessage("tick");
		}, interval);
	} else if (event.data.interval) {
		interval = event.data.interval;
		if (timer) {
			clearInterval(timer);
			timer = setInterval(function() {
				postMessage("tick");
			},interval);
		}
	} else if (event.data === "stop") {
		clearInterval(timer);
		timer = null;
	}
};
