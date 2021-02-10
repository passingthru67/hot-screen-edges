/* ========================================================================================================
 * hotScreenEdges.js
 * --------------------------------------------------------------------------------------------------------
 *  CREDITS:  Part of this code was copied from gnome-shell Layout.js
 * ========================================================================================================
 */

const _DEBUG_ = false;

const { Clutter, GObject, Meta, Shell, St } = imports.gi;
const Signals = imports.signals;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

var PRESSURE_THRESHOLD = 100; // pixels
var PRESSURE_TIMEOUT = 1000; // ms


var HotScreenEdgesManager = class HotScreenEdges_HotScreenEdgesManager {
    constructor() {
        this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.hot-screen-edges');
        this._hotScreenEdges = [];

        this._monitorsChangedId = Main.layoutManager.connect('monitors-changed', this._onMonitorsChanged.bind(this));

        this._bindSettingsChanges();
        this._updateHotScreenEdges();
    }

    destroy() {
        // Disoconnect signals
        if (this._monitorsChangedId)
            Main.layoutManager.disconnect(this._monitorsChangedId);
        this._monitorsChangedId = 0;

        // Destroy old hot screen edges
        this._hotScreenEdges.forEach(edge => {
            if (edge)
                edge.destroy();
        });
        this._hotScreenEdges = [];

        this._settings.run_dispose();
        this._settings = null;
    }

    _checkMonitorBoundaries(index) {
        let monitor = Main.layoutManager.monitors[index];
        let otherMonitors = Main.layoutManager.monitors;

        let leftMost, topMost, rightMost, bottomMost;
        leftMost = topMost = rightMost = bottomMost = true;
        for (let j = 0; j < otherMonitors.length; j++) {
            if (index == j)
                continue;

            let otherMonitor = otherMonitors[j];
            if (otherMonitor.x + otherMonitor.width <= monitor.x  &&
                otherMonitor.y < monitor.y + monitor.height &&
                otherMonitor.y + otherMonitor.height > monitor.y) {
                leftMost = false;
            }
            if (otherMonitor.y + otherMonitor.height <= monitor.y  &&
                otherMonitor.x < monitor.x + monitor.width &&
                otherMonitor.x + otherMonitor.width > monitor.x) {
                topMost = false;
            }
            if (otherMonitor.x >= monitor.x + monitor.width &&
                otherMonitor.y < monitor.y + monitor.height &&
                otherMonitor.y + otherMonitor.height > monitor.y) {
                rightMost = false;
            }
            if (otherMonitor.y >= monitor.y + monitor.height &&
                otherMonitor.x < monitor.x + monitor.width &&
                otherMonitor.x + otherMonitor.width > monitor.x) {
                bottomMost = false;
            }
        }

        return [leftMost, topMost, rightMost, bottomMost];
    }

    _updateHotScreenEdges() {
        // Destroy old hot screen edges
        this._hotScreenEdges.forEach(edge => {
            if (edge)
                edge.destroy();
        });
        this._hotScreenEdges = [];

        // build new hot edges
        let monitors = Main.layoutManager.monitors;
        for (let i = 0; i < monitors.length; i++) {
            let monitor = monitors[i];

            if (this._settings.get_boolean('primary-monitor-only')) {
                if (i != Main.layoutManager.primaryIndex)
                    continue;
            }

            let [leftMost, topMost, rightMost, bottomMost] = this._checkMonitorBoundaries(i);
            let side, edge;
            if (this._settings.get_boolean('side-left') && leftMost) {
                if (_DEBUG_) global.log("HotScreenEdges: LEFT pref side active");
                side = St.Side.LEFT;
                edge = new HotScreenEdge(monitor, side);
                this._hotScreenEdges.push(edge);
            }
            if (this._settings.get_boolean('side-top') && topMost) {
                if (_DEBUG_) global.log("HotScreenEdges: TOP pref side active");
                side = St.Side.TOP;
                edge = new HotScreenEdge(monitor, side);
                this._hotScreenEdges.push(edge);
            }
            if (this._settings.get_boolean('side-right') && rightMost) {
                if (_DEBUG_) global.log("HotScreenEdges: RIGHT pref side active");
                side = St.Side.RIGHT;
                edge = new HotScreenEdge(monitor, side);
                this._hotScreenEdges.push(edge);
            }
            if (this._settings.get_boolean('side-bottom') && bottomMost) {
                if (_DEBUG_) global.log("HotScreenEdges: BOTTOM pref side active");
                side = St.Side.BOTTOM;
                edge = new HotScreenEdge(monitor, side);
                this._hotScreenEdges.push(edge);
            }
        }
    }

    _onMonitorsChanged() {
        this._updateHotScreenEdges();
    }

    _bindSettingsChanges() {
        this._settings.connect('changed::side-top', () => {
            this._updateHotScreenEdges();
        });
        this._settings.connect('changed::side-bottom', () => {
            this._updateHotScreenEdges();
        });
        this._settings.connect('changed::side-left', () => {
            this._updateHotScreenEdges();
        });
        this._settings.connect('changed::side-right', () => {
            this._updateHotScreenEdges();
        });
        this._settings.connect('changed::primary-monitor-only', () => {
            this._updateHotScreenEdges();
        });
        this._settings.connect('changed::allow-fullscreen-mode', () => {
            this._updateHotScreenEdges();
        });
        this._settings.connect('changed::require-pressure-to-show', () => {
            this._updateHotScreenEdges();
        });
        this._settings.connect('changed::pressure-threshold', () => {
            this._updateHotScreenEdges();
        });
    }
};

