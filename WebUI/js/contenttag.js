class ContentTag {
    constructor(hierarchy) {
        this.hierarchy = hierarchy;
        this.startbyte = -1;
        this.endbyte = -1;
        this.length = -1;
        this.bit = -1;
        this.endianess = "";        
        this.valuetype = "";
        this.offset = 0;

        this.name = "";
        if(hierarchy !== undefined){
            if(hierarchy.thing !== undefined){
                this.name = hierarchy.name;
                let startByteFeature = hierarchy.thing.GetFeatureByName("StartByte");
                let lengthFeature = hierarchy.thing.GetFeatureByName("Length");
                let bitFeature = hierarchy.thing.GetFeatureByName("Bit");
                let endianessFeature = hierarchy.thing.GetFeatureByName("Endianness"); 
                let valueFeature = hierarchy.thing.GetFeatureByName("Value"); 
                if(startByteFeature !== undefined){
                    this.startbyte = Number(startByteFeature.value);
                    if(this.length >= 0){
                        this.endbyte = this.startbyte + this.length - 1;
                    }
                }
                if(lengthFeature !== undefined){
                    this.length = Number(lengthFeature.value);
                    if(this.startbyte >= 0){
                        this.endbyte = this.startbyte + this.length - 1;
                    }
                }
                if(bitFeature !== undefined){
                    this.bit = Number(bitFeature.value);
                }
                if(endianessFeature !== undefined){
                    this.endianess = endianessFeature.value.toLowerCase();;
                }
                if(valueFeature !== undefined){
                    this.valuetype = valueFeature.type.toLowerCase();
                }
            }
        }
    }


    Value(datagram ,useOffset){
        let value = undefined;
        let offset = useOffset === true ? this.offset : 0;

        if(this.valuetype == "image/jpeg"){
            value = datagram;
        }
        else if(this.valuetype == "text"){
            value = new TextDecoder().decode(datagram);
        }
        else{
            let littleEndian = this.endianess == "little";

            if(datagram.length > this.endbyte){
                var buf = new ArrayBuffer(this.length);
                var view = new DataView(buf);
                let index = 0;
                for(let i = this.startbyte + offset; i <= this.endbyte + offset; i++){
                    view.setUint8(index, datagram[i]);
                    index++;
                }
                if(this.valuetype == "bit"){
                    value = ((datagram[this.startbyte + offset] >> this.bit) % 2 != 0);
                }
                else if(this.valuetype == "int8"){
                    value = view.getInt8(0,littleEndian);
                }
                else if(this.valuetype == "uint8"){
                    value = view.getUint8(0,littleEndian);
                }
                else if(this.valuetype == "int16"){
                    value = view.getInt16(0,littleEndian);
                }
                else if(this.valuetype == "uint16"){
                    value = view.getUint16(0,littleEndian);
                }
                else if(this.valuetype == "int32"){
                    value = view.getInt32(0,littleEndian);
                }
                else if(this.valuetype == "uint32"){
                    value = view.getUint32(0,littleEndian);
                }
                else if(this.valuetype == "int64"){
                    value = view.getBigInt64(0,littleEndian);
                }
                else if(this.valuetype == "uint64"){
                    value = view.getBigUint64(0,littleEndian);
                }
                else if(this.valuetype == "float32"){
                    value = view.getFloat32(0,littleEndian);
                }
                else if(this.valuetype == "float64"){
                    value = view.getFloat64(0,littleEndian);
                }
            }       
        }
        return value;
    }
}

export { ContentTag };
