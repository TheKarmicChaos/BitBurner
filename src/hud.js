/*
----------------------------------------------------------------------------------------
				README - Instructions for how to use this script
----------------------------------------------------------------------------------------

Step 0: Setup -----------------------------

	WIP :: After you have customized your hud via Steps 1-3, you may be tempted to run the script to test if it works.
Before you do, make sure you have already done the following.

- (Optional) Tweak the consts/vars under the section labelled "Settings" (before the main function) to fit to your liking.
- WIP

Step 1: Creating Your Hud -----------------

	First, you need to create your hud. This means adding custom hooks for every single row you want on display.
The functions in this script should handle all of the heavy lifting for you and make this fairly straightforward.

- Go down to the section labelled "LIST EACH ROW OF YOUR CUSTOM HUD BELOW"
- List every row you want your hud to contain, in order from top to bottom, using any of the following functions:
	(check function paramaters/definitions and the examples I use for more details)
	- addTextRow(hook, color)
	- addProgrBar(hook, color)
	- addDefault(hook, nextRowHook)
	- addLine(num)

Step 2: Updating Your Hud -----------------

	From now on, your hud will be permanently on display, even when this script is not running. In order to completely
reset your hud, you need to use the "Kill all running scripts" option (in the options menu or bottom-right corner of
the hud). To actually update each line of the hud, you have two options. The more RAM-expensive option (not recommened)
is to add a "while" loop to the main function of this script and update every row locally (within this script).
The cheaper, easier, and less laggy option (recommended) is to update as few things locally as possible, and instead use ns.run in your
other looping scripts to run hud.js, passing arguments that tell the hud which row to update and with what information.

- Go down to the section labelled "LIST YOUR LOCAL UPDATES HERE"
- Define all hud updates you want to run locally. (Be wary of RAM usage and script time complexity here! These will happen every single time hud.js is run!)
- Go to each of your other scripts that contain information you want to display in your hud.
- Add the command ns.run("hud.js") to each of those scripts, passing the proper arguments so that hud.js knows what to update. A cheat sheet can be found below.

Step 3: Making Tooltips -------------------

	Tooltips (the popup windows that appear when you hover your cursor over something) are extremely useful for displaying
extra non-vital information. Tooltips for progress bars will be automatically created and updated along with the progress bar
itself. For text rows, you will need to add and update tooltips manually.

- Go down to the section labelled "LIST YOUR LOCAL UPDATES HERE"
- Define all tooltip updates you want to run locally. (Again, be wary of RAM usage & script complexity here!)
- Go to each of your other scripts that contain information you want to display in a hud tooltip.
- Add the command ns.run("hud.js") to each of those scripts, passing the proper arguments so that hud.js knows what to update. A cheat sheet can be found below.

Step 4: Making Buttons -------------------

	WIP

-------------------------------------------

		External Updates Cheat Sheet:
	TEXT ROW: UPDATE/SHOW 		ns.run("hud.js", 1, "!!upd", hook, "Column 1 Text", "Column 2 Text", "Column 3 Text", ... )
	TEXT ROW: HIDE				ns.run("hud.js", 1, "!!upd", hook )
	TEXT ROW: CHANGE COLOR		ns.run("hud.js", 1, "!!color", hook, "new color" )
	PROGR BAR: UPDATE			ns.run("hud.js", 1, "!!progr", hook, currentValue, maximumValue )
	PROGR BAR: CHANGE COLOR		ns.run("hud.js", 1, "!!progr color", hook, "new color", "new background color (optional)" )
	PROGR BAR: HIDE 			ns.run("hud.js", 1, "!!progr hide", hook )
	PROGR BAR: SHOW				ns.run("hud.js", 1, "!!progr show", hook )
	PROGR BAR: TOGGLE			ns.run("hud.js", 1, "!!progr toggle", hook )
	TOOLTIP: UPDATE/ADD			ns.run("hud.js", 1, "!!tooltip", hook, "Tooltip Content" )
	CLEAR HUD ELEMENTS			ns.run("hud.js", 1, "!!clear" )
	PASSING MULTIPLE UPDATES	ns.run("hud.js", 1, "!!progr show", hook1, "!!upd", hook2, "foo", "bar", "!!tooltip", hook3, "More Text", ... )

-------------------------------------------

		TODO LIST:
	- Overhaul all "Add" functions to try to update the element if they already exist (allowing for function changes to be made without killing all scripts)
	- Figure out how to center tooltips, like the ones the game uses for progress bars
	- Add fancy ripple effect on button click that the game uses.
	- Add support for hiding/showing hud buttons.
	- Add support for lines, progr bars, & buttons to be inside dropdowns.

-------------------------------------------
*/


	// Class definitions - DO NOT MODIFY ---------------------------------------------------
