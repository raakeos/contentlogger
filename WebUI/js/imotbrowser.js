import {ConfigurationHandler, Feature} from "../js/configurationhandler.js";

import {RaakeRequest} from "../js/raakerequest.js";

class IMoTBrowser {
    constructor(){
        var self = this;
        this.request = undefined;
        this.requests = [];
        this.services = new Map(); 

        //this.hierarchyElements = new Map();

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
            else {
                if(self.services.size > 0) {
                    self.services.forEach((serviceHierarchy) =>{
                        let serviceRequest = new RaakeRequest("/service?uuid=" + serviceHierarchy.hierarchyUUID ,"","", "GET");
                        this.requests.push(serviceRequest);  
                    });
                }
            }
        }       
        
    }

    getIMoT() {
        let configRequest = new RaakeRequest("/config","","", "GET");
        this.requests.push(configRequest);  
    }

    makeRequest(){
        let ipAddressElement = document.getElementById("ipAddress");
        let portElement = document.getElementById("port");

        let ipAddress = ipAddressElement.value;
        let port = portElement.value;

        if(this.xmlHttpRequest === undefined ){
            this.xmlHttpRequest = new XMLHttpRequest();            

            if(ipAddress !== undefined && port !== undefined){
                let queryUrl = "http://" + ipAddress + ":" + port + this.request.request;
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
            else{
                alert("ipAddress or port element not found");
            }
        }
    }

    requestReady(self){
        if(self.request !== undefined){
            if (self.xmlHttpRequest.readyState === 4 && self.xmlHttpRequest.status === 200) {
                let request = self.request.request;
                if(self.request.method === "GET" && request.indexOf("/config") >= 0){
                    self.parseConfigFile(self.xmlHttpRequest.responseText);                    
                }
                else if(self.request.method === "GET" && request.indexOf("/service") >= 0){
                    self.parseServiceFile(self.xmlHttpRequest.responseText);                    
                }
                else if(self.request.method === "PUT" && request.indexOf("/config") >= 0){
                    let configRequest = new RaakeRequest("/config","","", "GET");
                    this.requests.push(configRequest);  
                }
            }
            self.request = undefined;
            self.xmlHttpRequest = undefined;
        }
    }

    parseConfigFile(resposeText) {

        let hierarchiesULElement = document.getElementById("hierarchiesUL");

        hierarchiesULElement.innerHTML = "";

        //this.hierarchyElements = new Map();
        this.services = new Map();

        this.configurationHandler = new ConfigurationHandler(resposeText, true);
        for(let i = 0; i < this.configurationHandler.Hierarchies.length; i++){
            if(this.configurationHandler.Hierarchies[i].parent === undefined){
                this.createChildElement(this.configurationHandler.Hierarchies[i], hierarchiesULElement, 0);
            }
        }
     }

     parseServiceFile(responseText){
        let uuid = this.parseXMLTagContent(responseText,"<uuid>","</uuid>");
        let status = this.parseXMLTagContent(responseText,"<status>","</status>");
        if(uuid !== undefined && status !== undefined){
            let serviceElement = document.getElementById("service-" + uuid);
            if(serviceElement !== undefined){
                serviceElement.innerHTML = " (" + status + ")";
            }
        }
        
     }

    createChildElement(hierarchy, ulElement, level){
        let liElement = document.createElement("li");
        let spanElement = document.createElement("span");
        let textElement = document.createElement("span");
        
        textElement.innerHTML = hierarchy.name;// + " (" + hierarchy.hierarchyUUID +")";
        if(hierarchy.hidden){
            textElement.classList.add("hierarchyHidden");
        }
        textElement.classList.add("hierarchyText");
        textElement.addEventListener("click", function(){window.imotBrowser.hierarchyClicked(hierarchy.hierarchyUUID);});
        liElement.appendChild(spanElement);
        liElement.appendChild(textElement);

        if(hierarchy.thing !== undefined){
            let serviceNameFeature = hierarchy.thing.GetFeatureByName("ServiceName");
            if(serviceNameFeature !== undefined){
                let serviceElement = document.createElement("span");
                serviceElement.setAttribute("id", "service-" + hierarchy.hierarchyUUID);
                liElement.appendChild(serviceElement);
                if(!this.services.has(hierarchy.hierarchyUUID)){
                    this.services.set(hierarchy.hierarchyUUID, hierarchy);
                }
            }            
        }

        if(hierarchy.children.length > 0){
            spanElement.classList.add("caret");
            spanElement.addEventListener("click", function() {
                this.parentElement.querySelector(".nested").classList.toggle("active");
                this.classList.toggle("caret-down");
            });

            let childULElement = document.createElement("ul");
            childULElement.classList.add("nested");
            if(level < 2){
                childULElement.classList.add("active");
            } 
            liElement.appendChild(childULElement);
            
            hierarchy.children.forEach((childHierarchy) => {
                this.createChildElement(childHierarchy, childULElement, level + 1);
            })
        }
        
        ulElement.appendChild(liElement);
    }

    hierarchyClicked(hierarchyUUID){

        let hierarchy = this.configurationHandler.rawHierarchies.get(hierarchyUUID);
        if(hierarchy !== undefined){
            let modalHeader = document.getElementById("modalHeader");
            modalHeader.innerHTML = hierarchy.name;

            let hierarchyName = document.getElementById("hierarchyName");
            hierarchyName.value = hierarchy.name;

            let hierarchyUUID = document.getElementById("hierarchyUUID");
            hierarchyUUID.innerHTML = hierarchy.hierarchyUUID;

            let hierarchyHidden = document.getElementById("hierarchyHidden");
            hierarchyHidden.checked = hierarchy.hidden;

            if(hierarchy.thing !== undefined){
                let thingUUID = document.getElementById("thingUUID");
                thingUUID.innerHTML = hierarchy.thing.thingUUID;

                let thingName = document.getElementById("thingName");
                thingName.value = hierarchy.thing.name;

                let features = document.getElementById("features");
                features.innerHTML = "";

                hierarchy.thing.features.forEach((feature) => {
                    let trElement = document.createElement("tr");
                    let nameElement = document.createElement("td");
                    let typeElement = document.createElement("td");
                    let valueElement = document.createElement("td");

                    nameElement.innerHTML = feature.name;
  
                    let typeInputElement = document.createElement("input");
                    typeInputElement.type = "text";
                    //typeInputElement.id = feature.name + '_type';
                    //typeInputElement.name = feature.name + "_type";
                    typeInputElement.value = feature.type;
                    typeElement.appendChild(typeInputElement);
                
                    let valueInputElement = document.createElement("input");
                    valueInputElement.type = "text";
                    valueInputElement.id = feature.name;
                    valueInputElement.name = feature.name;
                    valueInputElement.value = feature.value;
                    valueElement.appendChild(valueInputElement);
      

                    trElement.appendChild(nameElement);
                    trElement.appendChild(typeElement);
                    trElement.appendChild(valueElement);

                    features.appendChild(trElement);
                });
            }

            let  editModal = new bootstrap.Modal(document.getElementById('editModal'));
            editModal.show();
        }
    }

    SetXMLContentToServer(){
        let xmlContent = this.configurationHandler.GetXMLContent();

        let xmlContentElement = document.getElementById("xmlContent");
        xmlContentElement.innerHTML = xmlContent;

        let configPUTRequest = new RaakeRequest("/config","","", "PUT", xmlContent);
        this.requests.push(configPUTRequest);

    }

    UpdateXMLContent(){       

        let hierarchyUUIDElement = document.getElementById("hierarchyUUID");

        if(hierarchyUUIDElement !== undefined){
            let hierarchyUUID = hierarchyUUIDElement.innerHTML;
            let hierarchy = this.configurationHandler.rawHierarchies.get(hierarchyUUID);
            if(hierarchy !== undefined){

                let hierarchyName = document.getElementById("hierarchyName").value;
                let hierarchyHidden = document.getElementById("hierarchyHidden").checked;
                let thingName = document.getElementById("thingName").value;

                hierarchy.name = hierarchyName.length > 0 ? hierarchyName : hierarchy.name;
                hierarchy.hidden = hierarchyHidden !== undefined ? hierarchyHidden : false;
                if(hierarchy.thing !== undefined){
                    hierarchy.thing.name = thingName.length > 0 ? thingName : hierarchy.thing.name;

                    let featuresTable = document.getElementById("features");
                    let rows = featuresTable.rows;
                    if(rows !== undefined && rows.length > 0){
                        for(let i = 0; i < rows.length; i++){
                            let row = rows[i];
                            if(row.cells.length === 3){
                                let featureName = row.cells[0].innerHTML;
                                let featureType = row.cells[1].children[0].value;
                                let featureValue = row.cells[2].children[0].value;

                                let updated = false;
                                hierarchy.thing.features.forEach((feature) => {
                                    if(feature.name === featureName){
                                        feature.type = featureType;
                                        feature.value = featureValue;
                                        updated = true;
                                    }
                                });

                                //if(updated === false){
                                //    hierarchy.thing.features.push(new Feature(featureName, featureType, featureValue));
                                //}
                            } 
                        }
                    }
                }               
            }
        }

        let  editModal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
        editModal.hide();
    }
    
    parseXMLTagContent(xmlContent, startTag, endTag){
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
}


export { IMoTBrowser };