var map;
var directionsService = new google.maps.DirectionsService();

function initialize() {
	var chicago = new google.maps.LatLng(41.850033, -87.6500523);
	var mapOptions = {
			zoom: 6,
			center: chicago
	}
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
}

function run() {
	var start = document.getElementById('start').value;
	var end = document.getElementById('end').value;

	var checkboxArray = document.getElementById('waypoints');
	var waypointsArray = [];
	for (var i = 0; i < checkboxArray.length; i++) {
		if (checkboxArray.options[i].selected == true) {
			waypointsArray.push(checkboxArray[i].value);
		}
	}
	var reqest = {
			origin: start, 
			destination : end, 
			waypoints : waypointsArray
			};

	calcRoute(directionsService, reqest, null, null);
}


google.maps.event.addDomListener(window, 'load', initialize);