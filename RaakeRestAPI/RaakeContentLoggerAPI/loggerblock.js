var MariaDBClient = require('./mariadbclient.js');
var RaakeDBClient = require('./raakedbclient.js');
var ConnectionNode = require('./connectionnode.js');



class LoggerBlock {
    constructor(hierarchy){  
        this.hierarchy = hierarchy; 
        this.connectionNode = undefined;
        this.mariaDBClient = undefined;        
        this.raakeDBClient = undefined;

        //Create ConnectionNode instance
        let connectionNodeHierarchies = this.hierarchy.GetChildrenByFeature("ThingType", "ConnectionNode");
        if(connectionNodeHierarchies.length === 1){
            this.connectionNode = new ConnectionNode(connectionNodeHierarchies[0]);
        }
        else{
            if(connectionNodeHierarchies.length === 0){
                console.log("Cannot create logger block(%s), because it has no ConnectionNode child", uuid);
            }
            else{
                console.log("Cannot create logger block(%s), because it has more than one ConnectionNode children", uuid);
            }
            
        }       
                
        let databaseClientHierarchies = this.hierarchy.GetChildrenByFeature("ThingType", "DatabaseClient");
        for(let databaseClientHierarchy of databaseClientHierarchies){
            let databaseTypeFeature = databaseClientHierarchy.thing.GetFeatureByName("DatabaseType");
            if(databaseTypeFeature !== undefined){
                if(databaseTypeFeature.value.toLowerCase() == "mariadb"){
                    this.mariaDBClient = new MariaDBClient(databaseClientHierarchy);
                }
                else if(databaseTypeFeature.value.toLowerCase() == "raakedb"){
                    this.raakeDBClient = new RaakeDBClient(databaseClientHierarchy);
                }
            }
        }
    }
    Stop(){
        if(this.connectionNode !== undefined){
            this.connectionNode.Stop();
            delete this.connectionNode;
        }

        if(this.mariaDBClient !== undefined){
            delete this.mariaDBClient;
        }

        if(this.raakeDBClient !== undefined){
            delete this.raakeDBClient;
        }
    }

    datafiles(request, response){
        if(this.mariaDBClient !== undefined){
            this.mariaDBClient.datafiles(request, response);
        }
        else if (this.raakeDBClient !== undefined) {
            this.raakeDBClient.datafiles(request, response);
        } 
        else {
            console.log('Cannot find dbclient object');
            response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
            response.end('dbclient not found');
        }
    }

    datafile(request, response){
        if(this.mariaDBClient !== undefined){
            this.mariaDBClient.datafile(request, response);
        }
        else if (this.raakeDBClient !== undefined) {
            this.raakeDBClient.datafile(request, response);
        } 
        else {
            console.log('Cannot find dbclient object');
            response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
            response.end('dbclient not found');
        }
    }

    datagram(request, response)
    {
        if(this.hierarchy !== undefined){        
            if(this.connectionNode !== undefined){
                if(this.connectionNode.lastDatagram !== undefined && this.connectionNode.lastDatagram.byteLength > 0){
                    response.writeHead(200, {'Content-Type': 'application/x-binary',
                                                'Content-Disposition': 'attachment;uuid=' + this.connectionNode.hierarchy.hierarchyUUID,
                                                'Content-Length': this.connectionNode.lastDatagram.byteLength,
                                                'Access-Control-Allow-Origin' : '*'});
                    
                                                response.end(Buffer.from(this.connectionNode.lastDatagram));
                }
                else {
                    let errorText = 'Cannot find datagram error';
                    console.log(errorText);

                    response.writeHead(404, {'Content-Type': 'text/xml',
                                                'Content-Length': errorText.length,
                                                'Access-Control-Allow-Origin' : '*'});
                    response.end(errorText);
                }

                return;
            }
        }
    }
}

module.exports = LoggerBlock;