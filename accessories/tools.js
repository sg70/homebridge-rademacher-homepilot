module.exports = {
    reversePercentage: function (p) {
        var min = 0;
        var max = 100;
        return (min + max) - p;
    },

    duofernTemp2HomekitTemp(t) {
        // TODO round
        return t/10;
    },

    homekitTemp2DuofernTemp(t) {
        // TODO round
        return t*10;
    }

}
