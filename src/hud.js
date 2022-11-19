// I store lots of data in my "global vars". Remove these imports and all calls of imported functions before you run this script.
import * as nstb from "./lib/nstools";
import * as tb from "./lib/toolbox";

/*
----------------------------------------------------------------------------------------
				README - Instructions for how to use this script
----------------------------------------------------------------------------------------

Step 0: Setup -----------------------------

	WIP :: After you have customized your hud via Steps 1-3, you may be tempted to run the script to test if it works.
Before you do, make sure you have already done the following.

- Delete both imports.
- Ctrl + F "REMOVE THIS LINE BEFORE RUNNING" and delete all 6 lines with that comment.
- (Optional) Tweak the consts/vars under the section labelled "Settings" (before the main function) to fit to your liking.
- WIP

Step 1: Creating Your Hud -----------------

	First, you need to create your hud. This means adding custom hooks for every single row you want on display.
The functions in this script should handle all of the heavy lifting for you and make this fairly straightforward.

- Go down to the section labelled "LIST EACH ROW OF YOUR CUSTOM HUD BELOW"
- List every row you want your hud to contain, in order from top to bottom, using any of the following functions:
	(check function paramaters/definitions and the examples I use for more details)
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

Step 4: Making Buttons -------------------

	WIP

-------------------------------------------

		External Updates Cheat Sheet:
	TEXT ROW: UPDATE/SHOW 		ns.run("hud.js", 1, "upd", hook, "Leftside Text", "Rightside Text")
	TEXT ROW: HIDE				ns.run("hud.js", 1, "upd", hook)
	TEXT ROW: CHANGE COLOR		ns.run("hud.js", 1, "color", hook, "new color")
	PROGR BAR: UPDATE			ns.run("hud.js", 1, "progr", hook, currentValue, maximumValue)
	PROGR BAR: CHANGE COLOR		ns.run("hud.js", 1, "progr color", hook, "new color", "new background color")
	PROGR BAR: HIDE 			ns.run("hud.js", 1, "progr hide", hook)
	PROGR BAR: SHOW				ns.run("hud.js", 1, "progr show", hook)
	PROGR BAR: TOGGLE			ns.run("hud.js", 1, "progr toggle", hook)
	TOOLTIP: UPDATE/ADD			ns.run("hud.js", 1, "tooltip", hook, "Tooltip Content")
	HIDE EVERY CUSTOM ROW		ns.run("hud.js", 1, "clear")

-------------------------------------------

		TODO LIST:
	- Overhaul all "Add" functions to try to update the element if they already exist (allowing for function changes to be made without killing all scripts)
	- Figure out how to center tooltips, like the ones the game uses for progress bars
	- Add fancy ripple effect on button click that the game uses.
	- Add support for hiding/showing hud buttons.
	- Add new feature: Clickable dropdown buttons that allow the player to collapse categories of rows in the hud. (probably will use column 3 for this)

-------------------------------------------
*/


	// Global Constants & Vars - DO NOT MODIFY ---------------------------------------------
//const d = document
const d = eval("document")
const symbols = ["", "k", "m", "b", "t", "q", "Q", "s", "S", "o", "n", "e33", "e36", "e39"];
let clicked_button = null;
// const ovv = d.getElementsByClassName('MuiPaper-root')[0]; // unused
// const ovvHeader = ovv.childNodes[0].firstChild.firstChild.firstChild; // unused
// const ovvTableCont = ovv.childNodes[1].firstChild.firstChild.firstChild; // unused


