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
            margin_right: 5,
            margin_top: 0
        });
        topSide.set_active(this._settings.get_boolean('side-top'));
        topSide.connect('toggled', Lang.bind(this, function(check) {
            this._settings.set_boolean('side-top', check.get_active());
        }));

        let bottomSide = new Gtk.CheckButton({
            label: _("Bottom"),
            margin_left: 0,
            margin_right: 5,
            margin_top: 0
        });
        bottomSide.set_active(this._settings.get_boolean('side-bottom'));
        bottomSide.connect('toggled', Lang.bind(this, function(check) {
            this._settings.set_boolean('side-bottom', check.get_active());
        }));

        let leftSide = new Gtk.CheckButton({
            label: _("Left"),
            margin_left: 0,
            margin_right: 5,
            margin_top: 0
        });
        leftSide.set_active(this._settings.get_boolean('side-left'));
        leftSide.connect('toggled', Lang.bind(this, function(check) {
            this._settings.set_boolean('side-left', check.get_active());
        }));

        let rightSide = new Gtk.CheckButton({
            label: _("Right"),
            margin_left: 0,
            margin_right: 5,
            margin_top: 0
        });
        rightSide.set_active(this._settings.get_boolean('side-right'));
        rightSide.connect('toggled', Lang.bind(this, function(check) {
            this._settings.set_boolean('side-right', check.get_active());
        }));

        // Left Side Action
        let leftSideActionCombo = new Gtk.ComboBoxText({halign:Gtk.Align.END});
        leftSideActionCombo.append_text(_("Toggle Overview"));
        leftSideActionCombo.append_text(_("Switch To Workspace"));

        let leftSideAction = this._settings.get_enum('side-left-action');
        leftSideActionCombo.set_active(leftSideAction);
        leftSideActionCombo.connect('changed', Lang.bind (this, function(widget) {
                this._settings.set_enum('side-left-action', widget.get_active());
        }));

        // Right Side Action
        let rightSideActionCombo = new Gtk.ComboBoxText({halign:Gtk.Align.END});
        rightSideActionCombo.append_text(_("Toggle Overview"));
        rightSideActionCombo.append_text(_("Switch To Workspace"));

        let rightSideAction = this._settings.get_enum('side-right-action');
        rightSideActionCombo.set_active(rightSideAction);
        rightSideActionCombo.connect('changed', Lang.bind (this, function(widget) {
                this._settings.set_enum('side-right-action', widget.get_active());
        }));

        // Top Side Action
        let topSideActionCombo = new Gtk.ComboBoxText({halign:Gtk.Align.END});
        topSideActionCombo.append_text(_("Toggle Overview"));
        topSideActionCombo.append_text(_("Switch To Workspace"));

        let topSideAction = this._settings.get_enum('side-top-action');
        topSideActionCombo.set_active(topSideAction);
        topSideActionCombo.connect('changed', Lang.bind (this, function(widget) {
                this._settings.set_enum('side-top-action', widget.get_active());
        }));

        // Bottom Side Action
        let bottomSideActionCombo = new Gtk.ComboBoxText({halign:Gtk.Align.END});
        bottomSideActionCombo.append_text(_("Toggle Overview"));
        bottomSideActionCombo.append_text(_("Switch To Workspace"));

        let bottomSideAction = this._settings.get_enum('side-bottom-action');
        bottomSideActionCombo.set_active(bottomSideAction);
        bottomSideActionCombo.connect('changed', Lang.bind (this, function(widget) {
                this._settings.set_enum('side-bottom-action', widget.get_active());
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
            column_homogeneous: false,
            margin_top: 0,
            margin_left: 0,
            margin_bottom: 10
        });

        monitorOptionsGrid.attach(topSide, 0, 0, 1, 1);
        monitorOptionsGrid.attach(topSideActionCombo, 1, 0, 1, 1);

        monitorOptionsGrid.attach(bottomSide, 0, 1, 1, 1);
        monitorOptionsGrid.attach(bottomSideActionCombo, 1, 1, 1, 1);

        monitorOptionsGrid.attach(leftSide, 0, 2, 1, 1);
        monitorOptionsGrid.attach(leftSideActionCombo, 1, 2, 1, 1);

        monitorOptionsGrid.attach(rightSide, 0, 3, 1, 1);
        monitorOptionsGrid.attach(rightSideActionCombo, 1, 3, 1, 1);

        monitorOptionsGrid.attach(primaryMonitor, 0, 4, 2, 1);
        monitorOptionsGrid.attach(allowFullscreenMode, 0, 5, 2, 1);

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

        // Add to layout
        let pressureOptionsGrid = new Gtk.Grid({
            row_homogeneous: false,
            column_homogeneous: false
        });

        pressureOptionsGrid.attach(requirePressureButton, 0, 0, 2, 1);
        pressureOptionsGrid.attach(pressureThresholdLabel, 0, 1, 1, 1);
        pressureOptionsGrid.attach(pressureThresholdSpinner, 1, 1, 1, 1);

        // Bind interactions
        this._settings.bind('require-pressure-to-show', pressureThresholdLabel, 'sensitive', Gio.SettingsBindFlags.DEFAULT);
        this._settings.bind('require-pressure-to-show', pressureThresholdSpinner, 'sensitive', Gio.SettingsBindFlags.DEFAULT);

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
