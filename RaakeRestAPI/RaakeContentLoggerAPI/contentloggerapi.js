var LoggerBlock = require('./loggerblock.js');


class RaakeContentLoggerAPI {
    constructor(contentLoggerHierarchy) {
        this.hierarchy = contentLoggerHierarchy;               
        this.loggerBlocks = new Map(); 
        
        let loggerBlockHierarchies = this.hierarchy.GetChildrenByFeature("ThingType", "LoggerBlock");
        for(let loggerBlockHierarchy of loggerBlockHierarchies){
            let loggerblock = new LoggerBlock(loggerBlockHierarchy);
            if(loggerblock.connectionNode !== undefined){
                this.loggerBlocks.set(loggerblock.connectionNode.hierarchy.hierarchyUUID, loggerblock);
            }
        }
    }
    Stop(){
        if(this.loggerBlocks !== undefined){
            for(let key of this.loggerBlocks.keys()){
                this.loggerBlocks.get(key).Stop();
                delete this.loggerBlocks[key];
            }
            delete this.loggerBlocks;
        } 
    }

    getDatafile(request, response) {
        console.log('get datafile');
        const uuid = request.query.uuid;
        let loggerBlock = this.loggerBlocks.get(uuid);
        if(loggerBlock !== undefined){
            loggerBlock.datafile(request, response);
        }
        else {
            console.log('Cannot find logger block object for connection node(%s)', uuid);
            response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
            response.end('Cannot find logger block object for connection node(' + uuid + ')');
        }
    }

    getDatafiles(request, response) {
        console.log('get datafiles');
        const uuid = request.query.uuid;
        let loggerBlock = this.loggerBlocks.get(uuid);
        if(loggerBlock !== undefined){
            loggerBlock.datafiles(request, response);
        }
        else {
            console.log('Cannot find logger block object for connection node(%s)', uuid);
            response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
            response.end('Cannot find logger block object for connection node(' + uuid + ')');
        }
    }

    getDatagram(request, response) {
        console.log('get datagram')
        const uuid = request.query.uuid;
        let loggerBlock = this.loggerBlocks.get(uuid);
        if(loggerBlock !== undefined){
            loggerBlock.datagram(request, response);
        }
        else {
            console.log('Cannot find logger block object for connection node(%s)', uuid);
            response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
            response.end('Cannot find logger block object for connection node(' + uuid + ')');
        }
    }
}


module.exports = RaakeContentLoggerAPI;


// var express = require('express');
// var cors = require('cors');
// var fs = require('fs');
// const path = require('path');
// var bodyParser = require('body-parser');
// var ConfigurationHandler = require('../common/configurationhandler.js');
// //var ContentLogger = require('./contentlogger.js');
// var MariaDBClient = require('./mariadbclient.js');
// var RaakeDBClient = require('./raakedbclient.js');
// var LoggerBlock = require('./loggerblock.js');

// var child_process = require('child_process');


// var app = express();
// app.use(cors());

// //Read arguments
// var args = process.argv.slice(2);
// const uuid = args[0];
// const configFilename = args[1];
// var contentLogger = undefined;
// var expressServer = undefined;
// var mariaDBPool = undefined;
// var mariaDBClient = undefined;
// var raakeDBClient = undefined;
// var loggerBlocks = new Map();

// //Open configuration file
// var configXML = fs.readFileSync(configFilename, {encoding:'utf8', flag:'r'});
// var configurationHandler = new ConfigurationHandler(configXML);

// function StartService(){
//     //Get ContentLoggerAPI hierarchy
//     var serviceHierarchy = configurationHandler.GetHierarchyByHierarchyUUID(uuid);
//     if(serviceHierarchy !== undefined){
//         let loggerBlockHierarchies = serviceHierarchy.GetChildrenByFeature("ThingType", "LoggerBlock");
//         for(let loggerBlockHierarchy of loggerBlockHierarchies){
//             let loggerblock = new LoggerBlock(loggerBlockHierarchy);
//             if(loggerblock.connectionNode !== undefined){
//                 loggerBlocks.set(loggerblock.connectionNode.hierarchy.hierarchyUUID, loggerblock);
//             }
//         }

//         if(serviceHierarchy.thing !== undefined){
//             let ipAddressFeature = serviceHierarchy.thing.GetFeatureByName("IPAddress");
//             let portFeature = serviceHierarchy.thing.GetFeatureByName("Port");
//             if(ipAddressFeature !== undefined && portFeature !== undefined){                
//                 port = portFeature.value;
//                 app.use(bodyParser.raw({ inflate: true, limit: '100mb', type: 'text/xml' }));

