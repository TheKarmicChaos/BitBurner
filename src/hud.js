// I store lots of data in my ports. Remove this import and all calls of nstb.PeekPort before you run this script.
import * as nstb from "./lib/nstools";

/*
----------------------------------------------------------------------------------------
				README - Instructions for how to use this script
----------------------------------------------------------------------------------------

Step 0: Setup -----------------------------

	WIP

- Delete import and all calls of the function nstb.PeekPort
- (Optional) Tweak the constants under the section labelled "Settings" (before the main function) to fit to your liking.


Step 1: Creating Your Hud -----------------

	First, you need to create your hud. This means adding custom hooks for every single row you want on display.
The functions in this script should handle all of the heavy lifting for you and make this fairly straightforward.

- Go down to the section labelled "LIST EACH ROW OF YOUR CUSTOM HUD BELOW"
- List every row you want your hud to contain, in order from top to bottom, using any of the following functions:
	(check function paramaters/definitions and the examples for more details)
	- AddTextRow(hook, color)
	- AddProgrBar(hook, color)
	- AddDefault(hook, nextRowHook)
	- AddLine(num)

Step 2: Updating Your Hud -----------------

	From now on, your hud will be permanently on display, even when this script is not running. In order to completely
reset your hud, you need to use the "Kill all running scripts" option (in the options menu or bottom-right corner of
the hud). To actually update each line of the hud, you have two options. The more RAM-expensive option (not recommened)
is to add a "while" loop to the main function of this script and update every row locally (within this script).
The cheaper and easier option (recommended) is to update as few rows locally as possible, and instead use ns.run in your
other looping scripts to run hud.js, passing arguments that tell the hud which row to update and with what information.

- Go down to the section labelled "LIST YOUR LOCAL UPDATES HERE"
- Define all hud updates you want to run locally. (Be wary of RAM usage here! These will happen every single time hud.js is run!)
- Go to each of your other scripts that contain information you want to display in your hud.
- Add the command ns.run("hud.js") to each of those scripts, passing the proper arguments so that hud.js knows what to update. A cheat sheet can be found below.

Step 3: Making Tooltips -------------------

	Tooltips (the popup windows that appear when you hover your cursor over something) are extremely useful for displaying
extra non-vital information. Tooltips for progress bars will be automatically created and updated along with the progress bar
itself. For text rows, you will need to add and update tooltips manually.

- Go down to the section labelled "LIST YOUR LOCAL UPDATES HERE"
- Define all tooltip updates you want to run locally. (Again, be wary of RAM usage here!)
- Go to each of your other scripts that contain information you want to display in a hud tooltip.
- Add the command ns.run("hud.js") to each of those scripts, passing the proper arguments so that hud.js knows what to update. A cheat sheet can be found below.

-------------------------------------------

		External Updates Cheat Sheet:
	UPDATE/SHOW TEXT ROW		ns.run("hud.js", 1, "upd", hook, "Leftside Text", "Rightside Text")
	HIDE TEXT ROW				ns.run("hud.js", 1, "upd", hook)
	UPDATE PROGR BAR			ns.run("hud.js", 1, "progr", hook, currentValue, maximumValue)
	HIDE PROGR BAR				ns.run("hud.js", 1, "hide", hook)
	SHOW PROGR BAR				ns.run("hud.js", 1, "show", hook)
	UPDATE/ADD TOOLTIP			ns.run("hud.js", 1, "tooltip", hook, "Tooltip Content")
	HIDE EVERY CUSTOM ROW		ns.run("hud.js", 1, "clear")

-------------------------------------------

		TODO LIST:
	- Construct custom hud text rows from scratch instead of copying existing ones, so they can be further customized.
	- Use the above change to implement support for all colors in the player's "theme".
	- Ingame progress bar tooltips still look a bit different from the ones this script generates.
		- Update tooltip line spacing to match that of the ingame tooltips
		- Figure out how to center tooltips, like the ones the game uses for progress bars
		- Figure out how to add the growing/shrinking transition effect to tooltips that the game uses.
	- Finish adding support for use of the 3rd column.
	- Add new feature: Clickable dropdown buttons that allow the player to collapse categories of rows in the hud. (probably will use column 3 for this)
	- Add new feature: Clickable button elements that run a customizable block of code when clicked.

-------------------------------------------
*/