/** Stack data structure (Last-In First-Out). */
class Stack {
	maxSize = 15;
	container = [];
	/** Helper function to display all values while developing */
	display() { console.log(this.container); }
	/** Checks if stack is empty */
	isEmpty() { return this.container.length === 0; }
	/** Checks if stack is full */
	isFull() { return this.container.length >= this.maxSize; }
	/** Adds an element to the stack */
	push(element) {
		// Check if Queue is full
		if (this.isFull()) throw new Error("Stack Overflow!");
		// Since we want to add elements to end, we'll just push them.
		this.container.push(element);
	}
	/** Removes and returns an element from the top of the stack */
	pop() {
		// Check if empty
		if (this.isEmpty()) throw new Error("Stack Underflow!");
		// Return
		return this.container.pop();
	}
	/** Returns the top element of the stack without removing it */
	peek() {
		// Check if empty
		if (this.isEmpty()) throw new Error("Stack Underflow!");
		// Return the last element of the stack container
		return this.container[this.container.length - 1];
	}
	/** Clears the stack container */
	clear() { this.container = []; }
}


	// Global Constants & Vars - DO NOT MODIFY ---------------------------------------------
//const d = document
const d = eval("document")
const symbols = ["", "k", "m", "b", "t", "q", "Q", "s", "S", "o", "n", "e33", "e36", "e39"];
const ovv = d.getElementsByClassName('MuiPaper-root')[0];
const ovvHeader = ovv.childNodes[0].firstChild.firstChild.firstChild; // unused
const ovvTable = ovv.childNodes[1].firstChild.firstChild.firstChild; // unused
const ovvTableCont = ovvTable.firstChild;
let clicked_button = null;
let myTextHooks = [];
let myProgrHooks = [];
let myButtonHooks = [];
let button_funcs = {};

