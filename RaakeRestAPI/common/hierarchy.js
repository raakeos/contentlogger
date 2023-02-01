const Feature = require('./feature.js');
const Thing = require('./thing.js');

class Hierarchy {
    constructor(name, hierarchyUUID, parent, order) {
        this.name = name;
        this.hierarchyUUID = hierarchyUUID;
        this.Parent = parent;  
        this.order = order; 
        this.thing = undefined;  
        this.children = [];
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

        if(this.Parent !== undefined){
            if(this.Parent.thing !== undefined){
                let feature = this.Parent.thing.GetFeature(featureName, featureValue);
                if(feature !== undefined){
                    parent = this.Parent;
                }
            }

            if(parent === undefined){
                parent = this.parent.GetParentByFeature(featureName, featureValue);
            }
        }        

        return parent;
    }

    GetHierarchyByHierarchyUUID(hierarchyUUID){
        let hierarchy = undefined;
        for(let i = 0; i < this.children.length; i++){
            if(this.children[i].hierarchyUUID === hierarchyUUID){
                hierarchy = this.children[i];
            }
            else{
                hierarchy = this.children[i].GetHierarchyByHierarchyUUID(hierarchyUUID);
            }
            if(hierarchy !== undefined){
                break;
            }
        }        
        return hierarchy;
    }
}

module.exports = Hierarchy;