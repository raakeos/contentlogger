//Feature
class Feature {
    constructor(name, type, value) {
        this.name = name;
        this.type = type;
        this.value = value;       
    }
}

//Thing
class Thing {
    constructor(name, thingUUID) {
        this.name = name;
        this.thingUUID = thingUUID;
        this.features = [];     
    }

    GetFeatureByName(name){
        let feature;

        for(let i = 0; i < this.features.length; i++){
            if(this.features[i].name == name){
                feature = this.features[i];
            }
        }

        return feature;
    }

    GetFeature(name, value){
        let feature;

        for(let i = 0; i < this.features.length; i++){
            if(this.features[i].name == name && this.features[i].value == value){
                feature = this.features[i];
            }
        }

        return feature;
    }
}

//Hierrachy
class Hierarchy {
    constructor(name, hierarchyUUID, parent, order, hidden) {
        this.name = name;
        this.hierarchyUUID = hierarchyUUID;
        this.parent = parent;
        this.parentUUID = parent === undefined ? undefined : parent.hierarchyUUID;    
        this.order = order; 
        this.thing;  
        this.children = [];
        this.hidden = hidden;
    }

    GetChildrenByFeature(featureName, featureValue){
        let children = [];

        for(let child of this.children){
            let thing = child.thing;
            if(thing !== undefined){
                let featureExists = thing.GetFeature(featureName, featureValue);
                if( featureExists !== undefined){
                    children.push(child);
                }
            }

            let childChildren = child.GetChildrenByFeature(featureName, featureValue);
            for(let childChild of childChildren){
                children.push(childChild);
            }
        }        

        return children;
    }

    GetParentByFeature(featureName, featureValue){
        let parent = undefined;

        if(this.parent !== undefined){
            if(this.parent.thing !== undefined){
                let feature = this.parent.thing.GetFeature(featureName, featureValue);
                if(feature !== undefined){
                    parent = this.parent;
                }
            }

            if(parent === undefined){
                parent = this.parent.GetParentByFeature(featureName, featureValue);
            }
        }

        

        return parent;
    }
}


//ConfigurationHandler
class ConfigurationHandler {
    constructor(xmlContent, getHidden = false) {
      this.xmlContent = xmlContent;
      this.getHidden = getHidden;
      this.Hierarchies = [];
      this.rawHierarchies = new Map();  
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
        this.rawHierarchies = new Map();
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
                let hidden = false;

                for (let i = 0; i < hierarchyArguments.length; i++) {
                    let argumentParts = hierarchyArguments[i].split('=');
                    if(argumentParts.length == 2) {
                        if(argumentParts[0] === "name") name = argumentParts[1];
                        else if(argumentParts[0] === "hierarchyuuid") hierarchyUUID = argumentParts[1];
                        else if(argumentParts[0] === "parentuuid") parentUUID = argumentParts[1];
                        else if(argumentParts[0] === "thinguuid") thingUUID = argumentParts[1];
                        else if(argumentParts[0] === "order") order = argumentParts[1];
                        else if(argumentParts[0] === "hidden"){
                            hidden = argumentParts[1].toLowerCase() === 'true';
                        } 
                    }
                }

                if(hidden !== true || this.getHidden === true) {
                    let hierarchy = undefined;
                    if(parentUUID !== "00000000-0000-0000-0000-000000000000"){
                        let parent = this.rawHierarchies.get(parentUUID);
                        if(parent !== undefined){
                            hierarchy = new Hierarchy(name, hierarchyUUID, parent, order, hidden);
                            parent.children.push(hierarchy)
                        }
                    }
                    else{
                        hierarchy = new Hierarchy(name, hierarchyUUID, undefined, order, hidden);
                    }
                    if(hierarchy !== undefined){ 
                        hierarchy.thing = this.GetThinByThingUUID(thingUUID);
                        this.Hierarchies.push(hierarchy);
                        this.rawHierarchies.set(hierarchyUUID, hierarchy);
                    }
                }
                
                hierarchyStart = this.xmlHierarchies.indexOf("<hierarchy ", hierarchyEnd) + 11;
            }
            else{
                hierarchyStart = -1;
            }            
        }
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

    GetXMLContent(){
        let indent = "";
        let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xmlContent = xmlContent + indent + '<imot>\n'
        indent = indent + '    ';
        xmlContent = xmlContent + indent + '<hierarchies>\n';
        indent = indent + '    ';

        //Get hierarchies xml
        let hierarhyXMLs = '';
        for(let i = 0; i < this.Hierarchies.length; i++){
            if(this.Hierarchies[i].parent === undefined){
                hierarhyXMLs = hierarhyXMLs + this.CreateHierarchyXML(this.Hierarchies[i], indent, i);
            }
        }
        xmlContent = xmlContent + hierarhyXMLs;

        indent = '    ';
        xmlContent = xmlContent + indent + '</hierarchies>\n\n';

        //Get things xml
        xmlContent = xmlContent + indent + '<things>\n';

        let thingXMLs = '';
        indent = indent + '    ';
        for(let i = 0; i < this.things.length; i++){
            thingXMLs = thingXMLs + this.CreateThingXML(this.things[i], indent);
        }
        xmlContent = xmlContent + thingXMLs;

        indent = '    ';        
        xmlContent = xmlContent + indent + '</things>\n\n';


        xmlContent = xmlContent + '</imot>\n';
        return xmlContent;
    }

    CreateHierarchyXML(hierarchy, indent, order){
        let hierarhyXML = indent + '<hierarchy ';
        hierarhyXML = hierarhyXML + 'name="' + hierarchy.name + '" ';
        hierarhyXML = hierarhyXML + 'hierarchyuuid="' + hierarchy.hierarchyUUID + '" ';
        let parentUUID = hierarchy.parent === undefined ? '00000000-0000-0000-0000-000000000000' : hierarchy.parent.hierarchyUUID;
        hierarhyXML = hierarhyXML + 'parentuuid="' + parentUUID + '" ';
        let thingUUID = hierarchy.thing === undefined ? '00000000-0000-0000-0000-000000000000' : hierarchy.thing.thingUUID;
        hierarhyXML = hierarhyXML + 'thinguuid="' +  thingUUID + '" ';
        hierarhyXML = hierarhyXML + 'order="' +  order + '" ';
        if(hierarchy.hidden === true){
            hierarhyXML = hierarhyXML + 'hidden="true"';
        }
        hierarhyXML = hierarhyXML + '/>\n';

        //Create children xml
        let childOrder = 0;
        let childIndent = indent + '    ';
        hierarchy.children.forEach((child) => {
            hierarhyXML = hierarhyXML + this.CreateHierarchyXML(child,childIndent, childOrder);
            childOrder++;
        });

        return hierarhyXML;
    }

    CreateThingXML(thing, indent){
        let thingXML = indent + '<thing ';
        thingXML = thingXML + 'name="' + thing.name + '" ';
        thingXML = thingXML + 'thinguuid="' + thing.thingUUID + '">\n';

        thing.features.forEach((feature) => {
            let featureXML = indent + '    <feature ';
            featureXML = featureXML + 'name="' + feature.name + '" ';
            featureXML = featureXML + 'type="' + feature.type + '" ';
            featureXML = featureXML + 'value="' + feature.value + '"/>\n';
            thingXML = thingXML + featureXML;
        });
        thingXML = thingXML + indent + '</thing>\n\n'
        return thingXML;
    }
}

export { ConfigurationHandler, Feature, Thing, Hierarchy };

