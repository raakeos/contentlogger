const mariadb = require('mariadb');

class MariaDBClient {
    constructor(hierarchy){  
        this.hierarchy = hierarchy;        
        //HostName
        let hostNameFeature = hierarchy.thing.GetFeatureByName("HostName");
        if(hostNameFeature !== undefined){
            this.hostname = hostNameFeature.value;
        }
        else{
            console.log("HostName feature is not defined in configuration XML-file");
        }

        //DatabaseName
        let databaseNameFeature = hierarchy.thing.GetFeatureByName("DatabaseName");
        if(databaseNameFeature !== undefined){
            this.databasename = databaseNameFeature.value;
        }
        else{
            console.log("DatabaseName feature is not defined in configuration XML-file");
        }

        //Username
        let usernameFeature = hierarchy.thing.GetFeatureByName("Username");
        if(usernameFeature !== undefined){
            this.username = usernameFeature.value;
        }
        else{
            console.log("Username feature is not defined in configuration XML-file");
        }

        //Password
        let passwordFeature = hierarchy.thing.GetFeatureByName("Password");
        if(passwordFeature !== undefined){
            this.password = passwordFeature.value;
        }
        else{
            console.log("Password feature is not defined in configuration XML-file");
        }

        this.mariaDBPool = mariadb.createPool({
            host: this.hostname, 
            user: this.username, 
            password: this.password,
            database: this.databasename,
            connectionLimit: 5
        });
    }

    datafiles(request, response){    
        if(this.hierarchy !== undefined){
            const uuid = request.query.uuid;
            const starttime = request.query.starttime;
            const endtime = request.query.endtime;

            if(this.mariaDBPool  !== undefined){
                this.mariaDBPool.getConnection()
                .then(conn => {     
                    let hexUUID = this.createHex(uuid);//'A9681C6D969E2148B007A8B505BC1C77';
                    let queryString = "SELECT MIN(Timestamp) AS start, MAX(Timestamp) AS end FROM ContentLoggerValue WHERE ";
                    queryString = queryString + "Timestamp>=" + starttime;
                    queryString = queryString + " AND Timestamp<=" + endtime;
                    queryString = queryString + " AND HEX(HierarchyUUID)='" + hexUUID +"';";
                    conn.query(queryString).then((rows) => {
                        let responseContent = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
                        responseContent = responseContent + "<connectionnode><uuid>" + uuid + "</uuid>";
                        responseContent = responseContent + "<datafiles>";


                        let filename = '';
                        for(let row of rows){
                            if(row.start !== null && row.end !== null)
                            {
                                let filename = row.start.toString();
                                filename = filename + row.end.toString();
                                if(filename.length === 26){
                                    responseContent = responseContent + filename;
                                }     
                            }                   
                        }
                        responseContent = responseContent + "</datafiles></connectionnode>"
                        
                        response.writeHead(200, {'Content-Type': 'text/xml', 'Access-Control-Allow-Origin' : '*'});
                        response.end(responseContent);  
                    })
                    .then((res) => {
                        conn.end();
                    })
                    .catch(err => {
                        //handle error
                        console.log(err); 
                        conn.end();
                    })
                    
                }).catch(err => {
                    response.status(404); //Not found
                    response.send(err);
                });
            }
            else{
                response.status(404); //Not found
                response.send('Configuration handler error');
            }
        }
    }

