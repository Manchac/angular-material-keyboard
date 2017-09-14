(function () {
    "use strict";

    angular.module('material.components.keyboard')
        .config(configure);

    function configure ($mdIconProvider) {
        $mdIconProvider.fontSet('md', 'material-icons');
    }
})();
