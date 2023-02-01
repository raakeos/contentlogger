class RaakeRequest {
    constructor(request, responsetype, resposedata, method, data=null){
        this.request = request;
        this.responsetype = responsetype;
        this.resposedata = resposedata;
        this.timestamp = Date.now();
        this.method = method;
        this.data = data;
    }
}

export { RaakeRequest };