/** @param {import("../").NS} ns */
export async function main(ns) {

	// Local Constants & Vars - DO NOT MODIFY ----------------------------------------------
	let clicked_button_temp = null;
	if (clicked_button !== null) { clicked_button_temp = clicked_button; clicked_button = null; }
	const hooks_to_clear = [];
	const bars_to_clear = [];
	const button_funcs = {};
	const colors = ns.ui.getTheme();
	let updType = ns.args[0] || null;
	let updHook = ns.args[1] || null;
	let updArg1 = ns.args[2] || null;
	let updArg2 = ns.args[3] || null;
	let updArg3 = ns.args[4] || null;


	// Settings ----------------------------------------------------------------------------
	const tailWindow = false; // Enables/Disables tail windows. Not reccommended for anything other than debugging.
	const showHiddenRows = false; // Debug tool to unhide all hidden text rows; only applies to rows that are currently being updated, or to all rows when resetting hud via "kill all running scripts"
	const lineColSpan = 2; // Number of columns your separator lines should occupy.
	const ToolTipStyleParams = // Default css style parameters used for your tooltips.
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
	transform-origin: top;
	transition: all 0.2s;
	color: ${colors.primary};
	background-color: ${colors.well};`;
	const textStyleParams = // Default css style parameters added to the text rows in your hud (applies to all text columns)
	``;
	const buttonSyleParams = // Default css style parameters used for your custom buttons
	`padding: 0px 10px;
	margin: 4px 4px 4px 4px;`;

	// Experimental settings (use at your own risk)
	const squishWorkInfo = false; // If true, modifies the default "Working at ..." text, info, button, etc. at the bottom of the hud into a much more compact version.
	
	// Unused settings
	const maxHudHeight = 1000 // Maximum vertical space (in pixels) the hud can occupy before requiring the player to scroll.
	const CAr = "◄"; // Text used for "Contracted dropdown" button
	const EAr = "▼"; // Text used for "Expanded dropdown" button


	// Main Function -----------------------------------------------------------------------
	try {
		// Run initialization functions
		if (tailWindow) { ns.tail("hud.js", "home", ...ns.args); ns.disableLog("ALL"); ns.clearLog(); }
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
		AddTextRow("buyupgr", "money");
		AddTextRow("buynode", "money");
		AddTextRow("buyserv", "money");
		AddTextRow("buyhash", "hack");
		AddTextRow("buyhashcorp", "hack");
		AddTextRow("buyhashblade", "hack");
		AddLine(2);
		AddDefault("hack", "line3");
		AddDefault("str", "line3");
		AddDefault("def", "line3");
		AddDefault("dex", "line3");
		AddDefault("agi", "line3");
		AddDefault("cha", "line3");
		AddDefault("int", "line3");
		AddLine(3);
		AddTextRow("karma", "error");
		AddProgrBar("karma", "error");
		AddTextRow("kill", "error");
		AddProgrBar("kill", "error");
		AddTextRow("gangtimer", "info");
		AddTextRow("augtimer", "info");
		AddLine(4);
		AddButton("buttons1", 0, "run-scanhud", "scan-hud.js", "right", () => ns.run(`scan-hud.js`));
		AddButton("buttons1", 1, "run-testfile", "test.js", "left", () => ns.run(`test.js`));
		AddButton("buttons2", 0, "toast-test", "Toast!", "right", () => ns.toast(`clicked!`, "success", 500));
		AddButton("buttons2", 1, "missing-test", "Click Me!", "left");

		// #################################################
		// LIST YOUR LOCAL UPDATES HERE
		// #################################################
		// (By default, this section will contain the hud elements that I personally update locally.)

		// Local Tooltip Updates
		const GLOBAL_VARS = nstb.getGlobals(ns); // REMOVE THIS LINE BEFORE RUNNING
		AddTooltip("bitnode", MakeToolTipFromDict(GLOBAL_VARS["bnMults"])); // REMOVE THIS LINE BEFORE RUNNING
		AddTooltip("income",  MakeToolTipFromDict(GLOBAL_VARS["income"], `%key%: $%val%`, true)); // REMOVE THIS LINE BEFORE RUNNING

		// Kills
		let kills = ns.getPlayer().numPeopleKilled;
		UpdateTextRow("kill", "Kills", kills);

		// Kill progress (toward the 30 required to access all factions)
		if (kills / 30 < 1) {
			ToggleProgrBar("kill", "show");
			UpdateProgrBar("kill", kills, 30);
		} else ToggleProgrBar("kill", "hide");

		// Karma
		var karma = ns.heart.break();
		UpdateTextRow("karma", "Karma", StandardNotation(karma, 3));

		// Karma progress (toward unlocking gang)
		if (Math.abs(karma) / 54000 < 1
			&& GLOBAL_VARS["gang"]["want"] // REMOVE THIS LINE BEFORE RUNNING
			) {
			ToggleProgrBar("karma", "show");
			UpdateProgrBar("karma", Math.abs(karma), 54000);
		} else ToggleProgrBar("karma", "hide");

		// Income
		let totalCashPerSec = tb.SumDict(GLOBAL_VARS["income"]) // REMOVE THIS LINE BEFORE RUNNING
		UpdateTextRow("income", "$/sec", `$${StandardNotation(totalCashPerSec, 3)}`); // REMOVE THIS LINE BEFORE RUNNING

		// ##################################################################################################


		// If we run this file with certain args we can update hud elements from other files!
		switch (updType) {
			case "upd":
				if (updArg1 == null) updArg1 = "";
				if (updArg2 == null) updArg2 = "";
				if (updArg3 == null) updArg3 = "";
				UpdateTextRow(updHook, updArg1, updArg2, updArg3);
				break;
			case "color":
				if (updArg1 == null) updArg1 = "";
				RecolorTextRow(updHook, updArg1);
				break;
			case "progr":
				if (updArg1 == null) updArg1 = 0; // Failsafe
				if (updArg2 == null) updArg2 = 100; // Failsafe
				UpdateProgrBar(updHook, updArg1, updArg2);
				break;
			case "progr color":
				if (updArg1 == null) updArg1 = "primary"; // Failsafe
				if (updArg2 == null) updArg2 = "rgb(17, 17, 17)"; // Default
				RecolorProgrBar(updHook, updArg1, updArg2);
				break;
			case "progr show":
				ToggleProgrBar(updHook, "show");
				break;
			case "progr hide":
				ToggleProgrBar(updHook, "hide");
				break;
			case "progr toggle":
				ToggleProgrBar(updHook, "toggle");
				break;
			case "tooltip":
				if (updArg1 == null) throw new Error(`Improper args for "tooltip" passed into ns.run`);
				AddTooltip(updHook, updArg1);
				break;
			case "clear":
				for (const hook of hooks_to_clear) { UpdateTextRow(hook, null, null, null) };
				for (const hook of bars_to_clear) { ToggleProgrBar(hook, "hide") };
				break;
		}

		// If a button was clicked, run the stored function for that button.
		if (clicked_button_temp in button_funcs) await button_funcs[clicked_button_temp]();
		// Reset the global clicked_button variable
		if (clicked_button !== null) clicked_button = null;
		
	} catch (err) { ns.toast("ERROR: HUD update Skipped: " + String(err), "error", 1000); }




/* ==================================================================================
-------------------------------------------------------------------------------------

					Functions - DELETE/MODIFY AT YOUR OWN RISK

-------------------------------------------------------------------------------------
================================================================================== */


// -------------------------------------------------------------------------------------
// Text Row functions
// -------------------------------------------------------------------------------------


/** Inserts a new text row at the bottom of the hud.
 * @param {string} hookName - Unique hook name for this text row.
 * - Must be distinct from all other text row hooks.
 * - Does not need to be distinct from progr bar hooks.
 * @param {string} color - Color of this row.
 * - Supported colors are all rgb/hex colors & every named color in the "Theme Editor".
 * */
function AddTextRow(hookName, color) {
	// add this hook to the list of hooks to hide when hud.js is run with the arg "clear".
	if (!(hooks_to_clear.includes(hookName))) hooks_to_clear.push(hookName);
	// Check if this hook already has an existing row element. If so, use that.
	let rowElement = d.getElementById(`ovv-row-${hookName}`);
	if (rowElement !== null) return rowElement;
	// If color is from the Theme, replace it with the correct rgb/hex code
	if (color in colors) color = colors[color];
	// Get an existing display element from HUD.
	let existingRow = d.getElementById(`ovv-row-hp`);
	// Make a clone of it for our new hud element
	let newHudRow = existingRow.cloneNode(true);
	// give hook id to our new row-level element
	newHudRow.id = `ovv-row-${hookName}`
	// Remove any nested elements created by stats.js
	newHudRow.querySelectorAll("p > p").forEach(el => el.parentElement.removeChild(el));
	// Create hook id's for the children where we will be modifying the innerText.
	newHudRow.querySelectorAll("p").forEach((el, i) => el.id = `ovv-${hookName}-${i}`);
	// Remove the class responsible for color.
	newHudRow.querySelectorAll("p").forEach((el) => el.className = `css-cxl1tz`);
	// Override the game's style parameters by inserting our own.
	newHudRow.querySelectorAll("p").forEach((el) => el.style = `color: ${color};${textStyleParams};`);
	// Set the innerText for all p children to be empty (making the row invisible)
	newHudRow.querySelectorAll("p").forEach((el) => el.innerText = "");
	// Insert our element at the bottom of the hud
	existingRow.parentElement.insertBefore(newHudRow, d.getElementById(`ovv-row-extra`));
	if (showHiddenRows) d.getElementById(`ovv-${hookName}-0`).innerText = hookName;
	return newHudRow;
};


/** Recolors an existing custom text row.
 * @param {string} hookToRecolor - Hook name for the text row to recolor.
 * @param {string} color - New color for this text row.
 * - Supported colors are all rgb/hex colors & every named color in the "Theme Editor".
 * */
function RecolorTextRow(hookToRecolor, color) {
	// If color is from the Theme, replace it with the correct rgb/hex code
	if (color in colors) color = colors[color];
	// Replace the appropriate style colors to get the desired effect.
	d.getElementById(`ovv-row-${hookToRecolor}`).querySelectorAll("p").forEach((el) => el.style = `color: ${color};${textStyleParams};`);
};


/** Updates a custom text row with new text in each column.
 * - If textL, textR, and text3 are all null, this row will be hidden.
 * @param {string} hookName - Name of the hook for text row
 * @param {string} textL - (optional) Text to display in column 1 of this row (left side)
 * @param {string} textR - (optional) Text to display in column 2 of this row (right side)
 * @param {string} text3 - (optional) Text to display in column 3 of this row
 * */
function UpdateTextRow(hookName, textL = null, textR = null, text3 = null) {
	// Determine the text we want in each column
	if (showHiddenRows) textL = hookName;
	else if (textL == null) textL = "";
	if (textR == null) textR = "";
	if (text3 == null) text3 = "";
	// Get each column element by id
	let col1 = d.getElementById(`ovv-${hookName}-0`)
	let col2 = d.getElementById(`ovv-${hookName}-1`)
	let col3 = d.getElementById(`ovv-${hookName}-2`)
	// Update the relevant elements' innerText (only if they exist & have a "p" tag; otherwise the column is a button)
	if (col1 !== null && col1.tagName == "P") col1.innerHTML = textL;
	if (col2 !== null && col2.tagName == "P") col2.innerHTML = textR;
	if (col3 !== null && col3.tagName == "P") col3.innerHTML = text3;
};


/** Adds/Updates a customizable button to an existing/new text row in the hud.
 * @param {string} hookName - Hook name for the row where you want to insert the button.
 * - Can be the hook of an existing text row or a new hook for a new row.
 * If it is a new hook, the newly made text row will be inserted at the bottom of the hud.
 * @param {number} column - The column in which to insert the button (out of 0, 1, or 2) (Default value: 0)
 * @param {string} buttonID - Unique string used to identify this button.
 * @param {string} buttonText - Text to display within the button.
 * @param {string} buttonAlign - Horizontal alignment of button.
 * - Valid strings: "left", "right", "center"
 * @param {Function} clickFunc - Nameless arrow function to run when the button is clicked. Custom-made functions are allowed.
 * - Example: () => { ns.print("foo"); ns.toast("bar") }
 * */
function AddButton(hookName, column = 0, buttonID, buttonText, buttonAlign = "center", clickFunc = () => alert("WARNING: This button lacks a function!")) {
	// add this hook to the list of hooks to hide when hud.js is run with the arg "clear".
	if (!(hooks_to_clear.includes(hookName))) hooks_to_clear.push(hookName);
	// Check if this hook already has an existing row element. If so, use that.
	let rowElement = d.getElementById(`ovv-row-${hookName}`);
	// if no row under this id exists, first create a new text row specifically for this button.
	if (rowElement === null) rowElement = AddTextRow(hookName, "primary");
	// find the button with this ID (if it exists)
	let buttonEl = d.getElementById(`ovv-button-${buttonID}`);
	// If a button with this ID does exist, update its attributes
	if (buttonEl !== null) {
		// update the parent (column) element
		buttonEl.parentElement.style = `text-align: ${buttonAlign};`
		buttonEl.parentElement.setAttribute("colspan", "1")
		// update the button innerText
		buttonEl.innerText = `${buttonText}`;
		// update the button style
		buttonEl.style = `${buttonSyleParams}`;
	}
	// if no button with this ID exists, make one.
	else {
		// Get the hook of the text element in the appropriate column, to replace with a button
		let elToReplace = d.getElementById(`ovv-${hookName}-${column}`);
		// If this hook is null, it has already been replaced with a button or is not a valid column.
		if (elToReplace === null) throw new Error(`AddButton: ${buttonText} is trying to insert into column ${column} which is already occupied by a button or doesn't exist!`);
		// Modify the parent (column) element
		let parentEl = elToReplace.parentElement
		parentEl.style = `text-align: ${buttonAlign};`
		parentEl.setAttribute("colspan", "1")
		// Remove the text element from the column
		parentEl.removeChild(elToReplace)
		// Create a new button element
		let newButton = createElement("button", {
			class: "css-fw8wf6",
			id: `ovv-button-${buttonID}`,
			innerText: `${buttonText}`,
			attributes: {
				"type": "button",
				"style": `${buttonSyleParams}`
			}
		})
		newButton.appendChild( createElement("span", {class: "MuiTouchRipple-root css-w0pj6f"}) )
		// Insert the new button element into the column.
		parentEl.appendChild(newButton);
		buttonEl = newButton;
	}
	// Set/update the onclick function for this button to update the CURRENTLY USED global clicked_button variable
	// (We cannot use addEventListener, since we can't constantly push updates to the event listener. This is a problem since if we save changes to hud.js while it is running, the pointer to clicked_button becomes outdated.)
	buttonEl.onclick = () => { clicked_button = buttonID; };
	// Create the function to run when the button is clicked, and store it in button_funcs
	button_funcs[buttonID] = () => clickFunc();
	return buttonEl;
};