//                 expressServer = app.listen(port, function () {
//                     host = expressServer.address().address
//                     console.log("Example app listening at http://%s:%s", host, port);
//                 })                
//             }
//             else{
//                 console.log("Cannot start service(%s), because it has no IPAddress or Port Feature", uuid);
//             }
//         }
//         else{
//             console.log("Cannot start API service(%s), because it is not connected to Thing", uuid);
//         }
//     }
//     else{
//         console.log("Cannot start API service, because service hierarchyUUID(%s) not found from config.xml", uuid);
//     }
// }

// StartService();

// app.on('close', function() {
//     console.log('close express server');
//     StartService();
//   });

// app.get('/config', function (request, response) {
//     console.log('get config')
    
//     if(configXML !== undefined){
//         response.writeHead(200, {'Content-Type' : 'text/xml',
//                                 'Access-Control-Allow-Origin' : '*',
//                                 'Access-Control-Allow-Methods' : 'GET, PUT'});
//         response.end( configXML );
//     }
//     else{
//         console.log('Cannot find config file');
//         response.writeHead(404, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'});                    
//         response.end('Config file not found');
//     }
//  })

//  app.put('/config', function (request, response) {
//     console.log('put config');
    
//     let newConfigXML = request.body.toString();

//     let filename = path.basename(configFilename);
//     let filenameParts = filename.split(".");
//     if(filenameParts.length > 0) {
//         let dateTime = new Date();
//         let newFilename = dateTime.getFullYear() + "_" + dateTime.getMonth() + "_" + dateTime.getDate();
//         newFilename = newFilename + "_" + dateTime.getHours() + "_" + dateTime.getMinutes() + "_" + dateTime.getSeconds() + "_" + dateTime.getMilliseconds();
//         newFilename = newFilename + "_" + filenameParts[0];
//         if(filenameParts.length > 1){
//             newFilename = newFilename + "." + filenameParts[1];
//         }
//         newFilename = path.dirname(configFilename) + "/" + newFilename;
//         fs.copyFileSync(configFilename,newFilename);
//         fs.writeFileSync(configFilename, newConfigXML,{encoding:'utf8',flag:'w'});

//         configXML = fs.readFileSync(configFilename, {encoding:'utf8', flag:'r'});
//     }

//     response.writeHead(200, {'Content-Type': 'text/plain','Access-Control-Allow-Origin' : '*'});
//     response.end("OK");

//  })

// app.get('/datafiles', function (request, response) {
//     console.log('get datafiles');
//     const uuid = request.query.uuid;
//     let loggerBlock = loggerBlocks.get(uuid);
//     if(loggerBlock !== undefined){
//         loggerBlock.datafiles(request, response);
//     }
//     else {
//         console.log('Cannot find logger block object for connection node(%s)', uuid);
//         response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
//         response.end('Cannot find logger block object for connection node(' + uuid + ')');
//     }
// })

// app.get('/datafile', function (request, response) {
//     console.log('get datafile')
//     const uuid = request.query.uuid;
//     let loggerBlock = loggerBlocks.get(uuid);
//     if(loggerBlock !== undefined){
//         loggerBlock.datafile(request, response);
//     }
//     else {
//         console.log('Cannot find logger block object for connection node(%s)', uuid);
//         response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
//         response.end('Cannot find logger block object for connection node(' + uuid + ')');
//     }
// })

// app.get('/datagram', function (request, response) {
//     console.log('get datagram')
//     const uuid = request.query.uuid;
//     let loggerBlock = loggerBlocks.get(uuid);
//     if(loggerBlock !== undefined){
//         loggerBlock.datagram(request, response);
//     }
//     else {
//         console.log('Cannot find logger block object for connection node(%s)', uuid);
//         response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
//         response.end('Cannot find logger block object for connection node(' + uuid + ')');
//     }
//  })

//  app.put('/service', function (request, response) {
//     console.log('put service');

//     const uuid = request.query.uuid;
//     const command = request.query.command;

//     console.log('uuid:' + uuid);
//     console.log('command:' + command);

//     var serviceHierarchy = configurationHandler.GetHierarchyByHierarchyUUID(uuid);
//     if(serviceHierarchy !== undefined){
//         console.log(serviceHierarchy.name);
//         if(serviceHierarchy.thing !== undefined){