/** @param {import("../").NS} ns */
export async function main(ns) {

	// Local Constants & Vars - DO NOT MODIFY ----------------------------------------------
	let clicked_button_temp = null;
	if (clicked_button !== null) { clicked_button_temp = clicked_button; clicked_button = null; }
	let hookOrder = []; //unused
	const dropdownChildren = {};
	const colors = ns.ui.getTheme();
	var dropdownStack = new Stack();

	// Settings ----------------------------------------------------------------------------
	const tailWindow = false; // Enables/Disables tail windows. Not reccommended for anything other than debugging.
	const showHiddenRows = false; // Debug tool to unhide all hidden text rows; only applies to rows that are currently being updated, or to all rows when resetting hud via "kill all running scripts"
	const squishWorkInfo = true; // If true, modifies the default "Working at ..." text, info, button, etc. at the bottom of the hud into a much more compact version.
	const Cdd = "◄"; // Character used for "Collapsed dropdown" button
	const Edd = "▼"; // Character used for "Expanded dropdown" button
	const numColumns = 3;	// Maximum number of columns you will ever use in your hud, excluding the auto-generated column for dropdown arrows. Minimum of 3.
	const lineColSpan = 2;	// Number of columns your separator lines should span accross.
	const progrColSpan = 2;	// unused // Number of columns your progress bars should span accross.
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
	background-color: ${colors.well};
	`.replace(/[\n\r\t]/g, ""); // This method removes the newline & tab characters.
	const textStyleParams = // Default css style parameters added to the text rows in your hud (applies to all text columns)
	`transform-origin: top;
	overflow: hidden;
	transition: all 0.5s;
	max-height: 3em;
	`.replace(/[\n\r\t]/g, "");
	const buttonSyleParams = // Default css style parameters used for your custom buttons
	`padding: 0px 10px;
	margin: 4px 4px 4px 4px;
	`.replace(/[\n\r\t]/g, ""); 
	
	// Unused settings
	const maxHudHeight = 1000 // Maximum vertical space (in pixels) the hud can occupy before requiring the player to scroll.


	// Main Function -----------------------------------------------------------------------
	try {
		// Run initialization functions
		if (tailWindow) { ns.tail("hud.js", "home", ...ns.args); ns.disableLog("ALL"); ns.clearLog(); }
		let runArgs = parseArgs();
		initHud();
		makeToolTipStyle();

		// ##################################################################################################

		// #################################################
		// LIST EACH ROW OF YOUR CUSTOM HUD BELOW
		// #################################################
		// (By default, this section will contain the hud rows that I personally use.)

		addTextRow("bitnode", "cha");
		addTextRow("loop-sf", "cha");
		startDropdown("loop-sf");
			addTextRow("aug", "int");
		endDropdown("loop-sf");
		addDefault("hp", "ram");
		addTextRow("ram", "hp");
		addLine(0);
		addDefault("money", "income");
		addTextRow("income", "money");
		addTextRow("stock", "money");
		addTextRow("hash", "hack");
		addTextRow("hashincome", "hack");
		addLine(1);
		addTextRow("buyupgr", "money");
		startDropdown("buyupgr");
			addTextRow("buynode", "money");
			addTextRow("buyserv", "money");
		endDropdown("buyupgr");
		addTextRow("buyhash", "hack");
		startDropdown("buyhash");
			addTextRow("buyhashcorp", "hack");
			addTextRow("buyhashblade", "hack");
		endDropdown("buyhash");
		addLine(2);
		addDefault("hack", "line3");
		startDropdown("hack");
			addDefault("str", "line3");
			startDropdown("str");
				addDefault("def", "line3");
				addDefault("dex", "line3");
				addDefault("agi", "line3");
			endDropdown("str");
			addDefault("cha", "line3");
			addDefault("int", "line3");
		endDropdown("hack");
		addLine(3);
		addTextRow("karma", "error");
		addProgrBar("karma", "error");
		addTextRow("kill", "error");
		addProgrBar("kill", "error");
		addTextRow("gangtimer", "info");
		addTextRow("augtimer", "info");
		addLine(4);
		addButton("buttons1", 0, "run-scanhud", "Scan Hud", "right", () => ns.run(`scan-hud.js`));
		addButton("buttons1", 1, "run-testfile", "Test", "left", () => ns.run(`test.js`));
		addButton("buttons2", 0, "clear-hud", "Clear Hud", "right", () => ns.run(`hud.js`, 1, "clear"));
		addButton("buttons2", 1, "run-globaltail", "Globals", "left", () => ns.run(`global-display.js`));
		addButton("buttons3", 0, "missing-test", "Click Me!", "right");

		// #################################################
		// LIST YOUR LOCAL UPDATES HERE
		// #################################################
		// (By default, this section will contain stuff that I personally update locally.)

		// My Local Tooltip Updates
		addTooltip("run-scanhud", "Run scan-hud.js");
		addTooltip("run-testfile", "Run test.js");
		addTooltip("run-globaltail", "Run global-display.js");

		// ##################################################################################################


		// If we run this file with certain args we can update hud elements from other files!
		for (let argArray of runArgs) {
			let updType = argArray[0] || null;
			let updHook = argArray[1] || null;
			let updArgs = argArray.slice(2) || [];
			switch (updType) {
				case "!!upd":
					updateTextRow(updHook, updArgs);
					break;
				case "!!color":
					if (updArgs.length == 0) throw new Error(`Too few args for updType "${updType}" passed into ns.run`);
					else recolorTextRow(updHook, updArgs[0]);
					break;
				case "!!progr":
					if (updArgs.length <= 1) throw new Error(`Too few args for updType "${updType}" passed into ns.run`);
					else updateProgrBar(updHook, updArgs[0], updArgs[1]);
					break;
				case "!!progr color":
					if (updArgs.length == 0) throw new Error(`Too few args for updType "${updType}" passed into ns.run`);
					else recolorProgrBar(updHook, updArgs[0], updArgs[1] || "rgb(17, 17, 17)");
					break;
				case "!!progr show":
					toggleProgrBar(updHook, "show");
					break;
				case "!!progr hide":
					toggleProgrBar(updHook, "hide");
					break;
				case "!!progr toggle":
					toggleProgrBar(updHook, "toggle");
					break;
				case "!!tooltip":
					if (updArgs.length == 0) throw new Error(`Too few args for updType "${updType}" passed into ns.run`);
					else addTooltip(updHook, updArgs[0]);
					break;
				case "!!clear":
					// Hide all custom-made hooks
					for (const hook of myTextHooks) { updateTextRow(hook, []) }
					for (const hook of myProgrHooks) { toggleProgrBar(hook, "hide") }
					for (const hook of myButtonHooks) {}
					// Wipe all stored data
					myTextHooks = [];
					myProgrHooks = [];
					myButtonHooks = [];
					button_funcs = {};
					break;
				default:
					throw new Error(`Invalid updType "${updType}" passed into ns.run`);
			}
		}

		// If a button was clicked, run the stored function for that button.
		if (clicked_button_temp in button_funcs) await button_funcs[clicked_button_temp]();
		
	} catch (err) { ns.toast("ERROR: HUD update Skipped: " + String(err), "error", 1000); }




/* ==================================================================================
-------------------------------------------------------------------------------------

					Functions - DELETE/MODIFY AT YOUR OWN RISK

-------------------------------------------------------------------------------------
================================================================================== */


// -------------------------------------------------------------------------------------
// Text Row functions
// -------------------------------------------------------------------------------------


/** Creates & inserts a new text row at the bottom of the hud, unless one using this hookName already exists.
 * @param {string} hookName - Unique hook name for this text row.
 * - Must be distinct from all other text row hooks.
 * - Does not need to be distinct from progr bar hooks.
 * @param {string} color - Color of this row.
 * - Supported colors are all rgb/hex colors & every named color in the "Theme Editor".
 * */
function addTextRow(hookName, color) {
	// If hookName isn't in myTextHooks, add it.
	if (!(myTextHooks.includes(hookName))) myTextHooks.push(hookName);
	// If the dropdownStack isn't empty, remember this hookName as a dropdownChild of the hook on the top of the stack.
	if (!dropdownStack.isEmpty()) dropdownChildren[dropdownStack.peek()].push(hookName);
	// If a row element with this hook already exists, we don't need to make a new one, so return here.
	if (d.getElementById(`ovv-row-${hookName}`) !== null) return;
	// If color is from the Theme, replace it with the correct rgb/hex code
	if (color in colors) color = colors[color];
	// Create a new row element
	let newHudRow = createElement("tr", {
		id: `ovv-row-${hookName}`,
		class: "MuiTableRow-root css-1dix92e"
	});
	// Iterate over the number of columns desired (minimum of 3)
	for (let n = 0; n < Math.max(numColumns, 3); n++) { 
		// Create a new column element
		let newCol;
		if (n == 0) newCol = createElement("th", { // Constuctor used for the first column
			class: "jss11 css-hadb7u",
			attributes: { "scope": "row" }
		});
		else newCol = createElement("td", { // Constuctor used for the other columns
			class: "jss11 css-7v1cxh"
		});
		// Create a new <p> (paragraph) element for the innerText
		let newPel = createElement("p", {
			class: "css-cxl1tz",
			id: `ovv-${hookName}-${n}`,
			attributes: { "style": `color: ${color};${textStyleParams}` }
		});
		// Insert the new <p> element as a child of the new column element
		newCol.appendChild(newPel);
		// Insert the new column element as a child of the new row element
		newHudRow.appendChild(newCol);
	}
	// Set the innerText of the first column to be visible, if we want to.
	if (showHiddenRows) d.getElementById(`ovv-${hookName}-0`).innerText = hookName;
	// Insert our row element at the bottom of the hud
	ovvTableCont.insertBefore(newHudRow, d.getElementById(`ovv-row-extra`));
}


/** Recolors an existing custom text row.
 * @param {string} hookToRecolor - Hook name for the text row to recolor.
 * @param {string} color - New color for this text row.
 * - Supported colors are all rgb/hex colors & every named color in the "Theme Editor".
 * */
function recolorTextRow(hookToRecolor, color) {
	// If color is from the Theme, replace it with the correct rgb/hex code
	if (color in colors) color = colors[color];
	// Replace the appropriate style colors to get the desired effect.
	d.getElementById(`ovv-row-${hookToRecolor}`).querySelectorAll("p").forEach((el) => {
		if (el !== d.getElementById(`ovv-${hookToRecolor}-dropdown`)) el.style.color = `${color}`;
	})
}


/** Updates a custom text row with new text in each column.
 * - If textL, textR, and text3 are all null, this row will be hidden.
 * @param {string} hookName - Name of the hook for text row
 * @param {string[]} newTextArray - (optional) Array of the new text to display in each column, from left to right.
 * - If new text is not specified for some column, this function will clear all text from that column.
 * */
function updateTextRow(hookName, newTextArray = []) {
	// Iterate through each column
	for (let n = 0; n < numColumns; n++) { 
		// Determine the text we want in the column
		let newText = newTextArray[n] || "";
		if (n == 0 && showHiddenRows) newText = hookName;
		// Get the column's <p> element by id
		let el = d.getElementById(`ovv-${hookName}-${n}`)
		// Update the element's innerText (only if it exists & has a "p" tag; otherwise the element doesn't exist or is a button)
		if (el !== null && el.tagName == "P") el.innerHTML = newText;
	}
}


/** Creates/Updates a customizable button to an existing/new text row in the hud.
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
function addButton(hookName, column = 0, buttonID, buttonText, buttonAlign = "center", clickFunc = () => ns.toast("This button lacks a function!", "warning")) {
	// If buttonID isn't in myButtonHooks, add it.
	if (!(myButtonHooks.includes(buttonID))) myButtonHooks.push(buttonID);
	// Get the existing text row element using hookName.
	let rowElement = d.getElementById(`ovv-row-${hookName}`);
	// If there is no text row element using hookName, create one and use that instead.
	if (rowElement === null) {
		addTextRow(hookName, "primary");
		rowElement = d.getElementById(`ovv-row-${hookName}`);
	}
	// Get the button using buttonID (if it exists)
	let buttonEl = d.getElementById(`ovv-button-${buttonID}`);
	// If no button using buttonID exists, make one.
	if (buttonEl === null) {
		// Get the hook of the text element in the appropriate column, to replace with a button
		let elToReplace = d.getElementById(`ovv-${hookName}-${column}`);
		// If this hook is null, it has already been replaced with a button or is not a valid column.
		if (elToReplace === null) throw new Error(`addButton: ${buttonText} is trying to insert into column ${column} which is already occupied by a button or doesn't exist!`);
		// Modify the parent (column) element
		let parentEl = elToReplace.parentElement
		parentEl.style.textAlign = `${buttonAlign}`
		parentEl.setAttribute("colspan", "1")
		parentEl.id = `ovv-buttoncol-${buttonID}`
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
	// If a button using buttonID already existed, update its innertext
	else { buttonEl.innerText = `${buttonText}`; }
	// Update the onclick function for this button to update the CURRENTLY USED global clicked_button variable
	// (NOTE: We cannot use addEventListener, since we can't constantly push updates to the event listener. This is a problem since if we save changes to hud.js while it is running, the pointer to clicked_button becomes outdated.)
	buttonEl.onclick = () => { clicked_button = buttonID; }
	// Create the function to run when the button is clicked, and store it in button_funcs
	button_funcs[buttonID] = () => clickFunc();
}

