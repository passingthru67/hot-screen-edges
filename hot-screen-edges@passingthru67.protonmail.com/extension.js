/* ========================================================================================================
 * extension.js
  * ========================================================================================================
 */

const _DEBUG_ = false;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const HotScreenEdges = Me.imports.hotScreenEdges;


function init() {

}

var hotScreenEdgesManager = null;

function enable() {
    if (_DEBUG_) global.log("HotScreenEdges: ENABLED");
    hotScreenEdgesManager = new HotScreenEdges.HotScreenEdgesManager();
}

function disable() {
    if (_DEBUG_) global.log("HotScreenEdges: DISABLED");

    hotScreenEdgesManager.destroy();
    hotScreenEdgesManager = null;
}
