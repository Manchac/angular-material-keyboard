(function () {
    angular.module('material.components.keyboard')
        .config(MdAutocompleteDecorator);

    function MdAutocompleteDecorator($provide) {
        // decorate md-autocomplete directive
        // with use-keyboard behavior
        $provide.decorator('mdAutocompleteDirective', mdAutocompleteDirective);

        function mdAutocompleteDirective ($q, $delegate, $timeout, $compile, $mdUtil, $mdConstant) {
            var directive = $delegate[0];
            var compile = directive.compile;

            directive.compile = function () {
                var link = compile.apply(this, arguments);
                return decorator;

                function decorator (scope, element, attrs, MdAutocompleteCtrl) {
                    // call original link
                    // function if existant
                    if (angular.isDefined(link)) {
                        link.apply(this, arguments);
                    }

                    if (angular.isDefined(attrs.useKeyboard)) {
                        $timeout(function () {
                            var input = angular.element(
                                element[0].querySelector('input[type="search"]:not(use-keyboard)')
                            );
                            var cloned = input
                                .clone(true, true)
                                .attr('use-keyboard', attrs.useKeyboard);
                            var compiled = $compile(cloned)(scope);
                            var keydown = MdAutocompleteCtrl.keydown;

                            input.replaceWith(compiled);

                            MdAutocompleteCtrl.select = select;
                            MdAutocompleteCtrl.keydown = keydownDecorated;

                            function select (index) {
                                $mdUtil.nextTick(function () {
                                    getDisplayValue(MdAutocompleteCtrl.matches[index]).then(function (val) {
                                        var ngModel = compiled.controller('ngModel');
                                        ngModel.$setViewValue(val);
                                        ngModel.$render();
                                    }).finally(function () {
                                        scope.selectedItem = MdAutocompleteCtrl.matches[index];
                                        MdAutocompleteCtrl.loading = false;
                                        MdAutocompleteCtrl.hidden = true;
                                    });
                                }, false);

                                function getDisplayValue(item) {
                                    return $q.when(getItemText(item) || item);
                                }

                                function getItemText(item) {
                                    return (item && scope.itemText) ? scope.itemText(getItemAsNameVal(item)) : null;
                                }

                                function getItemAsNameVal(item) {
                                    if (!item) return undefined;

                                    var locals = {};
                                    if (MdAutocompleteCtrl.itemName) locals[MdAutocompleteCtrl.itemName] = item;

                                    return locals;
                                }
                            }

                            function keydownDecorated (event) {
                                switch (event.keyCode) {
                                    case $mdConstant.KEY_CODE.ENTER:
                                        if (MdAutocompleteCtrl.hidden
                                            || MdAutocompleteCtrl.loading
                                            || MdAutocompleteCtrl.index < 0
                                            || MdAutocompleteCtrl.matches.length < 1) return;
                                        if (hasSelection()) return;
                                        event.stopPropagation();
                                        event.preventDefault();
                                        select(MdAutocompleteCtrl.index);
                                        break;
                                    case $mdConstant.KEY_CODE.TAB:
                                    case $mdConstant.KEY_CODE.ESCAPE:
                                        compiled.blur();
                                        if (scope.searchText) {
                                            keydown.call(MdAutocompleteCtrl, event);
                                        }
                                        break;
                                    default:
                                        keydown.call(MdAutocompleteCtrl, event);
                                        break;
                                }

                                function hasSelection() {
                                    return Boolean(MdAutocompleteCtrl.scope.selectedItem);
                                }
                            }
                        });
                    }
                }
            };

            return $delegate;
        }
    }
});
