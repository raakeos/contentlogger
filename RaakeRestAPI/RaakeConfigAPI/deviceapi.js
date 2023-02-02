var fs = require('fs');
const path = require('path');
var os = require('os');

class RaakeDeviceAPI {
    constructor() {
        this.configXML = undefined;
        this.uuidMissingHTML = "uuidmissing.html"

        this.workingFolder = __dirname;
        this.raakeosFolder = path.resolve(this.workingFolder, '../..');
        this.binFolder = this.raakeosFolder + "/bin";
        this.webFolder = this.raakeosFolder + "/WebUI";
        this.configFilename = this.binFolder + "/config.xml";
        this.nouuidFilename = this.webFolder + "/nouuid.html";
        this.noconfigxmlFilename = this.webFolder + "/noconfigxml.html";
        this.deviceUUIDFilename = this.raakeosFolder + "/deviceUUID";
        this.deviceUUID = undefined;
        this.ipAddress = "127.0.0.1";

        let networkInterfaceNames = [];
        let networkInterfaces = os.networkInterfaces();
        for (let networkInterfaceName in networkInterfaces) {
            networkInterfaceNames.push(networkInterfaceName);
        }
        let defaultInterfaceName = "eth0";
        if(networkInterfaceNames.includes(defaultInterfaceName)){
            let defaultInterface = networkInterfaces[defaultInterfaceName];
            for(let i = 0; i < defaultInterface.length; i++){
                if(defaultInterface[i].family === 'IPv4' && defaultInterface[i].address !== '127.0.0.1' && !defaultInterface[i].internal){
                    this.ipAddress = defaultInterface[i].address;
                    break;
                }
            }  
        }
        else{
            for (let networkInterfaceName in networkInterfaces) {
                let networkInterface = networkInterfaces[networkInterfaceName];
                for(let i = 0; i < networkInterface.length; i++){
                    if(networkInterface[i].family === 'IPv4' && networkInterface[i].address !== '127.0.0.1' && !networkInterface[i].internal){
                        if(networkInterface[i].address.includes("192.168.7")){
                            this.ipAddress = networkInterface[i].address;
                            break;
                        }
                    }
                }            
            }
        }

        this.getDeviceUUID();
        this.getConfigXML();   
    }

    getDeviceUUID(){
        if(fs.existsSync(this.deviceUUIDFilename)){
            this.deviceUUID = fs.readFileSync(this.deviceUUIDFilename, {encoding:'utf8', flag:'r'});
        }
    }

    getConfigXML(){
        if(fs.existsSync(this.configFilename)){
            this.configXML = fs.readFileSync(this.configFilename, {encoding:'utf8', flag:'r'});
        }
    }


    getDevice(request, response) {
        console.log('get device')
        const exampleconfig = request.query.exampleconfig;
        if(exampleconfig === undefined){
            if(this.deviceUUID !== undefined) {
                if(this.configXML !== undefined){
                    response.writeHead(200, {'Content-Type' : 'text/xml',
                                            'Access-Control-Allow-Origin' : '*',
                                            'Access-Control-Allow-Methods' : 'GET, PUT'});

                    let deviceXML = '<!--?xml version="1.0" encoding="UTF-8"?-->';
                    deviceXML = deviceXML + '<device>';
                    deviceXML = deviceXML + '<uuid>' + this.deviceUUID + '</uuid>';
                    deviceXML = deviceXML + '</device>';
                    response.end(deviceXML);
                }
                else{
                    this.configXMLNotFound(request, response);                
                }
            }
            else {
                this.uuidNotFound(request, response);
            }
        }
        else{
            let newThingUUID = this.newUUID();
            let defaultXML = '<?xml version="1.0" encoding="UTF-8"?>\n';
            defaultXML = defaultXML + '<imot>\n';
            defaultXML = defaultXML + '    <hierarchies>\n';
            defaultXML = defaultXML + '        <hierarchy name="New RaakeOS device" hierarchyuuid="${hierarchyUUID}" parentuuid="00000000-0000-0000-0000-000000000000" thinguuid="${thingUUID}" order="0"/>\n';
            defaultXML = defaultXML + '    </hierarchies>\n\n';
            defaultXML = defaultXML + '    <things>\n';
            defaultXML = defaultXML + '        <thing name="New RaakeOS device" thinguuid="${thingUUID}">\n';
            defaultXML = defaultXML + '            <feature name="ThingType" type="text" value="RaakeOSDevice"/>\n';
            defaultXML = defaultXML + '            <feature name="IPAddress" type="text" value="${ipAddress}"/>\n';
            defaultXML = defaultXML + '        </thing>\n\n';
            defaultXML = defaultXML + '    </things>\n\n';
            defaultXML = defaultXML + '</imot>\n';
            defaultXML = defaultXML.replace("${hierarchyUUID}", this.deviceUUID);
            defaultXML = defaultXML.replaceAll("${thingUUID}", newThingUUID);
            defaultXML = defaultXML.replaceAll("${ipAddress}", this.ipAddress);
            response.writeHead(200, {'Content-Type' : 'text/xml',
                                    'Access-Control-Allow-Origin' : '*',
                                    'Access-Control-Allow-Methods' : 'GET, PUT'});
            response.end(defaultXML);
        }
    }

