import {ConfigurationHandler, Feature} from "../js/configurationhandler.js";

import * as THREE from "../js/three.module.js";
import {OrbitControls} from "../js/OrbitControls.js";

import {ChartValue} from "../js/chartvalue.js";
import {ChartContent} from "../js/chartcontent.js";
import {LoggerBlock} from "../js/loggerblock.js";
import {ConnectionNode} from "../js/connectionnode.js";
import {ContentTag} from "../js/contenttag.js";
import {RaakeRequest} from "../js/raakerequest.js";
import {Datafile} from "../js/datafile.js";


class RestAPI {
    constructor(){
        this.request = undefined;
        this.requests = [];
        this.fileRequestInProgress = false;
        //this.loggerBlocks = new Map();
        //this.selectedLoggerBlock = undefined;
        this.connectionNodes = new Map();
        this.selectedConnectionNode = undefined;
        this.onlineDatafile = new Datafile("online");
        this.chartColorPalette = ["#0B84A5", "#F6C85F", "#6F4E7C", "#9DD866", "#CA472F", "#FFA056", "#8DDDD0"];
        var self = this;
        this.carouselImages = new Map();
        this.carouselTimestamps = [];
        this.carouselImageIndex = 0;
        setInterval(function () { self.timerEvent(self); },100);
        
        //For 3d chart
        this.camera = undefined;
        this.controls = undefined;
        this.scene = undefined;
        this.renderer = undefined;
    }

    timerEvent(self){
        if(self.request !== undefined){
            let timestamp = Date.now();
            let timeDifference = timestamp - self.request.timestamp;
            if(timeDifference > 5000){
                self.request = undefined;
                self.xmlHttpRequest = undefined;
            }
            //toDo cancel request
        }
        else{            
            if(self.requests.length > 0){
                self.request = self.requests.pop();
                self.makeRequest();
            }
            else{
                if(self.fileRequestInProgress){
                    //All requested files has been handled -> show values 
                    self.fileRequestInProgress = false;
                    this.showValues();
                }
                else{
                    let onlineTabElement = document.getElementById("onlineTab");
                    if(onlineTabElement !== null){
                    if(onlineTabElement.classList.contains("active")){
                        self.getDatagram();
                    }
                }
                }                
            }
        }       
        
    }

    makeRequest(){
        //let ipAddress = window.location.hostname;
        let ipAddressElement = document.getElementById("ipAddress");
        let portElement = document.getElementById("port");
        //let port = 8080;
        //if(this.selectedLoggerBlock !== undefined){    
        //    port = this.selectedLoggerBlock.apiPort;
        //}
        //ipAddressElement.value = ipAddress;
        //portElement.value = port;

        let ipAddress = ipAddressElement.value;
        let port = portElement.value;

        if(this.xmlHttpRequest === undefined ){
            this.xmlHttpRequest = new XMLHttpRequest();            

            if(ipAddress !== undefined && port !== undefined){
                let queryUrl = "http://" + ipAddress + ":" + port + this.request.request;
                var self = this;
                this.xmlHttpRequest.open('GET', queryUrl, true);
                if(this.request.responsetype.length > 0){
                    this.xmlHttpRequest.responseType = this.request.responsetype;
                }
                this.xmlHttpRequest.send(null);                
                this.xmlHttpRequest.onload = function () { self.requestReady(self); }
            }
            else{
                alert("ipAddress or port element not found");
            }
        }
    }

    requestReady(self){
        if(self.request !== undefined){
            if (self.xmlHttpRequest.readyState === 4 && self.xmlHttpRequest.status === 200) {
                let request = self.request.request;
                if(request.indexOf("/datafile?") >= 0){
                    self.handleDatafileResponse(self.xmlHttpRequest.response, self.request.resposedata);
                } 
                else if(request.indexOf("/datafiles?") >= 0){
                    self.handleDatafilesResponse(self.xmlHttpRequest.responseText);
                }
                else if(request.indexOf("/config") >= 0){
                    self.handleConfigResponse(self.xmlHttpRequest.responseText);
                }
                else if(request.indexOf("/datagram") >= 0){
                    self.handleDatagramResponse(self.xmlHttpRequest.response, self.request.resposedata);
                }
            }
            self.request = undefined;
            self.xmlHttpRequest = undefined;
        }
    }

    getConnectionNodes(){

    }

    connectionNodeChanged(){
        let connectionNodesElement = document.getElementById("connectionNodes");
        let contentTagListElement = document.getElementById("contentTagListElement");
        if(connectionNodesElement !== undefined && contentTagListElement !== undefined){
            contentTagListElement.innerHTML = "";
            
            let connectionNodeHierarchyUUID = connectionNodesElement.value;
            this.selectedConnectionNode = this.connectionNodes.get(connectionNodeHierarchyUUID);
            if(this.selectedConnectionNode  !== undefined){
                this.selectedConnectionNode.contentTags.forEach(contentTag =>{

                    let divElement = document.createElement("div");	
                    divElement.classList.add("form-check");                        

                    let inputElement = document.createElement("input");
                    inputElement.classList.add("form-check-input");	
                    inputElement.type = "checkbox";
                    inputElement.id = contentTag.hierarchy.hierarchyUUID;
                    

                    let labelElement = document.createElement("label");
                    labelElement.classList.add("form-check-label");	
                    labelElement.appendChild(document.createTextNode(contentTag.hierarchy.name));
                    labelElement.for = contentTag.hierarchy.hierarchyUUID;							
                    
                    divElement.appendChild(inputElement);
                    divElement.appendChild(labelElement);
                    contentTagListElement.appendChild(divElement);
                })
            }
        }
    }