// -------------------------------------------------------------------------------------
// Dropdown functions
// -------------------------------------------------------------------------------------


function startDropdown(hookName) {
	// Check if a row element using this hook exists. If not, throw an error.
	let rowEl = d.getElementById(`ovv-row-${hookName}`)
	if (rowEl === null) throw new Error(`Attempted to create dropdown for ${hookName}, but no ${hookName} row exists!`);
	// If this hook already has a dropdown, throw an error.
	if (hookName in Object.keys(dropdownChildren)) throw new Error(`Attempted to create dropdown for ${hookName}, but one already exists!`);
	// Assign this hook an empty arrray of children in dropdownChildren
	dropdownChildren[hookName] = [];
	// Add this hook to the top of the dropdownStack.
	dropdownStack.push(hookName);
}


function endDropdown(hookName) {
	// Check if a row element using this hook exists. If not, throw an error.
	let rowEl = d.getElementById(`ovv-row-${hookName}`)
	if (rowEl === null) throw new Error(`Attempted to create dropdown for ${hookName}, but no ${hookName} row exists!`);
	// Remove this hook from the top of the dropdownStack. If it is not at the top, throw an error.
	if (dropdownStack.pop() != hookName) throw new Error(`Attempted to end dropdown for ${hookName} before ending nested dropdowns!`);
	// Check if this hook already has an extra row element for dropdown buttons. If not, create it first.
	let dropdownEl = d.getElementById(`ovv-${hookName}-dropdown`);
	if (dropdownEl === null) {
		// Create a new column element
		let newCol = createElement("td", {
			class: "jss11 css-7v1cxh",
			attributes: { "style": `padding: 0 ${12*(dropdownStack.container.length)}px 0 5px;`} // more padding is applied to nested dropdowns
		});
		// Create a new <p> (paragraph) element
		let newPel = createElement("p", {
			class: "css-cxl1tz",
			id: `ovv-${hookName}-dropdown`,
			innerText: Edd,
			attributes: { "style": `color: ${colors["secondary"]};cursor: pointer;${textStyleParams}` }
		});
		newPel.addEventListener("click", ((e) => {
			if (d.getElementById(`ovv-${hookName}-dropdown`).innerText[0] == Edd) {
				d.getElementById(`ovv-${hookName}-dropdown`).innerText = Cdd;
				collapseDropdown(hookName);
			} else if (d.getElementById(`ovv-${hookName}-dropdown`).innerText[0] == Cdd) {
				d.getElementById(`ovv-${hookName}-dropdown`).innerText = Edd;
				expandDropdown(hookName);
			}
		}));
		// Insert the new <p> element as a child of the new column element
		newCol.appendChild(newPel);
		// Insert the new column element as a child of the existing row element
		rowEl.appendChild(newCol);
		// Re-assign variable dropdownEl to this newly added <p> element
		dropdownEl = d.getElementById(`ovv-${hookName}-dropdown`);
	}
}