// Constants & Global Vars - DO NOT MODIFY ---------------------------------------------
//const d = document
const d = eval("document")
const ovv = d.getElementsByClassName('MuiPaper-root')[0];
const ovvHeader = ovv.childNodes[0].firstChild.firstChild.firstChild; // unused
const ovvTableCont = ovv.childNodes[1].firstChild.firstChild.firstChild; // unused
const hooks_to_clear = [];
const symbols = ["", "k", "m", "b", "t", "q", "Q", "s", "S", "o", "n", "e33", "e36", "e39"];
const colors = ["hp", "money", "hack", "str", "cha", "int"] // valid color names for text rows
const barColors = ["hack", "str", "cha", "int"] // valid color names for progress bars
let cols;
let updType;
let updHook;
let updArg1;
let updArg2;
let updArg3;


// Settings ----------------------------------------------------------------------------
const showHiddenRows = false; // Debug tool; only applies to rows that are currently being updated or when resetting hud via "kill all running scripts"
let ToolTipStyleParams =
`font-family: "Lucida Console", "Lucida Sans Unicode", "Fira Mono", Consolas, "Courier New", Courier, monospace, "Times New Roman";
padding: 4px 8px;
margin: 2px;
overflow-wrap: normal;
display: absolute;
white-space: pre;
font-weight: 500;
font-size: 1em;
line-height: 1.4;
border-radius: 0px;
border: 2px solid white;
max-width: 100vh;
position: absolute;
z-index: 9999999;
inset: 0px auto auto 0px;
transform: translate3d(0px, 20px, 0px);
transition: opacity 0.2s;`;

// Unused settings
const maxHudHeight = 1000 // Maximum vertical space (in pixels) the hud can occupy before requiring the player to scroll.
const LAr = "◄"; // Text used for "contracted dropdown" button
const DAr = "▼"; // Text used for "expanded dropdown" button


// Main Function -----------------------------------------------------------------------

