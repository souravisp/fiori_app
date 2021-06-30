sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV",
	"sap/m/MessageBox"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, Filter, FilterOperator, MessageToast, Export, ExportTypeCSV, MessageBox) {
		"use strict";

		return Controller.extend("cowin.cowin.controller.View2", {
			onInit: function () {
                this.oRouter = this.getOwnerComponent().getRouter();
				this.oRouter.getRoute("View2").attachMatched(this._onRouteMatched, this);
			},
			_onRouteMatched: function(oEvent) {
				
				var that = this;
				var oModel = this.getOwnerComponent().getModel("local").getProperty("/center_data");
				if(!oModel) {
					var district_Id = oEvent.getParameter("arguments").distict_Id;
					var sDate = oEvent.getParameter("arguments").date;					
					if(district_Id.length < 6) {
						this.getDataAccDistId(district_Id, sDate);
					}else {
						
						this.getDataAccPincode(district_Id, sDate);
					}
					this.getStateList();
				}else{
					this.getDataForTile(oModel);
					this.getChartData(oModel);
				}
				this.getView().getModel("local").setProperty("/districts", []);
			},
			getDataAccPincode: function(district_Id, sDate) {
				var that = this;
				$.ajax("https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode="+district_Id+"&date="+sDate, {
					type: 'GET',
					success: function(data) {
						
						if(data.sessions.length === 0) {
							MessageToast.show("No vaccination data available for selected area");
						}else{
							that.getOwnerComponent().getModel("local").setProperty("/center_data", data.sessions);
						}
						that.getDataForTile(data.sessions);
						that.getChartData(data.sessions);
					},
					error: function(oErr) {
						
					}
				});
			},
			getDataAccDistId: function(district_Id, sDate) {
				var that = this;
				$.ajax("https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id="+district_Id+"&date="+sDate, {
					type: 'GET',
					success: function(data) {
						
						if(data.sessions.length === 0) {
							MessageToast.show("No vaccination data available for selected area");
						}else{
							that.getOwnerComponent().getModel("local").setProperty("/center_data", data.sessions);
						}
						that.getDataForTile(data.sessions);
						that.getChartData(data.sessions);								
					},
					error: function(oErr) {
						
					}
				});
			},
			getStateList: function() {
				var that = this;
				$.ajax("https://cdn-api.co-vin.in/api/v2/admin/location/states", {
					type: 'GET',
					success: function(data) {
						that.getOwnerComponent().getModel("local").setProperty("/states", data.states);
					},
					error: function(oErr) {
					}
				});
			},
			onBack: function() {
				this.oRouter.navTo("Main");
			},
			getDataForTile: function(sessionData) {
				var total_center = sessionData.length;
				var city_name = sessionData[0].district_name;
				var state_name = sessionData[0].state_name;

				var oTileData = {
					"total_centers": total_center,
					"city": city_name,
					"state": state_name
				}
				this.getView().getModel("local").setProperty("/TileData", oTileData);
			},
			getChartData: function(sessionData) {
				var Total = sessionData.length;
				var covishield = 0;
				var covaxin = 0;
				var sputnik = 0;
				// var vaccines = ["COVISHIELD", "COVAXIN", "SPUTNIK"];
				$.each(sessionData, function(Item, Value) {
					if(Value.vaccine === "COVISHIELD") {
						covishield += 1;
					} else if(Value.vaccine === "COVAXIN") {
						covaxin += 1;
					}else {
						sputnik += 1;
					}
				});

				var oChartModel = [
					{
						"vaccine": "Covishield",
						"value": covishield,
						"percentage": parseFloat(((covishield/Total)*100).toFixed(2))
					},
					{
						"vaccine": "Covaxin",
						"value": covaxin,
						"percentage": parseFloat(((covaxin/Total)*100).toFixed(2))
					},
					{
						"vaccine": "Sputnik V",
						"value": sputnik,
						"percentage": parseFloat(((sputnik/Total)*100).toFixed(2))
					}];
				
				this.getView().getModel("local").setProperty("/ChartData", oChartModel);
				
				var age45 = 0;
				var age18 = 0;
				$.each(sessionData, function(Item, Value) {
					if(Value.min_age_limit === 45) {
						age45 += 1;
					}else {
						age18 += 1;
					}
				}); 
				var oAgeData = {
					"age18": age18,
					"age45": age45
				}
				this.getView().getModel("local").setProperty("/ageChartData", oAgeData);
			},
			onBarSelect: function(oEvent) {
				
				var selectedBars = oEvent.getParameter("selectedBars");
				var selectedLabel = oEvent.getParameter("bar").getProperty("label");
				var selectedId = oEvent.getParameter("bar").getId();
				var selected = oEvent.getParameter("selected");
				$.each(selectedBars, function(Item, Value){
					if(Value.sId !== selectedId){
						selectedBars[Item].setSelected(false);
					}
				});
				var oTable = this.getView().byId("centerDataTable");
				if(selectedLabel.includes("18") && selected) {
					 var oFilter  = new Filter("min_age_limit", FilterOperator.EQ, 18);
				}else if(selectedLabel.includes("18") && !selected) {
					var oFilter = [];
				}else if(selectedLabel.includes("45") && selected) {
					var oFilter  = new Filter("min_age_limit", FilterOperator.EQ, 45);
				}
				else {
					var oFilter  = [];
				}
				oTable.getBinding("items").filter(oFilter);
			},
			onDonutSelect: function(oEvent) {
				var selectedSegments = oEvent.getParameter("selectedSegments");
				var selectedLabel = oEvent.getParameter("segment").getProperty("label");
				var selectedId = oEvent.getParameter("segment").getId();
				var selected = oEvent.getParameter("selected");
				$.each(selectedSegments, function(Item, Value){
					if(Value.sId !== selectedId){
						selectedSegments[Item].setSelected(false);
					}
				});
				var oTable = this.getView().byId("centerDataTable");
				if(selectedLabel.includes("Covishield") && selected) {
					 var oFilter  = new Filter("vaccine", FilterOperator.Contains, selectedLabel);
				}else if(selectedLabel.includes("Covishield") && !selected) {
					var oFilter = [];
				}else if(selectedLabel.includes("Covaxin") && selected) {
					var oFilter  = new Filter("vaccine", FilterOperator.Contains, selectedLabel);
				}else if(selectedLabel.includes("Covaxin") && !selected) {
					var oFilter = [];
				}else if(selectedLabel.includes("Sputnik") && selected) {
					var oFilter  = new Filter("vaccine", FilterOperator.Contains, "SPUTNIK");
				}else {
					var oFilter  = [];
				}
				oTable.getBinding("items").filter(oFilter);
			},
			onDashStateChange: function(oEvent) {
				var that = this;
				this.getView().byId("dashCity").setSelectedKey("");
				var sKey = oEvent.getParameter("selectedItem").getKey();
				this.state_Id = sKey;
				$.ajax("https://cdn-api.co-vin.in/api/v2/admin/location/districts/"+ sKey, {
					type: 'GET',
					success: function(data) {
						
						that.getOwnerComponent().getModel("local").setProperty("/districts", data.districts);
					},
					error: function(oErr) {
						
					}
				});
			},
			onDashCityChange: function(oEvent) {
				var sKey = oEvent.getParameter("selectedItem").getKey();
				
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
				var sDate = day + "-" + month + "-" + year;

				this.getDataAccDistId(sKey, sDate);
			},
			onExcelExport: function(oEvent) {
				
				var sPath = oEvent.getSource().getParent().getParent().getBindingInfo("items").path;
				var oModelData = this.getView().getModel("local").getProperty(sPath);
				var oNewDataModel = [];
				$.each(oModelData, function(Item, Value) {
					var newModel = {
						"name" : Value.name,
						"min_age_limit":Value.min_age_limit,
						"vaccine": Value.vaccine,
						"available_capacity_dose1": Value.available_capacity_dose1,
						"available_capacity_dose2": Value.available_capacity_dose2,
						"block_name": Value.block_name,
						"pincode": Value.pincode
					}
					oNewDataModel.push(newModel);
				});
				this.getView().getModel("local").setProperty("/ExcelData", oNewDataModel);

				var oExport = new Export({
					exportType : new ExportTypeCSV({
						seperatorChar : ",",
						charset: "utf-8"
					}),

					models : this.getView().getModel("local"),

					rows : {
						path : '/ExcelData'
					},

					columns : [{
						name : "Center Name",
						template : {
							content : "{name}"
						}
					}, {
						name : "Age Group",
						template : {
							content : "{min_age_limit}"
						}
					}, {
						name : "Vaccine",
						template : {
							content : "{vaccine}"
						}
					}, {
						name : "Available Dose 1",
						template : {
							content : "{available_capacity_dose1}"
						}
					}, {
						name : "Available Dose 2",
						template : {
							content : "{available_capacity_dose2}"
						}
					}, {
						name : "Block Name",
						template : {
							content : "{block_name}"
						}
					}, {
						name : "Pincode",
						template : {
							content : "{pincode}"
						}
					}]
				});

				oExport.saveFile().catch(function(oError) {
					MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
				}).then(function() {
					oExport.destroy();
				});
			}
		});
	});