function expandDropdown(hookName) {
	// Iterate over dropdownChildren elements of this hookName
	for (let hook of dropdownChildren[hookName]) {
		let el = d.getElementById(`ovv-row-${hook}`)
		// Set the maxheight of <p> elements back to default.
		el.querySelectorAll("p").forEach((el) => el.style.maxHeight = "3em");
		// If this row has a dropdown of its own and it should be expanded (first character is Edd), also expand that.
		if (d.getElementById(`ovv-${hook}-dropdown`) !== null && d.getElementById(`ovv-${hook}-dropdown`).innerText[0] == Edd) expandDropdown(hook);
	}
}


function collapseDropdown(hookName) {
	// Iterate over dropdownChildren elements of this hookName
	for (let hook of dropdownChildren[hookName]) {
		let el = d.getElementById(`ovv-row-${hook}`)
		// Set the maxheight of <p> elements to 0.
		el.querySelectorAll("p").forEach((el) => el.style.maxHeight = "0");
		// If this row has a dropdown of its own, also collapse that.
		if (d.getElementById(`ovv-${hook}-dropdown`) !== null) collapseDropdown(hook);
	}
}


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
function addProgrBar(hookName, color, backgroundColor = "rgb(17, 17, 17)") {
	// add this hook to the list of custom progr hooks.
	if (!(myProgrHooks.includes(hookName))) myProgrHooks.push(hookName);
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
}