    handleConfigResponse(resposeText) {
        this.connectionNodes = new Map();
        let connectionNodesElement = document.getElementById("connectionNodes");
        if(connectionNodesElement !== undefined){
            connectionNodesElement.innerHTML = "";
            this.configurationHandler = new ConfigurationHandler(resposeText);
            for(let i = 0; i < this.configurationHandler.Hierarchies.length; i++){
                let hierarchy = this.configurationHandler.Hierarchies[i];

                if(hierarchy.thing !== undefined){
                    let connectionNodeFeature = hierarchy.thing.GetFeature("ThingType", "ConnectionNode");
                    if(connectionNodeFeature != undefined){ 
                        let connectionNode = new ConnectionNode(hierarchy);
                        this.connectionNodes.set(hierarchy.thing.thingUUID, connectionNode);

                        let connectionNodeOptionElement = document.createElement("option");
                        connectionNodeOptionElement.value = hierarchy.thing.thingUUID;
                        connectionNodeOptionElement.appendChild(document.createTextNode(hierarchy.name));
                        connectionNodesElement.appendChild(connectionNodeOptionElement);                       
                    }
                }
            }
            this.connectionNodeChanged();  
        }
        else{
            alert("thingList element not found");
        }
    }

    handleDatafilesResponse(resposeText){
        let uuid = parseXMLTagContent(resposeText, "<uuid>", "</uuid>");
        if(this.selectedConnectionNode.hierarchy.hierarchyUUID === uuid){
            let newDatafiles = false;
            let datafilesContent = parseXMLTagContent(resposeText, "<datafiles>", "</datafiles>");
            if(datafilesContent.length > 0){
                let datafilesContents = datafilesContent.split(",");
                for(let i = 0; i < datafilesContents.length; i++){
                    if(!this.selectedConnectionNode.datafiles.has(datafilesContents[i])){
                        this.selectedConnectionNode.datafiles.set(datafilesContents[i], new Datafile(datafilesContents[i]));
                        newDatafiles = true;
                    }
                }
            }

            if(!newDatafiles){
                this.fileRequestInProgress = true;
            }
        }
        
        this.getDatafileContents();
    }

    handleDatafileResponse(response, datafile){
        this.fileRequestInProgress = true;
        let bytearray = new Uint8Array(response);
        datafile.AddDatagrams(bytearray);
    }

    handleDatagramResponse(response, uuid){
        if(this.selectedConnectionNode !== undefined && this.selectedConnectionNode.hierarchy.hierarchyUUID == uuid){
            this.selectedConnectionNode.handleDatagramResponse(response);
            this.showOnline();
        }       
    }
  
    getIMoT() {
        let configRequest = new RaakeRequest("/config","","", "GET");
        this.requests.push(configRequest);  
    }

    getDatafiles(uuid, starttimestamp, endtimestamp){
        let queryUrl = "/datafiles?uuid=" + uuid + "&starttime=" + starttimestamp + "&endtime=" + endtimestamp;
        let datafilesRequest = new RaakeRequest(queryUrl, "", "");
        this.requests.push(datafilesRequest); 
    }

    getDatafileContents(){
        if(this.selectedConnectionNode !== undefined){
            for(let[key, value] of this.selectedConnectionNode.datafiles){
                if(key.endsWith("9999999999000") || value.datagrams.size == 0){
                    let request = "/datafile?uuid=" + this.selectedConnectionNode.hierarchy.hierarchyUUID + "&filename=" + value.filename;
                    let raakeRequest = new RaakeRequest(request, "arraybuffer", value);
                    this.requests.push(raakeRequest);
                }
            }
        }
    }

    getDatagram(){
        if(this.selectedConnectionNode !== undefined){
            let requestUrl = "/datagram?uuid=" + this.selectedConnectionNode.hierarchy.hierarchyUUID;
            let datagramRequest = new RaakeRequest(requestUrl, "arraybuffer", this.selectedConnectionNode.hierarchy.hierarchyUUID);
            this.requests.push(datagramRequest);
        }
    }    

    getCheckedUUIDs(){
        let checkedUUIDs = [];
        var checkboxes = document.getElementsByClassName("form-check-input");
        for (let i = 0; i < checkboxes.length; i++) {
            if(checkboxes[i].checked === true){
                checkedUUIDs.push(checkboxes[i].id);
            }            
        }
        return checkedUUIDs;
    }

    getCheckedContentTags(){
        let checkedContentTags = [];
        if(this.selectedConnectionNode !== undefined){
            this.getCheckedUUIDs().forEach(uuid=>{
                let checkedContentTag = this.selectedConnectionNode.contentTags.get(uuid);
                if(checkedContentTag !== undefined){
                    checkedContentTags.push(checkedContentTag);
                }
            })
        }
        return checkedContentTags;
    }