// -------------------------------------------------------------------------------------
// Progress Bar functions
// -------------------------------------------------------------------------------------


/** Inserts a progress bar at the bottom of the hud.
 * @param {string} hookName - Unique hook name for this progress bar.
 * - Must be distinct from all other progress bar hooks.
 * - Does not need to be distinct from text row hooks.
 * @param {string} color - Color of the progress bar.
 * - Supported colors are all rgb/hex colors & every named color in the "Theme Editor".
 * @param {string} backgroundColor - (optional) Color of the background for progress bar.
 * - Default value: "rgb(17, 17, 17)"
 * - Supported colors are all rgb/hex colors & every named color in the "Theme Editor".
 * */
function AddProgrBar(hookName, color, backgroundColor = "rgb(17, 17, 17)") {
	// add this hook to the list of hooks to hide when hud.js is run with the arg "clear".
	if (!(bars_to_clear.includes(hookName))) bars_to_clear.push(hookName);
	// Check if this hook already has an existing row element. If so, use that.
	let rowElement = d.getElementById(`ovv-row-${hookName}-progr`);
	if (rowElement !== null) return rowElement;
	// If color or backgroundColor is from the Theme, replace them with the correct rgb/hex code
	if (color in colors) color = colors[color];
	if (backgroundColor in colors) backgroundColor = colors[backgroundColor];
	// Create a new row element
	let newRow = createElement("tr", {
		id: `ovv-row-${hookName}-progr`,
		class: "MuiTableRow-root css-1dix92e"
	})
	// Create a new column element
	let newHeader = createElement("th", {
		class: "jss11 css-hadb7u",
		attributes: {
				"scope": "row",
				"colspan": "2",
				"style": "padding-bottom: 2px; position: relative; top: -3px;"
		}
	})
	// Create a new bar background element
	let newEmptyBar = createElement("span", {
		class: "css-koo86v",
		attributes: {
			"role": "progressbar",
			"aria-valuenow": "0",
			"aria-valuemin": "0",
			"aria-valuemax": "100",
			"style": `background-color: ${backgroundColor};`  // set color of "empty" parts of bar
		}
	})
	// Create a new bar fill element
	let newFillBar = createElement("span", {
		class: "css-14usnx9",
		attributes: { "style": `transform: translateX(-100%); background-color: ${color};` } // set color of "full" parts of bar
	})
	// Properly nest our newly made elements
	newRow.appendChild(newHeader);
	newHeader.appendChild(newEmptyBar);
	newEmptyBar.appendChild(newFillBar);
	// Insert our row element at the bottom of the hud
	d.getElementById(`ovv-row-extra`).parentElement.insertBefore(newRow, d.getElementById(`ovv-row-extra`));
	return newRow;
};


