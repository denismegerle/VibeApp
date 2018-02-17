var VIB_SERVICE	       	= "713D0000-503E-4C75-BA94-3148F18D941E";
var VIB_CHARACTERISTIC	= "713D0003-503E-4C75-BA94-3148F18D941E";

var data = new Uint8Array(5);
var pre_data = new Uint8Array(5);
var vibrate = new Uint8Array(5);

var bleList = [];
var bleDevice;

function createBLListElement(device) {
	var li = document.createElement("li");
	
	var devName = document.createElement("h2");
	devName.appendChild(document.createTextNode(device.name));
	
	var devId = document.createElement("p");
	var devIdIn = document.createElement("strong");
	devIdIn.appendChild(document.createTextNode(device.id));
	devId.appendChild(devIdIn);
	
	var devCompatible = document.createElement("p");
	devCompatible.appendChild(document.createTextNode("compatible: " + device.compatible));
	
	var devRSSI = document.createElement("p");
	devRSSI.setAttribute('class', 'ui-li-aside');
	var devRSSIIn = document.createElement("strong");
	devRSSIIn.appendChild(document.createTextNode(device.rssi));
	devRSSI.appendChild(devRSSIIn);
	
	li.appendChild(devName);
	li.appendChild(devId);
	li.appendChild(devCompatible);
	li.appendChild(devRSSI);
	
	return li;
}

function bleVibrate() {
	ble.isConnected(bleDevice.id, function() {
		// connected, send vibration signals
		prepareData(userGoDir);
		ble.writeWithoutResponse(bleDevice.id, VIB_SERVICE, VIB_CHARACTERISTIC, data.buffer, writeDone, writeFailure);
	}, function() {
		// not connected, do nothing
	});
}



function prepareData(dir) {
	vibrate[0] = (dir > getBoundary(0, -1) || dir < getBoundary(0, 1)) ? 1 : 0;
	for (var i = 1; i < 5; i++) {
		var leftBoundary = getBoundary(i, -1);
		var rightBoundary = getBoundary(i, 1);
		vibrate[i] = (dir > leftBoundary && dir < rightBoundary) ? 1 : 0;
	}
	
	distanceScale = 1.0;
	
	if (isNumber(nextWaypoint.dist))
		distanceScale = getDistanceScale(nextWaypoint.dist);
	
	for (var i = 0; i < 5; i++) {
		data[i] = vibrate[i] * distanceScale * 0xff;
	}
}

function getDistanceScale(distance) {
	return 1.0;	// TODO remove...
	if (distance < 0) return 1.0;
	if (distance > 100) return 0.6;
	
	return (- 3 * 1000) * distance + 1.0; 
}

function getBoundary(positionNumber, side) {
	return (side == -1) ? mod(positionNumber * 72 - (2 / 3) * 72, 360) : mod(positionNumber * 72 + (2 / 3) * 72, 360);
}


//Callback when write is done.
function writeDone() {
}

// Callback when write fails.
function writeFailure() {
}

function scanBluetooth() {
	$('#ble-devices-list').empty();
	bleList = [];
	
	ble.isEnabled(function success() {
		ble.scan([], 5, function(device) {
			device.compatible = isDeviceCompatible(device);
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

function isDeviceCompatible(device) {
	if (device.name)
		return device.name.toUpperCase().indexOf("TECO WEARABLE") !== -1;
	return false;
}