    calculateChartValues(starttimestamp, endtimestamp, width, height){
        this.chartContents = new Map();
        if(this.selectedConnectionNode !== undefined){
            let checkedUUIDs = this.getCheckedUUIDs();
            let colorIndex = 0;
            for(let i = 0; i < checkedUUIDs.length; i++){
                let chartContent = new ChartContent(this.selectedConnectionNode.contentTags.get(checkedUUIDs[i]));
                chartContent.color = this.chartColorPalette[colorIndex];
                let values = new Map();

                this.selectedConnectionNode.datafiles.forEach((datafile) => {
                    for(let[key, value] of datafile.datagrams){
                        if(key >= starttimestamp && key <= endtimestamp){
                            let tagValue = chartContent.contentTag.Value(value, true);
                            chartContent.minValue = tagValue < chartContent.minValue ? tagValue : chartContent.minValue;
                            chartContent.maxValue = tagValue > chartContent.maxValue ? tagValue : chartContent.maxValue;
                            values.set(key,tagValue);
                        }                      
                    }
                });

                if(values.size > 1) {
                    let valuesCount = values.size;
                    let timestampStep = valuesCount / width;
                    let valueDifference = chartContent.maxValue !== chartContent.minValue ? chartContent.maxValue - chartContent.minValue : 1;
                    let yMarginal = height * 0.05;
                    let heightWithMarginal = height - (2 * yMarginal);
                    let yStep = heightWithMarginal / Number(valueDifference);
                    let y3DStep = 100 / Number(valueDifference);
                    let yOffset = height - (yMarginal + (yStep * - Number(chartContent.minValue)));
                    let y3DOffset = 50 - (y3DStep * - Number(chartContent.minValue));
                    let timestamps = Array.from(values.keys());
                    chartContent.yMin = height - yMarginal;
                    chartContent.yMax = yMarginal;

                    let chartValues = new Map();
                    for(let x = 0; x < width; x++){
                        let timestampIndex = parseInt(timestampStep * x);
                        let timestamp = timestamps[timestampIndex];
                        let value = values.get(timestamp);

                        let chartValue = new ChartValue();
                        chartValue.value = Number(value);
                        chartValue.x = x;
                        chartValue.y = yOffset - (yStep * chartValue.value);
                        chartValue.y3D = -(y3DOffset - (y3DStep * chartValue.value));                       
                        chartValue.color = chartContent.color;
                        chartValue.timestamp = timestamp;

                        chartContent.chartValues.set(x, chartValue);
                    }
                    this.chartContents.set(chartContent.contentTag, chartContent);
                }

                if(colorIndex >= this.chartColorPalette.length) {
                    colorIndex = 0;
                }
                else{
                    colorIndex++;
                }
            }
        }
    }
    
    excel(){
        let data = [];
        let contentvaluesElement = document.getElementById("contentValues");
        
        for (let i = 0; i < 1; i++) {
            var objCells = contentvaluesElement.rows.item(i).cells;
            let row = [];
            row.push({v: objCells.item(0).innerHTML, t:"t" });
            for (var j = 1; j < objCells.length; j++) {
                row.push({v: objCells.item(j).innerHTML, t:"s" });
            }
            data.push(row);
        }


        for (let i = 1; i < contentvaluesElement.rows.length; i++) {
            var objCells = contentvaluesElement.rows.item(i).cells;

            let row = [];
            row.push({v: objCells.item(0).innerHTML, t:"t" });
            for (var j = 1; j < objCells.length; j++) {
                row.push({v: objCells.item(j).innerHTML, t:"n" });
            }
            data.push(row);
        }
        
        var workbook = XLSX.utils.book_new();
        let worksheet = XLSX.utils.aoa_to_sheet(data);
        workbook.SheetNames.push(this.selectedLoggerBlock.hierarchy.name);
        workbook.Sheets[this.selectedLoggerBlock.hierarchy.name] = worksheet;

        XLSX.utils

        var xlsbin = XLSX.write(workbook, { bookType: "xlsx", type: "binary" });
        
        var buffer = new ArrayBuffer(xlsbin.length);
        var array = new Uint8Array(buffer);
        for (let i=0; i<xlsbin.length; i++) {
            array[i] = xlsbin.charCodeAt(i) & 0XFF;
        }
        var xlsblob = new Blob([buffer], {type:"application/octet-stream"});

        var url = window.URL.createObjectURL(xlsblob), anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "contenttags.xlsx";
        anchor.click();
        window.URL.revokeObjectURL(url);
    }

    

