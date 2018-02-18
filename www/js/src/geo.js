var map; // gmaps map
var waypointMarker; // gmaps marker
var userMarker;

var gRouteLeg;

/**
 * Converting value to radians.
 * 
 * @param {number} value to convert in degrees
 * @returns {number} value in radians
 */
function toRad(value) {
    return value * Math.PI / 180;
}

/**
 * Converting value to degrees.
 * 
 * @param {number} value to convert in radians
 * @returns {number} value in degrees
 */
function toDeg(value) {
	return value * 180 / Math.PI;
}

/**
 * Calculates the airline distance from point 1 (lat1, long1) to
 * point 2 (lat2, long2).
 * 
 * @param {number} lat1 latitude of point 1
 * @param {number} long1 longitude of point 1
 * @param {number} lat2 latitude of point 2
 * @param {number} long2 longitude of point 2
 * @returns {number} airline distance in meters
 */
function airlineDistanceOf(lat1, long1, lat2, long2) {
	var eR = 6371e3; 					// earth radius in m
	var φ1 = toRad(lat1);
	var φ2 = toRad(lat2);
	var Δφ = toRad(lat2 - lat1);
	var Δλ = toRad(long2 - long1);

	var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
	        Math.cos(φ1) * Math.cos(φ2) *
	        Math.sin(Δλ/2) * Math.sin(Δλ/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	var d = eR * c;
	
	return d;
}

/**
 * Calculates the degree to walk on a round earth to reach point 2 from point 1.
 * 
 * @param {number} lat1 latitude of point 1
 * @param {number} long1 longitude of point 1
 * @param {number} lat2 latitude of point 2
 * @param {number} long2 longitude of point 2
 * @returns {number} degree point 1 to point 2 on a sphere
 */
function degreeBetween(lat1, long1, lat2, long2) {
	var φ1 = toRad(lat1);
	var φ2 = toRad(lat2);
	var Δφ = toRad(lat2 - lat1);
	var Δλ = toRad(long2 - long1);

    var y = Math.sin(Δλ) * Math.cos(φ2);
    var x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1)
            * Math.cos(φ2) * Math.cos(Δλ);

    var brng = Math.atan2(y, x);

    brng = toDeg(brng);
    brng = (brng + 360) % 360;
    brng = 360 - brng;
    return brng;
}

/**
 * Simply checking a string against regex to check for coordinates
 * 
 * @param {string} input any string
 * @returns {boolean} whether the input are coordinates in lat long or not
 */
function representsCoordinates(input) {
	var regexCoords = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
	var regexMatch = input.match(regexCoords);
	
	if (regexMatch !== null)
		return true;
	return false;
}

/**
 * Parsing coordinates when they are in the correct format.
 * 
 * @param {string} input coordinates in the format lat, long
 * @returns {Object} coords containing latitude, longitude and str representation
 */
function parseCoordinateText(input) {
	var strCoords = input.split(',');
	var coords = new Object();
	
	coords.str = input;
	coords.latitude = parseFloat(strCoords[0]);
	coords.longitude = parseFloat(strCoords[1]);
	
	return coords;
}

/**
 * Parsing an input to a webrequest, replacing ' ' with '+' for HTML.
 * 
 * @param {string} input the search term
 * @returns {string} a representation of the search term to be used in web requests
 */
function parseInputToRequest(input) {
	if (representsCoordinates(input))
		return input.replace(/ /g, '');
	return input.trim().replace(/ /g, '+');
}

/**
 * Creating a google directions request to retrieve the json containing the
 * route to a destination.
 * 
 * @param {string} deviceLocation the current device location
 * @param {string} destination the destintion of the route to be retrieved
 * @returns {string} the g directions request url matching location and dest
 */
function createDirectionsRequest(deviceLocation, destination) {
	var gmapsUrl = "https://maps.googleapis.com/maps/api/directions/",
		outputFormat = "json?";
		origin = "origin=" + deviceLocation.latitude + "," + deviceLocation.longitude,
		destination = "destination=" + destination,
		apikey = "key=" + "AIzaSyBsgaNK6czEQ-n3O0jLIPdcoy_8qsNGUhI",
		optional = "mode=" + "walking";
		parameters = origin + "&" + destination + "&" + apikey + "&" + optional;
	
	return gmapsUrl + outputFormat + parameters;
}

function updateGmap() {
	var gposWaypoint = { lat: nextWaypoint.latitude, lng: nextWaypoint.longitude };
	waypointMarker.setPosition(gposWaypoint);
	
	var gposUser = { lat: deviceLocation.latitude, lng: deviceLocation.longitude };
	userMarker.setPosition(gposUser);
}

function initMap() {
    var ka = {lat: 49.006, lng: 8.403};
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 9,
      center: ka
    });
    waypointMarker = new google.maps.Marker({
      position: ka,
      map: map
    });
    userMarker = new google.maps.Marker({
        position: ka,
        map: map,
        icon: 'http://www.robotwoods.com/dev/misc/bluecircle.png'
    });
}