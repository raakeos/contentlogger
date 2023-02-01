class ChartContent {
    constructor(contentTag)
    {
        this.contentTag = contentTag;
        this.minValue  = 9223372036854775807;
        this.maxValue = -9223372036854775808;
        this.color = "#ff0000";
        this.chartValues = new Map();
    }
}

export { ChartContent };