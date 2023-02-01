var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var RaakeConfigAPI = require('./RaakeConfigAPI/configapi.js');
var RaakeDeviceAPI = require('./RaakeConfigAPI/deviceapi.js');
var RaakeContentLoggerAPI = require('./RaakeContentLoggerAPI/contentloggerapi.js');
var ConfigurationHandler = require('./common/configurationhandler.js');
const RaakeServiceAPI = require('./RaakeServiceAPI/serviceapi.js');
var path = require('path');
var fs = require('fs');

class RaakeRestAPI {
    constructor(configFilename, uuid) {   
        this.configFilename = configFilename;
        this.uuid = uuid;
        this.server = undefined;
        this.app = express();
        this.app.use(bodyParser.raw({ inflate: true, limit: '100mb', type: 'text/xml' }));
        this.app.use(cors());
        this.ipAddress = "127.0.0.1";
        this.port = 40001;

        this.StartDeviceAPI(); 
        this.StartServiceAPIs();
        this.StartExpressServer();
    }

    StartDeviceAPI(){
        this.raakeDeviceAPI = new RaakeDeviceAPI();
        this.deviceAPIIPAddress = "127.0.0.1";
        this.deviceAPIPort = 40001;

        //get device
        this.app.get('/device', (request, response) => { 
            this.raakeDeviceAPI.getDevice(request, response);
        });  

        //put device
        this.app.put('/device', (request, response) => { 
            this.raakeDeviceAPI.putDevice(request, response);
        });          
    }

    StartServiceAPIs(){

        this.raakeConfigAPI = new RaakeConfigAPI(this.configFilename);
        this.CreateConfigAPI(); 
        if(this.raakeConfigAPI.configXML !== undefined){
            this.configurationHandler = new ConfigurationHandler(this.raakeConfigAPI.configXML); 
            this.deviceHierarchy = this.configurationHandler.GetHierarchyByHierarchyUUID(this.uuid);

            if(this.deviceHierarchy != undefined){
                this.serviceAPI = new RaakeServiceAPI(this.deviceHierarchy);
                this.CreateServiceAPI();
                
                
                let contentLoggerHierarchies = this.deviceHierarchy.GetChildrenByFeature("ThingType", "ContentLogger");
                if(contentLoggerHierarchies.length === 1){
                    if(this.contentLoggerAPI != undefined){
                        this.contentLoggerAPI.Stop();
                    }
                    delete this.contentLoggerAPI;
                    this.contentLoggerAPI = new RaakeContentLoggerAPI(contentLoggerHierarchies[0]);                         
                    

                    this.CreateContentLoggerAPI();                                                   
                }
                else{
                    if(contentLoggerHierarchies.length > 1){
                        console.log("Cannot start Content Logger API service, because device config.xml contains more than one ContentLogger-things", this.uuid);
                    }
                }                                           
            }
            else{
                console.log("Cannot start RestAPI service, because service hierarchyUUID(%s) not found from config.xml", this.uuid);
            }
        }
        else{
            console.log("Cannot start RestAPI service, because config.xml is not exists");
        }
        
    }  

    StartExpressServer(){ 
        var self = this;
        this.server = this.app.listen(this.port, function() {
            console.log("RestAPI listening at http://%s:%s", self.ipAddress, self.port );                            
        })
    }
    
    CreateConfigAPI(){
        //get config
        this.app.get('/config', (request, response) => { 
            this.raakeConfigAPI.getConfig(request, response);
        });

        //put config
        this.app.put('/config', (request, response) => { 
            this.raakeConfigAPI.putConfig(request, response);
            this.StartServiceAPIs();
        });        
    }

    CreateContentLoggerAPI(){
        //get datafiles
        this.app.get('/datafiles', (request, response) => { 
            this.contentLoggerAPI.getDatafiles(request, response);
        });

        //get datafile
        this.app.get('/datafile', (request, response) => { 
            this.contentLoggerAPI.getDatafile(request, response);
        });
        
        //get datagram
        this.app.get('/datagram', (request, response) => { 
            this.contentLoggerAPI.getDatagram(request, response);
        });
    }

    CreateServiceAPI(){
        //get service
        this.app.get('/service', (request, response) => { 
            this.serviceAPI.getService(request, response);
        });

        //put service
        this.app.put('/service', (request, response) => { 
            this.serviceAPI.putService(request, response);
        });
    }
}




//Read arguments
var workingFolder = __dirname;
var raakeosFolder = path.resolve(workingFolder, '..');
var binFolder = raakeosFolder + "/bin";
var configFilename = binFolder + "/config.xml";
var deviceUUIDFilename = raakeosFolder + "/deviceUUID";
var uuid = "";
if(fs.existsSync(deviceUUIDFilename)){
    uuid = fs.readFileSync(deviceUUIDFilename, {encoding:'utf8', flag:'r'});
}
var raakeRestAPI = new RaakeRestAPI(configFilename, uuid);
