class LoggerBlock {
    constructor(hierarchy){
        this.hierarchy = hierarchy;
        this.connectionNodes = new Map();
        this.datafiles = new Map();

        this.apiHierarchy = hierarchy.GetParentByFeature("ThingType", "ContentLoggerAPI");
        this.apiIPAddress = undefined;
        this.apiPort = undefined;
        if(this.apiHierarchy !== undefined){
            if(this.apiHierarchy.thing !== undefined){
                let ipFeature = this.apiHierarchy.thing.GetFeatureByName("IPAddress");
                let portFeature = this.apiHierarchy.thing.GetFeatureByName("Port");
                if(ipFeature !== undefined && portFeature !== undefined){
                    this.apiIPAddress = ipFeature.value;
                    this.apiPort = portFeature.value;
                }
            }             
        }
    }

    isDataUpToDate(startTimestamp, endTimestamp)
    {
        let startFileFound = false;
        let endFileFound = false;
        for(let[key, value] of this.datafiles){
            if(!startFileFound && startTimestamp >= value.startTimestamp && startTimestamp <= value.endTimestamp)
            {
                startFileFound = true;
                if(endFileFound || value.endTimestamp == 9999999999000)
                {
                    break;
                }
            }

            if(!endFileFound && endTimestamp >= value.startTimestamp && endTimestamp <= value.endTimestamp)
            {
                endFileFound = true;
                if(startFileFound || value.endTimestamp == 9999999999000)
                {
                    break;
                }
            }
        }
        return startFileFound && endFileFound;
    }

    GetContentTags(uuids){
        let contentTags = [];
        this.connectionNodes.forEach(connectionNode =>{
            uuids.forEach(uuid =>{
                let contentTag = connectionNode.contentTags.get(uuid);
                if(contentTag !== undefined){
                    contentTags.push(contentTag);
                }
            });
        });

        return contentTags;
    }
}

export { LoggerBlock };