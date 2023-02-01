import {ChartValue} from "../js/chartvalue.js";
import {Datafile} from "../js/datafile.js";
import {ChartContent} from "../js/chartcontent.js";
import {ContentTag} from "../js/contenttag.js";

class ConnectionNode {
    constructor(hierarchy){
        this.hierarchy = hierarchy;
        this.contentTags = new Map(); 
        this.onlineDatafile = new Datafile("online");
        this.onlineChartContents = new Map();
        this.chartColorPalette = ["#0B84A5", "#F6C85F", "#6F4E7C", "#9DD866", "#CA472F", "#FFA056", "#8DDDD0"]; 
        this.lastDatagram = [];  
        this.datafiles = new Map();
        
        this.addTimestamp = false;
        let addTimestampFeature = this.hierarchy.thing.GetFeatureByName("AddTimestamp");            
        if(addTimestampFeature !== undefined) {
            this.addTimestamp = addTimestampFeature.value.toLowerCase() === "true";
        }

        this.connectionNodeType = "unknown";
        let connectionNodeTypeFeature = this.hierarchy.thing.GetFeatureByName("ConnectionNodeType");            
        if(connectionNodeTypeFeature !== undefined) {
            this.connectionNodeType = connectionNodeTypeFeature.value.toLowerCase();
        }

        let contentTagHierarchies = this.hierarchy.GetChildrenByFeature("ThingType", "ContentTag");
        contentTagHierarchies.forEach(contentTagHierarchy => {
            let contentTag = new ContentTag(contentTagHierarchy);
            this.contentTags.set(contentTagHierarchy.hierarchyUUID, contentTag);
        })

        let uuid = this.hierarchy.hierarchyUUID; //xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        //"4de0bded-d81f-4eb6-9f82-a15ea8d8183e"
        if(uuid.length === 36){
            let uuidBuffer = [];
            let uuidParts = uuid.split('-');
            if(uuidParts.length === 5){
                for(let i = 0; i < uuidParts.length; i++){
                    let uuidPart = uuidParts[i];
                    if(i < 3){
                        for(let j = uuidPart.length; j > 0; j=j-2){
                            let decValue = parseInt(uuidPart.substr(j-2, 2), 16);
                            uuidBuffer.push(decValue);
                        }
                    }
                    else{
                        for(let j = 0; j < uuidPart.length; j=j+2){
                            let decValue = parseInt(uuidPart.substr(j, 2), 16);
                            uuidBuffer.push(decValue);
                        }
                    }
                }
                this.uuidArray = new Uint8Array(uuidBuffer);
            }
        }
    }    

    handleDatagramResponse(response){
        if(this.onlineDatafile.datagrams.size > 100){
            let firstKey = this.onlineDatafile.datagrams.keys().next(); 
            let deleted = this.onlineDatafile.datagrams.delete(firstKey.value);
        }
        let bytearray = new Uint8Array(response);

        this.lastDatagram = this.onlineDatafile.AddOlineDatagrams(bytearray); 

        // if(bytearray.byteLength > 28){
        //     if(this.connectionNodeType === "image"){
        //         this.onlineDatafile.AddImageDatagram(bytearray);   
        //     }
        //     else {
        //         this.onlineDatafile.AddOlineDatagrams(bytearray);        
        //     }
        // }
    }

    calculateOnlineChartValues(width, height, checkedUUIDs){
        this.onlineChartContents = new Map();

        let colorIndex = 0;
        for(let i = 0; i < checkedUUIDs.length; i++){
            let contentTag = this.contentTags.get(checkedUUIDs[i]);
            let chartContent = new ChartContent(contentTag);
            if(contentTag.valuetype !== "image/jpeg"){                
                chartContent.color = this.chartColorPalette[colorIndex];
                let values = new Map();

                for(let[key, value] of this.onlineDatafile.datagrams){
                    let tagValue = chartContent.contentTag.Value(value, false);
                    chartContent.minValue = tagValue < chartContent.minValue ? tagValue : chartContent.minValue;
                    chartContent.maxValue = tagValue > chartContent.maxValue ? tagValue : chartContent.maxValue;
                    values.set(key,tagValue);                    
                }

                if(values.size > 1) {
                    let valuesCount = values.size;
                    let timestampStep = valuesCount / width;
                    let valueDifference = chartContent.minValue !== chartContent.maxValue ? chartContent.maxValue - chartContent.minValue : 1;
                    let yMarginal = height * 0.05;
                    let heightWithMarginal = height - (2 * yMarginal);
                    let yStep = heightWithMarginal / Number(valueDifference);
                    let yOffset = height - (yMarginal + (yStep * - Number(chartContent.minValue)));
                    let timestamps = Array.from(values.keys());
                    chartContent.yMin = height - yMarginal;
                    chartContent.yMax = yMarginal;

                    for(let x = 0; x < width; x++){
                        let timestampIndex = parseInt(timestampStep * x);
                        let timestamp = timestamps[timestampIndex];
                        let value = values.get(timestamp);

                        let chartValue = new ChartValue();
                        chartValue.x = x;
                        chartValue.y = yOffset - (yStep * Number(value));
                        chartValue.value = Number(value);
                        chartValue.color = chartContent.color;
                        chartValue.timestamp = timestamp;

                        chartContent.chartValues.set(x, chartValue);
                    }
                    
                    this.onlineChartContents.set(chartContent.contentTag, chartContent);
                }

                if(colorIndex >= this.chartColorPalette.length) {
                    colorIndex = 0;
                }
                else{
                    colorIndex++;
                }
            }
            else{
                for(let[key, value] of this.onlineDatafile.datagrams){

                    let chartValue = new ChartValue();
                    chartValue.value = chartContent.contentTag.Value(value, false);
                    chartContent.chartValues.set(key, chartValue);                    
                }
                this.onlineChartContents.set(chartContent.contentTag, chartContent);
            }
        }
    }
}

export { ConnectionNode };