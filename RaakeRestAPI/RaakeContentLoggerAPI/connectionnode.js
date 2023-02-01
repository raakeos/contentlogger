//const Feature = require('./feature.js');
//const Hierarchy = require('./hierarchy.js');
//const Thing = require('./thing.js');
const DataContent = require('./datacontent.js');
var net = require('net');
const { deflate } = require('zlib');


class ConnectionNode {
    constructor(hierarchy){
        this.hierarchy = hierarchy;
        this.dataContent = undefined;
        this.lastDatagram = undefined;
        this.heartbeatFrequency = 0;
        this.socket = undefined;
        this.timeout = undefined;
        this.stopped = false;

        console.log("(%s)(%s)", this.hierarchy.name, this.hierarchy.hierarchyUUID);

        this.lastDatagram = [];  

        this.connectionNodeType = "unknown";
        let connectionNodeTypeFeature = this.hierarchy.thing.GetFeatureByName("ConnectionNodeType");            
        if(connectionNodeTypeFeature !== undefined) {
            this.connectionNodeType = connectionNodeTypeFeature.value.toLowerCase();
        }

        //Create Uint8Array from hierarchy uuid
        let uuid = this.hierarchy.hierarchyUUID; 
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

        //Create online connection to the connection node service
        this.ipAddressFeature = this.hierarchy.thing.GetFeatureByName("IPAddress");
        let outputNodeHierarchies = this.hierarchy.GetChildrenByFeature("ThingType", "OutputNode");
        if(outputNodeHierarchies.length === 1){
            let outputNodeHierarchy = outputNodeHierarchies[0];
            if(outputNodeHierarchy.thing !== undefined){                
                this.portFeature = outputNodeHierarchy.thing.GetFeatureByName("Port");
                let heartbeatFrequencyFeature = outputNodeHierarchy.thing.GetFeatureByName("HeartbeatFrequency");
                if(heartbeatFrequencyFeature !== undefined)
                {
                    this.heartbeatFrequency = heartbeatFrequencyFeature.value;
                }
                if(this.ipAddressFeature !== undefined && this.portFeature !== undefined){
                    this.startSocketConnection();                
                }
            }
        }        
    }    

    Stop(){
        console.log("Stopping to %s(ConnectionNode) %s:%s", this.hierarchy.name, this.ipAddressFeature.value, this.portFeature.value);
        if(this.timeout !== undefined){
            clearTimeout(this.timeout);            
        }

        if(this.socket !== undefined){
            this.socket.destroy();
        }
        this.stopped = true;
    }

    

    startSocketConnection(){

        if(this.socket !== undefined){
            this.socket.destroy();
        }

        if(!this.stopped){
            let self = this;
            console.log("Connecting to %s(ConnectionNode) %s:%s", self.hierarchy.name, self.ipAddressFeature.value, self.portFeature.value);
            self.socket = net.connect(self.portFeature.value, self.ipAddressFeature.value, function() {
                console.log("Connected to ConnectionNode %s:%s", self.ipAddressFeature.value, self.portFeature.value);
                if(self.heartbeatFrequency > 0) {
                    this.timeout = setTimeout(function() { self.sendHeartbeat(); }, self.heartbeatFrequency);
                }
                
            });

            self.socket.on('error', function(error) {                        
                console.log(error);
                console.log("reconnect after 5s.");
                this.timeout = setTimeout(function() { self.startSocketConnection(); }, 5000);
            });

            self.socket.on('end', function () {
                console.log("connection has been lost.");
                console.log("reconnect after 5s.");
                this.timeout = setTimeout(function() { self.startSocketConnection(); }, 5000);
            });

            self.socket.on('data', function(data) {

                let uuidArray = data.slice(2, 18); //uuid (2-18 bytes)
                if(self.isMyMessage(uuidArray)){
                    if(data.length > 18){
                        self.dataContent = new DataContent(data);
                        if(self.dataContent.contentDatagram === undefined){
                            self.dataContent = undefined;
                        }
                    }             
                }
                else{
                    if(self.dataContent !== undefined){
                        self.dataContent.AddDatagram(data);
                    }
                }

                if(self.dataContent !== undefined){
                    if(self.dataContent.IsReady()){
                        self.lastDatagram = self.dataContent.GetDatagram();                    
                        self.dataContent = undefined;
                    }
                }
                //connectionNodeDatagram.set(connectionNodeHierarchy.hierarchyUUID, data);
                //console.log('Received: ' + data);
            });
        }
    }

    sendHeartbeat(){
        let self = this;
        if(self.socket !== undefined){
            if(self.socket.writable === true){
                self.socket.write(self.uuidArray);
                //console.log('Send heartbeat');
                setTimeout(function() { self.sendHeartbeat(); }, self.heartbeatFrequency);
            }                 
        }
    }

    isMyMessage(uuid) {
        if(this.uuidArray === undefined) return false;
        for (let i = 0; i < uuid.length; i++) {
            if (this.uuidArray[i] !== uuid[i]) return false;
        }
        return true;
    }  
}

module.exports = ConnectionNode;
