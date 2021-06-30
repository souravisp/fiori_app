/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"cowin/cowin/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