/** @param {import("../").NS} ns */
export async function main(ns) {
	//ns.tail('hud.js'); ns.disableLog("ALL"); ns.clearLog();
	
	try {
		// Initialize variables requiring ns
		updType = ns.args[0] || null;
		updHook = ns.args[1] || null;
		updArg1 = ns.args[2] || null;
		updArg2 = ns.args[3] || null;
		updArg3 = ns.args[4] || null;
		cols = ns.ui.getTheme();
		ToolTipStyleParams +=
			`color: ${cols.primary};
			background-color: ${cols.well};`
		// Run initialization functions
		InitHud();
		MakeToolTipStyle();

		// ##################################################################################################

		// #################################################
		// LIST EACH ROW OF YOUR CUSTOM HUD BELOW
		// #################################################
		// (By default, this section will contain the hud rows that I personally use.)

		AddTextRow("bitnode", "cha");
		AddTextRow("aug", "cha");
		AddDefault("hp", "ram");
		AddTextRow("ram", "hp");
		AddLine(0);
		AddDefault("money", "income");
		AddTextRow("income", "money");
		AddTextRow("stock", "money");
		AddTextRow("hash", "hack");
		AddTextRow("hashincome", "hack");
		AddLine(1);
		AddTextRow("buyupgrON", "money"); // I use multiple elements of different colors for the same purpose so that I can color code these rows with ease
		AddTextRow("buyupgrOFF", "hp");
		AddTextRow("buynodeON", "money");
		AddTextRow("buynodeOFF", "hp");
		AddTextRow("buyservON", "money");
		AddTextRow("buyservOFF", "hp");
		AddTextRow("buyhashON", "hack");
		AddTextRow("buyhashOFF", "hp");
		AddTextRow("buyhashcorpON", "hack");
		AddTextRow("buyhashcorpOFF", "hp");
		AddTextRow("buyhashbladeON", "hack");
		AddTextRow("buyhashbladeOFF", "hp");
		AddLine(2);
		AddDefault("hack", "line3");
		AddDefault("str", "line3");
		AddDefault("def", "line3");
		AddDefault("dex", "line3");
		AddDefault("agi", "line3");
		AddDefault("cha", "line3");
		AddDefault("int", "line3");
		AddLine(3);
		AddTextRow("karma", "str");
		AddProgrBar("karma", "str");
		AddTextRow("kill", "str");
		AddProgrBar("kill", "str");
		AddTextRow("gangtimer", "hp");
		AddTextRow("augtimer", "hp");

		// #################################################
		// LIST YOUR LOCAL UPDATES HERE
		// #################################################
		// (By default, this section will contain the hud elements that I personally update locally.)

		// Local Tooltip Updates
		AddTooltip("bitnode", MakeToolTipFromDict(nstb.PeekPort(ns, 1)["mults"]));
		AddTooltip("income",  MakeToolTipFromDict(nstb.PeekPort(ns, 2), `%key%: $%val%`, true));

		// Kills
		let kills = ns.getPlayer().numPeopleKilled;
		UpdateTextRow("kill", "Kills", kills);
		// Kill progress (toward the 30 required to access all factions)
		let killProgr = kills / 30;
		if (killProgr < 1) {
			ShowProgrBar("kill");
			UpdateProgrBar("kill", kills, 30);
		} else { HideProgrBar("kill") };
		// Karma
		var karma = ns.heart.break();
		UpdateTextRow("karma", "Karma", StandardNotation(karma, 3));
		// Karma progress (toward unlocking gang)
		if ((Math.abs(karma) / 54000) < 1 && nstb.PeekPort(ns, 7)["wantGang"]) {
			ShowProgrBar("karma");
			UpdateProgrBar("karma", Math.abs(karma), 54000);
		} else { HideProgrBar("karma") };
		// Income
		let totalCashPerSec = nstb.PeekPort(ns, 2, "sumdict")
		UpdateTextRow("income", "$/sec", `$${StandardNotation(totalCashPerSec, 3)}`);

		// ##################################################################################################


		switch (updType) { // If we run this file with certain args we can update hud elements from other files!
			case "upd":
				if (updArg1 == null) updArg1 = "";
				if (updArg2 == null) updArg2 = "";
				if (updArg3 == null) updArg3 = "";
				UpdateTextRow(updHook, updArg1, updArg2, updArg3);
				break;
			case "progr":
				if (updArg1 == null) updArg1 = 0;
				if (updArg2 == null) updArg2 = 100; // Failsafe
				UpdateProgrBar(updHook, updArg1, updArg2);
				break;
			case "show":
				if (updArg1 == null) updArg1 = 0;
				if (updArg2 == null) updArg2 = 100; // Failsafe
				ShowProgrBar(updHook);
				UpdateProgrBar(updHook, updArg1, updArg2);
				break;
			case "hide":
				HideProgrBar(updHook);
				break;
			case "tooltip":
				if (updArg1 == null) updArg1 = "ERROR: INCORRECT ARGS PASSED INTO ns.run()";
				AddTooltip(updHook, updArg1);
				break;
			case "clear":
				for (const hook of hooks_to_clear) { UpdateTextRow(hook, null, null, null) };
				break;
		}

		// removes my debug 3rd-column text to keep the hud slim. If you use the 3rd column for something, remove the following line.
		d.getElementById("overview-extra-hook-2").innerText = ""

	} catch (err) { ns.toast("ERROR: HUD update Skipped: " + String(err), "error", 1500); }
}


// -------------------------------------------------------------------------------------
// Functions - DO NOT DELETE OR MODIFY
// -------------------------------------------------------------------------------------