/** Recolors an existing progress bar.
 * @param {string} hookName - Unique hook name for this progress bar.
 * - Must be distinct from all other progress bar hooks.
 * - Does not need to be distinct from text row hooks.
 * @param {string} color - Color of the progress bar.
 * - Supported colors are all rgb/hex colors & every named color in the "Theme Editor".
 * @param {string} backgroundColor - (optional) Color of the background for progress bar.
 * - Supported colors are all rgb/hex colors & every named color in the "Theme Editor".
 * */
function RecolorProgrBar(hookName, color, backgroundColor = "rgb(17, 17, 17)") {
	// If color or backgroundColor is from the Theme, replace them with the correct rgb/hex code
	if (color in colors) color = colors[color];
	if (backgroundColor in colors) backgroundColor = colors[backgroundColor];
	// Update the style of the second-depth child, setting "background-color" to the desired color for "empty" parts of bar
	let backElement = d.getElementById(`ovv-row-${hookName}-progr`).firstChild.firstChild
	backElement.style = `background-color: ${backgroundColor};`;
	// get existing HTML
	let curHTML = backElement.parentElement.innerHTML;
	// split the HTML so we get the sections we want to edit. We can't edit style directly since there are other style paramaters.
	let htmlL = curHTML.split("; background-color: ")[0]
	let htmlR = curHTML.split(`;">`)[1];
	// Update the style of the deepest child, setting "background-color" to the desired color for "full" parts of bar
	backElement.innerHTML = `${htmlL}; background-color: ${color};">${htmlR}`;
};


