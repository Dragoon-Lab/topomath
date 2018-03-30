define([
	"dojo/_base/declare"
], function(declare){
	return declare(null, {
		constructor: function(){},
		
		init: function(plotVariables){
			var paneText = "";
			if(plotVariables.length>0) {
				paneText += this.beginTable();
				paneText += this.setTableHeader();
				paneText += this.setTableContent();
				paneText += this.endTable();
			}else{
				//Error telling there are no nodes and Table cant be rendered
				paneText = "There is nothing to show in the table.	Please define some quantitites.";
			}
			this.tableTab.set("content", paneText);
		},

		/*
		 * @brief: function to begin table dom
		 */
		beginTable: function(){
			return "<div style='overflow:visible' align='center'>" + "<table class='solution' style='overflow:visible'>";
		},

		/*
		 * @brief: function to close table dom
		 */
		endTable: function(){
			return "</table>"+"</div>";
		},

		/*
		 * @brief: function to set headers of table
		 */
		setTableHeader: function(){
			var i, tableString = "";
			tableString += "<tr style='overflow:visible'>";
			//setup xunit (unit of timesteps)
			tableString += "<th style='overflow:visible'>" + this.labelString() + "</th>";
			array.forEach(this.activeSolution.plotVariables, function(id){
				tableString += "<th>" + this.labelString(id) + "</th>";
			}, this);
			tableString += "</tr>";
			return tableString;
		},

	});
});
