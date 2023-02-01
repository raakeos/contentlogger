class DataContent {
    constructor(datagram){
        this.contentDatagram = undefined;
    
        let currentTimestamp = Date.now();
        
        if(datagram.length > 1){
            if(datagram[0] == 1){ // 1 = monitoring message contains sender messagetype(0x0-0x1)uuid(0x2-0x11) + timestamp(0x12-0x19) + length(0x1a-0x1d) + content(0x1e->)
                this.messageHeader = datagram.slice(0x12, 0x1e);
                this.timestamp = this.byteArrayToLong(datagram.slice(0x12, 0x1a)); //timestamp (8 bytes int64)                
                this.contentLength = this.byteArrayToLong(datagram.slice(0x1a, 0x1e)); //length of content(4 bytes uint32)           
                if(datagram.byteLength  <= (this.contentLength + 0x1e)){    
                    let contentDatagram = datagram.slice(0x1e, datagram.byteLength);
                    this.contentDatagram = new Uint8Array(this.contentLength); 
                    this.contentDatagram.set(contentDatagram, 0);
        
                    this.offset = contentDatagram.byteLength;
                }
            }
            else if(datagram[0] == 2){ // 1 = monitoring message contains sender messagetype(0x0-0x1)uuid(0x2-0x11) + length(0x12-0x15) + content(0x16->)           
                this.contentLength = this.byteArrayToLong(datagram.slice(0x12, 0x16));
                let timestampArray = this.longToByteArray(currentTimestamp);
                this.messageHeader =  Buffer(8 + 4);
                this.messageHeader.set(timestampArray,0);
                this.messageHeader.set(datagram.slice(0x12, 0x16),0x8);
                if(datagram.byteLength  <= (this.contentLength + 0x16)){    
                    let contentDatagram = datagram.slice(0x16, datagram.byteLength);
                    this.contentDatagram = new Uint8Array(this.contentLength); 
                    this.contentDatagram.set(contentDatagram, 0);
        
                    this.offset = contentDatagram.byteLength;
                }
            }
            
        }
        
    }

    byteArrayToLong(byteArray) {    
        var value = 0;    
        for ( var i = byteArray.byteLength - 1; i >= 0; i--) {
            value = (value * 256) + byteArray[i];
        }
        return value;
    }

    longToByteArray(longValue) {
        //var byteArray = [0, 0, 0, 0, 0, 0, 0, 0];  
        var byteArray = new Buffer(8)  
        for ( var index = 0; index < byteArray.length; index ++ ) {
            var byte = longValue & 0xff;
            byteArray [ index ] = byte;
            longValue = (longValue - byte) / 256 ;
        }    
        return byteArray;
    }

    AddDatagram(datagram){
        let isOK = false;
        let newLength = this.offset + datagram.byteLength;
        if(newLength <= this.contentLength)
        {
            isOK = true;
            this.contentDatagram.set(datagram, this.offset);
            this.offset = newLength;
        }
        return isOK;
    }

    IsReady(){
        return this.contentLength > 0 && this.offset == this.contentLength;
    }

    GetDatagram(){
        let datagram = undefined;
        if(this.contentLength > 0){
            datagram = new Uint8Array(this.messageHeader.byteLength + this.contentLength); 
            datagram.set(this.messageHeader, 0);
            datagram.set(this.contentDatagram, this.messageHeader.byteLength);
        }
        return datagram;
    }
}

module.exports = DataContent;