/** Updates a progress bar and its tooltip with a new percentage.
 * - If textL, textR, and text3 are all set to the string "null", this row will be hidden.
 * @param {string} hookName - Name of the hook for text row
 * @param {number} curAmt - How much of the "thing" we currently have
 * @param {number} maxAmt - How much of the "thing" we need to have in order for progr bar to be 100% full.
 * */
function UpdateProgrBar(hookName, curAmt, maxAmt) {
	let elementToUpdate = d.getElementById(`ovv-row-${hookName}-progr`).firstChild.firstChild
	// calculate the percentage progress
	let remaining =  Math.max(0, maxAmt - curAmt)
	let percent = Math.min(curAmt, maxAmt) * 100 / maxAmt
	// update the tooltip
	let ttContent = `<strong>Progress:</strong> ${StandardNotation(Math.abs(curAmt), 3)} / ${StandardNotation(Math.abs(maxAmt), 3)}<br /><strong>Remaining:</strong> ${StandardNotation(remaining, 3)} (${percent.toFixed(2)}%)`
	AddTooltip(`${hookName}-progr`, ttContent, {textAlign: "right"});
	// get existing HTML
	let curHTML = elementToUpdate.innerHTML;
	// split the HTML so we get the sections we want to edit. We can't edit style directly since there are other style paramaters.
	let htmlL = curHTML.split("transform: translateX(")[0]
	let htmlR = curHTML.split("%);")[1];
	// Update the style of the deepest child, setting "transform" to "translateX(-N%)" where N is the inverse percentage of the progress bar's completion. 
	elementToUpdate.innerHTML = `${htmlL}transform: translateX(-${(100 - percent).toFixed(2)}%);${htmlR}`;
};


/** Hides/Shows a progress bar on the hud.
 * @param {string} hookName - Name of the hook for the progress bar
 * @param {string} visibilityChange - String telling the function what to do to the visibility of the progress bar.
 * - Valid inputs are "show", "hide", or "toggle"
 * */
