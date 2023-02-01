import {ConfigurationHandler, Feature} from "../js/configurationhandler.js";

import {RaakeRequest} from "../js/raakerequest.js";

class DeviceAPI {
    constructor(ipAddress, port){
        var self = this;
        this.ipAddress = ipAddress;
        this.port = port;
        this.request = undefined;
        this.requests = [];
        setInterval(function () { self.timerEvent(self); },100);
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
        }       
        
    }

    getDevice() {
        let deviceRequest = new RaakeRequest("/device","","", "GET");
        this.requests.push(deviceRequest);  
    }

    putDevice(deviceUUID){
        let devicePUTRequest = new RaakeRequest("/device?uuid=" + deviceUUID,"","", "PUT", deviceUUID);
        this.requests.push(devicePUTRequest);
    }

    makeRequest(){
        if(this.xmlHttpRequest === undefined ){
            this.xmlHttpRequest = new XMLHttpRequest();           

            let queryUrl = "http://" + this.ipAddress + ":" + this.port + this.request.request;
            var self = this;
            this.xmlHttpRequest.open(this.request.method, queryUrl, true);
            if(this.request.method === "PUT"){
                this.xmlHttpRequest.setRequestHeader('Content-type', 'text/xml');
            }
            if(this.request.responsetype.length > 0){
                this.xmlHttpRequest.responseType = this.request.responsetype;
            } 
            this.xmlHttpRequest.send(this.request.data);               
            this.xmlHttpRequest.onload = function () { self.requestReady(self); }
        }
    }

    requestReady(self){
        if(self.request !== undefined){
            if (self.xmlHttpRequest.readyState === 4 && self.xmlHttpRequest.status === 200) {
                let request = self.request.request;
                if(self.request.method === "GET" && request.indexOf("/device") >= 0){
                    self.parseDeviceXML(self.xmlHttpRequest.responseText);                    
                }
                else if(self.request.method === "PUT" && request.indexOf("/device") >= 0){
                    window.openContent('device.html');
                }
            }
            self.request = undefined;
            self.xmlHttpRequest = undefined;
        }
    }

    parseDeviceXML(resposeText) {
        let deviceUUID = this.parseXMLTagContent(resposeText, "<uuid>", "</uuid>");
        if(deviceUUID !== undefined){
            let deviceUUIDElement = document.getElementById("deviceUUID");
            if(deviceUUIDElement !== undefined){
                deviceUUIDElement.innerHTML = deviceUUID;
                window.openContent('device.html');
            }            
        }
        else{
            window.openContent('nouuid.html');
        }
    }

    parseXMLTagContent(xmlContent, startTag, endTag){
        let tagContent = undefined;
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
}

export { DeviceAPI };