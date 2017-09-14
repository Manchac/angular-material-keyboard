(function () {
    "use strict";

    angular.module('material.components.keyboard')
        .constant('keyboardSymbols', keyboardSymbols());

    function keyboardSymbols () {
        return {
            '\u00a0': 'NB\nSP',
            '\u200b': 'ZW\nSP',
            '\u200c': 'ZW\nNJ',
            '\u200d': 'ZW\nJ'
        };
    }
})();