    refreshValues(){
        var chartDataElement = document.getElementById("chartData");
        chartDataElement.style.visibility = "hidden";

        if(this.selectedConnectionNode.connectionNodeType === "image"){
            $("#contentTabs li:eq(0) a").tab("show");
            document.getElementById("contentChartRefreshButtonSpinner").style.visibility = "visible";
            document.getElementById("contentChart3DRefreshButtonSpinner").style.visibility = "hidden";
            document.getElementById("contentTableRefreshButtonSpinner").style.visibility = "hidden";
        }
        else 
        if(this.selectedConnectionNode.connectionNodeType === "log"){
            $("#contentTabs li:eq(2) a").tab("show");
            document.getElementById("contentChartRefreshButtonSpinner").style.visibility = "hidden";
            document.getElementById("contentChart3DRefreshButtonSpinner").style.visibility = "hidden";
            document.getElementById("contentTableRefreshButtonSpinner").style.visibility = "visible";
        }


        let hasDoneNewRequests = this.getValues();
        if(!hasDoneNewRequests){
            this.showValues();
        }
    }

    
    showValues() {
        let chartTabElement = document.getElementById("chartTab");
        let chart3DTabElement = document.getElementById("chart3DTab");
        let tableTabElement = document.getElementById("tableTab");
        let onlineTabElement = document.getElementById("onlineTab");

        if(chartTabElement !== undefined && tableTabElement !== undefined && onlineTabElement !== undefined){
            if(chartTabElement.classList.contains("active")){
                if(this.selectedConnectionNode.connectionNodeType === "image"){
                    this.showImages();
                }
                else{
                    this.showChartValues();
                }
                
            }
            else if(chart3DTabElement.classList.contains("active")){
                this.show3DValues();
            }
            else if(tableTabElement.classList.contains("active")){
                this.showTableValue();
            }
            else if(onlineTabElement.classList.contains("active")){
                alert("online");
            }
        }
    }

    showImages(){
        let startdateElement = document.getElementById("startdate");
        let starttimeElement = document.getElementById("starttime");
        let enddateElement = document.getElementById("enddate");
        let endtimeElement = document.getElementById("endtime");
        let chartTabElement = document.getElementById("chartTab");    
        
        document.getElementById("contentChartRefreshButtonSpinner").style.visibility = "hidden";
      
        
        let timeZoneOffset = new Date().getTimezoneOffset() * 60000;

        if(startdateElement !== undefined && starttimeElement !== undefined && enddateElement !== undefined && endtimeElement != undefined
            && chartTabElement !== undefined){
            let starttimestamp =  startdateElement.valueAsNumber + starttimeElement.valueAsNumber + timeZoneOffset;
            let endtimestamp =  enddateElement.valueAsNumber + endtimeElement.valueAsNumber + timeZoneOffset;

            this.carouselTimestamps = [];
            this.carouselImages = new Map();
            this.selectedLoggerBlock.datafiles.forEach((datafile) => {
                for(let[key, value] of datafile.datagrams){                    
                    if(key >= starttimestamp && key <= endtimestamp){
                        this.carouselImages.set(key, value);
                        this.carouselTimestamps.push(key);
                    }                      
                }
            });
            if(this.carouselTimestamps.length > 0){
                //this.createCarouselCard();
                this.createThumbnails();
            }
        }
    }

    createThumbnails(){      
        let imageThumbnailsElement = document.getElementById("imageThumbnails");
        imageThumbnailsElement.innerHTML = "";
        imageThumbnailsElement.style.display = "block";

        let carouselImagesElement = document.getElementById("carouselImages");
        carouselImagesElement.style.display = "none";

        let canvas = document.getElementById("contentCanvas");
        canvas.style.display = "none";


        this.carouselTimestamps.forEach(timestamp =>{
            let datagram = this.carouselImages.get(timestamp);
            let contentTags = this.selectedLoggerBlock.GetContentTags(this.getCheckedUUIDs());
            contentTags.forEach(contentTag =>{
                var blob = new Blob( [ datagram ], { type: contentTag.valuetype} );
                var imageUrl = URL.createObjectURL( blob );
                
                var image = new Image();
                image.src = imageUrl;
                image.onload = function(){ 
                    // //Thumbnail <a href="#"><img src="https://source.unsplash.com/featured/?tree" alt=""></a>
                    // let thumbnailElement = document.createElement("a");
                    // thumbnailElement.setAttribute('href', "#");
                    // let thumbnailImageElement = document.createElement("img");
                    // thumbnailImageElement.setAttribute('src', imageUrl); 
                    // thumbnailElement.appendChild(thumbnailImageElement);
                    // imageThumbnailsElement.appendChild(thumbnailElement);  
                    //Card
                    let cardElement = document.createElement("div");
                    cardElement.classList.add("card");	
                    imageThumbnailsElement.appendChild(cardElement);  

                    //Card image
                    let cardImageElement = document.createElement("img");
                    cardImageElement.classList.add("card-img-top");	
                    cardImageElement.setAttribute('src', imageUrl); 
                    //cardImageElement.setAttribute('src', imageUrl); 
                    cardElement.appendChild(cardImageElement); 

                    //Card body
                    let cardBodyElement = document.createElement("div");
                    cardBodyElement.classList.add("card-body");	
                    cardElement.appendChild(cardBodyElement);
                    //Card Body Header
                    let cardBodyHeaderElement = document.createElement("h5");
                    cardBodyHeaderElement.classList.add("card-title");	
                    cardBodyHeaderElement.innerHTML = contentTag.hierarchy.name;
                    cardBodyElement.appendChild(cardBodyHeaderElement);
                    //Card Body Text
                    let cardBodyTextElement = document.createElement("p");
                    cardBodyTextElement.classList.add("card-text");	
                    let utcTimestamp = new Date(0);
                    utcTimestamp.setUTCMilliseconds(timestamp);
                    let timestamptext = utcTimestamp.toISOString().replace("T", " ");
                    timestamptext = timestamptext.replace("Z", "");
                    cardBodyTextElement.innerHTML = timestamptext;
                    cardBodyElement.appendChild(cardBodyTextElement); 

                    
                }
            });
        });

        
    }