function ToggleProgrBar(hookName, visibilityChange) {
	let rowElement = d.getElementById(`ovv-row-${hookName}-progr`);
	if (rowElement !== null) {
		var barElement = rowElement.firstChild.firstChild.firstChild // deepest child
		switch (visibilityChange) {
			case "show":
				// Replace the missing className in the deepest child
				barElement.className = "css-14usnx9";
				// get existing HTML
				var curHTML = rowElement.innerHTML
				// split the HTML so we get the sections we want to edit
				var htmlL = curHTML.split(`-3px;"><span cl`)[0]
				var htmlR = curHTML.split(`-3px;"><span cl`)[1]
				// Rename "class" back to "clss" in the HTML of the second-depth child so the information can be parsed once again.
				if (htmlR[0] != "a") { rowElement.innerHTML = `${htmlL}-3px;"><span cla${htmlR}`; }
				break;
			case "hide":
				// Remove the className from the deepest child so the HTML doesn't break
				barElement.className = "";
				// get existing HTML
				var curHTML = rowElement.innerHTML
				// split the HTML so we get the sections we want to edit
				var htmlL = curHTML.split(`-3px;"><span cl`)[0]
				var htmlR = curHTML.split(`-3px;"><span cl`)[1]
				// Rename "class" to "clss" in the HTML of the second-depth child so the information cannot be parsed.
				if (htmlR[0] == "a") { rowElement.innerHTML = `${htmlL}-3px;"><span cl${htmlR.substring(1)}`; }
				break;
			case "toggle":
				// Determine whether the bar is currently hidden or not, and switch it to the other state
				if (barElement.className == "") { // Currently hidden
					// Replace the missing className in the deepest child
					barElement.className = "css-14usnx9";
					// get existing HTML
					var curHTML = rowElement.innerHTML
					// split the HTML so we get the sections we want to edit
					var htmlL = curHTML.split(`-3px;"><span cl`)[0]
					var htmlR = curHTML.split(`-3px;"><span cl`)[1]
					// Rename "class" back to "clss" in the HTML of the second-depth child so the information can be parsed once again.
					if (htmlR[0] != "a") { rowElement.innerHTML = `${htmlL}-3px;"><span cla${htmlR}`; }
				} else {  // Currently visible
					// Remove the className from the deepest child so the HTML doesn't break
					barElement.className = "";
					// get existing HTML
					var curHTML = rowElement.innerHTML
					// split the HTML so we get the sections we want to edit
					var htmlL = curHTML.split(`-3px;"><span cl`)[0]
					var htmlR = curHTML.split(`-3px;"><span cl`)[1]
					// Rename "class" to "clss" in the HTML of the second-depth child so the information cannot be parsed.
					if (htmlR[0] == "a") { rowElement.innerHTML = `${htmlL}-3px;"><span cl${htmlR.substring(1)}`; }
				}
				break;
			default:
				throw new Error(`Invalid arg ${visibilityChange} @ ToggleProgrBar`);
		}
	}
};


// -------------------------------------------------------------------------------------
// Misc functions
// -------------------------------------------------------------------------------------


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


/** Updates or inserts a decorative separator line at the bottom of the hud.
 * @param {number} lineNum - Unique number used to construct the hook for this line.
 * - Must be distinct from all other line numbers.
 * */
function AddLine(lineNum) {
	let rowElement = d.getElementById(`ovv-row-line${lineNum}`);
	let desiredHTML = `<th class="jss12 css-hadb7u" scope="row" colspan="${lineColSpan}"></th>`
	// If this element already exists, update it if needed, then return it.
	if (rowElement !== null) { 
		if (rowElement.innerHTML != desiredHTML) rowElement.innerHTML = desiredHTML;
		return rowElement;
	}
	// Get an existing display element from HUD.
	let existingRow = d.getElementById(`ovv-row-extra`);
	// Make a clone of it for our new hud element
	let newHudRow = existingRow.cloneNode(true);
	// Replace existing childNodes with a new childNode to create the line
	newHudRow.innerHTML = desiredHTML
	// Give hook id to our new row-level element
	newHudRow.id = `ovv-row-line${lineNum}`
	// Insert our element at the bottom of the hud
	existingRow.parentElement.insertBefore(newHudRow, d.getElementById(`ovv-row-extra`));
	return newHudRow;
};


/** Updates or creates a tooltip for a custom row element.
 * @param {string} hookName - Name of the hook to add the tooltip to
 * @param {string} content - Text content of the tooltip.
 * @param {any} params - (optional) Dictionary of any additional params you want to use to further customizee this tooltip.
 * - Supported params:
 * - tooltiptextAlign
 * */
function AddTooltip(hookName, content, params = {}) {
	params.tooltiptext = content
	let el = d.getElementById(`ovv-row-${hookName}`)
	setElementTooltip(el, params)
};


// -------------------------------------------------------------------------------------
// Setup/Init functions
// -------------------------------------------------------------------------------------