    datafile(request, response)
    {    
        if(this.hierarchy !== undefined){
            const uuid = request.query.uuid;
            const filename = request.query.filename;

            if(filename.length >= 26){
                var starttime = parseInt(filename.substring(0,13));
                var endtime = parseInt(filename.substring(13,27));

                let dataContent = undefined;
                if(this.mariaDBPool  !== undefined){
                    this.mariaDBPool.getConnection()
                    .then(conn => {     
                        let hexUUID = this.createHex(uuid);//'A9681C6D969E2148B007A8B505BC1C77';
                        let queryString = "SELECT ValueData FROM ContentLoggerValue WHERE ";
                        queryString = queryString + "Timestamp>=" + starttime;
                        queryString = queryString + " AND Timestamp<=" + endtime;
                        queryString = queryString + " AND HEX(HierarchyUUID)='" + hexUUID +"';";
                        
                        conn.query(queryString).then((rows) => {
                            for(let row of rows){
                                if(dataContent !== undefined){
                                    //dataContent = dataContent + row.ValueData;  
                                    dataContent = Buffer.concat([dataContent, row.ValueData]);
                                    //dataContent = tempContent;
                                }
                                else{
                                    dataContent = row.ValueData; 
                                }             
                            }                         
                        })
                        .then((res) => {
                            conn.end();
                            
                            if(dataContent !== undefined && dataContent.length > 0){
                                var buffer = Buffer.from(dataContent);
                                response.writeHead(200, {'Content-Type': 'application/x-binary',
                                                                        'Content-Disposition': 'attachment;filename=' + filename,
                                                                        'Content-Length': dataContent.length,
                                                                        'Access-Control-Allow-Origin' : '*'});
                                            
                                response.end(dataContent);
                                console.log(filename)
                            }
                            else {
                                console.log("datafile not found");
                                response.status(404); //Not found
                                response.send("datafile not found");
                            }
                        })
                        .catch(err => {
                            //handle error
                            console.log(err); 
                            conn.end();
                        })
                        
                    }).catch(err => {
                        response.status(404); //Not found
                        response.send(err);
                    });
                    
                }
                else{
                    response.status(404); //Not found
                    response.send('Configuration handler error');
                }


                // let loggerBlock = this.loggerBlocks.get(uuid);
                // if(loggerBlock !== undefined){
                //     let datafile = loggerBlock.GetDatafile(fileStarttime, fileEndtime, filename);
                //     if(datafile !== undefined){

                //         if(datafile.folder !== undefined && datafile.filename != undefined)
                //         {
                //             let filename = (datafile.folder + "/" + datafile.filename).replace("//", "/");
                //             //var dataContent = fs.readFileSync(filename, {encoding:'binary', flag:'r'});
                //             if(fs.existsSync(filename)){
                //                 var dataContent = fs.readFileSync(filename);
                //                 if(dataContent.length > 0){
                //                     response.writeHead(200, {'Content-Type': 'application/x-binary',
                //                                                 'Content-Disposition': 'attachment;filename=' + datafile.timestamp,
                //                                                 'Content-Length': dataContent.length,
                //                                                 'Access-Control-Allow-Origin' : '*'});
                                    
                //                     response.end(dataContent);
                //                     console.log(filename)
                //                 }
                //             }
                //             else{
                //                 console.log('File not found');
                //                 response.writeHead(400, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'});                                
                //                 response.end('File not found');                                
                //             }
                //         }
                //     }
                //     else{
                //         console.log('Datafile error');
                //         response.writeHead(404, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'});                                
                //         response.end('Datafile error');
                //     }

                // }
                // else{
                //     console.log('Given uuid is wrong' + uuid);
                //     response.writeHead(400, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'}); //Bad request
                //     response.send('Given uuid is wrong');
                // }
            }
            else{
                console.log('Given filename is wrong ' + filename);
                response.writeHead(400, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'}); //Bad request
                response.send('Given filename is wrong ' + filename);
            }
        }
        else{
            console.log('Configuration handler error');
            response.writeHead(400, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'}); //Not found
            response.send('Configuration handler error');
        }
    }  

    createHex(uuid){
        let hex = '';

        if(uuid.length === 36){
            let uuidParts = uuid.split('-');
            if(uuidParts.length === 5){
                for(let i = 0; i < uuidParts.length; i++){
                    let uuidPart = uuidParts[i];
                    if(i < 3){
                        for(let j = uuidPart.length; j > 0; j=j-2){
                            hex = hex + uuidPart.substr(j-2, 2).toUpperCase();
                        }
                    }
                    else{
                        for(let j = 0; j < uuidPart.length; j=j+2){
                            hex = hex + uuidPart.substr(j, 2).toUpperCase();
                        }
                    }
                }
            }
        }

        return hex;
    }
}



module.exports = MariaDBClient;