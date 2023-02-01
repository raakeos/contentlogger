const Feature = require('./feature.js');
const Hierarchy = require('./hierarchy.js');
const Thing = require('./thing.js');

class ConfigurationHandler {
    constructor(xmlContent) {
      this.xmlContent = xmlContent;
      this.Hierarchies = [];
      this.things = [];

      //Find things tags
      let thingsStart = this.xmlContent.search("<things>") + 8;
      let thingsEnd = this.xmlContent.search("</things>");

      if(thingsEnd > thingsStart) {
        this.xmlThings = xmlContent.substring(thingsStart, thingsEnd).trim();
        this.ParseThings();
      }
      else{
        console.log("Configuration file does not contains hierarchies");
      }

      //Find hierarchies tags
      let hierarchiesStart = this.xmlContent.search("<hierarchies>") + 13;
      let hierarchiesEnd = this.xmlContent.search("</hierarchies>");

      if(hierarchiesEnd > hierarchiesStart) {
        this.xmlHierarchies = xmlContent.substring(hierarchiesStart, hierarchiesEnd).trim();
        this.ParseHierarchies();
      }
      else{
        console.log("Configuration file does not contains hierarchies");
      }
       
    }

    
    ParseThings() {
        let thingEnd = 0;
        let thingStart = this.xmlThings.indexOf("<thing ", thingEnd) + 7;
        while(thingStart > 6)
        {          
            thingEnd = this.xmlThings.indexOf(">", thingStart);
            if(thingEnd > thingStart){
                let thingContent = this.xmlThings.substring(thingStart, thingEnd).trim();
                let thingArguments = this.ParseArguments(thingContent);

                let name;
                let thingUUID;


                for (let i = 0; i < thingArguments.length; i++) {
                    let argumentParts = thingArguments[i].split('=');
                    if(argumentParts.length == 2) {
                        if(argumentParts[0] === "name") name = argumentParts[1];
                        else if(argumentParts[0] === "thinguuid") thingUUID = argumentParts[1];
                    }
                }
                
                let thing = new Thing(name,thingUUID);                

                let thingTagEnd = this.xmlThings.indexOf("</thing>", thingEnd);
                if(thingTagEnd > thingEnd){
                    let xmlFeatures = this.xmlThings.substring(thingEnd + 1, thingTagEnd).trim();
                    thing.features = this.ParseFeatures(xmlFeatures);
                    this.things.push(thing);

                    thingStart = this.xmlThings.indexOf("<thing ", thingEnd) + 7;
                }
                else{
                    thingStart = -1;
                }                
            }
            else{
                thingStart = -1;
            }            
        }
    }

    ParseFeatures(xmlFeatures){
        let features = [];
        let featureEnd = 0;
        let featureStart = xmlFeatures.indexOf("<feature ", featureEnd) + 9;
        while(featureStart > 8){
            featureEnd = xmlFeatures.indexOf("/>", featureStart);
            if(featureEnd > featureStart){
                let featureContent = xmlFeatures.substring(featureStart, featureEnd).trim();
                let featureArguments = this.ParseArguments(featureContent);

                let name;
                let type;
                let value;

                for (let i = 0; i < featureArguments.length; i++) {
                    let argumentParts = featureArguments[i].split('=');
                    if(argumentParts.length == 2) {
                        if(argumentParts[0] === "name") name = argumentParts[1];
                        else if(argumentParts[0] === "type") type = argumentParts[1];
                        else if(argumentParts[0] === "value") value = argumentParts[1];
                    }                    
                }

                features.push(new Feature(name, type, value));
                featureStart = xmlFeatures.indexOf("<feature ", featureEnd) + 9;
            }
            else {
                featureStart = -1;
            }
        }
        return features;
    }