/** Inserts a new text row at the bottom of the hud.
 * @param {string} hookName - Unique hook name for this text row.
 * - Must be distinct from all other text row hooks.
 * - Does not need to be distinct from progr bar hooks.
 * @param {string} color - Color of this row.
 * - Currently supported colors are:
 * - "hp", "money", "hack", "str", "cha", "int"
 * */
function AddTextRow(hookName, color) {
	// add this hook to the list of hooks to hide when hud.js is run with the arg "clear".
	if (!(hooks_to_clear.includes(hookName))) hooks_to_clear.push(hookName);
	// check if this hook already has an existing row element. If so, return that.
	let rowElement = d.getElementById(`ovv-row-${hookName}`);
	if (rowElement !== null) return rowElement;
	// Get an existing display element from HUD.
	let existingRow;
	if (colors.includes(color)) { existingRow = d.getElementById(`ovv-row-${color}`) }
	else { existingRow = d.getElementById(`ovv-row-${color}`) }
	// Make a clone of it for our new hud element
	let newHudRow = existingRow.cloneNode(true);
	// Remove any nested elements created by stats.js
	newHudRow.querySelectorAll("p > p").forEach(el => el.parentElement.removeChild(el));
	// Create hook id's for the subchildren where we will be modifying the innerText.
	newHudRow.querySelectorAll("p").forEach((el, i) => el.id = `ovv-${hookName}-${i}`);
	// give hook id to our new row-level element
	newHudRow.id = `ovv-row-${hookName}`
	// Set the innerText for this element to be empty on both sides (making it invisible)
	newHudRow.querySelectorAll("p")[0].innerText = "";
	newHudRow.querySelectorAll("p")[1].innerText = "";
	if (showHiddenRows) newHudRow.querySelectorAll("p")[0].innerText = hookName;
	// Insert our element at the bottom of the hud
	existingRow.parentElement.insertBefore(newHudRow, d.getElementById(`ovv-row-extra`));
	return newHudRow;
};

/** Inserts a progress bar at the bottom of the hud.
 * @param {string} hookName - Unique hook name for this progress bar.
 * - Must be distinct from all other progress bar hooks.
 * - Does not need to be distinct from text row hooks.
 * @param {string} color - Color of this row.
 * - Currently supported colors are:
 * - "hack", "str", "cha", "int"
 * */
function AddProgrBar(hudHook, color) {
	let rowElement = d.getElementById(`ovv-row-${hudHook}-progr`);
	if (rowElement !== null) return rowElement;
	// Get an existing bar element from HUD.
	let existingRow;
	if (barColors.includes(color)) { existingRow = d.getElementById(`ovv-row-${color}-progr`) }
	else { existingRow = d.getElementById(`ovv-row-str-progr`) }
	// Make a clone of it for our new hud element
	let newHudRow = existingRow.cloneNode(true);
	// give hook id to our new row-level element
	newHudRow.id = `ovv-row-${hudHook}-progr`;
	// Insert our element at the bottom of the hud
	existingRow.parentElement.insertBefore(newHudRow, d.getElementById(`ovv-row-extra`));
	return newHudRow;
};

/** Inserts a default hud row (and its corresponding progress bar) at the bottom of the hud.
 * @param {string} hookName - Existing hook name for this default hud element.
 * - Valid hookNames are:
 * - "hp", "money", "hack", "str", "def", "dex", "agi", "cha", "int".
 * @param {string} nextRowHook - The expected name of the hook for the next non-default row.
 * - This is used to prevent over-updating the hud when you install augs, which pushes default rows to the bottom of the hud.
 * */