/** Initializes the hud for editing & handles changing default hud elements to fit your settings.*/
function InitHud() {
	let hooknames = ["hp", "money", "str", "def", "dex", "agi", "cha", "int", "extra"];
	let progrhooks = ["str", "def", "dex", "agi", "cha", "int", "hack"]
	// give every default hud element a row-level hook
	for (let hook of hooknames) {
		let rowElement = d.getElementById(`ovv-row-${hook}`); 
		if (rowElement !== null) continue; // only proceed if the row-hook doesn't exist yet
		if (hook == "extra") { d.getElementById(`overview-extra-hook-0`).parentElement.parentElement.id = `ovv-row-extra` }
		else { d.getElementById(`overview-${hook}-hook`).parentElement.parentElement.id = `ovv-row-${hook}`}
		if (progrhooks.includes(hook)) { d.getElementById(`ovv-row-${hook}`).nextSibling.id = `ovv-row-${hook}-progr`}
	}
	// If the element of this id doesn't exist, then this is the first time InitHud has run, so run the following code.
	let rowElement = d.getElementById(`ovv-row-hack`);
	if (rowElement === null) { 
		// fix the broken hack hook in the default hud.
		d.getElementById("overview-hack-hook").parentElement.parentElement.previousSibling.previousSibling.id = "ovv-row-hack";
		let nodeToDel = d.getElementById("overview-hack-hook").parentElement.parentElement;
		d.getElementById("overview-hack-hook").parentElement.parentElement.parentElement.removeChild(nodeToDel);
		d.getElementById("ovv-row-hack").nextSibling.id = `ovv-row-hack-progr`;
		// Remove all separator lines from the default hud.
		d.getElementById("ovv-row-agi").childNodes.forEach((el) => el.className = el.className.replaceAll('jss12', 'jss11'));
		d.getElementById("ovv-row-int").childNodes.forEach((el) => el.className = el.className.replaceAll('jss12', 'jss11'));
		// Tidy up the game's messy css class names
		d.getElementById("ovv-row-agi").parentElement.querySelectorAll("th").forEach((el) => el.className = el.className.replace("MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium ", ""))
		d.getElementById("ovv-row-agi").parentElement.querySelectorAll("td").forEach((el) => el.className = el.className.replace("MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium ", ""))
		d.getElementById("ovv-row-agi").parentElement.querySelectorAll("p").forEach((el) => el.className = el.className.replace("MuiTypography-root MuiTypography-body1 ", ""))
		d.getElementById("ovv-row-agi").parentElement.querySelectorAll("span").forEach((el) => el.className = el.className.replace("MuiLinearProgress-root MuiLinearProgress-colorPrimary MuiLinearProgress-determinate ", ""))
		d.getElementById("ovv-row-agi").parentElement.querySelectorAll("span").forEach((el) => el.className = el.className.replace("MuiLinearProgress-bar MuiLinearProgress-barColorPrimary ", ""))
	}
	// Implement all hud settings
	if (squishWorkInfo) SimplifyWorkInfoRows();
	// These settings are DISABLED, as they conflict with tooltips
	/* ovvTableCont.style.maxHeight = `${maxHudHeight}px`;
	ovvTableCont.style.transition = "all .2s";
	ovvTableCont.style.overflow = "scroll"; */
};


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
};


/** EXPERIMENTAL: Modifies the default "Working at ..." text, info, button, etc. at the bottom of the hud into a much more compact version.*/
function SimplifyWorkInfoRows() {
	// Make an array of the current bottom hud elements ("Working for...", Focus button, etc.)
	let bottomEls = []
	let siblingEl = d.getElementById("ovv-row-extra").nextSibling
	while (siblingEl !== null) {
		bottomEls.push(siblingEl);
		siblingEl = siblingEl.nextSibling;
	}
	// If there are no elements at the bottom of the hud, stop here.
	if (bottomEls.length == 0) return;
	// Iterate through the bottom hud elements, changing styles to be more compact
	for (let el of bottomEls) {
		el.parentElement.setAttribute("colspan", 3);
		// make all text rows to take up less horizontal space and align to the left
		el.querySelectorAll("p").forEach((elp) => elp.style = `padding: 0px 0px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;`)
		el.querySelectorAll("br").forEach((elbr) => elbr.outerHTML = " ");
		// make the Focus button occupy less space
		el.querySelectorAll("button").forEach((elbutton) => elbutton.style = "padding: 0px 0px; margin: 1px 0px 0px;")
	}
	// If the first element is a text element
	let firstEl = bottomEls[0].querySelector("p")
	if (firstEl !== null) {
		// Add some top padding to the first element
		firstEl.style = `padding: 3px 0px 0px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;`;
		// If present, shorten the abnoxiously long crime message of the first element "You are attempting to ..."
		firstEl.innerText = firstEl.innerText.replace("You are attempting to", "Committing");
	}
};


// -------------------------------------------------------------------------------------
// Helper functions
// -------------------------------------------------------------------------------------