    createCarouselCard(){        
        let carouselImagesElement = document.getElementById("carouselImages");
        let canvas = document.getElementById("contentCanvas");
        carouselImagesElement.style.display = "block";
        canvas.style.display = "none";

        let carouselElement = document.getElementById("carousel");
        carouselElement.innerHTML = "";

        let timestamp = this.carouselTimestamps[this.carouselImageIndex];
        let datagram = this.carouselImages.get(timestamp);
        let contentTags = this.selectedLoggerBlock.GetContentTags(this.getCheckedUUIDs());
        contentTags.forEach(contentTag =>{
            var blob = new Blob( [ datagram ], { type: contentTag.valuetype} );
            var imageUrl = URL.createObjectURL( blob );
            
            var image = new Image();
            image.src = imageUrl;
            image.onload = function(){ 
                //Carousel item
                let carouselItem = document.createElement("div");
                carouselItem.classList.add("carousel-item");
                carouselItem.classList.add("active");                                	

                //Card
                let cardElement = document.createElement("div");
                cardElement.classList.add("card");	
                carouselItem.appendChild(cardElement);  

                //Card image
                let cardImageElement = document.createElement("img");
                cardImageElement.classList.add("card-img-top");	
                cardImageElement.setAttribute('src', imageUrl); 
                //cardImageElement.setAttribute('src', imageUrl); 
                cardElement.appendChild(cardImageElement); 

                //Card body
                let cardBodyElement = document.createElement("div");
                cardBodyElement.classList.add("card-body");	
                cardElement.appendChild(cardBodyElement);
                //Card Body Header
                let cardBodyHeaderElement = document.createElement("h5");
                cardBodyHeaderElement.classList.add("card-title");	
                cardBodyHeaderElement.innerHTML = contentTag.hierarchy.name;
                cardBodyElement.appendChild(cardBodyHeaderElement);
                //Card Body Text
                let cardBodyTextElement = document.createElement("p");
                cardBodyTextElement.classList.add("card-text");	
                let timestamptext = new Date(0);
                timestamptext.setUTCMilliseconds(timestamp);
                cardBodyTextElement.innerHTML = timestamptext;
                cardBodyElement.appendChild(cardBodyTextElement); 

                carouselElement.appendChild(carouselItem);                  
            }
        });
    }

    nextCarouselImage(){
        if(this.carouselTimestamps.length > 0){
            this.carouselImageIndex++;
            if(this.carouselImageIndex > this.carouselTimestamps.length){
                this.carouselImageIndex = 0;
            }  
            this.createCarouselCard();          
        }     
    }

    prevCarouselImage(){
        if(this.carouselTimestamps.length > 0){
            this.carouselImageIndex--;
            if(this.carouselImageIndex < 0){
                this.carouselImageIndex = this.carouselTimestamps.length - 1;
            }  
            this.createCarouselCard();          
        }  

    }

    showOnline(){
        
        if(this.selectedConnectionNode !== undefined){
            let canvas = document.getElementById("onlineCanvas");
            let chartTabElement = document.getElementById("onlineTab");

            if(this.selectedConnectionNode.connectionNodeType === "image")
            {               
                if(this.selectedConnectionNode.lastDatagram !== undefined){
                    
                    var blob = new Blob( [ this.selectedConnectionNode.lastDatagram ], { type: "image/jpeg" } );
                    var imageUrl = URL.createObjectURL( blob );

                    
                    
                    var image = new Image();
                    image.src = imageUrl;
                    image.onload = function(){ 
                        canvas.width = chartTabElement.clientWidth;
                        canvas.height = chartTabElement.clientHeight;
                        //let context = canvas.getContext('2d');
                        let width = canvas.width - (0.1 * canvas.width);
                        let height = canvas.height;
 
                        var ctx = canvas.getContext('2d');                      
                        ctx.drawImage(image, 0, 0, width, height);
                    }
                }
            }
            else{
                canvas.width = chartTabElement.clientWidth;
                canvas.height = chartTabElement.clientHeight;
                let context = canvas.getContext('2d');
                let width = canvas.width - (0.1 * canvas.width);
                let height = canvas.height;

                this.selectedConnectionNode.calculateOnlineChartValues(width,height, this.getCheckedUUIDs());

                let yMargin = height * 0.05;
                context.beginPath();
                context.strokeStyle = "#aaaaaa";
                context.setLineDash([5, 3]);
                context.moveTo(0,yMargin);
                context.lineTo(width, yMargin);
                context.moveTo(0,height - yMargin);
                context.lineTo(width, height - yMargin);
                context.stroke();

                let rowIndex = 0;
                let valueTexts = [];
                let valueColors =[];
                for(let[contentTag, chartContent] of this.selectedConnectionNode.onlineChartContents){                
                    if(chartContent.chartValues.size > 1){
                        context.beginPath();
                        let timestamps = Array.from(chartContent.chartValues.keys());
                        let chartValue1 = chartContent.chartValues.get(timestamps[0]);
                        let x1 = chartValue1.x;
                        let y1 = chartValue1.y;
                        context.strokeStyle = chartValue1.color;
                        context.fillStyle = chartValue1.color;
                        context.moveTo(x1, y1);
                        context.lineWidth = 1;
                        context.setLineDash([]);
                        
                        let lastValue = "";
                        for(let timestampIndex = 1; timestampIndex < timestamps.length; timestampIndex++){
                            let chartValue2 = chartContent.chartValues.get(timestamps[timestampIndex]);
                            lastValue = chartValue2.value;
                            let x2 = chartValue2.x;
                            let y2 = chartValue2.y;
                            context.lineTo(x2, y2);
                            context.moveTo(x2, y2);                        
                        }                                         

                        context.fillText(Number(chartContent.maxValue).toFixed(2), width + 10, chartContent.yMax + rowIndex); 
                        context.fillText(Number(chartContent.minValue).toFixed(2), width + 10, chartContent.yMin - rowIndex); 
                        context.stroke(); 

                        let contentValue = contentTag.hierarchy.name + ": " + lastValue;
                        valueTexts.push(contentValue);
                        valueColors.push(chartValue1.color);
                        rowIndex = rowIndex + 15;                 
                    }    
                         
                }
                context.beginPath();
                context.stroke();

                rowIndex = 0;
                if(valueTexts.length === valueColors.length)
                {
                    context.fillStyle = "#ffffff";
                    context.fillRect(5, 5, 200, 10 + (15*valueTexts.length));

                    for(let i = 0; i < valueTexts.length ; i++){
                        context.fillStyle = valueColors[i];
                        context.fillText(valueTexts[i], 10, 20 + rowIndex); 
                        rowIndex = rowIndex + 15;
                        context.stroke(); 
                    }
                }
            }
        }
    }
    
