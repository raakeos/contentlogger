var child_process = require('child_process');


class RaakeServiceAPI {
    constructor(deviceHierarchy) {
        this.deviceHierarchy = deviceHierarchy             
    }

    
    getService(request, response) {
        //console.log('get service');
        if(this.deviceHierarchy !== undefined){
            const uuid = request.query.uuid;

            //console.log('uuid:' + uuid);

            var serviceHierarchy = this.deviceHierarchy.GetHierarchyByHierarchyUUID(uuid);
            if(serviceHierarchy !== undefined){
                console.log(serviceHierarchy.name);
                if(serviceHierarchy.thing !== undefined){

                    let serviceNameFeature = serviceHierarchy.thing.GetFeatureByName('ServiceName');
                    if(serviceNameFeature !== undefined){
                        let status = 'unknown';
                        let cmd = 'systemctl status ' + serviceNameFeature.value;
                        child_process.exec(cmd, (error, stdout, stderr) => {
                            if(stderr === ''){
                                //console.log(stdout);
                                let activeStart = stdout.indexOf('Active:');
                                if(activeStart > 0){
                                    activeStart = activeStart + 7;
                                    let activeEnd = stdout.indexOf("\n", activeStart);
                                    if(activeEnd > activeStart){
                                        let activeLine = stdout.substring(activeStart, activeEnd).trim();
                                        let activeMatches = activeLine.match(/\(([^)]+)\)/g);
                                        if(activeMatches.length > 0){
                                            status = activeMatches[0].replace('(','').replace(')','');
                                            //console.log(status);
                                        }                                
                                    }
                                }

                        let responseContent = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
                        responseContent = responseContent + "<connectionnode><uuid>" + uuid + "</uuid>";
                        responseContent = responseContent + "<status>" + status + "</status>";
                        responseContent = responseContent + "</connectionnode>"

                        response.writeHead(200, {'Content-Type': 'text/xml', 'Access-Control-Allow-Origin' : '*'});
                        response.end(responseContent);
                            }
                            else{
                                console.log(stderr);
                                response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
                                response.end(stderr);
                            }
                        });               
                    }
                    else{
                        console.log('Service hierarchy(%s) has no ServiceName feature', serviceHierarchy.name);
                        response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
                        response.end('Service hierarchy(' + serviceHierarchy.name + ') has no ServiceName feature');
                    }
                    

                }
                else{
                    console.log('Service hierarchy(%s) has no thing connection', serviceHierarchy.name);
                    response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
                    response.end('Service hierarchy(' + serviceHierarchy.name + ') has no thing connection');
                }                                                 
            }
            else {
                console.log('Cannot find service object (%s)', uuid);
                response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
                response.end('Cannot find service object(' + uuid + ')');
            }
        }
        else{
            console.log('Cannot find RaakeOSDevice');
            response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
            response.end('Cannot find RaakeOSDevice');
        }
    }

    putService(request, response) {
        console.log('put service');
        if(this.deviceHierarchy !== undefined){
            const uuid = request.query.uuid;
            const command = request.query.command;

            console.log('uuid:' + uuid);
            console.log('command:' + command);

            var serviceHierarchy = this.deviceHierarchy.GetHierarchyByHierarchyUUID(uuid);
            if(serviceHierarchy !== undefined){
                console.log(serviceHierarchy.name);
                if(serviceHierarchy.thing !== undefined){

                    let serviceNameFeature = serviceHierarchy.thing.GetFeatureByName('ServiceName');
                    if(serviceNameFeature !== undefined){
                        let cmd = '';
                        if(command.toLowerCase() === 'restart'){
                            cmd = 'systemctl restart ' + serviceNameFeature.value;
                        }
                        else if(command.toLowerCase() === 'stop'){
                            cmd = 'systemctl stop ' + serviceNameFeature.value;
                        }

                        if(cmd !== ''){
                            child_process.exec(cmd, (error, stdout, stderr) => {
                                console.log(error);
                            });
                            
                            let responseContent = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";

                            response.writeHead(200, {'Content-Type': 'text/xml', 'Access-Control-Allow-Origin' : '*'});
                            response.end(responseContent); 
                        }
                        else{
                            console.log('Service hierarchy(%s) unkown command(%s)', serviceHierarchy.name, command);
                            response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
                            response.end('Service hierarchy(' + serviceHierarchy.name + ') unkown command(' + command + ')');
                        }
                    }
                    else{
                        console.log('Service hierarchy(%s) has no ServiceName feature', serviceHierarchy.name);
                        response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
                        response.end('Service hierarchy(' + serviceHierarchy.name + ') has no ServiceName feature');
                    }
                    

                }
                else{
                    console.log('Service hierarchy(%s) has no thing connection', serviceHierarchy.name);
                    response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
                    response.end('Service hierarchy(' + serviceHierarchy.name + ') has no thing connection');
                }                                                 
            }
            else {
                console.log('Cannot find service object (%s)', uuid);
                response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
                response.end('Cannot find service object(' + uuid + ')');
            }
        }
        else{
            console.log('Cannot find RaakeOSDevice');
            response.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
            response.end('Cannot find RaakeOSDevice');
        }
    }
}

module.exports = RaakeServiceAPI;