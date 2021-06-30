sap.ui.define([], 
    function () {
	"use strict";

	return {

        getTiming: function(time1, time2) {
            if(time1 && time2) {
                if (parseInt(time2) > 12) {
                    time2 = parseInt(time2) - 12;
                }
                var timing = parseInt(time1)+ ":00 AM - " + parseInt(time2) + ":00 PM";
                return timing;
            }
        }

	};
});