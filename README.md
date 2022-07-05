# ICU Connection Example

An simple example face/age recognition system, using the Innovative Technology Ltd [ICU Lite™](https://www.intelligent-identification.com/icu-lite) or [ICU Pro™](https://www.intelligent-identification.com/icu-pro) with the npm [icu-connect](https://www.npmjs.com/package/icu-connect) module

## Features

 - Node back end drives the ICU™ device via npm icu-connect module
 - Browser front end
 - Live stream capture
 - Enroll faces to local database

 <br />

## Useage
The ICU™ device needs to be set up in Local API mode. The user can chose SSL (https) connection or http and enter a security username and password on the 'Running Mode' tab on the device Web Config page. For example: http://192.168.137.8:3000 if the device usb-ethernet connection us is being used.
```

git clone https://github.com/inn-tech/icu-connect-example-node.git

cd icu-connect-example-node
npm install
npm start

# open a browser http://localhost:3030

```