/** Recolors an existing progress bar.
 * @param {string} hookName - Unique hook name for this progress bar.
 * - Must be distinct from all other progress bar hooks.
 * - Does not need to be distinct from text row hooks.
 * @param {string} color - Color of the progress bar.
 * - Supported colors are all rgb/hex colors & every named color in the "Theme Editor".
 * @param {string} backgroundColor - (optional) Color of the background for progress bar.
 * - Supported colors are all rgb/hex colors & every named color in the "Theme Editor".
 * */
function recolorProgrBar(hookName, color, backgroundColor = "rgb(17, 17, 17)") {
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
}


/** Updates a progress bar and its tooltip with a new percentage.
 * - If textL, textR, and text3 are all set to the string "null", this row will be hidden.
 * @param {string} hookName - Name of the hook for text row
 * @param {number} curAmt - How much of the "thing" we currently have
 * @param {number} maxAmt - How much of the "thing" we need to have in order for progr bar to be 100% full.
 * */
function updateProgrBar(hookName, curAmt, maxAmt) {
	let elementToUpdate = d.getElementById(`ovv-row-${hookName}-progr`).firstChild.firstChild
	// calculate the percentage progress
	let remaining =  Math.max(0, maxAmt - curAmt)
	let percent = Math.min(curAmt, maxAmt) * 100 / maxAmt
	// update the tooltip
	let ttContent = `<strong>Progress:</strong> ${standardNotation(Math.abs(curAmt), 3)} / ${standardNotation(Math.abs(maxAmt), 3)}<br /><strong>Remaining:</strong> ${standardNotation(remaining, 3)} (${percent.toFixed(2)}%)`
	addTooltip(`${hookName}-progr`, ttContent, {textAlign: "right"});
	// get existing HTML
	let curHTML = elementToUpdate.innerHTML;
	// split the HTML so we get the sections we want to edit. We can't edit style directly since there are other style paramaters.
	let htmlL = curHTML.split("transform: translateX(")[0]
	let htmlR = curHTML.split("%);")[1];
	// Update the style of the deepest child, setting "transform" to "translateX(-N%)" where N is the inverse percentage of the progress bar's completion. 
	elementToUpdate.innerHTML = `${htmlL}transform: translateX(-${(100 - percent).toFixed(2)}%);${htmlR}`;
}


/** Hides/Shows a progress bar on the hud.
 * @param {string} hookName - Name of the hook for the progress bar
 * @param {string} visibilityChange - String telling the function what to do to the visibility of the progress bar.
 * - Valid inputs are "show", "hide", or "toggle"
 * */
