sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"cowin/cowin/model/formatter"
],
function (Controller, JSONModel, MessageToast, formatter) {
	"use strict";

	return Controller.extend("cowin.cowin.controller.Main", {
		formatter: formatter,
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("Main").attachMatched(this._onRouteMatched, this);	
			this.getOwnerComponent().getModel("local").setProperty("/dateValue", new Date());			
		},
		_onRouteMatched: function() {
			var that = this;
			$.ajax("https://cdn-api.co-vin.in/api/v2/admin/location/states", {
				type: 'GET',
				success: function(data) {
					// 
					that.getOwnerComponent().getModel("local").setProperty("/states", data.states);
				},
				error: function(oErr) {
					// 
				}
			});
			this.getAllIndiaCovidData();
		},
		getAllIndiaCovidData: function() {
			var that = this;
			$.ajax("https://api.cowin.gov.in/api/v1/reports/v2/getPublicReports?state_id=&district_id=", {
				type: 'GET',
				success: function(data) {
					
					that.getOwnerComponent().getModel("local").setProperty("/allIndia", data);
					that.getOwnerComponent().getModel("local").setProperty("/timeWiseDataToday", data.vaccinationDoneByTime);
					
				},
				error: function(oErr) {
					
					MessageToast.show("Failed to Load Data");
				}
			});
		},
		onBtnPress: function() {
			if(!this.district_Id){
				this.oRouter.navTo("View2", {
					distict_Id: this.pinCode_Id,
					date: this.to_date
				});
			}else {
				this.oRouter.navTo("View2", {
					distict_Id: this.district_Id,
					date: this.to_date
				});
			}
			
		},
		onPinChange: function(oEvent) {
			this.district_Id = null;
			this.getView().byId("dashboardBtn").setEnabled(false);
			this.getView().byId("stateSelect").setSelectedKey("");
			this.getView().byId("citySelect").setSelectedKey("");
			var sValue = oEvent.getParameter("value");
			if(sValue.includes("e") || sValue.length < 6 || sValue.length > 6){
				oEvent.getSource().setValueState("Error");
				oEvent.getSource().setValueStateText("Please enter correct pin");
			}else {
				oEvent.getSource().setValueState("None");
				oEvent.getSource().setValueStateText("");
			}
		},
		onRadioBtnSelect: function(oEvent) {
			var sIndex = oEvent.getParameter("selectedIndex");
			if (sIndex){
				
				this.getView().byId("pinBox").setVisible(false);
				this.getView().byId("cityBox").setVisible(true);
			}else {
				
				this.getView().byId("pinBox").setVisible(true);
				this.getView().byId("cityBox").setVisible(false);
			}
		},
		to_date:null,
		onSearch: function(oEvent) {
			var that = this;
			var sId = oEvent.getParameter("id");
			var sDate = this.getView().byId("idSelectedDate").getValue();
			if(this.getView().getModel("local").getProperty("/formData")) {
				this.getView().getModel("local").setProperty("/formData", []);
				this.getView().byId("dashboardBtn").setEnabled(false);
			}
			this.to_date = sDate;
			if(sDate === "" || sDate === undefined || sDate === null) {
				var Date1 = new Date();
				var day = Date1.getDate();
				if (day < 10) {
					day = "0" + day;
				}
				var month = Date1.getMonth() + 1;
				if (month < 10) {
					month = "0" + month;
				}
				var year = Date1.getFullYear();
				sDate = day + "-" + month + "-" + year;
			}
			if(sId.includes("cityButton")) {
				
				var oSelectedState = this.getView().byId("stateSelect").getSelectedItem();
				var oSelecetdCity = this.getView().byId("citySelect").getSelectedItem();
				if(!oSelecetdCity || !oSelectedState){
					this.getView().byId("citySelect").setValueState("Error");
					this.getView().byId("citySelect").setValueStateText("Please select correct city");
					this.getView().byId("stateSelect").setValueState("Error");
					this.getView().byId("stateSelect").setValueStateText("Please select correct state");
					return;
				}

				$.ajax("https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id="+this.district_Id+"&date="+sDate, {
					type: 'GET',
					success: function(data) {
						
						if(data.sessions.length === 0) {
							MessageToast.show("No vaccination data available");
							return;
						}else{
							that.getOwnerComponent().getModel("local").setProperty("/center_data", data.sessions);
						}
						that.getFormData(data);
						that.getView().byId("dashboardBtn").setEnabled(true);
						
					},
					error: function(oErr) {
						
					}
				});
				// https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=110001&date=31-03-2021
				// https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=332001&date=29-05-2021
			}else {
				
				var sPin = this.getView().byId("pinCode").getValue();
				this.pinCode_Id = sPin;
				$.ajax("https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode="+sPin+"&date="+sDate, {
					type: 'GET',
					success: function(data) {
						
						if(data.sessions.length === 0) {
							MessageToast.show("No vaccination data available");
							return;
						}else{
							that.getOwnerComponent().getModel("local").setProperty("/center_data", data.sessions);
						}
						that.getFormData(data);
						that.getView().byId("dashboardBtn").setEnabled(true);
					},
					error: function(oErr) {
						
					}
				});
			}
		},
		state_Id: null,
		district_Id: null,
		pinCode_Id: null,
		onStateSelect: function(oEvent) {
			
			var that = this;
			this.pinCode_Id = null;
			this.getView().byId("dashboardBtn").setEnabled(false);
			this.getView().byId("pinCode").setValue("");
			this.getView().byId("stateSelect").setValueState("None");
			var sKey = oEvent.getParameter("selectedItem").getKey();
			this.state_Id = sKey;
			sessionStorage.setItem("state_Id", sKey);
			this.getView().byId("citySelect").setSelectedKey("");
			$.ajax("https://cdn-api.co-vin.in/api/v2/admin/location/districts/"+ sKey, {
				type: 'GET',
				success: function(data) {
					
					that.getOwnerComponent().getModel("local").setProperty("/districts", data.districts);
				},
				error: function(oErr) {
					
				}
			});
			// this.getPublicReport(sKey);
		},
		
		onCitySelect: function(oEvent) {
			
			this.getView().byId("dashboardBtn").setEnabled(false);
			var sKey = oEvent.getParameter("selectedItem").getKey();
			this.district_Id = sKey;
			sessionStorage.setItem("district_Id", sKey);
			this.getView().byId("citySelect").setValueState("None");
			this.getView().byId("stateSelect").setValueState("None");
		},
		getFormData: function(data) {
			var totalCenter = data.sessions.length;
			var cityName = data.sessions[0].district_name;
			var stateName = data.sessions[0].state_name;
			var timing = this.formatter.getTiming(data.sessions[0].from, data.sessions[0].to);
			var oFormData = {
				"state_name": stateName,
				"city_name": cityName,
				"total_center": totalCenter,
				"timing": timing
			};
			this.getView().getModel("local").setProperty("/formData", oFormData);
		},
		getCountMillion: function(value) {
			if(value) {
				var countInMillion = value / 10000000;
				return countInMillion;
			}
		},
		getCountThousand: function(value) {
			if(value) {
				var countInThousand = value / 1000;
				return countInThousand;
			}
		}
	});
});
