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
var gRouteLeg;

var curStep = 0;

var countSteps = false;

var map; // gmaps map
var waypointMarker; // gmaps marker
var userMarker;

var bleList = [];
var bleDevice;

var touchScroll = function( event ) {
    event.preventDefault();
};

var body = document.body,
overlay = document.querySelector('.overlay');

$( document ).on( "pageinit", "#home-page", function() {
	$("#left-panel").panel().enhanceWithin();	// init global panel before start
	$("#overlay").hide();		// hide the overlay at start
	
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

function onWaypointButton() {
	curStep = 0;
	countSteps = false;
	var input = String(document.getElementById("waypointInput").value);
	
	// check if input are coordinates
	if (!representsCoordinates(input)) {
		alert("No coordinates in textfield...");
		return;
	}
		
	var coords = parseCoordinateText(input);
	setNextWaypoint(coords);
}

function onRouteButton() {
	curStep = 0;
	countSteps = true;
	var request = createDirectionsRequest(deviceLocation);
	
	alert(request);
	
	$.getJSON(request, function(data) {
		gRouteLeg = data.routes[0].legs[0];
		
		var coords = new Object();
		coords.str = gRouteLeg.steps[0].html_instructions;
		coords.latitude = gRouteLeg.steps[0].end_location.lat;
		coords.longitude = gRouteLeg.steps[0].end_location.lng;
		
		setNextWaypoint(coords);
	});
}

function scanButton() {
	$('#ble-scan-button').hide();
	scanBluetooth();
    setTimeout(function() {
        $('#ble-scan-button').show();
    }, 5000);
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
        	
        	// update route variables in compass
        	setInterval(updateRouteInfo, 100);
        	
        	// update compass
        	setInterval(updateCompass, 50);
        	
        	// update waypoint on compass
        	setInterval(updateWaypointSign, 50);
        	
        	// if connected with ble, vibrate accordingly
        	setInterval(bleVibrate, 1000);
  
        	// update home html
        	setInterval(homeStatusUpdate, 2000);
        	
        	// update map
        	setInterval(updateGmap, 500);
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

function updateGmap() {
	var gposWaypoint = { lat: nextWaypoint.latitude, lng: nextWaypoint.longitude };
	waypointMarker.setPosition(gposWaypoint);
	
	var gposUser = { lat: deviceLocation.latitude, lng: deviceLocation.longitude };
	userMarker.setPosition(gposUser);
}

function scanBluetooth() {
	$('#ble-devices-list').empty();
	bleList = [];
	
	ble.isEnabled(function success() {
		ble.scan([], 5, function(device) {
			device.compatible = true;	// TODO TEST HERE!
			bleList.push(device);
			
			document.getElementById("ble-devices-list").appendChild(createBLListElement(device));
			// $('#ble-devices-list').append(li);
		}, false);
	}, function failure() {
		alert("Enable bluetooth!");
	});
}

function handleBLConnect(clickedIndex) {
	var select = $('#ble-devices-list').children()[clickedIndex];
	
	var conDevice = bleList[clickedIndex];
	
	ble.isConnected(conDevice.id, function success() {
		// already connected, then disconnect...
		ble.disconnect(conDevice.id, function success() {
			// revoking style changes
			select.removeChild(select.lastChild);
		}, function failure() {
			alert("Could not disconnect... Retry!");
		})
	}, function failure() {
		// not connected, then connect to the device if its compatible!
		ble.connect(conDevice.id, function success(device) {
			// now connected to device, style changes to node
			var connectedMessage = document.createElement("p");
			connectedMessage.appendChild(document.createTextNode("CONNECTED!"));

			select.appendChild(connectedMessage);
			// TODO -> CONNECT TO DEVICE !!!
			bleDevice = conDevice;
		}, function failure() {
			// connection failure
			alert("Could not connect to device!");
		})
	});
}

function debug() {
}

// sending vibration signals to bleDevice !
function sendVibration() {
	
}

function buttonClick() {
	// Test...
	alert("abc");
}

function foundBT(device) {
	alert(device.name)
}

function notFound() {
	alert("nothin found")
}