function toggleProgrBar(hookName, visibilityChange) {
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
				throw new Error(`Invalid arg ${visibilityChange} @ toggleProgrBar`);
		}
	}
}


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
function addDefault(hookName, nextRowHook = "extra") {
	// Get the existing default display element from HUD, and the next row element if it exists
	let rowElement = d.getElementById(`ovv-row-${hookName}`);
	let nextRowElement = d.getElementById(`ovv-row-${nextRowHook}`);
	// Remember the element of the progr bar if it exists
	let progrEl = d.getElementById(`ovv-row-${hookName}-progr`);
	if (rowElement !== null) {
		// If the dropdownStack isn't empty, remember this hookName as a dropdownChild of the hook on the top of the stack.
		if (!dropdownStack.isEmpty()) {
			dropdownChildren[dropdownStack.peek()].push(hookName);
			// If there is a progr bar, remember that too.
			if (progrEl !== null) dropdownChildren[dropdownStack.peek()].push(`${hookName}-progr`);
		}
		// If the hook for the next row element exists, insert our element(s) before it
		if (nextRowElement !== null) {
			rowElement.parentElement.insertBefore(rowElement, nextRowElement);
			// If there is a progr bar, insert that too
			if (progrEl !== null) {progrEl.parentElement.insertBefore(progrEl, nextRowElement)}
		}
		// Otherwise, insert our element(s) at the bottom of the hud
		else { 
			rowElement.parentElement.insertBefore(rowElement, d.getElementById(`ovv-row-extra`));
			// If there is a progr bar, insert that too
			if (progrEl !== null) {progrEl.parentElement.insertBefore(progrEl, d.getElementById(`ovv-row-extra`))}
		}
	}
}


/** Updates or inserts a decorative separator line at the bottom of the hud.
 * @param {number} lineNum - Unique number used to construct the hook for this line.
 * - Must be distinct from all other line numbers.
 * */
function addLine(lineNum) {
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
}


/** Updates or creates a tooltip for a custom row element.
 * @param {string} hookName - Name of the hook to add the tooltip to
 * @param {string} content - Text content of the tooltip.
 * @param {any} params - (optional) Dictionary of any additional params you want to use to further customizee this tooltip.
 * - Supported params:
 * - tooltiptextAlign
 * */
function addTooltip(hookName, content, params = {}) {
	params.tooltiptext = content
	let el = d.getElementById(`ovv-row-${hookName}`)
	if (el === null) el = d.getElementById(`ovv-button-${hookName}`).parentElement;
	setElementTooltip(el, params)
}


// -------------------------------------------------------------------------------------
// Setup/Init functions
// -------------------------------------------------------------------------------------

/** Converts ns.args into an array-of-arrays that the main function can read. */
function parseArgs() {
	let args = ns.args
	// Make the empty array within which to store subarrays
	let parsedArray = []
	for (let arg of args) {
		// If an arg is an updType (starts with "!!"), make a new subarray and add it to parsedArray
		if (typeof arg == "string" && arg.substring(0,2) == "!!") parsedArray.push([arg]);
		// Otherwise add the arg to the most rercent subarray
		else {
			try { parsedArray[parsedArray.length-1].push(arg); }
			catch(err) {throw new Error("Invalid args passed into ns.run") }
		}
	}
	return parsedArray;
}