var HotScreenEdge = GObject.registerClass(
class HotScreenEdge extends Clutter.Actor {
    _init(monitor, side) {
        super._init();

        this._monitor = monitor;
        this._side = side;
        this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.hot-screen-edges');

        // Initialize non-pressure variables
        this._entered = false;

        // Initialize pressure barrier variables
        this._canUsePressure = false;
        this._pressureSensed = false;
        this._pressureBarrier = null;
        this._barrier = null;
        this._removeBarrierTimeoutId = 0;

        this._canUsePressure = global.display.supports_extended_barriers();
        this._setupFallbackEdgeIfNeeded();
        this._createPressureBarrier();
        this._updateBarrier();

        this.connect('destroy', this._onDestroy.bind(this));
    }

    _onDestroy() {
        this._removeBarrier();
        if (this._pressureBarrier) {
            this._pressureBarrier.destroy();
            this._pressureBarrier = null;
        }

        this._settings.run_dispose();
        this._settings = null;
    }

    _createPressureBarrier() {
        // Remove existing pressure barrier
        if (this._pressureBarrier) {
            this._pressureBarrier.destroy();
            this._pressureBarrier = null;
        }

        // Create new pressure barrier based on pressure threshold setting
        if (this._canUsePressure) {

            let pressureThreshold = this._settings.get_double('pressure-threshold');

            this._pressureBarrier = new MyPressureBarrier(pressureThreshold, PRESSURE_TIMEOUT,
                                Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW);

            this._pressureBarrier.connect('trigger', this._onPressureSensed.bind(this));
        }
    }

    _removeBarrier() {
        if (this._barrier) {
            if (this._pressureBarrier) {
                this._pressureBarrier.removeBarrier(this._barrier);
            }
            this._barrier.destroy();
            this._barrier = null;
        }

        // Remove barrier timeout
        if (this._removeBarrierTimeoutId > 0) {
            GLib.source_remove(this._removeBarrierTimeoutId);
            this._removeBarrierTimeoutId = 0;
        }
    }

    _updateBarrier() {
        if (_DEBUG_) global.log("HotScreenEdge: _updateBarrier");
        // Remove existing barrier
        this._removeBarrier();

        // Manually reset pressure barrier
        if (this._pressureBarrier) {
            this._pressureBarrier._reset();
            this._pressureBarrier._isTriggered = false;
        }

        // Create new barrier
        if (this._canUsePressure && this._settings.get_boolean('require-pressure-to-show')) {

            let x1, x2, y1, y2, direction;
            if(this._side==St.Side.LEFT){
                x1 = this._monitor.x;
                x2 = this._monitor.x;
                y1 = this._monitor.y;
                y2 = this._monitor.y + this._monitor.height;
                direction = Meta.BarrierDirection.POSITIVE_X;
            } else if(this._side==St.Side.RIGHT) {
                x1 = this._monitor.x + this._monitor.width;
                x2 = this._monitor.x + this._monitor.width;
                y1 = this._monitor.y;
                y2 = this._monitor.y + this._monitor.height;
                direction = Meta.BarrierDirection.NEGATIVE_X;
            } else if(this._side==St.Side.TOP) {
                x1 = this._monitor.x;
                x2 = this._monitor.x + this._monitor.width;
                y1 = this._monitor.y;
                y2 = this._monitor.y;
                direction = Meta.BarrierDirection.POSITIVE_Y;
            } else if (this._side==St.Side.BOTTOM) {
                x1 = this._monitor.x;
                x2 = this._monitor.x + this._monitor.width;
                y1 = this._monitor.y + this._monitor.height;
                y2 = this._monitor.y + this._monitor.height;
                direction = Meta.BarrierDirection.NEGATIVE_Y;
            }

            this._barrier = new Meta.Barrier({display: global.display,
                                x1: x1, x2: x2,
                                y1: y1, y2: y2,
                                directions: direction});

            if (this._pressureBarrier) {
                this._pressureBarrier.addBarrier(this._barrier);
            }
        }

        // Reset pressureSensed flag
        this._pressureSensed = false;
    }

    _onPressureSensed() {
        this._pressureSensed = true;
        this._toggleOverview();
    }

    _setupFallbackEdgeIfNeeded(layoutManager) {
        if (!this._canUsePressure || !this._settings.get_boolean('require-pressure-to-show')) {

            let x1, x2, y1, y2;
            if(this._side==St.Side.LEFT){
                x1 = this._monitor.x;
                x2 = this._monitor.x + 1;
                y1 = this._monitor.y;
                y2 = this._monitor.y + this._monitor.height;
            } else if(this._side==St.Side.RIGHT) {
                x1 = this._monitor.x + this._monitor.width - 1;
                x2 = this._monitor.x + this._monitor.width;
                y1 = this._monitor.y;
                y2 = this._monitor.y + this._monitor.height;
            } else if(this._side==St.Side.TOP) {
                x1 = this._monitor.x;
                x2 = this._monitor.x + this._monitor.width;
                y1 = this._monitor.y;
                y2 = this._monitor.y + 1;
            } else if (this._side==St.Side.BOTTOM) {
                x1 = this._monitor.x;
                x2 = this._monitor.x + this._monitor.width;
                y1 = this._monitor.y + this._monitor.height - 1;
                y2 = this._monitor.y + this._monitor.height;
            }

            this.set({
                name: 'hot-edge-environs',
                x: x1,
                y: y1,
                width: (x2 - x1),
                height: (y2 - y1),
                reactive: true,
            });

            this._edge = new Clutter.Actor({ name: 'hot-edge',
                                               width: (x2 - x1),
                                               height: (y2 - y1),
                                               opacity: 0,
                                               reactive: true });
            this._edge._delegate = this;

            this.add_child(this._edge);
            Main.layoutManager.addChrome(this);

            if (Clutter.get_default_text_direction() == Clutter.TextDirection.RTL) {
                this._edge.set_position(this.width - this._edge.width, 0);
                this.set_pivot_point(1.0, 0.0);
                this.translation_x = -this.width;
            } else {
                this._edge.set_position(0, 0);
            }

            this._edge.connect('enter-event',
                                 this._onEdgeEntered.bind(this));
            this._edge.connect('leave-event',
                                 this._onEdgeLeft.bind(this));
        }
    }

    _toggleOverview() {
        if (!this._settings.get_boolean('allow-fullscreen-mode')) {
            if (this._monitor.inFullscreen && !Main.overview.visible)
                return;
        }

        // if (Main.overview.shouldToggleByCornerOrButton()) {
        //     Main.overview.toggle();
        //     if (Main.overview.animationInProgress)
        //         this._ripples.playAnimation(this._x, this._y);
        // }

        Main.overview.toggle();
    }

    handleDragOver(source, _actor, _x, _y, _time) {
        if (source != Main.xdndHandler)
            return DND.DragMotionResult.CONTINUE;

        this._toggleOverview();

        return DND.DragMotionResult.CONTINUE;
    }

    _onEdgeEntered() {
        if (!this._entered) {
            this._entered = true;
            this._toggleOverview();
        }
        return Clutter.EVENT_PROPAGATE;
    }

    _onEdgeLeft(actor, event) {
        if (event.get_related() != this)
            this._entered = false;
        // Consume event, otherwise this will confuse onEnvironsLeft
        return Clutter.EVENT_STOP;
    }

    vfunc_leave_event(crossingEvent) {
        if (crossingEvent.related != this._edge)
            this._entered = false;
        return Clutter.EVENT_PROPAGATE;
    }



});