    show3DValues(){

        document.getElementById("contentChart3DRefreshButtonSpinner").style.visibility = "hidden";
               
        let startdateElement = document.getElementById("startdate");
        let starttimeElement = document.getElementById("starttime");
        let enddateElement = document.getElementById("enddate");
        let endtimeElement = document.getElementById("endtime");
        let chartTabElement = document.getElementById("chartTab");
        
        const canvas = document.getElementById("content3DCanvas"); 
   
        
        let timeZoneOffset = new Date().getTimezoneOffset() * 60000;

        if(startdateElement !== undefined && starttimeElement !== undefined && enddateElement !== undefined && endtimeElement != undefined
            && chartTabElement !== undefined && canvas !== undefined){
            let startTimestamp =  startdateElement.valueAsNumber + starttimeElement.valueAsNumber + timeZoneOffset;
            let endTimestamp =  enddateElement.valueAsNumber + endtimeElement.valueAsNumber + timeZoneOffset;

            let width = canvas.width - (0.1 * canvas.width);
            let height = canvas.height;

            this.calculateChartValues(startTimestamp, endTimestamp, width, height);
            
            //draw 3D chart
            this.renderer = new THREE.WebGLRenderer({canvas});      
            this.renderer.setSize( canvas.clientWidth, canvas.clientHeight );
            
            if(this.camera === undefined){        
                this.camera = new THREE.PerspectiveCamera( 75, canvas.clientWidth / canvas.clientHeight, 0.1, 500 );
                this.camera.position.x = -10;
                this.camera.position.y = 50;
                this.camera.position.z = 100;
            }
            
            // controls
            this.controls = new OrbitControls( this.camera, this.renderer.domElement );
            this.controls.screenSpacePanning = false;
            this.controls.maxPolarAngle = Math.PI / 2;
            
            
            this.scene = new THREE.Scene();
            
            var grid = new THREE.GridHelper(200, 20);
            this.scene.add(grid);
            
            const dir = new THREE.Vector3( 100, 0, 0 );

            //normalize the direction vector (convert to vector of length 1)
            dir.normalize();

            const origin = new THREE.Vector3( 0, 0, 0 );
            const length = 100;
            const hex = 0xffff00;

            const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
            this.scene.add( arrowHelper );
                        
            let z = (0.5 * (this.chartContents.size -1)) * 20;
            for(let[contentTag, chartContent] of this.chartContents){
             
                    let timestamps = Array.from(chartContent.chartValues.keys());

                    const material = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 5 } );
                    material.color.setHex(chartContent.chartValues.get(timestamps[0]).color.replace('#', '0x'));
                    const points = [];
                    
                    let xStep = 200 / timestamps.length;
                    let x = -100;
                    for(let timestampIndex = 0; timestampIndex < timestamps.length; timestampIndex++){
                        let chartValue = chartContent.chartValues.get(timestamps[timestampIndex]);
                        points.push( new THREE.Vector3( x, chartValue.y3D, z ) );
                        x = x + xStep;

                        
                    }
                    const geometry = new THREE.BufferGeometry().setFromPoints( points );
                    const line = new THREE.Line( geometry, material );
                    this.scene.add( line );
                    z = z - 20;
                                        
            }

