# Kiiroo Platform Server

The Kiiroo Desktop platform was a node.js application that acts as a
bridge between a web browser and Kiiroo devices. This was used in
Kiiroo's desktop software before the release of the FeelConnect mobile
app.

The platform server opens a webserver on localhost:6969, then listens
for XMLHttpRequests on that port.

Endpoints are as follows:

- /status 
  - Accessed via GET request. 
  - No parameters.
  - Returns a JSON block. Sample device status block included below.
  
```
{"connectedDeviceName":"ONYX"
"bluetoothAddress":"8CDE52B866B5"
"firmwareUpdateProgres":0
"remoteDevice":"not connected"
"devicestatus":"NORMAL"
"localDevice":"connected"
"previousdevice_connectionurl":"btspp://8CDE52B866B5:1;authenticate=false;encrypt=false;master=false"
"readOnlyMode":false
"streamToDeviceEnabled":true
"delay":0
"writeOnlyMode":false
"currentFW":"91"
"waitingforusbcable":true
"bluetoothOn":true
"previousdevice_name":"ONYX"
"uienabled":true
"newFWVersionAvailable":false
"previousdevice_bluetoothaddress":"8CDE52B866B5"
"statusCode":1}
```

- /senddata
  - Accessed via POST request.
  - Takes 2 parameters: Auth code (always 'DCPRS9PKW11AEHJFG7QT') and data (integer from 0-4)
  - Sets the position or speed of the toy
  
- /streamToDevice 
  - Accessed via GET request. 
  - Takes an "enabled" parameter (i.e. "/streamToDevice?enabled=true"). 
  - Usage unknown.
  
- /stopStreaming 
  - Accessed via POST request. 
  - No parameters
  - Usage unknown.
  
- /joinRoom 
  - Accessed via POST request. 
  - Takes 3 parameters: access token, auth token, and call code.
  - Usage unknown

- /connect
  - Accessed via POST request.
  - No parameters.
  - Usage unknown. Possibly connects to a device?

- /disconnect
  - Accessed via POST request.
  - No parameters.
  - Usage unknown. Possible disconnects from a device?
