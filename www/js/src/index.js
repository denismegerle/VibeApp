/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/** Controllable intervals and interval times used in functions */
var routeInfoInterval;
var waypointSignInterval;
var bleVibrateInterval;

var ROUTEINFO_TIME = 100;
var WAYPOINTSIGN_TIME = 50;
var BLEVIBRATE_TIME = 1000;
var HOMESTATUS_TIME = 500;
var UPDATECOMPASS_TIME = 50;
var UPDATEGMAP_TIME = 500;

//various init stuff...
var touchScroll = function( event ) {
    event.preventDefault();
};

$( document ).on( "pageinit", "#home-page", function() {
	$("#left-panel").panel().enhanceWithin();	// init global panel before start
	$("#overlay").hide();						// hide the overlay at start
	
	// open left panel by swiping
    $( document ).on( "swipeleft swiperight", "#home-page,#map-page,#conn-page,#comp-page", function( e ) {
        if ( $.mobile.activePage.jqmData( "panel" ) !== "open" ) {
            if ( e.type === "swiperight" ) {
                $( "#left-panel" ).panel( "open" );
            }
        }
    });
    
    // overlaying if panel is closed, no overlay if its open...
    $("#left-panel").on("panelbeforeopen",function(){
    	$("#overlay").show();
    });
    
    $("#left-panel").on("panelbeforeclose",function(){
        $("#overlay").hide();
    });
    
    $('#ble-devices-list').on('click', 'li', function () {
    	var clickedIndex = $(this).index();
    	handleBLConnect(clickedIndex);
    });
});

/**
 * Turns position of textfield into usable variables, then calculates a path
 * and updates compass sign accordingly.
 */
function onWaypointButton() {
	// ... and location is turned on. Rest not necessary
	if (!stati.geolocation) {
		alert("Your position is needed to calculate your path!");
		return;
	}
	
	var input = String(document.getElementById("waypointInput").value);
	
	// check if input are coordinates...
	if (!representsCoordinates(input)) {
		alert("No coordinates in textfield...");
		return;
	}
	
	curStep = 0;
	countSteps = false;
	
	setNextWaypoint(parseCoordinateText(input));
	startNavIntervals();
}

/**
 * Checks for all its needs in establishing a connection with gmaps directions
 * api, then retrieves the first route possible from the device location to the 
 * destination. If one is found, saves the path globally and starts routing.
 */
function onRouteButton() {
	if (!stati.internet) {
		alert("No internet. It is needed to retrieve your route!");
		return;
	}
	
	if (!stati.geolocation) {
		alert("Geolocation turned off or not precise enough. Your position is needed to calculate your path!");
		return;
	}
	
	var input = String(document.getElementById("waypointInput").value);
	var request = createDirectionsRequest(deviceLocation, parseInputToRequest(input));
	
	alert(request);	// TODO REMOVE, debug info
	
	$.getJSON(request, function(data) {
		if (!data || !data.route) return;
		if (data.status == "NOT_FOUND" || data.status == "ZERO_RESULTS") {
			alert("Route could not be found or zero results.");
			return;
		};
		if (!data.routes[0] || !data.routes[0].legs[0]) return;
		
		// just randomly picking the first available route for simplicity
		gRouteLeg = data.routes[0].legs[0];
		
		// data correct, start with the first waypoint now...
		curStep = 0;
		countSteps = true;
		
		var coords = new Object();
		coords.str = gRouteLeg.steps[0].html_instructions;
		coords.latitude = gRouteLeg.steps[0].end_location.lat;
		coords.longitude = gRouteLeg.steps[0].end_location.lng;
		
		setNextWaypoint(coords);
		startNavIntervals();
	});
}





// TODO next... -> if scan not possible then also dont hide the button...
function onScanButton() {
	$('#ble-scan-button').hide();
	scanBluetooth();
    setTimeout(function() {
        $('#ble-scan-button').show();
    }, 5000);
}

function startNavIntervals() {
	// update route variables in compass
	if (routeInfoInterval) clearInterval(routeInfoInterval);
	routeInfoInterval = setInterval(updateRouteInfo, ROUTEINFO_TIME);
	
	// update waypoint on compass
	if (waypointSignInterval) clearInterval(waypointSignInterval);
	waypointSignInterval = setInterval(updateWaypointSign, WAYPOINTSIGN_TIME);
	
	// if connected with ble, vibrate accordingly
	if (bleVibrateInterval) clearInterval(bleVibrateInterval);
	bleVibrateInterval = setInterval(bleVibrate, BLEVIBRATE_TIME);
}

var app = {
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', function() {
        	// update location all the time...
        	var locationWatchID = navigator.geolocation.watchPosition(function(position) {
        		deviceLocation.latitude = position.coords.latitude;
        		deviceLocation.longitude = position.coords.longitude;
        	}, function() {}, {enableHighAccuracy: true, frequency: 1 });
        	
        	// update device orientation constantly...
        	window.addEventListener("compassneedscalibration", function(event) {
     	       event.preventDefault();
        	}, true);
        	// update compass orientation data all the time...
        	window.addEventListener("deviceorientationabsolute", function(event) {
        		orientationAbsolute.alpha = event.alpha;
        		orientationAbsolute.beta = event.beta;
        		orientationAbsolute.gamma = event.gamma;
        	}, true);
        	// fixing (extremely) low response gmaps
        	google.maps.event.addListener(map, "idle", function(){
                google.maps.event.trigger(map, 'resize');
            });
        	
        	// update home html, compass and gmaps, no need to save
        	setInterval(homeStatusUpdate, HOMESTATUS_TIME);
        	setInterval(updateCompass, UPDATECOMPASS_TIME);
        	setInterval(updateGmap, UPDATEGMAP_TIME);
        }, false);
    },
    onDeviceReady: function() {
    	app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

/**
 * Calculates a % b correctly, this is not the remainder.
 * 
 * @param a {number}
 * @param b {number}
 * @returns {number} a % b
 */
function mod(a, b) { return ((a % b) + b) % b; }

/**
 * Checks whether n is a number and not NaN.
 * 
 * @param n {Object} to check
 * @returns {bool} whether it is a number or not
 */
function isNumber(n) { return !isNaN(parseFloat(n)) && !isNaN(n - 0) }

// TEST BUTTON...
function debug() {}