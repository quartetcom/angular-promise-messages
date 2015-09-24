import angular from 'angular';
import mocks from 'angular-mocks';
import module from '../../src/promise-messages-module';

let bind = angular.bind;

describe('PromiseMessagesController', () => {
    let controller;

    beforeEach(() => {
        angular.mock.module(module.name);

        inject($controller => {
            controller = bind(null, $controller, 'PromiseMessagesController');
        });
    });

    it('should be instantiate', () => {
        expect(controller()).toBeTruthy();
    });

    describe('setState()', () => {
        it('should update $state', () => {
            let ctrl = controller();

            expect(ctrl.$state).toEqual({});

            ctrl.setState('none');
            expect(ctrl.$state).toEqual({
                name: 'none',
                none: true,
                pending: false,
                fulfilled: false,
                rejected: false
            });

            ctrl.setState('fulfilled');
            expect(ctrl.$state).toEqual({
                name: 'fulfilled',
                none: false,
                pending: false,
                fulfilled: true,
                rejected: false
            });
        });

        it('should schedule reset if auto resetting is enabled', () => {
            let config = jasmine.createSpyObj('config', ['willAutoReset', 'getAutoResetAfter']);
            let scheduler = jasmine.createSpy('scheduler');
            let schedule = jasmine.createSpy('schedule');

            scheduler.and.returnValue(schedule);

            let ctrl = controller({promiseMessages: config, promiseMessagesScheduler: scheduler});

            config.willAutoReset.and.returnValue(true);
            config.getAutoResetAfter.and.returnValue(3000);

            ctrl.setState('none');
            expect(schedule).not.toHaveBeenCalled();

            ctrl.setState('pending');
            expect(schedule).not.toHaveBeenCalled();

            ctrl.setState('fulfilled');
            expect(schedule).toHaveBeenCalledWith(3000);
            expect(schedule.calls.count()).toEqual(1);

            ctrl.setState('rejected');
            expect(schedule.calls.count()).toEqual(2);
        });

        it('should not schedule reset if auto resetting is disabled', () => {
            let config = jasmine.createSpyObj('config', ['willAutoReset', 'getAutoResetAfter']);
            let scheduler = jasmine.createSpy('scheduler');
            let schedule = jasmine.createSpy('schedule');

            scheduler.and.returnValue(schedule);

            let ctrl = controller({promiseMessages: config, promiseMessagesScheduler: scheduler});

            config.willAutoReset.and.returnValue(false);
            config.getAutoResetAfter.and.returnValue(3000);

            ctrl.setState('none');
            expect(schedule).not.toHaveBeenCalled();

            ctrl.setState('pending');
            expect(schedule).not.toHaveBeenCalled();

            ctrl.setState('fulfilled');
            expect(schedule).not.toHaveBeenCalled();

            ctrl.setState('rejected');
            expect(schedule).not.toHaveBeenCalled();
        });
    });
});