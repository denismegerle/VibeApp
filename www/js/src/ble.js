var VIB_SERVICE	       	= "713D0000-503E-4C75-BA94-3148F18D941E";
var VIB_CHARACTERISTIC	= "713D0003-503E-4C75-BA94-3148F18D941E";

var data = new Uint8Array(5);
var vibrate = new Uint8Array(5);

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
	prepareData(10);
	alert(data[0] + " " + data[1] + " " + data[2] + " " + data[3] + " " + data[4]);
	ble.isConnected(bleDevice.id, function() {
		// connected, send vibration signals
		//updateDataBuffer();
		
		ble.writeWithoutResponse(bleDevice.id, VIB_SERVICE, VIB_CHARACTERISTIC, data.buffer, writeDone, writeFailure);
	}, function() {
		// not connected, do nothing
		
	});
}

function isNumber(n) { return !isNaN(parseFloat(n)) && !isNaN(n - 0) }

// data[0] am ahorn, gegen uhrzeigersinn
function updateDataBuffer() {
	if (userGoDir <= 0)
		return;
	
	data[0] = 0x00;
	data[1] = 0xff;
	data[2] = 0x00;
	data[3] = 0x00;
	data[4] = 0x00;
	
	var pd = projectDir(0);
	
	// links ist 318, im Uhrzeigersinn nehmen die Zahlen zu, ab und zu minus!
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
	return 2.0;
}

function getBoundary(positionNumber, side) {
	return (side == -1) ? mod(positionNumber * 72 - (2 / 3) * 72, 360) : mod(positionNumber * 72 + (2 / 3) * 72, 360);
}

function mod(a, b) {
	return ((a%b)+b)%b;
}

//Callback when write is done.
function writeDone() {
}

// Callback when write fails.
function writeFailure() {
}