function AddDefault(hookName, nextRowHook = "extra") {
	// Get the existing default display element from HUD, and the nextRow element if it exists
	let rowElement = d.getElementById(`ovv-row-${hookName}`);
	let nextRowElement = d.getElementById(`ovv-row-${nextRowHook}`);
	// Remember the element of the progr bar if it exists
	let progrEl = d.getElementById(`ovv-row-${hookName}-progr`);
	if (rowElement !== null) {
		// If the hook for the next row element exists, insert our element(s) before it
		if (nextRowElement !== null) {
			rowElement.parentElement.insertBefore(rowElement, nextRowElement);
			if (progrEl !== null) {progrEl.parentElement.insertBefore(progrEl, nextRowElement)}
		}
		// otherwise, insert our element(s) at the bottom of the hud
		else { 
			rowElement.parentElement.insertBefore(rowElement, d.getElementById(`ovv-row-extra`));
			if (progrEl !== null) {progrEl.parentElement.insertBefore(progrEl, d.getElementById(`ovv-row-extra`))}
		}
		return rowElement;
	}
};

/** Inserts a decorative separator line at the bottom of the hud.
 * @param {number} lineNum - Unique number used to construct the hook for this line.
 * - Must be distinct from all other line numbers.
 * */
function AddLine(lineNum) {
	// check if this hook already exists. If so, return that.
	let rowElement = d.getElementById(`ovv-row-line${lineNum}`);
	if (rowElement !== null) return rowElement;
	// Get an existing display element from HUD.
	let existingRow = d.getElementById(`ovv-row-extra`);
	// Make a clone of it for our new hud element
	let newHudRow = existingRow.cloneNode(true);
	// Remove any nested elements created by stats.js
	newHudRow.querySelectorAll("p > p").forEach(el => el.parentElement.removeChild(el));
	newHudRow.querySelectorAll("p").forEach((el) => el.parentElement.removeChild(el));
	// give hook id to our new row-level element
	newHudRow.id = `ovv-row-line${lineNum}`
	// Insert our element at the bottom of the hud
	existingRow.parentElement.insertBefore(newHudRow, d.getElementById(`ovv-row-extra`));
	return newHudRow;
};

/** Updates or creates a tooltip for a custom row element.
 * @param {string} elhook - Name of the hook to add the tooltip to
 * @param {string} content - Text content of the tooltip.
 * @param {any} params - (optional) Dictionary of any additional params you want to use to further customizee this tooltip.
 * */
function AddTooltip(elhook, content, params = {}) {
	params.tooltiptext = content
	let el = d.getElementById(`ovv-row-${elhook}`)
	setElementTooltip(el, params)
};

/** Updates a text row with new text in each column.
 * - If textL, textR, and text3 are all set to the string "null", this row will be hidden.
 * @param {string} hookToUpdate - Name of the hook for text row
 * @param {string} textL - Text to display in column 1 of this row (left side)
 * @param {string} textR - Text to display in column 2 of this row (right side)
 * @param {string} text3 - (optional) Text to display in column 3 of this row
 * - Default value: "null"
 * */
function UpdateTextRow(hookToUpdate, textL, textR, text3 = null) {
	// Determine the text we want in each column
	if (textL == null) {
		if (showHiddenRows) textL = hookToUpdate;
		else textL = "";
	}
	if (textL == null) { textR = "" };
	if (text3 == null) { text3 = "" };
	// Update the relevant elements' innerText
	d.getElementById(`ovv-${hookToUpdate}-0`).innerText = textL;
	d.getElementById(`ovv-${hookToUpdate}-1`).innerText = textR;
	//d.getElementById(`ovv-${hookToUpdate}-2`).innerText = text3;
};

/** Updates a progress bar and its tooltip with a new percentage.
 * - If textL, textR, and text3 are all set to the string "null", this row will be hidden.
 * @param {string} hookToUpdate - Name of the hook for text row
 * @param {number} curAmt - How much of the "thing" we currently have
 * @param {number} maxAmt - How much of the "thing" we need to have in order for progr bar to be 100% full.
 * */
