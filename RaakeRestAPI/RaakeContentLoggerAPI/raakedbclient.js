const fs = require('fs');
const Datafile = require('./datafile.js');

class RaakeDBClient {
    constructor(hierarchy){  
        this.hierarchy = hierarchy;     
        this.datafolder = undefined;
        this.tempDatafolder = undefined;   
        
        if(this.hierarchy.thing !== undefined){
            //DataFolder
            let datafolderFeature = hierarchy.thing.GetFeatureByName("DataFolder");
            if(datafolderFeature !== undefined){
                this.datafolder = datafolderFeature.value;
                this.tempDatafolder = (this.datafolder + "/new").replace("//","/");
                
            }
            else{
                console.log("RaakeDBClient DataFolder feature is not defined in configuration XML-file");
            }
        }
        else{
            console.log("RaakeDBClient thing is not defined in configuration XML-file");
        }
    }

    datafiles(request, response){
        if(this.hierarchy !== undefined){
            const uuid = request.query.uuid;
            const starttime = request.query.starttime !== undefined ? parseInt(request.query.starttime) : undefined;
            const endtime = request.query.endtime !== undefined ? parseInt(request.query.endtime): undefined;

            let responseContent = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
            responseContent = responseContent + "<loggerblock><uuid>" + uuid + "</uuid>";
            responseContent = responseContent + "<datafiles>";

            let datafiles = this.GetDatafiles(starttime, endtime);
            let datafileFound = false;
            for(let datafile of datafiles){
                if((starttime >= datafile.starttimestamp && starttime <= datafile.endtimestamp) || 
                    (endtime >= datafile.starttimestamp && endtime <= datafile.endtimestamp) || 
                    (starttime < datafile.starttimestamp && endtime > datafile.endtimestamp)){
                        responseContent = responseContent + datafile.timestamp + ",";
                        datafileFound = true;
                    }  
            }
            if(datafileFound){
                responseContent = responseContent.substring(0, responseContent.length - 1);
            }
            responseContent = responseContent + "</datafiles></loggerblock>"

            response.writeHead(200, {'Content-Type': 'text/xml', 'Access-Control-Allow-Origin' : '*'});
            response.end(responseContent);
        }
        else{
            console.log('Configuration handler error');
            response.status(404); //Not found
            response.send('Configuration handler error');
        }
    }

    datafile(request, response)
    {    
        if(this.hierarchy !== undefined){
            const uuid = request.query.uuid;
            const filename = request.query.filename;

            if(filename.length >= 26){
                var fileStarttime = parseInt(filename.substring(0,13));
                var fileEndtime = parseInt(filename.substring(13,27));
                
                let datafile = this.GetDatafile(fileStarttime, fileEndtime, filename);
                if(datafile !== undefined){

                    if(datafile.folder !== undefined && datafile.filename != undefined)
                    {
                        let filename = (datafile.folder + "/" + datafile.filename).replace("//", "/");
                        if(fs.existsSync(filename)){
                            var dataContent = fs.readFileSync(filename);
                            if(dataContent.length > 0){
                                response.writeHead(200, {'Content-Type': 'application/x-binary',
                                                            'Content-Disposition': 'attachment;filename=' + datafile.timestamp,
                                                            'Content-Length': dataContent.length,
                                                            'Access-Control-Allow-Origin' : '*'});
                                
                                response.end(dataContent);
                                console.log(filename)
                            }
                        }
                        else{
                            console.log('File not found');
                            response.writeHead(400, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'});                                
                            response.end('File not found');                                
                        }
                    }
                }
                else{
                    console.log('Datafile error');
                    response.writeHead(404, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'});                                
                    response.end('Datafile error');
                }

                
                
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


    GetDatafile(starttime, endtime, filename) {
        var foundDatafile;

        let datafiles = this.GetFolderDatafiles(this.tempDataFolder, starttime, endtime);
        if(datafiles.length == 0)
        {
            //file is not in the temp folder
            datafiles = this.GetFolderDatafiles(this.datafolder, starttime, endtime);
        }
        for(let datafile of datafiles){
            if(datafile.timestamp == filename){
                foundDatafile = datafile;
                break;
            }
        }   

        return foundDatafile;
    }


    GetDatafiles(starttime, endtime) {  
        var files = [];

        if(this.datafolder !== undefined){             
            let folder = this.datafolder;            

            if(fs.existsSync(folder)){
                fs.readdirSync(folder, {withFileTypes: true})
                .forEach(file => {
                    if(file.isDirectory())
                    {
                        if(file.name.length == 26){
                            var folderStarttime = parseInt(file.name.substring(0,13));
                            var folderEndtime = parseInt(file.name.substring(13,27));
                            if((starttime >= folderStarttime && starttime <= folderEndtime) ||
                                (endtime >= folderStarttime && endtime <= folderEndtime) ||
                                (starttime < folderStarttime && endtime > folderEndtime) ||
                                (starttime === undefined || endtime === undefined))
                            {
                                const childFolder = folder + '/' + file.name + '/';
                                files = files.concat(this.GetFolderDatafiles(childFolder.replace("//","/"), starttime, endtime));
                            }
                        }
                        else{
                            const childFolder = folder + '/' + file.name + '/';
                            files = files.concat(this.GetFolderDatafiles(childFolder.replace("//","/"), starttime, endtime));
                        }
                    }
                    file.close;
                });
            }    
        }
        else{
            console.log("DataFolder is undefined");
        }
        return files;
    }

    GetFolderDatafiles(folder, starttime, endtime) {
        var files = [];
        if(fs.existsSync(folder)){
            fs.readdirSync(folder, {withFileTypes: true})
            .forEach(file => {
                if(file.isDirectory())
                {
                    const childFolder = folder + '/' + file.name + '/';
                    files = files.concat(this.GetFolderDatafiles(childFolder.replace("//","/"), starttime, endtime));
                }
                else
                {
                    if(file.name.length == 30)
                    {
                        var fileStarttime = parseInt(file.name.substring(0,13));
                        var fileEndtime = parseInt(file.name.substring(13,27));
                        if((starttime >= fileStarttime && starttime <= fileEndtime) ||
                            (endtime >= fileStarttime && endtime <= fileEndtime) ||
                            (starttime < fileStarttime && endtime > fileEndtime) ||
                            (starttime === undefined || endtime === undefined))
                        {
                            files.push(new Datafile(folder, file.name));                            
                        }
                        
                    }         
                }
                file.close;
            });
        }
        return files;
    }
}

module.exports = RaakeDBClient;