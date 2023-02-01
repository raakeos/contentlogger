class Datafile {
    constructor(folder, filename) {
        this.folder = folder; 
        this.filename = filename.replace(/[//]+/g, '/');
        let filenameParts = this.filename.split(".");
        if(filenameParts.length == 2){
            this.timestamp = filenameParts[0];
            if(this.timestamp.length === 26){
                this.starttimestamp = this.timestamp.substring(0,13);
                this.endtimestamp = this.timestamp.substring(13,26);
            }
            
        }
        else {
            this.timestamp = 0;
        }
         
    }
}

module.exports = Datafile;