    putDevice(request, response) {
        console.log('put device')
        const uuid = request.query.uuid;
        if(uuid !== undefined) {
            fs.writeFileSync(this.deviceUUIDFilename, uuid);
            this.getDeviceUUID();
            this.getConfigXML();
        }

        response.writeHead(200, {'Content-Type': 'text/plain','Access-Control-Allow-Origin' : '*'});
        response.end("OK");
    }

    uuidNotFound(request, response){
        let uuidNotFound = '<!--?xml version="1.0" encoding="UTF-8"?-->';
        uuidNotFound = uuidNotFound + '<device>';
        uuidNotFound = uuidNotFound + '<uuid></uuid>';
        uuidNotFound = uuidNotFound + '</device>';
        response.writeHead(200, {'Content-Type' : 'text/xml',
                        'Access-Control-Allow-Origin' : '*',
                        'Access-Control-Allow-Methods' : 'GET, PUT'});
        response.end(uuidNotFound);  

        // if(fs.existsSync(this.nouuidFilename)){
        //     let nooUUIDHTML = fs.readFileSync(this.nouuidFilename, {encoding:'utf8', flag:'r'});
        //     response.writeHead(200, {'Content-Type' : 'text/html',
        //                             'Access-Control-Allow-Origin' : '*',
        //                             'Access-Control-Allow-Methods' : 'GET, PUT'});
        //     response.end(nooUUIDHTML);                
        // }
        // else{
        //     console.log('Cannot find nouuid');
        //     response.writeHead(404, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'});                    
        //     response.end('Cannot find nouuid');
        // }        
    }

    configXMLNotFound(request, response){
        let configXMLNotFound = '<!--?xml version="1.0" encoding="UTF-8"?-->';
        configXMLNotFound = configXMLNotFound + '<device>';
        configXMLNotFound = configXMLNotFound + '<uuid>' + this.deviceUUID + '</uuid>';
        configXMLNotFound = configXMLNotFound + '</device>';
        response.writeHead(200, {'Content-Type' : 'text/xml',
                        'Access-Control-Allow-Origin' : '*',
                        'Access-Control-Allow-Methods' : 'GET, PUT'});
        response.end(configXMLNotFound);  

        // if(fs.existsSync(this.noconfigxmlFilename)){
        //     let newThingUUID = this.newUUID();
        //     let defaultXML = '<?xml version="1.0" encoding="UTF-8"?>\n';
        //     defaultXML = defaultXML + '<imot>\n';
        //     defaultXML = defaultXML + '    <hierarchies>\n';
        //     defaultXML = defaultXML + '        <hierarchy name="New RaakeOS device" hierarchyuuid="${hierarchyUUID}" parentuuid="00000000-0000-0000-0000-000000000000" thinguuid="${thingUUID}" order="0"/>\n';
        //     defaultXML = defaultXML + '    </hierarchies>\n\n';
        //     defaultXML = defaultXML + '    <things>\n';
        //     defaultXML = defaultXML + '        <thing name="New RaakeOS device" thinguuid="${thingUUID}">\n';
        //     defaultXML = defaultXML + '            <feature name="ThingType" type="text" value="RaakeOSDevice"/>\n';
        //     defaultXML = defaultXML + '            <feature name="IPAddress" type="text" value="192.168.7.53"/>\n';
        //     defaultXML = defaultXML + '        </thing>\n\n';
        //     defaultXML = defaultXML + '    </things>\n\n';
        //     defaultXML = defaultXML + '</imot>\n';
        //     defaultXML = defaultXML.replace("${hierarchyUUID}", this.deviceUUID);
        //     defaultXML = defaultXML.replaceAll("${thingUUID}", newThingUUID);

            
        //     let noConfigXMLHTML = fs.readFileSync(this.noconfigxmlFilename, {encoding:'utf8', flag:'r'});
        //     response.writeHead(200, {'Content-Type' : 'text/html',
        //                             'Access-Control-Allow-Origin' : '*',
        //                             'Access-Control-Allow-Methods' : 'GET, PUT'});
            
            

        //     let hmtl = noConfigXMLHTML.replace('raakeDefaultXML', defaultXML)
        //     response.end(hmtl);                
        // }
        // else{
        //     console.log('Cannot find noconfigxml');
        //     response.writeHead(404, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'});                    
        //     response.end('Cannot find noconfigxml');
        // } 
    }

    newUUID(){
        let uuid = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
        return uuid;
    }
}

module.exports = RaakeDeviceAPI;
