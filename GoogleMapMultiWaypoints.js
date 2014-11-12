
var GMMW_directionsService;
var GMMW_allRoutes = []; // Store all objects that represent routes. 
/*
 * Each route object has:
 * start : String
 * end : String
 * waypoints : Array
 * directionsDisplay : DirectionsRenderer
 * directionResult : DirectionsResult
 */

var GMMW_allMarkers = [];
var GMMW_startMarkerImg;
var GMMW_endMarkerImg;


/**
 * 
 * @param inDirectionsService : DirectionsService. Required. google.maps.DirectionsService object.
 * @param inReq : Object. Required. An object that has the following fields: (supports most fields of DirectionsRequest and a few more optional fields)
 * 	origin : LatLng | String. Required. Start location of the whole route. 
 * 	destination : LatLng | String. Required. End locaiton of the whole route. 
 * 	waypoints : Array. Required (otherwise no point of using this library :)). 
 * 	travelMode : TravelMode. Optional. TODO to be implemented
 * 	unitSystem: UnitSystem. Optional. TODO to be implemented
 * 	durationInTraffic: Boolean. Optional. TODO to be implemented
 * 	optimizeWaypoints: Boolean. Optional. TODO to be implemented
 * 	provideRouteAlternatives: Boolean. Optional. TODO to be implemented
 * 	avoidHighways: Boolean. Optional. TODO to be implemented
 * 	avoidTolls: Boolean. Optional. TODO to be implemented
 * 	region: String. Optional. TODO to be implemented
 * @param inStartIcon : String. Optional.
 * @param inEndIcon : String. Optional.
 * 
 * (transitOptions: TransitOptions) is disabled because "Waypoints are not supported for transit directions" - Directions Service[1]. 
 * [1] For how to use Google Map JavaScript API v3 Directions Service, see https://developers.google.com/maps/documentation/javascript/directions
 */
function calcRoute(inDirectionsService, inReq, inStartIcon, inEndIcon) {
	// clean up all the previous objects on the map.
	if (GMMW_allRoutes.length != 0) {
		GMMW_allRoutes.forEach(function(route) {
			route.directionsDisplay.setMap(null);
		});
		GMMW_allRoutes = [];
	}
	if (GMMW_allMarkers.length != 0) {
		GMMW_allMarkers.forEach(function(marker) {
			marker.setMap(null);
		});
		GMMW_allMarkers = [];
	}
	// finish cleaning up.
	
	GMMW_directionsService = inDirectionsService;
	var origin = inReq.origin;
	var end = inReq.destination;
	var waypoints = inReq.waypoints;
//	var travelMode = inReq.travelMode;
//	var unitSystem = inReq.unitSystem;
//	var durationInTraffic = inReq.durationInTraffic;
//	var optimizeWaypoints = inReq.optimizeWaypoints;
//	var provideRouteAlternatives = inReq.provideRouteAlternatives;
//	var avoidHighways = inReq.avoidHighways;
//	var avoidTolls = inReq.avoidTolls;
//	var region = inReq.region;
	
	if (inStartIcon) {
		GMMW_startMarkerImg = inStartIcon;
	} 
	
	if (inEndIcon) {
		GMMW_endMarkerImg = inEndIcon;
	}
	
	if (!waypoints) {
		waypoints = [];
	}
	
	waypoints.splice(0, 0, origin); // NOTE: we use SPLICE here, not SLICE
	waypoints.push(end);
	
	var noOfWPs = waypoints.length;
	var currRouteWP;
	var isStartingRoute = true;
	while (noOfWPs > 10) {
		var currRouteStart = waypoints[0];
		var currRouteEnd = waypoints[9];
		currRouteWP = waypoints.slice(1, 9); // NOTE: we use SLICE here, not SPLICE.
		
		waypoints.splice(0, 9); // NOTE: we use SPLICE here, not SLICE.
		noOfWPs = waypoints.length;
		
		// run query
		if (isStartingRoute) {
			queryRoute (currRouteStart, currRouteEnd, currRouteWP, true, false);
			isStartingRoute = false;
		} else {
			queryRoute (currRouteStart, currRouteEnd, currRouteWP, false, false);
		}
	}
	
	// Construct the last route
	var currRouteStart = waypoints[0];
	var currRouteEnd = waypoints[waypoints.length - 1];
	if (waypoints.length > 2) {
		currRouteWP = waypoints.splice(1, waypoints.length - 2);
	} else {
		currRouteWP = null;
	}
	
	// run query
	if (isStartingRoute) {
		queryRoute (currRouteStart, currRouteEnd, currRouteWP, true, true);
		isStartingRoute = false;
	} else {
		queryRoute (currRouteStart, currRouteEnd, currRouteWP, false, true);
	}
	return;
}


/*
 * isStart is used to determine if the route is the starting route.
 * isEnd is used to determine if the route is the last route. So the end point marker can be displayed accordingly. 
 */
function queryRoute (start, end, waypoints, isStart, isEnd) {
	var routeObj = {
			start : start,
			end : end,
			waypoints : waypoints,
			directionsDisplay : null,
			directionResult : null
	}
	GMMW_allRoutes.push(routeObj);
	
	var request; 
	
	if (waypoints) {
		var waypts = new Array();
		for (var i = 0; i < waypoints.length; i++) {
			waypts.push({
				location:waypoints[i],
				stopover:true});
		}
		request = {
				origin: start,
				destination: end,
				waypoints: waypts,
				optimizeWaypoints: true,
				travelMode: google.maps.TravelMode.DRIVING
		};
	} else {
		request = {
				origin: start,
				destination: end,
				travelMode: google.maps.TravelMode.DRIVING
		};
	}
	
	// Need to create a DirectionsRenderer for each route.
	var directionsDisplay = new google.maps.DirectionsRenderer();
	directionsDisplay.setMap(map);
	routeObj.directionsDisplay = directionsDisplay;
	
	GMMW_directionsService.route(request, function(response, status) {// return: DirectionsResult and a DirectionsStatus
		routeObj.directionResult = response;
		if (status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(response); // directionDisplay:DirectionsRenderer
			var directionRendererOptions = {
					draggable: true,
					suppressMarkers: true
			};
			directionsDisplay.setOptions(directionRendererOptions);
			
			var routeLegs = response.routes[0].legs;
			var routeLegsLen = routeLegs.length;
			
			// set overall route's start marker:
			if (isStart) {
				var startLeg = routeLegs[0];
				putMarker(startLeg.start_location.lat(), startLeg.start_location.lng(), GMMW_startMarkerImg);
			}
			
			// Set overall route's end marker:
			if (isEnd) {
				routeLegsLen--;
				var lastLeg = routeLegs[routeLegsLen];
				putMarker(lastLeg.end_location.lat(), lastLeg.end_location.lng(), GMMW_endMarkerImg);
			}
			
			for (var i = 0; i < routeLegsLen; i++) {
				var leg = routeLegs[i];
				// put marker on leg start address
				putMarker(leg.end_location.lat(), leg.end_location.lng());
			}
			
		} else {
			// error
			console.log(google.maps.DirectionsStatus);
		}
	});
}


/*
 * You can manipulate the markers here.
 */
function putMarker(lat, lon, icon){
	var myLatlng = new google.maps.LatLng(lat, lon);
	var marker;
	if (icon) {
		marker = new google.maps.Marker({
		    position: myLatlng,
		    map: map,
		    icon: icon
		});
	} else {
		marker = new google.maps.Marker({
		    position: myLatlng,
		    map: map
		});
	}
	GMMW_allMarkers.push(marker); // for clean-up purpose.
}
