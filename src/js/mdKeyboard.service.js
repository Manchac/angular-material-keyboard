(function () {
    "use strict";

    angular.module('material.components.keyboard')
        .factory('mdKeyboardService', mdKeyboardService);

    function mdKeyboardService ($mdKeyboard, $timeout, $interval, $animate, mdKeyboardUtilService) {
        var scrollAnimation = null;
        var keyboardTimeout = null;
        var keyboardAnimation = null;

        return {
            showKeyboard: showKeyboard,
            hideKeyboard: hideKeyboard
        };

        /**
         * Show the keyboard.
         */
        function showKeyboard(element, attrs, ngModelCtrl) {
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
                startKeyboardShow(element, attrs);
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
         * Set keyboard layout to use.
         *
         * @param layoutName layout name to use.
         */
        function useKeyboardLayout (layoutName) {
            /* only use the keyboard if it is defined */
            if (!mdKeyboardUtilService.isNullOrUndefined(layoutName) && layoutName !== '') {
                /* switch which layout to use */
                $mdKeyboard.useLayout(layoutName);
            }
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
            if (mdKeyboardUtilService.isNullOrUndefined(node)
                || mdKeyboardUtilService.isNullOrUndefined(node.parent())
                || mdKeyboardUtilService.isNullOrUndefined(node.parent()[0])) {
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
            if (mdKeyboardUtilService.isNullOrUndefined(node)
                || mdKeyboardUtilService.isNullOrUndefined(node.parent())) {
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

            /* start scrolling */
            startScrollToAnimation(parent, scrollToLocation);
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
            if (!mdKeyboardUtilService.isNullOrUndefined(scrollAnimation)) {
                $interval.cancel(scrollAnimation);
                scrollAnimation = null;
            }
        }

        /**
         * Stop keyboard hide timeout.
         */
        function stopKeyboardTimeout () {
            /* stop keyboard timeout */
            if (!mdKeyboardUtilService.isNullOrUndefined(keyboardTimeout)) {
                $timeout.cancel(keyboardTimeout);
                keyboardTimeout = null;
            }
        }

        /**
         * Stop keyboard show or hide animation.
         */
        function stopKeyboardAnimation () {
            /* stop keyboard animation */
            if (!mdKeyboardUtilService.isNullOrUndefined(keyboardAnimation)) {
                $animate.cancel(keyboardAnimation);
                keyboardAnimation = null;
            }
        }

        /**
         * Start keyboard show animation.
         */
        function startKeyboardShow (element, attrs) {
            keyboardAnimation = $mdKeyboard.show({
                templateUrl: '../view/mdKeyboard.view.html',
                controller: makeMdKeyboardController(element, attrs.useKeyboard),
                controllerAs: 'keyboard',
                bindToController: true
            });
        }

        /**
         * Start keyboard hide animation.
         */
        function startKeyboardHide () {
            keyboardTimeout = $timeout(function () {
                keyboardAnimation = $mdKeyboard.hide();
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

            /* start scrolling */
            scrollAnimation = $interval(moveStep, 25);

            /**
             * Move another step closer to the scroll to location.
             */
            function moveStep () {
                var deltaScrollTo = scrollToLocation - currentLocation;

                /* Threshold of 5px will not make that much of a difference */
                if (Math.abs(deltaScrollTo) <= 5) {
                    stopScrollAnimation();
                }

                currentLocation += deltaScrollTo * 0.3;
                parent.scrollTop = currentLocation;
            }
        }

        /**
         * Make a new keyboard controller.
         *
         * @param element element the controller is being applied to
         * @param keyboardLayoutName keyboard layout name to use
         */
        function makeMdKeyboardController(element, keyboardLayoutName) {

            /* return a controller decorated with an element, attributes, and ngModelCtrl */
            return mdKeyboardController;

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
                    useKeyboardLayout(keyboardLayoutName);

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

                            var selectionStart = element[0].selectionStart;
                            var selectionEnd = element[0].selectionEnd;
                            var curval = $mdKeyboard.currentModel.$viewValue || '';
                            if (selectionStart === selectionEnd && selectionStart === 0) {
                                /**
                                 * if the selection start and end are the
                                 * same, then we do not have anything highlighted
                                 * and if selectionStart is 0, then we are at the
                                 * beginning of the string so we do not do anything
                                 **/
                                $mdKeyboard.currentModel.$validate();
                                $mdKeyboard.currentModel.$render();
                                break;
                            } else if (selectionStart === selectionEnd && selectionStart !== 0) {
                                /**
                                 * if the selection start and end are the
                                 * same, then we do not have anything highlighted
                                 * and if selectionStart is not 0, then we are removing
                                 * something from within the string
                                 */
                                $mdKeyboard.currentModel.$setViewValue(
                                    curval.slice(0, selectionStart - 1) + curval.slice(selectionEnd)
                                );
                                $mdKeyboard.currentModel.$validate();
                                $mdKeyboard.currentModel.$render();
                                element[0].setSelectionRange(selectionStart - 1, selectionStart - 1);
                                break;
                            } else {
                                /**
                                 * the selection start and end are not the same,
                                 * but we can guarentee start << end since we know
                                 * they are not equal.
                                 */
                                $mdKeyboard.currentModel.$setViewValue(
                                    curval.slice(0, selectionStart) + curval.slice(selectionEnd)
                                );
                                $mdKeyboard.currentModel.$validate();
                                $mdKeyboard.currentModel.$render();
                                element[0].setSelectionRange(selectionStart, selectionStart);
                                break;
                            }
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
