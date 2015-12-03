(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.PromiseMessageDirective = PromiseMessageDirective;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _angular = (typeof window !== "undefined" ? window['angular'] : typeof global !== "undefined" ? global['angular'] : null);

var _angular2 = _interopRequireDefault(_angular);

var isDefined = _angular2['default'].isDefined;
var isNumber = _angular2['default'].isNumber;
var identity = _angular2['default'].identity;

function PromiseMessageDirective() {
    return {
        restrict: 'EA',
        transclude: 'element',
        require: '^^promiseMessages',
        compile: function compile(element, attr) {
            var disableAutoReset = isDefined(attr.disableAutoReset);

            if (disableAutoReset && isDefined(attr.autoResetDelay)) {
                throw new Error('directive `promiseMessage` cannot have both attributes `disableAutoReset` and `autoResetDelay`');
            }

            if (disableAutoReset) {
                attr.$set('autoResetDelay', "-1");
            }

            return function (scope, element, attr, messages, transclude) {
                var current = undefined;

                var when = attr.when || 'none';
                var configure = isDefined(attr.autoResetDelay) ? function (config) {
                    return config.override(attr.autoResetDelay);
                } : identity;
                var control = {
                    test: function test(state) {
                        return state === when;
                    },
                    attach: function attach() {
                        if (current) return;
                        transclude(scope, function (cloned) {
                            element.parent().append(current = cloned);
                        });
                    },
                    detach: function detach() {
                        if (!current) return;
                        current.remove();
                        current = null;
                    },
                    config: function config(_config) {
                        return configure(_config);
                    }
                };

                messages.addControl(control);
                scope.$on('$destroy', function () {
                    messages.removeControl(control);
                });
            };
        }
    };
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.PromiseMessagesDirective = PromiseMessagesDirective;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var STATE_NONE = 'none';
var STATE_PENDING = 'pending';
var STATE_FULFILLED = 'fulfilled';
var STATE_REJECTED = 'rejected';
var STATES = [STATE_NONE, STATE_PENDING, STATE_FULFILLED, STATE_REJECTED];

var PromiseMessagesController = (function () {
    _createClass(PromiseMessagesController, null, [{
        key: '$inject',

        // TODO: fixme
        get: function get() {
            return ['promiseMessages', 'promiseMessagesScheduler'];
        }
    }]);

    function PromiseMessagesController(configs, scheduler) {
        var _this = this;

        _classCallCheck(this, PromiseMessagesController);

        this.schedule = scheduler(function () {
            return _this.render(STATE_NONE);
        });
        this.configs = configs;
        this.controls = [];
        this.$state = {};
    }

    _createClass(PromiseMessagesController, [{
        key: 'addControl',
        value: function addControl(control) {
            this.controls.push(control);
        }
    }, {
        key: 'removeControl',
        value: function removeControl(control) {
            var index = this.controls.indexOf(control);
            if (index > -1) {
                this.controls = this.controls.splice(index, 1);
            }
        }
    }, {
        key: 'getConfig',
        value: function getConfig(state) {
            return this.controls.reduce(function (config, control) {
                return control.test(state) ? control.config(config) : config;
            }, this.configs.get(state));
        }
    }, {
        key: 'render',
        value: function render(state) {
            this.setState(state);
            this.controls.forEach(function (control) {
                if (control.test(state)) {
                    control.attach();
                } else {
                    control.detach();
                }
            });
        }
    }, {
        key: 'setState',
        value: function setState(state) {
            var _this2 = this;

            this.$state.name = state;
            STATES.forEach(function (state) {
                return _this2.$state[state] = _this2.$state.name === state;
            });

            this.tryScheduleReset(this.getConfig(state));
        }
    }, {
        key: 'tryScheduleReset',
        value: function tryScheduleReset(config) {
            if (config.willAutoReset()) {
                this.scheduleReset(config.getAutoResetDelay());
            }
        }
    }, {
        key: 'scheduleReset',
        value: function scheduleReset(delay) {
            this.schedule(delay);
        }
    }]);

    return PromiseMessagesController;
})();

exports.PromiseMessagesController = PromiseMessagesController;

PromiseMessagesDirective.$inject = ['$parse', '$q'];

function PromiseMessagesDirective($parse, $q) {
    function renderer(control) {
        return function (promise) {
            if (promise) {
                control.render(STATE_PENDING);
                promise.then(function (_) {
                    return control.render(STATE_FULFILLED);
                }, function (_) {
                    return control.render(STATE_REJECTED);
                });
            } else {
                control.render(STATE_NONE);
            }
        };
    }

    return {
        restrict: 'EA',
        link: function link(scope, element, attr, control) {
            var render = renderer(control);
            var state = attr.state;
            var forExpression = attr['for'];
            var forActionExpression = attr.forAction;

            if (state) {
                ($parse(state).assign || function () {})(scope, control.$state);
            }

            if (forExpression) {
                scope.$watch(forExpression, function (promise) {
                    return render(promise);
                });
            }

            if (forActionExpression) {
                (function () {
                    var event = attr.trigger || 'click';
                    var handler = function handler() {
                        render($q.when($parse(forActionExpression)(scope)));
                        scope.$apply();
                    };

                    element.on(event, handler);
                    scope.$on('$destroy', function () {
                        return element.off(event, handler);
                    });
                })();
            }

            // initialize view
            render();
        },
        controller: 'PromiseMessagesController'
    };
}

},{}],3:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _angular = (typeof window !== "undefined" ? window['angular'] : typeof global !== "undefined" ? global['angular'] : null);

