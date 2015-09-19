export class PromiseMessagesController {
    constructor() {
        this.controls = [];
    }
    addControl (control) {
        this.controls.push(control);
    }
    removeControl (control) {
        let index = this.controls.indexOf(control);
        if (index > -1) {
            this.controls = this.controls.splice(index, 1);
        }
    }
    render (state) {
        this.controls.forEach(control => {
            if (control.test(state)) {
                control.attach();
            } else {
                control.detach();
            }
        });
    }
}

export function PromiseMessagesDirective () {
    return {
        restrict: 'EA',
        link: (scope, element, attr, control) => {
            scope.$watch(attr.for, promise => render(promise));

            function render (promise) {
                if (promise) {
                    control.render('pending');
                    promise.then(_ => control.render('fulfilled'), _ => control.render('rejected'));
                } else {
                    control.render('none')
                }
            }
        },
        controller: 'PromiseMessagesController'
    };
}