function UpdateProgrBar(hookToUpdate, curAmt, maxAmt) {
	let elementToUpdate = d.getElementById(`ovv-row-${hookToUpdate}-progr`).firstChild.firstChild
	// calculate the percentage progress
	let remaining =  Math.max(0, maxAmt - curAmt)
	let percent = Math.min(curAmt, maxAmt) * 100 / maxAmt
	// update the tooltip
	let ttContent = `<strong>Progress:</strong> ${StandardNotation(Math.abs(curAmt), 3)} / ${StandardNotation(Math.abs(maxAmt), 3)}<br /><strong>Remaining:</strong> ${StandardNotation(remaining, 3)} (${percent.toFixed(2)}%)`
	AddTooltip(`${hookToUpdate}-progr`, ttContent, {textAlign: "right"});
	// get existing HTML
	let existingHTML = elementToUpdate.innerHTML;
	// split the HTML so we get the sections we want to edit
	let leftHTML = String(existingHTML).split("translateX(")[0] + "translateX(";
	let rightHTML = "%);" + String(existingHTML).split("%);")[1];
	// update the HTML
	let newHTML = `${leftHTML}-${(100 - percent).toFixed(2)}${rightHTML}`;
	elementToUpdate.innerHTML = newHTML;
};

/** Hides a visbile progress bar on the hud.
 * @param {string} hudHook - Name of the hook for the progress bar
 * */
function HideProgrBar(hudHook) {
	let rowElement = d.getElementById(`ovv-row-${hudHook}-progr`);
	if (rowElement !== null) {
		// Remove all HTML from the deepest child so the HTML doesn't auto-update
		rowElement.firstChild.firstChild.innerHTML = "";

		// Rename "class" to "clss" in the HTML of the first-depth child so the information cannot be parsed.
		let curHTML = rowElement.innerHTML
		let htmlL = curHTML.split(`-3px;"><span cl`)[0] + `-3px;"><span cl`
		let htmlR = curHTML.split(`-3px;"><span cl`)[1]
		if (htmlR[0] == "a") { rowElement.innerHTML = htmlL + curHTML.split(`-3px;"><span cla`)[1]; }
	}
};

/** Un-hides a hidden progress bar on the hud.
 * @param {string} hudHook - Name of the hook for the progress bar
 * */
function ShowProgrBar(hudHook) {
	let rowElement = d.getElementById(`ovv-row-${hudHook}-progr`);
	if (rowElement !== null) {
		// Replace the missing HTML in the deepest child
		let existingHTML = d.getElementById("ovv-row-str-progr").firstChild.firstChild.innerHTML;
		rowElement.firstChild.firstChild.innerHTML = existingHTML.split(`></span>`)[0] + `></span>`

		// Rename "class" back to "clss" in the HTML of the first-depth child so the information can be parsed once again.
		let curHTML = rowElement.innerHTML
		let htmlL = curHTML.split(`-3px;"><span cl`)[0] + `-3px;"><span cl`
		let htmlR = curHTML.split(`-3px;"><span cl`)[1]
		if (htmlR[0] != "a") { rowElement.innerHTML = htmlL + "a" + htmlR; }
	}
};



// Unused - this function does not work
function RecolorProgrBar(hookToRecolor, r, g, b) {
	d.getElementById(`ovv-row-${hookToRecolor}`).firstChild.firstChild.style.backgroundColor =	`rgb(${r},${g},${b})`
};

// Incomplete - this function works, but not as intended.
export function MakeToolTipFromDict(dict, format = `%key%: %val%`, exclude0 = false) {
	let entries = [];
	for (let key in dict) {
		let seg1 = format.split("%key%")[0]
		let seg2 = format.split("%key%")[1].split("%val%")[0]
		let seg3 = format.split("%val%")[1]
		let val = dict[key]
		if (typeof val == "number") val = StandardNotation(val, 3);
		if (exclude0 && dict[key] != 0) {
			entries.push(`${seg1}${key}${seg2}${val}${seg3}`)
		} else if (!exclude0) {
			entries.push(`${seg1}${key}${seg2}${val}${seg3}`)
		}
	}
	return entries.join(`\n`);
}