            this.animate();
   
        }
        
        
        
        

    }
    
    animate(){
        let chart3DTabElement = document.getElementById("chart3DTab");
        if(chart3DTabElement !== undefined){
            if(chart3DTabElement.classList.contains("active")){
                requestAnimationFrame( ()=>this.animate() );
        this.renderer.render( this.scene, this.camera );
            }
        }
    }

    detailedChartData(event){
        if(this.chartContents !== undefined){
            var chartDataElement = document.getElementById("chartData");
            var canvas = document.getElementById("contentCanvas");
            var context = canvas.getContext("2d");
            let posx = event.clientX - canvas.offsetLeft;
            let posy = event.clientY - canvas.offsetTop;

            chartDataElement.style.visibility = "visible";
            chartDataElement.style.position = "absolute";
            chartDataElement.style.left = event.layerX + "px";
            chartDataElement.style.top = event.layerY + "px";
            chartDataElement.innerHTML = "";
            
                

            let innerhtml = "";
            for(let[contentTag, chartContent] of this.chartContents){
                if(innerhtml !== ""){
                    innerhtml = innerhtml + "<br>";
                }
                if(chartContent.chartValues.size > 1){   
                    let keys = Array.from(chartContent.chartValues.keys());
                    let chartValue = chartContent.chartValues.get(posx);
                    
                    let timestamp = new Date(0);
                    timestamp.setUTCMilliseconds(chartValue.timestamp);
                    let timestamptext = timestamp.toISOString().replace("T", " ");
                    timestamptext = timestamptext.replace("Z", "");
                    
                    innerhtml = innerhtml + "<b>" + contentTag.name + "</b><br>";
                    innerhtml = innerhtml + "value: " + chartValue.value + "<br>";
                    innerhtml = innerhtml + "timestamp: " + timestamptext + "<br>";                    
                }                           
            }
            chartDataElement.innerHTML = innerhtml;
        }   
        else {
            var chartDataElement = document.getElementById("chartData");
            chartDataElement.style.visibility = "hidden";
        }

    }

    showChartValues(){
        let startdateElement = document.getElementById("startdate");
        let starttimeElement = document.getElementById("starttime");
        let enddateElement = document.getElementById("enddate");
        let endtimeElement = document.getElementById("endtime");
        let chartTabElement = document.getElementById("chartTab");
        let canvas = document.getElementById("contentCanvas");

        let carouselImagesElement = document.getElementById("carouselImages");
        carouselImagesElement.style.display = "none";

        let imageThumbnailsElement = document.getElementById("imageThumbnails");
        imageThumbnailsElement.style.display = "none";

        canvas.style.display = "block";

        let imageThumbnailsImagesElement = document.getElementById("imageThumbnails");
        imageThumbnailsElement.style.display = "none";
        

        document.getElementById("contentChartRefreshButtonSpinner").style.visibility = "hidden";


        let timeZoneOffset = new Date().getTimezoneOffset() * 60000;

        if(startdateElement !== undefined && starttimeElement !== undefined && enddateElement !== undefined && endtimeElement != undefined
            && chartTabElement !== undefined && canvas !== undefined){
            let startTimestamp =  startdateElement.valueAsNumber + starttimeElement.valueAsNumber + timeZoneOffset;
            let endTimestamp =  enddateElement.valueAsNumber + endtimeElement.valueAsNumber + timeZoneOffset;

            canvas.width = chartTabElement.clientWidth;
            canvas.height = chartTabElement.clientHeight;
            let context = canvas.getContext('2d');
            let width = canvas.width - (0.1 * canvas.width);
            let height = canvas.height;

            this.calculateChartValues(startTimestamp, endTimestamp, width, height);

            let yMargin = height * 0.05;
            context.beginPath();
            context.strokeStyle = "#aaaaaa";
            context.setLineDash([5, 3]);
            context.moveTo(0,yMargin);
            context.lineTo(width, yMargin);
            context.moveTo(0,height - yMargin);
            context.lineTo(width, height - yMargin);
            context.stroke();
            
            let rowIndex = 0;
            let texts = [];
            let colors =[];

            context.setLineDash([]);
            for(let[contentTag, chartContent] of this.chartContents){
                if(chartContent.chartValues.size > 1){   
                    context.beginPath();                
                    let timestamps = Array.from(chartContent.chartValues.keys());
                    let chartValue1 = chartContent.chartValues.get(timestamps[0]);
                    let x1 = chartValue1.x;
                    let y1 = chartValue1.y;
                    context.strokeStyle = chartValue1.color;
                    context.fillStyle = chartValue1.color;
                    context.moveTo(x1, y1);
                    context.lineWidth = 1;
                    
                    for(let timestampIndex = 1; timestampIndex < timestamps.length; timestampIndex++){
                        let chartValue2 = chartContent.chartValues.get(timestamps[timestampIndex]);
                        let x2 = chartValue2.x;
                        let y2 = chartValue2.y;
                        context.lineTo(x2, y2);
                        context.moveTo(x2, y2);
                        
                    }
                    context.fillText(Number(chartContent.maxValue).toFixed(2), width + 10, chartContent.yMax + rowIndex); 
                    context.fillText(Number(chartContent.minValue).toFixed(2), width + 10, chartContent.yMin - rowIndex);    
                    context.stroke();  

                    let contentValue = contentTag.hierarchy.name
                    texts.push(contentValue);
                    colors.push(chartValue1.color);

                    rowIndex = rowIndex + 15;
                }                           
            }
            context.beginPath();
            context.stroke();

            rowIndex = 0;
            if(texts.length === colors.length)
            {
                context.fillStyle = "#ffffff";
                context.strokeStyle = "#000000";
                context.lineWidth = 1;
                context.setLineDash([]);
                context.fillRect(5, 5, 200, 10 + (15*texts.length));
                context.rect(5, 5, 200, 10 + (15*texts.length));

                for(let i = 0; i < texts.length ; i++){
                    context.fillStyle = colors[i];
                    context.fillText(texts[i], 10, 20 + rowIndex); 
                    rowIndex = rowIndex + 15;
                    context.stroke(); 
                }
            }
        }
    }

    showTableValue(){

        let startdateElement = document.getElementById("startdate");
        let starttimeElement = document.getElementById("starttime");
        let enddateElement = document.getElementById("enddate");
        let endtimeElement = document.getElementById("endtime");
        let contentvaluesElement = document.getElementById("contentValues");
        
        document.getElementById("contentTableRefreshButtonSpinner").style.visibility = "hidden";

        let timeZoneOffset = new Date().getTimezoneOffset() * 60000;

        if(startdateElement !== undefined && starttimeElement !== undefined && enddateElement !== undefined && endtimeElement != undefined){
            let startTimestamp =  startdateElement.valueAsNumber + starttimeElement.valueAsNumber + timeZoneOffset;
            let endTimestamp =  enddateElement.valueAsNumber + endtimeElement.valueAsNumber + timeZoneOffset;

            contentvaluesElement.innerHTML = "";
            let tableHeader = document.createElement("thead");
            tableHeader.classList.add("table-dark");	

            let tableHeaderRow = document.createElement("tr");
            tableHeader.appendChild(tableHeaderRow);  
            
            //Add timestamp header
            let tableHeaderColumn = document.createElement("th");
            //tableHeaderColumn.scope = "col";
            tableHeaderColumn.appendChild(document.createTextNode("Timestamp"));
            tableHeaderRow.appendChild(tableHeaderColumn);

            //Create table table header first
            let checkedUUIDs = this.getCheckedUUIDs();
            let contentTags = [];
            for(let i = 0; i < checkedUUIDs.length; i++){
                let contentTag = this.selectedConnectionNode.contentTags.get(checkedUUIDs[i]);
                contentTags.push(contentTag);
                let tableHeaderColumn = document.createElement("th");
                tableHeaderColumn.scope = "col";
                tableHeaderColumn.appendChild(document.createTextNode(contentTag.name));
                tableHeaderRow.appendChild(tableHeaderColumn);
            }
            contentvaluesElement.appendChild(tableHeader);

            //Create valuetable(body) second
            let tableBody= document.createElement("tbody");

            

                
            this.selectedConnectionNode.datafiles.forEach((datafile) => {
                for(let[key, value] of datafile.datagrams){
                    if(key >= startTimestamp && key <= endTimestamp){
                        let bodyRow = document.createElement("tr");

                        //Add timestamp column
                        let timstampCell = document.createElement("td");
                        let timestampValue = new Date(key);
                        let millisecond = timestampValue.getMilliseconds();
                        let timestampValueString = timestampValue.toLocaleTimeString().concat(":", millisecond);
                        timstampCell.appendChild(document.createTextNode(timestampValueString));
                        bodyRow.appendChild(timstampCell); 

                        contentTags.forEach(contentTag =>{
                            let tagValueCell = document.createElement("td");
                            let tagValue = contentTag.Value(value, true);
                            tagValueCell.appendChild(document.createTextNode(tagValue));

                            bodyRow.appendChild(tagValueCell);                            
                        }); 
                        tableBody.appendChild(bodyRow);
                    }                      
                }
            });
            
            
            contentvaluesElement.appendChild(tableBody);
        }
    }

    getValues(){        
        let needForRequest = false;
        if(this.selectedConnectionNode !== undefined){
            let startdateElement = document.getElementById("startdate");
            let starttimeElement = document.getElementById("starttime");
            let enddateElement = document.getElementById("enddate");
            let endtimeElement = document.getElementById("endtime");

            let timeZoneOffset = new Date().getTimezoneOffset() * 60000;

            if(startdateElement !== null && starttimeElement !== null && enddateElement !== null && endtimeElement != null){
                let startTimestamp =  startdateElement.valueAsNumber + starttimeElement.valueAsNumber + timeZoneOffset;
                let endTimestamp =  enddateElement.valueAsNumber + endtimeElement.valueAsNumber + timeZoneOffset;

                needForRequest = !this.isDataUpToDate(startTimestamp,endTimestamp);
                if(needForRequest){
                    this.getDatafiles(this.selectedConnectionNode.hierarchy.hierarchyUUID,startTimestamp, endTimestamp)
                }
            }     
        }  
        return needForRequest;
    }

    isDataUpToDate(startTimestamp, endTimestamp)
    {
        let isDataUpToDate = false;
        if(this.selectedLoggerBlock !==  undefined){
            isDataUpToDate = this.selectedLoggerBlock.isDataUpToDate(startTimestamp, endTimestamp);
        }

        return isDataUpToDate;

    }
}

function parseXMLTagContent(xmlContent, startTag, endTag){
    let tagContent = "";
    let start = xmlContent.indexOf(startTag);
    if(start >= 0)
    {
        start = start + startTag.length;
        let end = xmlContent.indexOf(endTag,start);
        if(end > start)
        {
            tagContent = xmlContent.substr(start, end-start);
        }
    }
    return tagContent;
}

export { RestAPI };

