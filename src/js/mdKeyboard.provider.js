(function () {
    "use strict";

    angular
        .module('material.components.keyboard')
        .provider('$mdKeyboard', MdKeyboardProvider);

    function MdKeyboardProvider($$interimElementProvider, keyboardLayouts, keyboardDeadkey, keyboardSymbols, keyboardNumpad) {
        var keyboardShowingClassName = 'md-keyboard-is-showing';
        var currentScope = null;
        var currentKeyboardLayout = 'US International';
        var keyboardSelectorString = 'body';
        var isKeyboardVisible = false;
        var $mdKeyboard = $$interimElementProvider('$mdKeyboard')
            .setDefaults({
                methods: ['themable', 'disableParentScroll', 'clickOutsideToClose', 'layout'],
                options: keyboardDefaults
            })
            .addMethod('getLayout', getLayout)
            .addMethod('getCurrentLayout', getCurrentLayout)
            .addMethod('getLayouts', getLayouts)
            .addMethod('defaultLayout', defaultLayout)
            .addMethod('keyboardSelector', keyboardSelector)
            .addMethod('useLayout', useLayout)
            .addMethod('addLayout', addLayout)
            .addMethod('isVisible', isVisible);

        /*
         * should be available in provider (config phase) not only
         * in service as defined in $$interimElementProvider
         */
        $mdKeyboard.getLayout = getLayout;
        $mdKeyboard.getCurrentLayout = getCurrentLayout;
        $mdKeyboard.getLayouts = getLayouts;
        $mdKeyboard.defaultLayout = defaultLayout;
        $mdKeyboard.keyboardSelector = keyboardSelector;
        $mdKeyboard.useLayout = useLayout;
        $mdKeyboard.addLayout = addLayout;
        $mdKeyboard.isVisible = isVisible;

        return $mdKeyboard;

        /**
         * Decide whether or not a value is null or undefined or neither.
         *
         * @param value value to check for null or undefined.
         * @returns {boolean} true if element is null or undefined, false otherwise.
         */
        function isNullOrUndefined (value) {
            return (value === null) || angular.isUndefined(value);
        }

        /**
         * Get currently used layout object.
         */
        function getCurrentLayout () {
            return currentKeyboardLayout;
        }

        /**
         * Get a keyboard layout by name.
         * @param layoutName layout name to query for.
         * @returns {*} layout object associated with layoutName.
         */
        function getLayout (layoutName) {
            if (keyboardLayouts.hasOwnProperty(layoutName) && !isNullOrUndefined(keyboardLayouts[layoutName])) {
                return keyboardLayouts[layoutName];
            }
        }

        /**
         * Get list of currently available layout names.
         *
         * @returns {Array} array of available layout names.
         */
        function getLayouts () {
            var layouts = [];
            angular.forEach(keyboardLayouts, function (_, layoutName) {
                layouts.push(layoutName);
            });
            return layouts;
        }

        /**
         * Set default layout associated with name.
         *
         * @param layoutName layout name to set
         */
        function defaultLayout(layoutName) {
            if (keyboardLayouts.hasOwnProperty(layoutName) && !isNullOrUndefined(keyboardLayouts[layoutName])) {
                currentKeyboardLayout = layoutName;
            } else {
                if (!isNullOrUndefined(layoutName)) {
                    console.warn([
                        'The keyboard layout ' + layoutName + ' does not exist.',
                        'The currently used layout is ' + getCurrentLayout() + '.',
                        'To get a list of available layouts, use "showLayouts".'
                    ].join('\n'));
                }
            }
        }

        /**
         * Set layout parent selector. This will allow the keyboard to be
         * placed anywhere in the DOM that the user specifies.
         *
         * @param selector selector string to query for keyboard location.
         */
        function keyboardSelector(selector) {
            keyboardSelectorString = selector
        }

        /**
         * Set the name of the layout to use.
         *
         * @param layoutName name of layout to use.
         */
        function useLayout(layoutName) {
            if (keyboardLayouts.hasOwnProperty(layoutName) && !isNullOrUndefined(keyboardLayouts[layoutName])) {
                currentKeyboardLayout = layoutName;
            } else {
                if (!isNullOrUndefined(layoutName)) {
                    console.warn([
                        'The keyboard layout ' + layoutName + ' does not exist.',
                        'The currently used layout is ' + getCurrentLayout() + '.',
                        'To get a list of available layouts, use "showLayouts".'
                    ].join('\n'));
                }
            }

            /* broadcast new layout */
            broadcastNewLayout();
        }

        /**
         * Add a custom layout.
         *
         * @param layoutName name of the layout.
         * @param keys layout key configuration.
         */
        function addLayout(layoutName, keys) {
            if (isNullOrUndefined(layoutName)) {
                return;
            }

            if (!keyboardLayouts.hasOwnProperty(layoutName)) {
                keyboardLayouts[layoutName] = keys;
            } else {
                console.warn('There is already a keyboard layout named ' + layoutName + ', use a different name.');
            }
        }

        /**
         * Broadcast to the current scope that a that the layout has been changed.
         */
        function broadcastNewLayout () {
            if (!isNullOrUndefined(currentScope)) {
                currentScope.$broadcast('$mdKeyboardLayoutChanged', currentKeyboardLayout);
            }
        }

        /**
         * Set the current scope.
         *
         * @param scope scope to set.
         */
        function setCurrentScope (scope) {
            currentScope = scope;
        }

        /**
         * Check whether or not the keyboard is visible.
         *
         * @returns {*} whether or not the keyboard is currently visible.
         */
        function isVisible () {
            return isKeyboardVisible;
        }

        /**
         * Set the keyboard status to showing or not showing based on the "showing" parameter.
         *
         * @param showing true if the keyboard status should be set to showing, false otherwise.
         */
        function setKeyboardShowing (showing) {
            if (showing) {
                angular.element(document.body).addClass(keyboardShowingClassName);
            } else {
                angular.element(document.body).removeClass(keyboardShowingClassName);
            }

            isKeyboardVisible = showing;
        }

        /**
         * Get the keyboard parent (where to shove the keyboard element).
         *
         * @return {*} an angular element for the keyboard parent.
         */
        function getKeyboardParent () {
            return angular.element(document.querySelector(keyboardSelectorString));
        }

        /* @ngInject */
        function keyboardDefaults($animate, $rootElement, $mdConstant, $mdUtil, $mdTheming, $mdKeyboard) {
            return {
                onShow: onShow,
                onRemove: onRemove,

                themable: true,
                disableParentScroll: true,
                clickOutsideToClose: true,
                layout: currentKeyboardLayout,
                layouts: keyboardLayouts,
                deadkey: keyboardDeadkey,
                symbols: keyboardSymbols,
                numpad: keyboardNumpad
            };

            /**
             * Show our keyboard.
             *
             * @param scope keyboard scope.
             * @param element element keyboard is applied to.
             * @param options options for keyboard.
             */
            function onShow(scope, element, options) {
                var parent = getKeyboardParent();
                var keyboard = new Keyboard(element, parent);

                /* make sure our parent is okay */
                if (isNullOrUndefined(parent)) {
                    return;
                }

                /* add keyboard to our options */
                options.keyboard = keyboard;

                /* set our status to showing and configure our current scope */
                setKeyboardShowing(true);
                setCurrentScope(scope);

                /* add the keyboard to our chosen parent */
                parent.append(keyboard.element);

                $mdTheming.inherit(keyboard.element, parent);

                if (options.disableParentScroll) {
                    options.restoreScroll = $mdUtil.disableScrollAround(keyboard.element, parent);
                }

                /* start keyboard show animation */
                return $animate
                    .enter(keyboard.element, parent)
                    .then(animationComplete);

                function animationComplete () {
                    if (options.escapeToClose) {
                        options.rootElementKeyupCallback = function (e) {
                            if (e.keyCode === $mdConstant.KEY_CODE.ESCAPE) {
                                $mdUtil.nextTick($mdKeyboard.cancel, true);
                            }
                        };
                        $rootElement.on('keyup', options.rootElementKeyupCallback);
                    }
                }
            }

            /**
             * Remove our keyboard.
             *
             * @param scope keyboard scope.
             * @param element element keyboard is applied to.
             * @param options options for keyboard.
             */
            function onRemove(scope, element, options) {
                var keyboard = options.keyboard;

                /* start keyboard hide animation */
                return $animate
                    .leave(keyboard.element)
                    .then(animationComplete);

                function animationComplete () {
                    if (options.disableParentScroll) {
                        options.restoreScroll();
                        delete options.restoreScroll;
                    }

                    /* cleanup keyboard */
                    keyboard.cleanup();

                    /* set our status to not showing and configure our current scope */
                    setKeyboardShowing(false);
                    setCurrentScope(null);
                }
            }

            /**
             * Keyboard class to apply keyboard behavior to an element
             */
            function Keyboard(element, parent) {
                element.on('mousedown', onMouseDown);

                return {
                    element: element,
                    cleanup: cleanup
                };

                /**
                 * Event that will happen when the mouse is pressed on a key.
                 *
                 * @param ev mouse event
                 */
                function onMouseDown(ev) {
                    ev.preventDefault();
                }

                /**
                 * Keyboard cleanup.
                 */
                function cleanup () {
                    parent.triggerHandler('focus');
                }
            }
        }
    }
})();