// -------------------------------------------------------------------------------------
// Helper & Setup Functions - DO NOT USE, DELETE, OR MODIFY
// -------------------------------------------------------------------------------------

/** Initializes the hud for editing */
function InitHud() {
	// Implement all hud settings
	//ovvTableCont.style.maxHeight = `${maxHudHeight}px`;
	//ovvTableCont.style.transition = "all .2s";
	//ovvTableCont.style.overflow = "scroll";

	let hooknames = ["hp", "money", "str", "def", "dex", "agi", "cha", "int", "extra"];
	let progrhooks = ["str", "def", "dex", "agi", "cha", "int", "hack"]
	// give every default hud element a row-level hook
	for (let hook of hooknames) {
		let rowElement = d.getElementById(`ovv-row-${hook}`); 
		if (rowElement !== null) continue;
		if (hook == "extra") { d.getElementById(`overview-extra-hook-0`).parentElement.parentElement.id = `ovv-row-extra` }
		else { d.getElementById(`overview-${hook}-hook`).parentElement.parentElement.id = `ovv-row-${hook}`}
		if (progrhooks.includes(hook)) { d.getElementById(`ovv-row-${hook}`).nextSibling.id = `ovv-row-${hook}-progr`}
	}
	// fix the broken hack hook in the default hud.
	let rowElement = d.getElementById(`ovv-row-hack`);
	if (rowElement !== null) return;
	d.getElementById("overview-hack-hook").parentElement.parentElement.previousSibling.previousSibling.id = "ovv-row-hack";
	let nodeToDel = d.getElementById("overview-hack-hook").parentElement.parentElement;
	d.getElementById("overview-hack-hook").parentElement.parentElement.parentElement.removeChild(nodeToDel);
	d.getElementById("ovv-row-hack").nextSibling.id = `ovv-row-hack-progr`;
}

/** Creates or updates a custom css style used for our custom-made tooltips */
function MakeToolTipStyle() {
	let existingStyle = d.getElementById(`custom-tooltip-style`);
	let desiredHTML = `.tooltiptext{${ToolTipStyleParams}}`
	// if no custom tooltip style exists, create one at the root element level (so it can be used for non-overview elements)
	if (existingStyle === null) {
		d.getElementById('root').parentElement.appendChild(createElement("style", {
			id: `custom-tooltip-style`,
			innerHTML: desiredHTML
		} ))
	}
	// if the existing custom tooltip style contains different info from what we want, update it.
	else if (existingStyle.innerHTML != desiredHTML) {
		existingStyle.innerHTML = desiredHTML
	}
}

/** Heavily modified helper function from the game's source code for creating new elements.
 * @param {string} tagName - name of element tag, like "span", "div", "a", "style", etc.
 * @param {any} params - Dictionary of relevant parameters
 * */
function createElement(tagName, params = {}) {
	const el = d.createElement(tagName);

	if (params.id !== undefined) { el.id = params.id; }
	if (params.class !== undefined) { el.className = params.class; }
	if (params.innerHTML !== undefined) { el.innerHTML = params.innerHTML; }
	if (params.innerText !== undefined) { el.innerText = params.innerText; }
	if (params.tabIndex !== undefined) { el.tabIndex = params.tabIndex; }

	// This is one of many helper functions that is called in this function, but is the only one we need.
	setElementTooltip(el, params);
	return el;
}

/** Heavily modified helper function from the game's source code for creating tooltips
 * @param {Element} el - The element to attatch the tooltip to
 * @param {any} params - Dictionary of relevant tooltip parameters
 * */
