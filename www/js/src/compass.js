var nextWaypoint = {
	str: "N/A",
	latitude: "N/A",
	longitude: "N/A",
	dist: "N/A",
	dir: "N/A"
};

var deviceLocation = {
		str: "N/A",
		latitude: "N/A",
		longitude: "N/A"
};

var orientationAbsolute = {
	alpha: "N/A",
	beta: "N/A",
	gamma: "N/A"
};

var userGoDir = 0.0;

/**
 * Offset to correct orientation of the next waypoint sign.
 */
var correctionOffset = 45.0;

/**
 * Offset to correct the user phones orientation.
 */
var phoneModeOffset = 0.0;

/**
 * Distance in meters in which the waypoint is defined as reached.
 */
var reachDistance = 10.0;

/**
 * Setting the next waypoint to given coordinates globally.
 * 
 * @param {Object} coords containing latitude and longitude, str representation possible
 */
function setNextWaypoint(coords) {
	if (coords.latitude === null || coords.longitude === null)
		return;
	nextWaypoint.str = coords.str;
	nextWaypoint.latitude = coords.latitude;
	nextWaypoint.longitude = coords.longitude;
}

/**
 * Updates the distance and direction to the next waypoint according to eliptic 
 * mathematics.
 */
function updateNextWaypoint() {
	nextWaypoint.dist = airlineDistanceOf(deviceLocation.latitude, deviceLocation.longitude, nextWaypoint.latitude, nextWaypoint.longitude);
	nextWaypoint.dir = degreeBetween(deviceLocation.latitude, deviceLocation.longitude, nextWaypoint.latitude, nextWaypoint.longitude);
}

/**
 * Function is called when the next waypoint is reached. It updates the next
 * waypoint to the next waypoint in the given route.
 * Also gives haptic feedback if goal or next waypoint is reached.
 */
function reachedNextWaypoint() {
	if (curStep + 1 < gRouteLeg.steps.length) {
		curStep++;
		var coords = new Object();
		coords.str = gRouteLeg.steps[curStep].html_instructions;
		coords.latitude = gRouteLeg.steps[curStep].end_location.lat;
		coords.longitude = gRouteLeg.steps[curStep].end_location.lng;
		setNextWaypoint(coords);
		
		// TODO: haptic feedback if goal / nextwaypoint is reached
	}
}

/**
 * Updating the waypoint sign in the gui to point to the next waypoint location.
 */
function updateWaypointSign() {
   	var waypointDisc = document.getElementById("waypointsign-circle");
   	userGoDir = correctionOffset + orientationAbsolute.alpha - nextWaypoint.dir;
   	
   	waypointDisc.style.webkitTransform = "rotate("+ userGoDir +"deg)";
   	waypointDisc.style.MozTransform = "rotate("+ userGoDir +"deg)";
   	waypointDisc.style.transform = "rotate("+ userGoDir +"deg)";
}

/**
 * Updating the compass disc to rotate according to north and the current phone
 * mode (landscape / portrait)
 */
function updateCompass() {
	var compassdir = orientationAbsolute.alpha + phoneModeOffset;
	
	var compassDisc = document.getElementById("compassdisc");
      	compassDisc.style.webkitTransform = "rotate("+ compassdir +"deg)";
      	compassDisc.style.MozTransform = "rotate("+ compassdir +"deg)";
      	compassDisc.style.transform = "rotate("+ compassdir +"deg)";
}

/**
 * Updates the route information in the DOM. Also checks if next waypoint of the
 * route is already reached, in which case the reachedNextWaypoint method is 
 * called.
 */
function updateRouteInfo() {
	document.getElementById("console-dest").innerHTML = nextWaypoint.str;
	document.getElementById("console-nextwpcoords").innerHTML = nextWaypoint.latitude + "," + nextWaypoint.longitude;
	document.getElementById("console-nextwpdir").innerHTML = nextWaypoint.dir;
	document.getElementById("console-nextwpdist").innerHTML = nextWaypoint.dist;
	updateNextWaypoint();
	
	if (countSteps) {
		if (nextWaypoint.dist < reachDistance) {
			reachedNextWaypoint();
		}
	}
}