/** Initializes the hud for editing & handles changing default hud elements to fit your settings.*/
function initHud() {
	let hooknames = ["hp", "money", "str", "def", "dex", "agi", "cha", "int", "extra"];
	let progrhooks = ["str", "def", "dex", "agi", "cha", "int", "hack"];
	// Iterate over every default hud hook 
	for (let hook of hooknames) {
		let rowElement = d.getElementById(`ovv-row-${hook}`); 
		if (rowElement !== null) continue; // only proceed if the row-hook doesn't exist yet
		// Give every default hud element a row-level hook
		if (hook == "extra") { d.getElementById(`overview-extra-hook-0`).parentElement.parentElement.id = `ovv-row-extra` }
		else { d.getElementById(`overview-${hook}-hook`).parentElement.parentElement.id = `ovv-row-${hook}`}
		// Also give the progr bar a row-level hook, if it exists.
		if (progrhooks.includes(hook)) d.getElementById(`ovv-row-${hook}`).nextSibling.id = `ovv-row-${hook}-progr`;
	}
	// If the element of this id doesn't exist, then this is the first time InitHud has run, so run the following code.
	let hackRowEl = d.getElementById(`ovv-row-hack`);
	if (hackRowEl === null) { 
		// fix the broken hack hook in the default hud.
		d.getElementById("overview-hack-hook").parentElement.parentElement.previousSibling.previousSibling.id = "ovv-row-hack";
		let nodeToDel = d.getElementById("overview-hack-hook").parentElement.parentElement;
		d.getElementById("overview-hack-hook").parentElement.parentElement.parentElement.removeChild(nodeToDel);
		d.getElementById("ovv-row-hack").nextSibling.id = `ovv-row-hack-progr`;
		d.getElementById("ovv-row-hack").appendChild(createElement("td", { class: "jss11 css-7v1cxh" }))
		// Remove all separator lines from the default hud.
		d.getElementById("ovv-row-agi").childNodes.forEach((el) => el.className = el.className.replaceAll('jss12', 'jss11'));
		d.getElementById("ovv-row-int").childNodes.forEach((el) => el.className = el.className.replaceAll('jss12', 'jss11'));
		// Tidy up the game's messy css class names
		ovvTableCont.querySelectorAll("th").forEach((el) => el.className = el.className.replace("MuiTableCell-root MuiTableCell-body MuiTableCell-sizeMedium ", ""))
		ovvTableCont.querySelectorAll("td").forEach((el) => el.className = el.className.replace("MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium ", ""))
		ovvTableCont.querySelectorAll("p").forEach((el) => el.className = el.className.replace("MuiTypography-root MuiTypography-body1 ", ""))
		ovvTableCont.querySelectorAll("span").forEach((el) => el.className = el.className.replace("MuiLinearProgress-root MuiLinearProgress-colorPrimary MuiLinearProgress-determinate ", ""))
		ovvTableCont.querySelectorAll("span").forEach((el) => el.className = el.className.replace("MuiLinearProgress-bar MuiLinearProgress-barColorPrimary ", ""))
		// Add style to the default hud elements that will allow us to collapse them with dropdowns later
		for (let hook of hooknames) d.getElementById(`ovv-row-${hook}`).querySelectorAll("p").forEach((el) => el.style = `${textStyleParams}`);
	}
	// Implement hud settings
	if (squishWorkInfo) simplifyWorkInfoRows();

	// These settings are DISABLED, as they conflict with tooltips
	/* ovvTable.style.maxHeight = `${maxHudHeight}px`;
	ovvTable.style.transition = "all .2s";
	ovvTable.style.overflow = "scroll"; */
}


/** Creates or updates a custom css style used for our custom-made tooltips */
function makeToolTipStyle() {
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


/** Modifies the default "Working at ..." text, info, button, etc. at the bottom of the hud into a much more compact version. */
function simplifyWorkInfoRows() {
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
		el.querySelectorAll("p").forEach((elp) => {
			// If this text element is the FIRST bottom element, make text take up less horizontal space, align left, and add some top padding
			if (elp === bottomEls[0].querySelector("p")) elp.style = `padding: 3px 0 0; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; text-align: left`;
			// If not, make text take up less horizontal space, and align left
			else elp.style = `padding: 0 0; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; text-align: left`;
		})
		el.querySelectorAll("button").forEach((elbutton) => {
			elbutton.parentElement.setAttribute("colspan", 1);
			// make the Focus button occupy less space
			elbutton.style = `padding: 0 0; margin: 1px 0 0;`
			// If the previous sibling is null, we have yet to relocate the focus button
			if (elbutton.parentElement.previousSibling === null) {
				// Move Focus button to be just after the job details (rep/sec, % done, etc.)
				elbutton.parentElement.parentElement.previousSibling.appendChild(elbutton.parentElement)
				// Make job details only occupy 1 column.
				elbutton.parentElement.previousSibling.setAttribute("colspan", 1);
				// NOTE: Do not delete the residual row element where the button used to be. This crashes the game to recovery mode.
			}
		})
	}
}

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
}


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
			d.getElementById(`${el.id}-tooltip`).style.transform = "translate3d(0px, 25px, 0px) scale3d(0.95, 0.95, 0.95)";
			// Add event listeners for mouseout/mouseover to hide/show the tooltip.
			el.addEventListener('mouseover', (e) => {
				d.getElementById(`${el.id}-tooltip`).style.visibility = "visible";
				d.getElementById(`${el.id}-tooltip`).style.opacity = "1";
				d.getElementById(`${el.id}-tooltip`).style.transform = "translate3d(0px, 25px, 0px) scale3d(1, 1, 1)";
			});
			el.addEventListener('mouseout', (e) => {
				d.getElementById(`${el.id}-tooltip`).style.visibility = "hidden";
				d.getElementById(`${el.id}-tooltip`).style.opacity = "0";
				d.getElementById(`${el.id}-tooltip`).style.transform = "translate3d(0px, 25px, 0px) scale3d(0.95, 0.95, 0.95)";
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
function standardNotation(num, decimalplaces = 1) {
	let formattedNum = formatNumberShort(num, 6, decimalplaces);
	if (String(num).length <= formattedNum.length && (num % 1) == 0) return String(num);
	else return formattedNum;
}


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
}

}