function setElementTooltip(el, params) {
	if (params.tooltiptext !== undefined && params.tooltiptext !== "") {
		// If the parent has not had a tooltip class added yet, add one and make its position relative.
		if (el.className.split("tool")[1] != "tip") {
			el.className += " tooltip";
			el.style.position = "relative";
		}
		// If the tooltip does not exist, make a new one.
		let curToolTip = d.getElementById(`${el.id}-tooltip`)
		if (curToolTip === null) {
			d.getElementById(el.id).appendChild(
				createElement("span", {
					id: `${el.id}-tooltip`,
					class: "tooltiptext",
					innerHTML: params.tooltiptext,
				}),
			);
			// Apply all additional parameters that were specified. Add more checks here as needed
			if (params.textAlign !== undefined) d.getElementById(`${el.id}-tooltip`).style.textAlign = params.textAlign;
			// Set the tooltip to start out as invisible
			d.getElementById(`${el.id}-tooltip`).style.visibility = "hidden";
			d.getElementById(`${el.id}-tooltip`).style.opacity = "0";
			// Add event listeners for mouseout/mouseover to hide/show the tooltip.
			el.addEventListener('mouseover', (e) => {
				d.getElementById(`${el.id}-tooltip`).style.visibility = "visible";
				d.getElementById(`${el.id}-tooltip`).style.opacity = "1";
			});
			el.addEventListener('mouseout', (e) => {
				d.getElementById(`${el.id}-tooltip`).style.visibility = "hidden";
				d.getElementById(`${el.id}-tooltip`).style.opacity = "0";
			});
		}
		// If the current tooltip exists but the text does not match what we want, replace it.
		else if (curToolTip.innerHTML != params.tooltiptext) {
			curToolTip.innerHTML = params.tooltiptext
		}
	}
}


/** Puts any large number into a standard notation "000.000a" string 
 * @param {number} num - Number to convert to standard notation
 * @param {number} decimalplaces - Number of decimal places to round to.
 * */
export function StandardNotation(num, decimalplaces = 1) {
	let formattedNum = formatNumberShort(num, 6, decimalplaces);
	
	if (String(num).length <= formattedNum.length && (num % 1) == 0) {
		return String(num);
	} else { return formattedNum; }
};

/** Helper function from helpers.js: Return a formatted representation of the monetary amount using scale sympols (e.g. 6.50M) 
 * @param {number} num - The number to format
 * @param {number=} maxSignificantFigures - (default: 6) The maximum significant figures you wish to see (e.g. 123, 12.3 and 1.23 all have 3 significant figures)
 * @param {number=} maxDecimalPlaces - (default: 3) The maximum decimal places you wish to see, regardless of significant figures. (e.g. 12.3, 1.2, 0.1 all have 1 decimal)
 **/
export function formatNumberShort(num, maxSignificantFigures = 6, maxDecimalPlaces = 3) {
    if (Math.abs(num) > 10 ** (3 * symbols.length)) // If we've exceeded our max symbol, switch to exponential notation
        return num.toExponential(Math.min(maxDecimalPlaces, maxSignificantFigures - 1));
    for (var i = 0, sign = Math.sign(num), num = Math.abs(num); num >= 1000 && i < symbols.length; i++) num /= 1000;
    // TODO: A number like 9.999 once rounded to show 3 sig figs, will become 10.00, which is now 4 sig figs.
    return ((sign < 0) ? "-" : "") + num.toFixed(Math.max(0, Math.min(maxDecimalPlaces, maxSignificantFigures - Math.floor(1 + Math.log10(num))))) + symbols[i];
}

/* HTML of a button, for reference */
/*
<div class="MuiBox-root css-1dskn3o">
<button class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeMedium css-jhk36g" tabindex="0" type="button" aria-label="kill all scripts">
   <svg class="MuiSvgIcon-root MuiSvgIcon-colorError MuiSvgIcon-fontSizeMedium css-ahfcdp" focusable="false" viewBox="0 0 24 24" aria-hidden="true" data-testid="ClearAllIcon" aria-label="Kill all running scripts">
	  <path d="M5 13h14v-2H5v2zm-2 4h14v-2H3v2zM7 7v2h14V7H7z">
	  </path>
   </svg>
   <span class="MuiTouchRipple-root css-w0pj6f">
   </span>
</button>
</div>
*/