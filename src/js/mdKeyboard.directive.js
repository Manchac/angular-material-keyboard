(function () {
    "use strict";

    angular.module('material.components.keyboard')
        .directive('mdKeyboard', MdKeyboardDirective)
        .directive('useKeyboard', useKeyboardDirective);

    function MdKeyboardDirective ($mdKeyboard) {
        return {
            restrict: 'E',
            link: postLink
        };

        function postLink (scope) {
            // When navigation force destroys an interimElement, then
            // listen and $destroy() that interim instance...
            scope.$on('$destroy', function () {
                $mdKeyboard.destroy();
            });
        }
    }

    function useKeyboardDirective(mdKeyboardService, mdKeyboardUtilService) {
        return {
            restrict: 'A',
            require: '?ngModel',
            link: postLink
        };

        function postLink (scope, element, attrs, ngModelCtrl) {
            /* requires ngModel silently */
            if (!ngModelCtrl) {
                return;
            }

            /* do nothing if we are not supposed to show in mobile */
            if (mdKeyboardUtilService.isMobileDevice() && !attrs.showInMobile) {
                return;
            }

            /*
             * open keyboard on focus
             * hide keyboard on blur and $destroy
             */
            element
                .bind('focus', showKeyboard)
                .bind('blur', hideKeyboard)
                .bind('$destroy', hideKeyboard);

            /**
             * Wrapper around showing the keyboard with the directive's parameters.
             */
            function showKeyboard () {
                mdKeyboardService.showKeyboard(element, attrs, ngModelCtrl);
            }

            /**
             * Wrapper around hiding the keyboard.
             */
            function hideKeyboard () {
                mdKeyboardService.hideKeyboard();
            }
        }
    }
})();
