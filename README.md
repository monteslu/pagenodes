# Pagenodes

[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/monteslu/pagenodes?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

You can check out a working example of pagenodes [here](https://pagenodes.com 'pagenodes').  Pagenodes is an in-browser fork of [node-red](http://www.node-red.org 'node-red').  It requires no back-end server and is 100% browser-based.  If you are going to host this, many modules will need to be hosted via https, or you can run it locally for full functionality.

Pagenodes is currently in a heavy state of development, and we are working on a roadmap to follow for future implementations.  In its current form it offers a large amount of functionality with very little set up.

## Overview

With pagenodes our goal is to give the user a simple, browser-based IOT network.  This gives the development of the workflow to the user without relying on a third party network.  Basic functionality can be as simple as relaying an image from the camera to Chrome notification center, scaling up to allowing a robotics protocol like [johnny5](http://johnny-five.io 'johnny5') the ability to control robotics via the web-browser.

## Install

```
git clone git@github.com:monteslu/pagenodes.git
cd pagenodes
npm install
npm run build
```

## Running Locally

```
npm run build
npm run start
```

This will open up a webserver locally with ecstatic on port `1337`.

## Requirements For Bluetooth Low Energy(BLE) Control

[Click here](https://github.com/WebBluetoothCG/web-bluetooth/blob/gh-pages/implementation-status.md#chrome "requirements") to see what is currently supported for the BLE nodes in pagenodes.  Currently bluetooth is enabled for Chrome OS only, but other browsers are working to implement them as well.  This site has a list of devices currently compatible.

## Setting Up A Basic Flow

Setting up a simple flow with pagenodes is pretty easy.  The UI is the standard drag and drop interface from node-red, however we implement a range of new functionality.

**Setting up a timestamp delivery** 

1. Drag the inject tab from the left column onto the sheet.
2. Drag the debug tab onto the sheet.
3. Click and drag from the node on the right side of the 'timestamp' module to the node on the left hand side of the 'msg.payload' module.  The flow should look like this:
    ![base flow](http://snag.gy/2SkBF.jpg)
4. Next Click on the ![deploy](http://snag.gy/sIIGx.jpg) button to start the flow.  Any time there is a change to the flow you must re-deploy.
5. Click the grey square to the left of the timestamp node in order to activate it.  You can switch to the debug panel on the right side of the screen in order to see the actual results!

Almost all of the nodes in the left column will have a small readme in the info tab explaining how they work.

This will give you the base functionality need in order to learn how the nodes work!

## Credits & Contributors

* [Node-Red Team](https://github.com/node-red/node-red 'node-red team')
* [Iced Dev](http://www.iceddev.com 'Iced Dev')

## Copyright & License

Copyright 2013, 2015 IBM Corp. under [the Apache 2.0 license](https://github.com/node-red/node-red/blob/master/LICENSE 'Apache 2.0 license').