//             let serviceNameFeature = serviceHierarchy.thing.GetFeatureByName('ServiceName');
//             if(serviceNameFeature !== undefined){
//                 let cmd = '';
//                 if(command.toLowerCase() === 'restart'){
//                     cmd = 'systemctl restart ' + serviceNameFeature.value;
//                 }
//                 else if(command.toLowerCase() === 'stop'){
//                     cmd = 'systemctl stop ' + serviceNameFeature.value;
//                 }

//                 if(cmd !== ''){
//                     child_process.exec(cmd, (error, stdout, stderr) => {
//                         console.log(error);
//                     });
                    
//                     let responseContent = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";

//                     response.writeHead(200, {'Content-Type': 'text/xml', 'Access-Control-Allow-Origin' : '*'});
//                     response.end(responseContent); 
//                 }
//                 else{
//                     console.log('Service hierarchy(%s) unkown command(%s)', serviceHierarchy.name, command);
//                     response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
//                     response.end('Service hierarchy(' + serviceHierarchy.name + ') unkown command(' + command + ')');
//                 }
//             }
//             else{
//                 console.log('Service hierarchy(%s) has no ServiceName feature', serviceHierarchy.name);
//                 response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
//                 response.end('Service hierarchy(' + serviceHierarchy.name + ') has no ServiceName feature');
//             }
            

//         }
//         else{
//             console.log('Service hierarchy(%s) has no thing connection', serviceHierarchy.name);
//             response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
//             response.end('Service hierarchy(' + serviceHierarchy.name + ') has no thing connection');
//         }                                                 
//     }
//     else {
//         console.log('Cannot find service object (%s)', uuid);
//         response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
//         response.end('Cannot find service object(' + uuid + ')');
//     }
//  })

//  app.get('/service', function (request, response) {
//     //console.log('get service');

//     const uuid = request.query.uuid;

//     //console.log('uuid:' + uuid);

//     var serviceHierarchy = configurationHandler.GetHierarchyByHierarchyUUID(uuid);
//     if(serviceHierarchy !== undefined){
//         console.log(serviceHierarchy.name);
//         if(serviceHierarchy.thing !== undefined){

//             let serviceNameFeature = serviceHierarchy.thing.GetFeatureByName('ServiceName');
//             if(serviceNameFeature !== undefined){
//                 let status = 'unknown';
//                 let cmd = 'systemctl status ' + serviceNameFeature.value;
//                 child_process.exec(cmd, (error, stdout, stderr) => {
//                     if(stderr === ''){
//                         //console.log(stdout);
//                         let activeStart = stdout.indexOf('Active:');
//                         if(activeStart > 0){
//                             activeStart = activeStart + 7;
//                             let activeEnd = stdout.indexOf("\n", activeStart);
//                             if(activeEnd > activeStart){
//                                 let activeLine = stdout.substring(activeStart, activeEnd).trim();
//                                 let activeMatches = activeLine.match(/\(([^)]+)\)/g);
//                                 if(activeMatches.length > 0){
//                                     status = activeMatches[0].replace('(','').replace(')','');
//                                     //console.log(status);
//                                 }                                
//                             }
//                         }

//                 let responseContent = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
//                 responseContent = responseContent + "<connectionnode><uuid>" + uuid + "</uuid>";
//                 responseContent = responseContent + "<status>" + status + "</status>";
//                 responseContent = responseContent + "</connectionnode>"

//                 response.writeHead(200, {'Content-Type': 'text/xml', 'Access-Control-Allow-Origin' : '*'});
//                 response.end(responseContent);
//                     }
//                     else{
//                         console.log(stderr);
//                         response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
//                         response.end(stderr);
//                     }
//                 });               
//             }
//             else{
//                 console.log('Service hierarchy(%s) has no ServiceName feature', serviceHierarchy.name);
//                 response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
//                 response.end('Service hierarchy(' + serviceHierarchy.name + ') has no ServiceName feature');
//             }
            

//         }
//         else{
//             console.log('Service hierarchy(%s) has no thing connection', serviceHierarchy.name);
//             response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
//             response.end('Service hierarchy(' + serviceHierarchy.name + ') has no thing connection');
//         }                                                 
//     }
//     else {
//         console.log('Cannot find service object (%s)', uuid);
//         response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
//         response.end('Cannot find service object(' + uuid + ')');
//     }
//  })