    ParseHierarchies() {    
        let rawHierarchies = new Map();  
        let hierarchyEnd = 0;
        let hierarchyStart = this.xmlHierarchies.indexOf("<hierarchy ", hierarchyEnd) + 11;
        while(hierarchyStart > 10)
        {          
            hierarchyEnd = this.xmlHierarchies.indexOf("/>", hierarchyStart);
            if(hierarchyEnd > hierarchyStart){
                let hierarchyContent = this.xmlHierarchies.substring(hierarchyStart, hierarchyEnd).trim();
                let hierarchyArguments = this.ParseArguments(hierarchyContent);

                let name;
                let hierarchyUUID;
                let parentUUID;
                let thingUUID;
                let order;
                let hidden;

                for (let i = 0; i < hierarchyArguments.length; i++) {
                    let argumentParts = hierarchyArguments[i].split('=');
                    if(argumentParts.length == 2) {
                        if(argumentParts[0] === "name") name = argumentParts[1];
                        else if(argumentParts[0] === "hierarchyuuid") hierarchyUUID = argumentParts[1];
                        else if(argumentParts[0] === "parentuuid") parentUUID = argumentParts[1];
                        else if(argumentParts[0] === "thinguuid") thingUUID = argumentParts[1];
                        else if(argumentParts[0] === "order") order = argumentParts[1];
                        else if(argumentParts[0] === "hidden"){
                            hidden = argumentParts[1].toLowerCase();
                        } 
                    }
                }
                if(hidden !== "true") {
                    let hierarchy = undefined;
                    if(parentUUID !== "00000000-0000-0000-0000-000000000000"){
                        let parent = rawHierarchies.get(parentUUID);
                        if(parent !== undefined){
                            hierarchy = new Hierarchy(name,hierarchyUUID,parent,order);
                            parent.children.push(hierarchy)
                        }
                    }
                    else{
                        hierarchy = new Hierarchy(name,hierarchyUUID,undefined,order);
                    }
                    if(hierarchy !== undefined){ 
                        hierarchy.thing = this.GetThinByThingUUID(thingUUID);
                        this.Hierarchies.push(hierarchy);
                        rawHierarchies.set(hierarchyUUID, hierarchy);
                    }
                }



                hierarchyStart = this.xmlHierarchies.indexOf("<hierarchy ", hierarchyEnd) + 11;
            }
            else{
                hierarchyStart = -1;
            }            
        }

        // for(let i = 0; i < this.Hierarchies.length; i++){
        //     this.Hierarchies[i].children = this.GetHierarchiesByParent(this.Hierarchies[i].hierarchyUUID);
        // }
    }

    ParseArguments(argumentsText){
        let hierarchyArguments = [];
        let quotationMarkOpen = false;
        let start = 0;
        for(let i = 0; i < argumentsText.length;i++) {
            if(argumentsText[i] == "\""){
                if(quotationMarkOpen){
                    hierarchyArguments.push(argumentsText.substring(start, i).trim().replace("\"",""));
                    quotationMarkOpen = false;
                    start = i + 1;
                }
                else{
                    quotationMarkOpen = true;
                }
            }
        }
        return hierarchyArguments;
    }

    GetHierarchiesByParent(parentUUID){
        let hierarchies = []
        for(let i = 0; i < this.Hierarchies.length; i++){
            if(this.Hierarchies[i].parentUUID == parentUUID){
                hierarchies.push(this.Hierarchies[i]);
            }
        }
        return hierarchies;
    }

    GetThinByThingUUID(thingUUID){
        let thing;
        for(let i = 0; i < this.things.length; i++){
            if(this.things[i].thingUUID == thingUUID){
                thing = this.things[i];
            }
        }
        return thing;
    }

    GetHierarchyByHierarchyUUID(hierarchyUUID){
        let hierarchy;
        for(let i = 0; i < this.Hierarchies.length; i++){
            if(this.Hierarchies[i].hierarchyUUID == hierarchyUUID){
                hierarchy = this.Hierarchies[i];
            }
        }
        return hierarchy;
    }

    GetDeviceHierarchies(){
        let hierachies = [];

        let rootHierarchies = [];
        for(let i = 0; i < this.Hierarchies.length; i++){
            if(this.Hierarchies[i].parent === undefined) {
                rootHierarchies.push(this.Hierarchies[i])
            }
        }
        
        for(let rootHierarchy of rootHierarchies){
            let raakeOSDeviceHierarchies = rootHierarchy.GetHierarchyByFeature("ThingType", "RaakeOSDevice");
            for(let raakeOSDeviceHierarchy of raakeOSDeviceHierarchies){
                hierachies.push(raakeOSDeviceHierarchy);
            }
        }        

        return hierachies;
    }
}


  module.exports = ConfigurationHandler;