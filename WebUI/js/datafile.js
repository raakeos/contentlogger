class Datafile {
    constructor(filename) {
        this.filename = filename;
        this.datagrams = new Map();

        if(filename.length >= 26){
            this.startTimestamp = filename.substr(0,13);
            this.endTimestamp = filename.substr(13,13);
        }      
    }
    AddDatagrams(datagrams){

        let contentStart = 14; //(stamptype 2 + timestamp 8 + length 4)

        while(datagrams.byteLength > contentStart)
        {
            let offset = contentStart - 14;

            let stamptype = this.byteArrayToLong(datagrams.slice(offset,offset + 2)); //timestamp (first 8 bytes)
            let timestamp = this.byteArrayToLong(datagrams.slice(offset + 2,offset + 10)); //timestamp (first 8 bytes)
            let length = this.byteArrayToLong(datagrams.slice(offset + 10 ,offset + 14)); //length of content(4 bytes uint32)
            if(!this.datagrams.has(timestamp)){                

                if(datagrams.byteLength >= (contentStart + length)){
                    let datagram = datagrams.slice(contentStart, contentStart + length);
                    this.datagrams.set(timestamp, datagram); //content data
                }
            }
            contentStart = contentStart + length + 14;
        }    
    }

    AddOlineDatagrams(datagram){

        let lastDatagram = undefined;

        let timestamp = this.byteArrayToLong(datagram.slice(0, 8)); //timestamp (8 bytes int64)
        let length = this.byteArrayToLong(datagram.slice(8, 12)); //length of content(4 bytes uint32)
        if(!this.datagrams.has(timestamp)){               
            if((datagram.byteLength - 12) >= length){
                lastDatagram = datagram.slice(12, datagram.byteLength);
                this.datagrams.set(timestamp, lastDatagram); //content data
            }
        }        
        return lastDatagram;   
    }

    // compare(uuid1, uuid2) {
    //     for (let i = 0; i < uuid1.length; i++) {
    //       if (uuid1[i] !== uuid1[i]) return false;
    //     }
    //     return true;
    //   }


    byteArrayToLong(byteArray) {
    
        var value = 0;
    
        for ( var i = byteArray.byteLength - 1; i >= 0; i--) {
            value = (value * 256) + byteArray[i];
        }
        return value;
    };
}

export { Datafile };