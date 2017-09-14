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

    function useKeyboardDirective($mdKeyboard, $timeout, $interval, $animate, $rootScope) {
        return {
            restrict: 'A',
            require: '?ngModel',
            link: postLink
        };

        function postLink (scope, element, attrs, ngModelCtrl) {
            /* Don't show virtual keyboard in mobile devices (default) */
            var isMobile = isMobileDevice();

            /* for show and hide */
            $rootScope.keyboardTimeout = null;
            $rootScope.keyboardAnimation = null;
            $rootScope.scrollAnimation = null;

            /* requires ngModel silently */
            if (!ngModelCtrl) {
                return;
            }

            /* do nothing if we are not supposed to show in mobile */
            if (isMobile && attrs.showInMobile !== true) {
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
             * Detect if the device being used is a mobile device or other device.
             *
             * This function is based on the answer by Tiesselune on StackOverflow:
             * https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
             *
             * @return Whether or not the current device is a mobile device.
             */
            function isMobileDevice () {
                var a = navigator.userAgent || navigator.vendor || window.opera;

                return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series[46]0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)
                    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br[ev]w|bumb|bw-[nu]|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do[cp]o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly[-_]|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-[mpt]|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c[-_agpst ]|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac[\-\/ ]|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja[tv]a|jbro|jemu|jigs|kddi|keji|kgt[\/ ]|klon|kpt |kwc-|kyo[ck]|le(no|xi)|lg( g|\/[klu]|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t[-ov ]|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30[02]|n50[025]|n7(0[01]|10)|ne([cm]-|on|tf|wf|wg|wt)|nok[6i]|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan[adt]|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c[-01]|47|mc|nd|ri)|sgh-|shar|sie[-m]|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel[im]|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c[- ]|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(a.substr(0, 4));
            }

            /**
             * Stop all ongoing animations that could possibly be occurring.
             */
            function stopAllAnimations () {
                stopScrollAnimation();
                stopKeyboardTimeout();
                stopKeyboardAnimation();
            }

            /**
             * Stop scroll to element animation.
             */
            function stopScrollAnimation () {
                /* stop scroll animation */
                if (!isNullOrUndefined($rootScope.scrollAnimation)) {
                    $interval.cancel($rootScope.scrollAnimation);
                    $rootScope.scrollAnimation = null;
                }
            }

            /**
             * Stop keyboard hide timeout.
             */
            function stopKeyboardTimeout () {
                /* stop keyboard timeout */
                if (!isNullOrUndefined($rootScope.keyboardTimeout)) {
                    $timeout.cancel($rootScope.keyboardTimeout);
                    $rootScope.keyboardTimeout = null;
                }
            }

            /**
             * Stop keyboard show or hide animation.
             */
            function stopKeyboardAnimation () {
                /* stop keyboard animation */
                if (!isNullOrUndefined($rootScope.keyboardAnimation)) {
                    $animate.cancel($rootScope.keyboardAnimation);
                    $rootScope.keyboardAnimation = null;
                }
            }

            /**
             * Start keyboard show animation.
             */
            function startKeyboardShow () {
                $rootScope.keyboardAnimation = $mdKeyboard.show({
                    templateUrl: '../view/mdKeyboard.view.html',
                    controller: mdKeyboardController,
                    controllerAs: 'keyboard',
                    bindToController: true
                });
            }

            /**
             * Start keyboard hide animation.
             */
            function startKeyboardHide () {
                $rootScope.keyboardTimeout = $timeout(function () {
                    $rootScope.keyboardAnimation = $mdKeyboard.hide();
                }, 100);
            }

            /**
             * Start animating scrolling to an element.
             *
             * @param parent parent element to scroll
             * @param scrollToLocation location to scroll to
             */
            function startScrollToAnimation (parent, scrollToLocation) {
                /*
                 * keep track of our current location as a float (we cannot trust parent.scrollTop
                 * because it is not a float and we will run into errors where scrolling may glitch)
                 */
                var currentLocation = parent.scrollTop;

                $rootScope.scrollAnimation = $interval(moveStep, 33);

                /**
                 * Move another step closer to the scroll to location.
                 */
                function moveStep () {
                    var deltaScrollTo = scrollToLocation - currentLocation;

                    /* Threshold of 5px will not make that much of a difference */
                    if (Math.abs(deltaScrollTo) <= 5) {
                        stopScrollAnimation();
                    }

                    currentLocation += deltaScrollTo * 0.15;
                    parent.scrollTop = currentLocation;
                }
            }

            /**
             * Set keyboard layout to use.
             *
             * @param layoutName layout name to use.
             */
            function useKeyboardLayout (layoutName) {
                /* only use the keyboard if it is defined */
                if (!isNullOrUndefined(layoutName) && layoutName !== '') {
                    /* switch which layout to use */
                    $mdKeyboard.useLayout(layoutName);
                }
            }

            /**
             * Show the keyboard.
             */
            function showKeyboard() {
                /* cancel all ongoing animations */
                stopAllAnimations();

                /*
                 * decide whether to add a new keyboard or use
                 * existing based on whether or not the keyboard
                 * is already visible
                 */
                if (!$mdKeyboard.isVisible()) {
                    /* no keyboard active, so add new */
                    $mdKeyboard.currentModel = ngModelCtrl;
                    startKeyboardShow();
                } else {
                    /* use existing keyboard */
                    $mdKeyboard.currentModel = ngModelCtrl;
                    useKeyboardLayout(attrs.useKeyboard);
                }

                /*
                 * scroll to the element we just clicked on.
                 * this assumes a sane scrollable region. Multiple
                 * scrollable regions within each other are not supported
                 * at this moment
                 */
                /* TODO: support multiple nested scrollable regions */
                $timeout(function () {
                    scrollToElement(findFirstScrollableElement(element));
                }, 0);
            }

            /**
             * Hide the keyboard.
             */
            function hideKeyboard() {
                /* stop all ongoing animations */
                stopAllAnimations();

                /* keyboard hide timeout */
                startKeyboardHide();
            }

            /**
             * Decide whether or not a value is null or undefined or neither.
             *
             * @param value value to check for null or undefined.
             * @returns {boolean} true if element is null or undefined, false otherwise.
             */
            function isNullOrUndefined(value) {
                return (value === null) || angular.isUndefined(value);
            }

            /**
             * Find the first node whose parent node is scrollable.
             *
             * If no parent node is scrollable, then
             * null is returned. If the passed in node is null or undefined,
             * the result will also be null.
             *
             * function based off answer by nils on StackOverflow
             * https://stackoverflow.com/questions/35939886/find-first-scrollable-parent
             *
             * @param node lowest element in DOM to start search for scrollable element.
             * @return null if there are no scrollable elements; otherwise an element whose parent is scrollable.
             */
            function findFirstScrollableElement(node) {
                if (isNullOrUndefined(node) || isNullOrUndefined(node.parent())
                    || isNullOrUndefined(node.parent()[0])) {
                    return null;
                }

                var parentNode = node.parent();

                /*
                 * check whether the height of the scrollable region on an element
                 * is greater than the actual displayed region. This will tell us if
                 * the element is scrollable
                 */
                if (parentNode[0].scrollHeight > parentNode[0].clientHeight) {
                    return node;
                } else {
                    return findFirstScrollableElement(parentNode);
                }
            }

            /**
             * Scroll to a given element.
             *
             * This function assumes that the element is null (in which this function will do nothing)
             * or an element whose parent is a scrollable region. To find this node, use
             * findFirstScrollableElement.
             *
             * @param node Node at which to scroll to
             */
            function scrollToElement(node) {
                if (isNullOrUndefined(node) || isNullOrUndefined(node.parent())) {
                    return;
                }

                /* cancel any ongoing animation interval */
                stopScrollAnimation();

                /* grab our parent */
                var parent = node.parent()[0];

                /* scroll such that the top of our element is in the middle of the scrollable region */
                var scrollToLocation = Math.max(0, Math.min(
                    parent.scrollHeight,
                    node[0].offsetTop - (parent.clientHeight / 2)
                ));

                /* start moving at 30fps */
                startScrollToAnimation(parent, scrollToLocation);
            }

            /**
             * Keyboard controller.
             *
             * @param $scope scope of the keyboard.
             */
            function mdKeyboardController($scope) {
                var $ctrl = this;

                $ctrl.getKey = getKey;
                $ctrl.getKeyClass = getKeyClass;
                $ctrl.pressed = pressed;

                $ctrl.layout = getKeyboardLayout($mdKeyboard.getCurrentLayout());
                $ctrl.capsLocked = false;
                $ctrl.caps = false;

                initialize();

                /**
                 * Initialize keyboard directive.
                 */
                function initialize () {
                    useKeyboardLayout(attrs.useKeyboard);

                    /* register event to change keyboard layout in our controller if it is changed externally */
                    $scope.$on('$mdKeyboardLayoutChanged', function ($event, layout) {
                        $ctrl.layout = getKeyboardLayout(layout);
                    });
                }

                /**
                 * Get key CSS class.
                 * This class is used per key and will tell CSS how to style the keyboard
                 *
                 * @param key key name
                 * @returns {string} CSS class for styling
                 */
                function getKeyClass (key) {
                    var k = (key[0] || ' ').toLowerCase();
                    var keys = ['bksp', 'tab', 'caps', 'enter', 'shift', 'alt', 'altgr', 'altlk'];

                    if (k === ' ') {
                        /* space bar */
                        k = 'space';
                    } else if (keys.indexOf(k) < 0) {
                        /* special key */
                        k = 'char';
                    } else if (k === 'spacer') {
                        /* spacer helper element */
                        return k;
                    }

                    return 'key-' + k;
                }

                /**
                 * Handle what happens when a key gets pressed.
                 *
                 * @param $event mousedown event for handling key presses
                 * @param key key that is pressed
                 */
                function pressed ($event, key) {
                    $event.preventDefault();

                    switch (key) {
                        case 'Caps':
                            $ctrl.capsLocked = !$ctrl.capsLocked;
                            $ctrl.caps = false;
                            break;
                        case 'Shift':
                            $ctrl.caps = !$ctrl.caps;
                            break;
                        case 'Alt':
                        case 'AltGr':
                        case 'AltLk':
                            // modify input, visualize
                            //self.VKI_modify(type);
                            break;
                        case 'Tab':
                            // TODO: handle text selection

                            // cycle through elements
                            // or insert \t tab
                            //if (self.VKI_activeTab) {
                            //    if (self.VKI_target.form) {
                            //        var target = self.VKI_target, elems = target.form.elements;
                            //        self.VKI_close(false);
                            //        for (var z = 0, me = false, j = -1; z < elems.length; z++) {
                            //            if (j == -1 && elems[z].getAttribute('VKI_attached')) j = z;
                            //            if (me) {
                            //                if (self.VKI_activeTab == 1 && elems[z]) break;
                            //                if (elems[z].getAttribute('VKI_attached')) break;
                            //            } else if (elems[z] == target) me = true;
                            //        }
                            //        if (z == elems.length) z = Math.max(j, 0);
                            //        if (elems[z].getAttribute('VKI_attached')) {
                            //            self.VKI_show(elems[z]);
                            //        } else elems[z].focus();
                            //    } else self.VKI_target.focus();
                            //} else self.VKI_insert('\t');
                            //return false;

                            $mdKeyboard.currentModel.$setViewValue(($mdKeyboard.currentModel.$viewValue || '') + '\t');
                            $mdKeyboard.currentModel.$validate();
                            $mdKeyboard.currentModel.$render();
                            break;
                        case 'Bksp':
                            // TODO: handle text selection

                            // backspace
                            //self.VKI_target.focus();
                            //if (self.VKI_target.setSelectionRange && hasSelectionStartEnd(self.VKI_target) && !self.VKI_target.readOnly) {
                            //    var rng = [self.VKI_target.selectionStart, self.VKI_target.selectionEnd];
                            //    if (rng[0] < rng[1]) rng[0]++;
                            //    self.VKI_target.value = self.VKI_target.value.substr(0, rng[0] - 1) + self.VKI_target.value.substr(rng[1]);
                            //    self.VKI_target.setSelectionRange(rng[0] - 1, rng[0] - 1);
                            //} else if (self.VKI_target.createTextRange && !self.VKI_target.readOnly) {
                            //    try {
                            //        self.VKI_target.range.select();
                            //    } catch (e) {
                            //        self.VKI_target.range = document.selection.createRange();
                            //    }
                            //    if (!self.VKI_target.range.text.length) self.VKI_target.range.moveStart('character', -1);
                            //    self.VKI_target.range.text = '';
                            //} else self.VKI_target.value = self.VKI_target.value.substr(0, self.VKI_target.value.length - 1);
                            //if (self.VKI_shift) self.VKI_modify('Shift');
                            //if (self.VKI_altgr) self.VKI_modify('AltGr');
                            //self.VKI_target.focus();
                            //self.keyInputCallback();
                            //return true;

                            $mdKeyboard.currentModel.$setViewValue(($mdKeyboard.currentModel.$viewValue || '').slice(0, -1));
                            $mdKeyboard.currentModel.$validate();
                            $mdKeyboard.currentModel.$render();
                            break;
                        case 'Enter':
                            if (element[0].nodeName.toUpperCase() !== 'TEXTAREA') {
                                $timeout(function () {
                                    angular.element(element[0].form).triggerHandler('submit');
                                });
                            } else {
                                $mdKeyboard.currentModel.$setViewValue(($mdKeyboard.currentModel.$viewValue || '') + '\n');
                                $mdKeyboard.currentModel.$validate();
                                $mdKeyboard.currentModel.$render();
                            }
                            break;
                        default:
                            $mdKeyboard.currentModel.$setViewValue(($mdKeyboard.currentModel.$viewValue || '') + $ctrl.getKey(key));
                            $mdKeyboard.currentModel.$validate();
                            $mdKeyboard.currentModel.$render();
                            $ctrl.caps = false;
                            break;
                    }
                }

                /**
                 * Get a keyboard layout based on name.
                 *
                 * @param layoutName name of the keyboard layout
                 * @returns {*} keyboard layout
                 */
                function getKeyboardLayout (layoutName) {
                    return $mdKeyboard.getLayout(layoutName);
                }

                /**
                 * Get a key from a key list.
                 *
                 * @param key key list.
                 * @param checkCaps should caps also be checked
                 * @returns {*} the key from the key list
                 */
                function getKey (key, checkCaps) {
                    /*
                     * caps is based on both caps lock and cap (Shift) key
                     * the function is actually XOR since we expect that if caps lock
                     * is on and we press shift, a lowercase letter will be typed.
                     * all other cases are obvious.
                     */
                    return (checkCaps && ($ctrl.capsLocked ^ $ctrl.caps)) ? key[1] : key[0];
                }
            }
        }
    }
})();
