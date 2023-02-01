const Feature = require('./feature.js');

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

module.exports = Thing;