var _angular2 = _interopRequireDefault(_angular);

var _directivesPromiseMessages = require('./directives/promise-messages');

var _directivesPromiseMessage = require('./directives/promise-message');

var _providersPromiseMessages = require('./providers/promise-messages');

var _servicesScheduler = require('./services/scheduler');

exports['default'] = _angular2['default'].module('promiseMessages', []).provider('promiseMessages', _providersPromiseMessages.PromiseMessagesProvider).factory('promiseMessagesScheduler', _servicesScheduler.SchedulerFactory).directive('promiseMessages', _directivesPromiseMessages.PromiseMessagesDirective).directive('promiseMessage', _directivesPromiseMessage.PromiseMessageDirective).controller('PromiseMessagesController', _directivesPromiseMessages.PromiseMessagesController);
module.exports = exports['default'];

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./directives/promise-message":1,"./directives/promise-messages":2,"./providers/promise-messages":4,"./services/scheduler":5}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.PromiseMessagesProvider = PromiseMessagesProvider;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var StateConfigBuilder = (function () {
    function StateConfigBuilder(state, parent) {
        _classCallCheck(this, StateConfigBuilder);

        this.state = state;
        this.parent = parent;
    }

    _createClass(StateConfigBuilder, [{
        key: "setAutoResetDelay",
        value: function setAutoResetDelay(ms) {
            this.autoResetDelay = ms;

            return this;
        }
    }, {
        key: "disableAutoReset",
        value: function disableAutoReset() {
            return this.setAutoResetDelay(-1);
        }
    }, {
        key: "end",
        value: function end() {
            return this.parent;
        }
    }, {
        key: "getStateConfig",
        value: function getStateConfig() {
            return new StateConfig(this.state, this.autoResetDelay);
        }
    }]);

    return StateConfigBuilder;
})();

var StateConfig = (function () {
    function StateConfig(state) {
        var autoResetDelay = arguments.length <= 1 || arguments[1] === undefined ? -1 : arguments[1];

        _classCallCheck(this, StateConfig);

        this.state = state;
        this.autoResetDelay = autoResetDelay;
    }

    _createClass(StateConfig, [{
        key: "getState",
        value: function getState() {
            return this.state;
        }
    }, {
        key: "getAutoResetDelay",
        value: function getAutoResetDelay() {
            return this.autoResetDelay;
        }
    }, {
        key: "willAutoReset",
        value: function willAutoReset() {
            return this.getAutoResetDelay() >= 0;
        }
    }, {
        key: "override",
        value: function override(autoResetDelay) {
            return new StateConfig(this.state, autoResetDelay);
        }
    }]);

    return StateConfig;
})();

var StateConfigRegistry = (function () {
    function StateConfigRegistry() {
        _classCallCheck(this, StateConfigRegistry);

        this.configs = {};
    }

    _createClass(StateConfigRegistry, [{
        key: "add",
        value: function add(config) {
            this.configs[config.getState()] = config;
        }
    }, {
        key: "get",
        value: function get(state) {
            return this.configs[state] || (this.configs[state] = new StateConfig(state));
        }
    }]);

    return StateConfigRegistry;
})();

function PromiseMessagesProvider() {
    var _this = this;

    var builders = [];

    this.state = function (state) {
        var builder = new StateConfigBuilder(state, _this);

        builders.push(builder);

        return builder;
    };

    this.$get = function () {

        var registry = new StateConfigRegistry();

        builders.map(function (builder) {
            return builder.getStateConfig();
        }).forEach(function (config) {
            return registry.add(config);
        });

        return registry;
    };
}

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.SchedulerFactory = SchedulerFactory;
function scheduler($timeout, fn) {
    var timer = undefined;

    function clearTimer() {
        if (timer) {
            $timeout.cancel(timer);
            timer = null;
        }
    }

    function scheduleFn(delay) {
        if (delay >= 0) {
            timer = $timeout(fn, delay);
        }
    }

    return function schedule(delay) {
        clearTimer();
        scheduleFn(delay);
    };
}

SchedulerFactory.$inject = ['$timeout'];

function SchedulerFactory($timeout) {
    return function (fn) {
        return scheduler($timeout, fn);
    };
}

},{}]},{},[3]);