var MyPressureBarrier = class HotScreenEdges_MyPressureBarrier {
    constructor(threshold, timeout, actionMode) {
        this._threshold = threshold;
        this._timeout = timeout;
        this._actionMode = actionMode;
        this._barriers = [];
        this._eventFilter = null;

        this._isTriggered = false;
        this._reset();
    }

    addBarrier(barrier) {
        barrier._pressureHitId = barrier.connect('hit', this._onBarrierHit.bind(this));
        barrier._pressureLeftId = barrier.connect('left', this._onBarrierLeft.bind(this));

        this._barriers.push(barrier);
    }

    _disconnectBarrier(barrier) {
        barrier.disconnect(barrier._pressureHitId);
        barrier.disconnect(barrier._pressureLeftId);
    }

    removeBarrier(barrier) {
        this._disconnectBarrier(barrier);
        this._barriers.splice(this._barriers.indexOf(barrier), 1);
    }

    destroy() {
        this._barriers.forEach(this._disconnectBarrier.bind(this));
        this._barriers = [];
    }

    setEventFilter(filter) {
        this._eventFilter = filter;
    }

    _reset() {
        if (_DEBUG_) global.log("myPressureBarrier: _reset");
        this._barrierEvents = [];
        this._currentPressure = 0;
        this._lastTime = 0;
    }

    _isHorizontal(barrier) {
        return barrier.y1 == barrier.y2;
    }

    _getDistanceAcrossBarrier(barrier, event) {
        if (this._isHorizontal(barrier))
            return Math.abs(event.dy);
        else
            return Math.abs(event.dx);
    }

    _getDistanceAlongBarrier(barrier, event) {
        if (this._isHorizontal(barrier))
            return Math.abs(event.dx);
        else
            return Math.abs(event.dy);
    }

    _trimBarrierEvents() {
        // Events are guaranteed to be sorted in time order from
        // oldest to newest, so just look for the first old event,
        // and then chop events after that off.
        let i = 0;
        let threshold = this._lastTime - this._timeout;

        while (i < this._barrierEvents.length) {
            let [time, distance] = this._barrierEvents[i];
            if (time >= threshold)
                break;
            i++;
        }

        let firstNewEvent = i;

        for (i = 0; i < firstNewEvent; i++) {
            let [time, distance] = this._barrierEvents[i];
            this._currentPressure -= distance;
        }

        this._barrierEvents = this._barrierEvents.slice(firstNewEvent);
    }

    _onBarrierLeft(barrier, event) {
        if (_DEBUG_) global.log("myPressureBarrier: _onBarrierLeft");
        barrier._isHit = false;
        if (this._barriers.every(function(b) { return !b._isHit; })) {
            this._reset();
            this._isTriggered = false;
        }
    }

    _trigger() {
        if (_DEBUG_) global.log("myPressureBarrier: _trigger");
        this._isTriggered = true;
        this.emit('trigger');
        this._reset();
    }

    _onBarrierHit(barrier, event) {
        barrier._isHit = true;

        // If we've triggered the barrier, wait until the pointer has the
        // left the barrier hitbox until we trigger it again.
        if (this._isTriggered)
            return;

        if (this._eventFilter && this._eventFilter(event))
            return;

        // Throw out all events not in the proper keybinding mode
        if (!(this._actionMode & Main.actionMode))
            return;

        let slide = this._getDistanceAlongBarrier(barrier, event);
        let distance = this._getDistanceAcrossBarrier(barrier, event);

        if (distance >= this._threshold) {
            this._trigger();
            return;
        }

        // Throw out events where the cursor is move more
        // along the axis of the barrier than moving with
        // the barrier.
        if (slide > distance)
            return;

        this._lastTime = event.time;

        this._trimBarrierEvents();
        distance = Math.min(15, distance);

        this._barrierEvents.push([event.time, distance]);
        this._currentPressure += distance;

        if (_DEBUG_) global.log("myPressureBarrier: _onBarrierHit currentPressure = "+this._currentPressure);
        if (this._currentPressure >= this._threshold)
            this._trigger();
    }
};
Signals.addSignalMethods(MyPressureBarrier.prototype);