/** Heavily modified helper function from the game's source code for creating new elements.
 * @param {string} tagName - name of element tag, like "span", "div", "a", "style", etc.
 * @param {any} params - Dictionary of relevant parameters.
 * - Valid keys:
 * - id, class, innerHTML, innerText, tabIndex, tooltiptext, tooltiptextAlign, attributes
 * - Valid value data types:
 * - string (for all keys except attributes), {string: string} dictionary (for attributes key)
 * - Example: {id: "hook-name", innerText: "Hello World", attributes: {"colspan": "1", "scope": "row"} }
 * */
function createElement(tagName, params = {}) {
	const el = d.createElement(tagName);

	if (params.id !== undefined) { el.id = params.id; }
	if (params.class !== undefined) { el.className = params.class; }
	if (params.innerHTML !== undefined) { el.innerHTML = params.innerHTML; }
	if (params.innerText !== undefined) { el.innerText = params.innerText; }
	if (params.tabIndex !== undefined) { el.tabIndex = params.tabIndex; }
	// custom-made attributes logic
	if (params.attributes !== undefined) {
		try {
			for (let attName of Object.keys(params.attributes)) el.setAttribute(attName, params.attributes[attName]);
		} catch (err) { throw new Error(`Invalid createElement attributes: ${err}`) }
	}
	
	// This is one of many helper functions that is called in this function, but is the only one we need.
	setElementTooltip(el, params);
	return el;
};


/** Heavily modified helper function from the game's source code for creating tooltips.
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
			if (params.tooltiptextAlign !== undefined) d.getElementById(`${el.id}-tooltip`).style.textAlign = params.tooltiptextAlign;
			// Set the tooltip to start out as invisible
			d.getElementById(`${el.id}-tooltip`).style.visibility = "hidden";
			d.getElementById(`${el.id}-tooltip`).style.opacity = "0";
			d.getElementById(`${el.id}-tooltip`).style.transform = "translate3d(0px, 20px, 0px) scale3d(0.95, 0.95, 0.95)";
			// Add event listeners for mouseout/mouseover to hide/show the tooltip.
			el.addEventListener('mouseover', (e) => {
				d.getElementById(`${el.id}-tooltip`).style.visibility = "visible";
				d.getElementById(`${el.id}-tooltip`).style.opacity = "1";
				d.getElementById(`${el.id}-tooltip`).style.transform = "translate3d(0px, 20px, 0px) scale3d(1, 1, 1)";
			});
			el.addEventListener('mouseout', (e) => {
				d.getElementById(`${el.id}-tooltip`).style.visibility = "hidden";
				d.getElementById(`${el.id}-tooltip`).style.opacity = "0";
				d.getElementById(`${el.id}-tooltip`).style.transform = "translate3d(0px, 20px, 0px) scale3d(0.95, 0.95, 0.95)";
			});
		}
		// If the current tooltip exists but the text does not match what we want, replace it.
		else if (curToolTip.innerHTML != params.tooltiptext) {
			curToolTip.innerHTML = params.tooltiptext
		}
	}
};


// Incomplete - this function works, but not as intended.
function MakeToolTipFromDict(dict, format = `%key%: %val%`, exclude0 = false) {
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
};

	
/** Puts any large number into a standard notation "000.000a" string 
 * @param {number} num - Number to convert to standard notation
 * @param {number} decimalplaces - Number of decimal places to round to.
 * */
function StandardNotation(num, decimalplaces = 1) {
	let formattedNum = formatNumberShort(num, 6, decimalplaces);
	if (String(num).length <= formattedNum.length && (num % 1) == 0) return String(num);
	else return formattedNum;
};


/** Return a formatted representation of the monetary amount using scale sympols (e.g. 6.50M)
 * - NOTE: This function was originally written by alianbryden, and can be found in the repo below, under "helpers.js".
 * - https://github.com/alainbryden/bitburner-scripts
 * @param {number} num - The number to format
 * @param {number=} maxSignificantFigures - (default: 6) The maximum significant figures you wish to see (e.g. 123, 12.3 and 1.23 all have 3 significant figures)
 * @param {number=} maxDecimalPlaces - (default: 3) The maximum decimal places you wish to see, regardless of significant figures. (e.g. 12.3, 1.2, 0.1 all have 1 decimal)
 * */
function formatNumberShort(num, maxSignificantFigures = 6, maxDecimalPlaces = 3) {
	if (Math.abs(num) > 10 ** (3 * symbols.length)) // If we've exceeded our max symbol, switch to exponential notation
		return num.toExponential(Math.min(maxDecimalPlaces, maxSignificantFigures - 1));
	for (var i = 0, sign = Math.sign(num), num = Math.abs(num); num >= 1000 && i < symbols.length; i++) num /= 1000;
	// TODO: A number like 9.999 once rounded to show 3 sig figs, will become 10.00, which is now 4 sig figs.
	return ((sign < 0) ? "-" : "") + num.toFixed(Math.max(0, Math.min(maxDecimalPlaces, maxSignificantFigures - Math.floor(1 + Math.log10(num))))) + symbols[i];
};

}