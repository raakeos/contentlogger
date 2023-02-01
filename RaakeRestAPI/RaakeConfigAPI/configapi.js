var fs = require('fs');
const path = require('path');



class RaakeConfigAPI {
    constructor(configFilename) {
        this.configFilename = configFilename;
        this.configXML = undefined;

        if(fs.existsSync(configFilename)){
            this.configXML = fs.readFileSync(configFilename, {encoding:'utf8', flag:'r'});
        }
    }

    
    getConfig(request, response) {
        console.log('get config')

        let configXML = "";
        if(this.configXML !== undefined){
            configXML = this.configXML;
        }
        response.writeHead(200, {'Content-Type' : 'text/xml',
                                'Access-Control-Allow-Origin' : '*',
                                'Access-Control-Allow-Methods' : 'GET, PUT'});
        response.end( this.configXML );

        // if(this.configXML !== undefined){
        //     response.writeHead(200, {'Content-Type' : 'text/xml',
        //                             'Access-Control-Allow-Origin' : '*',
        //                             'Access-Control-Allow-Methods' : 'GET, PUT'});
        //     response.end( this.configXML );
        // }
        // else{
        //     console.log('Cannot find config file');
        //     response.writeHead(404, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'});                    
        //     response.end('Config file not found');
        // }
    }

    putConfig(request, response) {
        console.log('put config');
    
        let newConfigXML = request.body.toString();

        let filename = path.basename(this.configFilename);
        let filenameParts = filename.split(".");
        if(filenameParts.length > 0) {
            if(fs.existsSync(this.configFilename)){
                let dateTime = new Date();
                let newFilename = dateTime.getFullYear() + "_" + dateTime.getMonth() + "_" + dateTime.getDate();
                newFilename = newFilename + "_" + dateTime.getHours() + "_" + dateTime.getMinutes() + "_" + dateTime.getSeconds() + "_" + dateTime.getMilliseconds();
                newFilename = newFilename + "_" + filenameParts[0];
                if(filenameParts.length > 1){
                    newFilename = newFilename + "." + filenameParts[1];
                }
                newFilename = path.dirname(this.configFilename) + "/" + newFilename;
                fs.copyFileSync(this.configFilename,newFilename);
            }
            fs.writeFileSync(this.configFilename, newConfigXML,{encoding:'utf8',flag:'w'});

            this.configXML = fs.readFileSync(this.configFilename, {encoding:'utf8', flag:'r'});
        }

        response.writeHead(200, {'Content-Type': 'text/plain','Access-Control-Allow-Origin' : '*'});
        response.end("OK");
    }

    getDevice(request, response) {
        console.log('get device')
        const uuid = request.query.uuid;
        if(this.configXML !== undefined){
            response.writeHead(200, {'Content-Type' : 'text/xml',
                                    'Access-Control-Allow-Origin' : '*',
                                    'Access-Control-Allow-Methods' : 'GET, PUT'});
            response.end( "device");
        }
        else{
            console.log('Cannot find Device');
            response.writeHead(404, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'});                    
            response.end('Device not found');
        }
    }
}

module.exports = RaakeConfigAPI;
