/* ========================================================================================================
 * prefs.js
 * ========================================================================================================
 */

const { Gio, GObject, Gtk } = imports.gi;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;


const HotScreenEdgesPreferencesWidget = GObject.registerClass(
class HotScreenEdgesPreferencesWidget extends Gtk.Box {
    _init() {
        super._init({
            orientation: Gtk.Orientation.VERTICAL,
            // spacing: 6,
            margin_top: 15,
            margin_bottom: 60,
            margin_start: 10,
            margin_end: 10,
            halign: Gtk.Align.CENTER,
        });
        this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.hot-screen-edges');

        let hotScreenEdgesTitle = new Gtk.Label({
            label: _("<b>Hot Screen Edges</b>"),
            use_markup: true,
            xalign: 0,
            margin_top: 15,
            margin_bottom: 0
        });
        let hotScreenEdgesDescription = new Gtk.Label({
            label: _("Select which screen edges to make hot.\nNOTE: Edges shared by adjacent monitors will be ignored."),
            use_markup: true,
            xalign: 0,
            margin_top: 0,
            margin_bottom: 10
        });

        this.add(hotScreenEdgesTitle);
        this.add(hotScreenEdgesDescription);

        let topSide = new Gtk.CheckButton({
            label: _("Top"),
            margin_left: 0,
            margin_top: 0
        });
        topSide.set_active(this._settings.get_boolean('side-top'));
        topSide.connect('toggled', Lang.bind(this, function(check) {
            this._settings.set_boolean('side-top', check.get_active());
        }));

        let bottomSide = new Gtk.CheckButton({
            label: _("Bottom"),
            margin_left: 0,
            margin_top: 0
        });
        bottomSide.set_active(this._settings.get_boolean('side-bottom'));
        bottomSide.connect('toggled', Lang.bind(this, function(check) {
            this._settings.set_boolean('side-bottom', check.get_active());
        }));

        let leftSide = new Gtk.CheckButton({
            label: _("Left"),
            margin_left: 0,
            margin_top: 0
        });
        leftSide.set_active(this._settings.get_boolean('side-left'));
        leftSide.connect('toggled', Lang.bind(this, function(check) {
            this._settings.set_boolean('side-left', check.get_active());
        }));

        let rightSide = new Gtk.CheckButton({
            label: _("Right"),
            margin_left: 0,
            margin_top: 0
        });
        rightSide.set_active(this._settings.get_boolean('side-right'));
        rightSide.connect('toggled', Lang.bind(this, function(check) {
            this._settings.set_boolean('side-right', check.get_active());
        }));

        let primaryMonitor = new Gtk.CheckButton({
            label: _("Hot edges on primary monitor only"),
            margin_left: 0,
            margin_top: 15,
            margin_bottom: 0
        });
        primaryMonitor.set_active(this._settings.get_boolean('primary-monitor-only'));
        primaryMonitor.connect('toggled', Lang.bind(this, function(check) {
            this._settings.set_boolean('primary-monitor-only', check.get_active());
        }));

        let allowFullscreenMode = new Gtk.CheckButton({
            label: _("Hot edges in fullscreen mode"),
            margin_left: 0,
            margin_top: 0,
            margin_bottom: 10
        });
        allowFullscreenMode.set_active(this._settings.get_boolean('allow-fullscreen-mode'));
        allowFullscreenMode.connect('toggled', Lang.bind(this, function(check) {
            this._settings.set_boolean('allow-fullscreen-mode', check.get_active());
        }));

        // Add to layout
        let monitorOptionsGrid = new Gtk.Grid({
            row_homogeneous: false,
            column_homogeneous: true,
            margin_top: 0,
            margin_left: 0,
            margin_bottom: 10
        });

        monitorOptionsGrid.attach(topSide, 0, 0, 1, 1);
        monitorOptionsGrid.attach(bottomSide, 0, 1, 1, 1);
        monitorOptionsGrid.attach(leftSide, 1, 0, 1, 1);
        monitorOptionsGrid.attach(rightSide, 1, 1, 1, 1);

        monitorOptionsGrid.attach(primaryMonitor, 0, 2, 2, 1);
        monitorOptionsGrid.attach(allowFullscreenMode, 0, 3, 2, 1);

        this.add(monitorOptionsGrid);


        let pressureOptionsTitle = new Gtk.Label({
            label: _("<b>Pressure Options</b>"),
            use_markup: true,
            xalign: 0,
            margin_top: 15,
            margin_bottom: 0
        });
        let pressureOptionsDescription = new Gtk.Label({
            label: _("Select the amount of pressure required to toggle the overview mode."),
            use_markup: true,
            xalign: 0,
            margin_top: 0,
            margin_bottom: 10
        });
        this.add(pressureOptionsTitle);
        this.add(pressureOptionsDescription);



        let requirePressureButton = new Gtk.CheckButton({
            label: _("Require pressure to toggle the overview mode"),
            margin_left: 0,
            margin_top: 0
        });
        requirePressureButton.set_active(this._settings.get_boolean('require-pressure-to-show'));
        requirePressureButton.connect('toggled', Lang.bind(this, function(check) {
            this._settings.set_boolean('require-pressure-to-show', check.get_active());
        }));

        let pressureThresholdLabel = new Gtk.Label({
            label: _("Pressure threshold [px]"),
            use_markup: true,
            xalign: 0,
            margin_left: 25,
            margin_top: 0,
            hexpand: true
        });

        let pressureThresholdSpinner = new Gtk.SpinButton({
            halign: Gtk.Align.END,
            margin_top: 0
        });
        pressureThresholdSpinner.set_sensitive(true);
        pressureThresholdSpinner.set_range(10, 1000);
        pressureThresholdSpinner.set_value(this._settings.get_double("pressure-threshold") * 1);
        pressureThresholdSpinner.set_increments(10, 20);
        pressureThresholdSpinner.connect("value-changed", Lang.bind(this, function(button) {
            let s = button.get_value_as_int() / 1;
            this._settings.set_double("pressure-threshold", s);
        }));

        // let speedLimitButton = new Gtk.CheckButton({
        //     label: _("Limit pressure sense to slow mouse speeds"),
        //     margin_left: 0,
        //     margin_top: 0
        // });
        // speedLimitButton.set_active(this._settings.get_boolean('use-pressure-speed-limit'));
        // speedLimitButton.connect('toggled', Lang.bind(this, function(check) {
        //     this._settings.set_boolean('use-pressure-speed-limit', check.get_active());
        // }));
        //
        // let speedLimitLabel = new Gtk.Label({
        //     label: _("Maximum speed [px]"),
        //     use_markup: true,
        //     xalign: 0,
        //     margin_left: 25,
        //     margin_top: 0,
        //     hexpand: true
        // });
        //
        // let speedLimitSpinner = new Gtk.SpinButton({
        //     halign: Gtk.Align.END,
        //     margin_top: 0
        // });
        // speedLimitSpinner.set_sensitive(true);
        // speedLimitSpinner.set_range(10, 1000);
        // speedLimitSpinner.set_value(this._settings.get_double("pressure-speed-limit") * 1);
        // speedLimitSpinner.set_increments(10, 20);
        // speedLimitSpinner.connect("value-changed", Lang.bind(this, function(button) {
        //     let s = button.get_value_as_int() / 1;
        //     this._settings.set_double("pressure-speed-limit", s);
        // }));
        //
        // let speedLimitDescription = new Gtk.Label({
        //     label: _("NOTE: For dual monitor setups. Allows the mouse to pass through \nthe barrier by attacking the edge of the screen with a quick stroke."),
        //     use_markup: true,
        //     xalign: 0,
        //     margin_left: 25,
        //     margin_top: 0,
        //     hexpand: false
        // })

        // Add to layout
        let pressureOptionsGrid = new Gtk.Grid({
            row_homogeneous: false,
            column_homogeneous: false
        });

        pressureOptionsGrid.attach(requirePressureButton, 0, 0, 2, 1);
        pressureOptionsGrid.attach(pressureThresholdLabel, 0, 1, 1, 1);
        pressureOptionsGrid.attach(pressureThresholdSpinner, 1, 1, 1, 1);
        // pressureOptionsGrid.attach(speedLimitButton, 0, 2, 2, 1);
        // pressureOptionsGrid.attach(speedLimitLabel, 0, 3, 1, 1);
        // pressureOptionsGrid.attach(speedLimitSpinner, 1, 3, 1, 1);
        // pressureOptionsGrid.attach(speedLimitDescription, 0, 4, 2, 1);

        // Bind interactions
        this._settings.bind('require-pressure-to-show', pressureThresholdLabel, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
        this._settings.bind('require-pressure-to-show', pressureThresholdSpinner, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
        // this._settings.bind('use-pressure-speed-limit', speedLimitLabel, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
        // this._settings.bind('use-pressure-speed-limit', speedLimitSpinner, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
        // this._settings.bind('use-pressure-speed-limit', speedLimitDescription, 'sensitive', Gio.SettingsBindFlags.DEFAULT);

        this.add(pressureOptionsGrid);
    }

});

function init() {
    ExtensionUtils.initTranslations();
}

function buildPrefsWidget() {
    let widget = new HotScreenEdgesPreferencesWidget();
    widget.show_all();
    return widget;
}
