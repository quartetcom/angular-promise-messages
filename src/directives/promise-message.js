export function PromiseMessageDirective () {
    let guard = (test, next) => test() && next();

    return {
        restrict: 'EA',
        transclude: 'element',
        require: '^^promiseMessages',
        link: (scope, element, attr, messages, transclude) => {
            let current;
            let when = attr.when || 'none';
            let control = {
                test: state => state === when,
                attach: () => guard(() => !current, () => {
                    transclude(scope, cloned => {
                        element.parent().append(current = cloned);
                    })
                }),
                detach: () => guard(() => current, () => {
                    current.remove();
                    current = null;
                })
            };

            messages.addControl(control);
            scope.$on('$destroy', () => {
                messages.removeControl(control);
            });
        }
    }
}
