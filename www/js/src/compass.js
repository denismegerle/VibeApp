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

function setNextWaypoint(coords) {
	if (coords.latitude === null || coords.longitude === null)
		return;
	nextWaypoint.str = coords.str;
	nextWaypoint.latitude = coords.latitude;
	nextWaypoint.longitude = coords.longitude;
	
	var gpos = { lat: nextWaypoint.latitude, lng: nextWaypoint.longitude };
	marker.setMap(null);
	marker = new google.maps.Marker({
		position: gpos,
	    map: map
	});
	map.setCenter(gpos);
}

//updates next wp except actual lat/long!
function updateNextWaypoint() {
	nextWaypoint.dist = airlineDistanceOf(deviceLocation.latitude, deviceLocation.longitude, nextWaypoint.latitude, nextWaypoint.longitude);
	nextWaypoint.dir = degreeBetween(deviceLocation.latitude, deviceLocation.longitude, nextWaypoint.latitude, nextWaypoint.longitude);
}

function reachedNextWaypoint() {
	if (curStep + 1 < gRouteLeg.steps.length) {
		curStep++;
		var coords = new Object();
		coords.str = gRouteLeg.steps[curStep].html_instructions;
		coords.latitude = gRouteLeg.steps[curStep].end_location.lat;
		coords.longitude = gRouteLeg.steps[curStep].end_location.lng;
		setNextWaypoint(coords);
		
		// make green for a few secs or vibrate bluetooth device
	}
}

function updateWaypointSign() {
   	var waypointDisc = document.getElementById("waypointsign-circle");
   	var correctionOffset = 45.0;
   	var userGoDir = correctionOffset + orientationAbsolute.alpha - nextWaypoint.dir;
   	waypointDisc.style.webkitTransform = "rotate("+ userGoDir +"deg)";
   	waypointDisc.style.MozTransform = "rotate("+ userGoDir +"deg)";
   	waypointDisc.style.transform = "rotate("+ userGoDir +"deg)";
}

function updateCompass() {
	var compassdir = orientationAbsolute.alpha;
	
	document.getElementById("alphashow").innerHTML = Math.ceil(compassdir);
	var compassDisc = document.getElementById("compassdisc");
      	compassDisc.style.webkitTransform = "rotate("+ compassdir +"deg)";
      	compassDisc.style.MozTransform = "rotate("+ compassdir +"deg)";
      	compassDisc.style.transform = "rotate("+ compassdir +"deg)";
}

function updateRouteInfo() {
	document.getElementById("console-dest").innerHTML = nextWaypoint.str;
	document.getElementById("console-nextwpcoords").innerHTML = nextWaypoint.latitude + "," + nextWaypoint.longitude;
	document.getElementById("console-nextwpdir").innerHTML = nextWaypoint.dir;
	document.getElementById("console-nextwpdist").innerHTML = nextWaypoint.dist;
	updateNextWaypoint();
	
	if (countSteps) {
		if (nextWaypoint.dist < 50.0) {
			reachedNextWaypoint();
		}
	}
}