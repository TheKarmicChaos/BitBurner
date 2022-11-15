import { formatNumberShort } from "/lib/helpers";

// -------------------------------------------------------------------------------------
// Formatting Functions
// -------------------------------------------------------------------------------------

/** Puts a duration of time into a standard "00:00:00" format
 * @param seconds - Duration of time (in seconds)
 * */
export function StandardTime(seconds: number): string {
	var secs; var secStr;
	var mins; var minStr;
	var hrs; var hrStr;
	if (seconds <= 0) {
		minStr = '00';
		secStr = '00';
	} else {
		mins = Math.floor(seconds / 60);
		secs = seconds - (mins * 60);
		hrs = Math.floor(mins / 60);
		mins = mins - (hrs * 60);
		if (Math.floor(hrs) <= 0) {
			hrStr = null;
		} else if (hrs > 0) {
			hrStr = hrs + ":";
		}

		if (mins == 0) {
			minStr = '00';
		} else if (mins < 10) {
			minStr = '0' + mins;
		} else {
			minStr = mins;
		}

		if (secs == 0) {
			secStr = '00';
		} else if (secs < 10) {
			secStr = '0' + secs;
		} else {
			secStr = secs;
		}
	}
	let timeStr = '';
	if (hrStr != null){ timeStr += hrStr }
	timeStr += minStr + ":" + secStr
	return timeStr
};

/** Puts any large number into a standard notation "000.000a" string 
 * @param num - Number to convert to standard notation
 * @param decimalplaces - Number of decimal places to round to.
 * */
export function StandardNotation(num: number, decimalplaces: number = 1): string {
	let formattedNum = formatNumberShort(num, 6, decimalplaces);
	
	if (String(num).length <= formattedNum.length && (num % 1) == 0) {
		return String(num);
	} else { return formattedNum; }
};

// -------------------------------------------------------------------------------------
// Dictionary functions
// -------------------------------------------------------------------------------------

/** Sums all number values in a string:number pair dictionary.
 * @param dict - Dictionary of string:number pairs
 * */
 export function SumDict(dict: Record<string, number>) {
	let total = 0;
	for (let entry in dict) { total += dict[entry]; };
	return total;
};

// -------------------------------------------------------------------------------------
// Array functions
// -------------------------------------------------------------------------------------

/** Returns a mathematical "intersection" of two arrays.
 * @param array1
 * @param array2
 * */
export function ArrIntersect(array1: any[], array2: any[]) {
	const filteredArray = array1.filter(value => array2.includes(value));
	return filteredArray;
};

/** Returns a mathematical "subtraction" of two arrays (array1 ~ array2).
 * @param array1
 * @param array2
 * @param duplicates - Default value: 0
 * - If set to 0, if an element is in array2, this function eliminates all instances of that element from array1.
 * - If set to > 0, if an element is in array2, this function will only subtract up to this many instances of that element from array1.
 * - If set to < 0, if an element is in array2, this function will only allow up to (absolute value) this many instances of that element to be kept in array1.
 * */
export function ArrSubtract(array1: any[], array2: any[], duplicates: number = 0): any[] {
	duplicates = Math.floor(duplicates);
	if (duplicates == 0) {
		const filteredArray = array1.filter(value => !array2.includes(value));
		return filteredArray;
	} else {
		let dupeDict: any = {};
		const filteredArray = [];
		for (let b of array2) { dupeDict[b] = Math.abs(duplicates) };
		for (let a of array1) {
			if (duplicates > 0) {
				if (dupeDict[a] == null || dupeDict[a] == 0) { filteredArray.push(a) }
				else if (dupeDict[a] > 0) { dupeDict[a] -= 1 }
			} else if (duplicates < 0) {
				if (dupeDict[a] == null) { filteredArray.push(a) }
				else if (dupeDict[a] > 0) { filteredArray.push(a); dupeDict[a] -= 1 }
			}
		}
		return filteredArray;
	}
};

/** Perfectly removes an element from an array via splicing.
 * @param element
 * @param array
 * */
export function DelFromArray(element: any, array: any[]) {
	var eleIndex = -1;
	for (var i = 0; i < array.length; i++) {
		if (array[i] == element) {
			eleIndex = i;
		}
	}
	if (eleIndex > -1) { // only splice array when item is found
		array.splice(eleIndex, 1); // 2nd parameter means remove one item only
	}
};

/** Returns the highest-value element from an array of numbers.
 * @param numArray
 * */
export function GetMaxOfArray(numArray: number[]): number {
	return Math.max.apply(null, numArray);
};

/** Returns the lowest-value element from an array of numbers.
 * @param numArray
 * */
export function GetMinOfArray(numArray: number[]): number {
	return Math.min.apply(null, numArray);
};

// -------------------------------------------------------------------------------------
// Decorative Functions
// -------------------------------------------------------------------------------------

/** Creates a string of specified length w/ text floating to the left & right.
 * @param spaces - Length (character count) of the space for the floating-text-string to occupy.
 * @param textL - Text to float on the left side of the give space.
 * - If passed "null", will style textR to float without any text on the left.
 * @param separator - A single decorative character to fill the empty space between textL and textR.
 * - If passed "null", will default to "·"
 * @param textR - Text to float on the right side of the give space.
 * - If passed "null", will style textL to float without any text on the right.
 * */
export function TextFloat(spaces: number, textL: string | null, separator: string | null, textR: string | null): string {
	if (textL == null) { textL = "·" } else if (typeof textL !== 'string') { textL = String(textL) }
	if (textR == null) { textR = "·" } else if (typeof textR !== 'string') { textR = String(textR) }
	if (separator == null) { separator = "·" }
	let lenL = textL.length;
	let lenR = textR.length;

	var returnStr = textL;
	var charsToPlace = 0;
	if (spaces <= (lenL + lenR + 1)) { return (textL + " " + textR); }
	else if (spaces == (lenL + lenR + 2) && textR == separator) { return (textL + " " + separator + textR); }
	else if (spaces == (lenL + lenR + 2) && textL == separator) { return (textL + separator + " " + textR); }
	else if (spaces == (lenL + lenR + 2)) { return (textL + separator + separator + textR); }
	else { charsToPlace = (spaces - 2) - (lenL + lenR); }


	if (textL == separator) { returnStr += separator; }
	else { returnStr += " "; }

	for (let x = charsToPlace; x > 0; --x) { returnStr += separator; }
	
	if (textR == separator) { returnStr += separator + separator; }
	else { returnStr += " " + textR; }

	return returnStr;
};

/** Creates an ASCII loading bar 
 * @param length - Length (character count) of the space for the loading bar to occupy.
 * @param percent - Fraction (between 0 and 1) representing the progress of the loading bar.
 * */
export function MakeLoadingBar(length: number, percent: number): string {
	const bar = [];
	if (length == 0) {
		bar.push('!!! Error - No Length !!!')
	} else if (percent == 0) {
		for (var i = 1; i <= length; ++i) {
			bar.push('▒');
		}
	} else {
		let fullBlocks = Math.floor(percent * length);
		for (var i = 1; i <= fullBlocks; ++i) {
			bar.push('█');
		}
		for (var i = (fullBlocks + 1); i <= length; ++i) {
			bar.push('▒');
		}
	}
	return bar.join("");
};

/** Returns a string that, when printed, prints every element of an object, as well as each element of those elements, etc. recursively.
 * @param obj - The object/array or primitive containing the information to recursively print.
 * @param maxDepth - Maximum layers of depth to print.
 * - Default value: 3
 * @param curDepth - ALWAYS LEAVE THIS ARG BLANK. Used to track recursive depth.
 * - Default value: 0
 * */
export function RecursivePrint(obj: unknown, maxDepth: number = 3, curDepth: number = 0): string {
	// return obj as string immediately if we are at max depth or obj is null / non-object type.
	if (curDepth >= maxDepth || obj == null || typeof obj !== "object") return `${obj}`;

	let printMsg = ``
	if (Array.isArray(obj)) { // If obj is an array, iterate through array...
		if (curDepth > 0) printMsg += ` []`;
		for (let n = 0; n < obj.length; n++) printMsg += `\n${"   ".repeat(curDepth)}${RecursivePrint(obj[n], maxDepth, curDepth + 1)}`;
	} else { // If obj is not an array, it is an object with key/vals, so iterate though [k,v] map...
		if (curDepth > 0) printMsg += ` {}`;
		printMsg += Object.entries(obj).map(([k,v]) => `\n${"   ".repeat(curDepth)}"${k}": ${RecursivePrint(v, maxDepth, curDepth + 1)}`).join("");
	}
	return printMsg; // if recursion completes, return print msg.
};

// -------------------------------------------------------------------------------------
// Get Constants Functions
// -------------------------------------------------------------------------------------

/** Returns an object detailing the base values for a given job position
 * @param position - Title of the job position.
 * */
export function GetBaseJobData(position: string) {
	let data;
	switch (position) {
		case "Software Engineering Intern":
			data = {
				nextPosition: "Junior Software Engineer",
				baseSalary: 33,
				charismaEffectiveness: 15,
				charismaExpGain: 0.02,
				hackingEffectiveness: 85,
				hackingExpGain: 0.05,
				reqdHacking: 1,
				repMultiplier: 0.9,
			}; break;
		case "Junior Software Engineer":
			data = {
				nextPosition: "Senior Software Engineer",
				baseSalary: 80,
				charismaEffectiveness: 15,
				charismaExpGain: 0.05,
				hackingEffectiveness: 85,
				hackingExpGain: 0.1,
				reqdHacking: 51,
				reqdReputation: 8e3,
				repMultiplier: 1.1,
			}; break;
		case "Senior Software Engineer":
			data = {
				nextPosition: "Lead Software Developer",
				baseSalary: 165,
				charismaEffectiveness: 20,
				charismaExpGain: 0.08,
				hackingEffectiveness: 80,
				hackingExpGain: 0.4,
				reqdCharisma: 51,
				reqdHacking: 251,
				reqdReputation: 40e3,
				repMultiplier: 1.3,
			}; break;
		case "Lead Software Developer":
			data = {
				nextPosition: 'Head of Software',
				baseSalary: 500,
				charismaEffectiveness: 25,
				charismaExpGain: 0.1,
				hackingEffectiveness: 75,
				hackingExpGain: 0.8,
				reqdCharisma: 151,
				reqdHacking: 401,
				reqdReputation: 200e3,
				repMultiplier: 1.5,
			}; break;
		case "Head of Software":
			data = {
				nextPosition: 'Head of Engineering',
				baseSalary: 800,
				charismaEffectiveness: 25,
				charismaExpGain: 0.5,
				hackingEffectiveness: 75,
				hackingExpGain: 1,
				reqdCharisma: 251,
				reqdHacking: 501,
				reqdReputation: 400e3,
				repMultiplier: 1.6,
			}; break;
		case "Head of Engineering":
			data = {
				nextPosition: 'Vice President of Technology',
				baseSalary: 1650,
				charismaEffectiveness: 25,
				charismaExpGain: 0.5,
				hackingEffectiveness: 75,
				hackingExpGain: 1.1,
				reqdCharisma: 251,
				reqdHacking: 501,
				reqdReputation: 800e3,
				repMultiplier: 1.6,
			}; break;
		case "Vice President of Technology":
			data = {
				nextPosition: 'Chief Technology Officer',
				baseSalary: 2310,
				charismaEffectiveness: 30,
				charismaExpGain: 0.6,
				hackingEffectiveness: 70,
				hackingExpGain: 1.2,
				reqdCharisma: 401,
				reqdHacking: 601,
				reqdReputation: 1.6e6,
				repMultiplier: 1.75,
			}; break;
		case "Chief Technology Officer":
			data = {
				nextPosition: null,
				baseSalary: 2640,
				charismaEffectiveness: 35,
				charismaExpGain: 1,
				hackingEffectiveness: 65,
				hackingExpGain: 1.5,
				reqdCharisma: 501,
				reqdHacking: 751,
				reqdReputation: 3.2e6,
				repMultiplier: 2,
			}; break;
		case "IT Intern":
			data = {
				nextPosition: 'IT Analyst',
				baseSalary: 26,
				charismaEffectiveness: 10,
				charismaExpGain: 0.01,
				hackingEffectiveness: 90,
				hackingExpGain: 0.04,
				reqdHacking: 1,
				repMultiplier: 0.9,
			}; break;
		case "IT Analyst":
			data = {
				nextPosition: 'IT Manager',
				baseSalary: 66,
				charismaEffectiveness: 15,
				charismaExpGain: 0.02,
				hackingEffectiveness: 85,
				hackingExpGain: 0.08,
				reqdHacking: 26,
				reqdReputation: 7e3,
				repMultiplier: 1.1,
			}
		case "IT Manager":
			data = {
				nextPosition: 'Systems Administrator',
				baseSalary: 132,
				charismaEffectiveness: 20,
				charismaExpGain: 0.1,
				hackingEffectiveness: 80,
				hackingExpGain: 0.3,
				reqdCharisma: 51,
				reqdHacking: 151,
				reqdReputation: 35e3,
				repMultiplier: 1.3,
			}; break;
		case "Systems Administrator":
			data = {
				nextPosition: 'Head of Engineering',
				baseSalary: 410,
				charismaEffectiveness: 20,
				charismaExpGain: 0.2,
				hackingEffectiveness: 80,
				hackingExpGain: 0.5,
				reqdCharisma: 76,
				reqdHacking: 251,
				reqdReputation: 175e3,
				repMultiplier: 1.4,
			}; break;
		case "Security Engineer":
			data = {
				nextPosition: 'Head of Engineering',
				baseSalary: 121,
				charismaEffectiveness: 15,
				charismaExpGain: 0.05,
				hackingEffectiveness: 85,
				hackingExpGain: 0.4,
				reqdCharisma: 26,
				reqdHacking: 151,
				reqdReputation: 35e3,
				repMultiplier: 1.2,
			}; break;
		case "Network Engineer":
			data = {
				nextPosition: "Network Administrator",
				baseSalary: 121,
				charismaEffectiveness: 15,
				charismaExpGain: 0.05,
				hackingEffectiveness: 85,
				hackingExpGain: 0.4,
				reqdCharisma: 26,
				reqdHacking: 151,
				reqdReputation: 35e3,
				repMultiplier: 1.2,
			}; break;
		case "Network Administrator":
			data = {
				nextPosition: "Head of Engineering",
				baseSalary: 410,
				charismaEffectiveness: 20,
				charismaExpGain: 0.1,
				hackingEffectiveness: 80,
				hackingExpGain: 0.5,
				reqdCharisma: 76,
				reqdHacking: 251,
				reqdReputation: 175e3,
				repMultiplier: 1.3,
			}; break;
		case "Business Intern":
			data = {
				nextPosition: "Business Analyst",
				baseSalary: 46,
				charismaEffectiveness: 90,
				charismaExpGain: 0.08,
				hackingEffectiveness: 10,
				hackingExpGain: 0.01,
				reqdCharisma: 1,
				reqdHacking: 1,
				repMultiplier: 0.9,
			}; break;
		case "Business Analyst":
			data = {
				nextPosition: 'Business Manager',
				baseSalary: 100,
				charismaEffectiveness: 85,
				charismaExpGain: 0.15,
				hackingEffectiveness: 15,
				hackingExpGain: 0.02,
				reqdCharisma: 51,
				reqdHacking: 6,
				reqdReputation: 8e3,
				repMultiplier: 1.1,
			}; break;
		case "Business Manager":
			data = {
				nextPosition: 'Operations Manager',
				baseSalary: 200,
				charismaEffectiveness: 85,
				charismaExpGain: 0.3,
				hackingEffectiveness: 15,
				hackingExpGain: 0.02,
				reqdCharisma: 101,
				reqdHacking: 51,
				reqdReputation: 40e3,
				repMultiplier: 1.3,
			}; break;
		case "Operations Manager":
			data = {
				nextPosition: 'Chief Financial Officer',
				baseSalary: 660,
				charismaEffectiveness: 85,
				charismaExpGain: 0.4,
				hackingEffectiveness: 15,
				hackingExpGain: 0.02,
				reqdCharisma: 226,
				reqdHacking: 51,
				reqdReputation: 200e3,
				repMultiplier: 1.5,
			}; break;
		case "Chief Financial Officer":
			data = {
				nextPosition: 'Chief Executive Officer',
				baseSalary: 1950,
				charismaEffectiveness: 90,
				charismaExpGain: 1,
				hackingEffectiveness: 10,
				hackingExpGain: 0.05,
				reqdCharisma: 501,
				reqdHacking: 76,
				reqdReputation: 800e3,
				repMultiplier: 1.6,
			}; break;
		case 'Chief Executive Officer':
			data = {
				nextPosition: null,
				baseSalary: 3900,
				charismaEffectiveness: 90,
				charismaExpGain: 1.5,
				hackingEffectiveness: 10,
				hackingExpGain: 0.05,
				reqdCharisma: 751,
				reqdHacking: 101,
				reqdReputation: 3.2e6,
				repMultiplier: 1.75,
			}; break;
		case "Police Officer":
			data = {
				nextPosition: 'Police Chief',
				baseSalary: 82,
				hackingEffectiveness: 5,
				strengthEffectiveness: 20,
				defenseEffectiveness: 20,
				dexterityEffectiveness: 20,
				agilityEffectiveness: 20,
				charismaEffectiveness: 15,
				hackingExpGain: 0.02,
				strengthExpGain: 0.08,
				defenseExpGain: 0.08,
				dexterityExpGain: 0.08,
				agilityExpGain: 0.08,
				charismaExpGain: 0.04,
				reqdHacking: 11,
				reqdStrength: 101,
				reqdDefense: 101,
				reqdDexterity: 101,
				reqdAgility: 101,
				reqdCharisma: 51,
				reqdReputation: 8e3,
				repMultiplier: 1,
			}; break;
		case 'Police Chief':
			data = {
				nextPosition: null,
				baseSalary: 460,
				hackingEffectiveness: 5,
				strengthEffectiveness: 20,
				defenseEffectiveness: 20,
				dexterityEffectiveness: 20,
				agilityEffectiveness: 20,
				charismaEffectiveness: 15,
				hackingExpGain: 0.02,
				strengthExpGain: 0.1,
				defenseExpGain: 0.1,
				dexterityExpGain: 0.1,
				agilityExpGain: 0.1,
				charismaExpGain: 0.1,
				reqdHacking: 101,
				reqdStrength: 301,
				reqdDefense: 301,
				reqdDexterity: 301,
				reqdAgility: 301,
				reqdCharisma: 151,
				reqdReputation: 36e3,
				repMultiplier: 1.25,
			}; break;
		case "Security Guard":
			data = {
				nextPosition: 'Security Officer',
				baseSalary: 50,
				hackingEffectiveness: 5,
				strengthEffectiveness: 20,
				defenseEffectiveness: 20,
				dexterityEffectiveness: 20,
				agilityEffectiveness: 20,
				charismaEffectiveness: 15,
				hackingExpGain: 0.01,
				strengthExpGain: 0.04,
				defenseExpGain: 0.04,
				dexterityExpGain: 0.04,
				agilityExpGain: 0.04,
				charismaExpGain: 0.02,
				reqdStrength: 51,
				reqdDefense: 51,
				reqdDexterity: 51,
				reqdAgility: 51,
				reqdCharisma: 1,
				repMultiplier: 1,
			}; break;
		case "Security Officer":
			data = {
				nextPosition: 'Security Supervisor',
				baseSalary: 195,
				hackingEffectiveness: 10,
				strengthEffectiveness: 20,
				defenseEffectiveness: 20,
				dexterityEffectiveness: 20,
				agilityEffectiveness: 20,
				charismaEffectiveness: 10,
				hackingExpGain: 0.02,
				strengthExpGain: 0.1,
				defenseExpGain: 0.1,
				dexterityExpGain: 0.1,
				agilityExpGain: 0.1,
				charismaExpGain: 0.05,
				reqdHacking: 26,
				reqdStrength: 151,
				reqdDefense: 151,
				reqdDexterity: 151,
				reqdAgility: 151,
				reqdCharisma: 51,
				reqdReputation: 8e3,
				repMultiplier: 1.1,
			}; break;
		case "Security Supervisor":
			data = {
				nextPosition: 'Head of Security',
				baseSalary: 660,
				hackingEffectiveness: 10,
				strengthEffectiveness: 15,
				defenseEffectiveness: 15,
				dexterityEffectiveness: 15,
				agilityEffectiveness: 15,
				charismaEffectiveness: 30,
				hackingExpGain: 0.02,
				strengthExpGain: 0.12,
				defenseExpGain: 0.12,
				dexterityExpGain: 0.12,
				agilityExpGain: 0.12,
				charismaExpGain: 0.1,
				reqdHacking: 26,
				reqdStrength: 251,
				reqdDefense: 251,
				reqdDexterity: 251,
				reqdAgility: 251,
				reqdCharisma: 101,
				reqdReputation: 36e3,
				repMultiplier: 1.25,
			}; break;
		case 'Head of Security':
			data = {
				nextPosition: null,
				baseSalary: 1320,
				hackingEffectiveness: 10,
				strengthEffectiveness: 15,
				defenseEffectiveness: 15,
				dexterityEffectiveness: 15,
				agilityEffectiveness: 15,
				charismaEffectiveness: 30,
				hackingExpGain: 0.05,
				strengthExpGain: 0.15,
				defenseExpGain: 0.15,
				dexterityExpGain: 0.15,
				agilityExpGain: 0.15,
				charismaExpGain: 0.15,
				reqdHacking: 51,
				reqdStrength: 501,
				reqdDefense: 501,
				reqdDexterity: 501,
				reqdAgility: 501,
				reqdCharisma: 151,
				reqdReputation: 144e3,
				repMultiplier: 1.4,
			}; break;
		case "Field Agent":
			data = {
				nextPosition: 'Secret Agent',
				baseSalary: 330,
				hackingEffectiveness: 10,
				strengthEffectiveness: 15,
				defenseEffectiveness: 15,
				dexterityEffectiveness: 20,
				agilityEffectiveness: 20,
				charismaEffectiveness: 20,
				hackingExpGain: 0.04,
				strengthExpGain: 0.08,
				defenseExpGain: 0.08,
				dexterityExpGain: 0.08,
				agilityExpGain: 0.08,
				charismaExpGain: 0.05,
				reqdHacking: 101,
				reqdStrength: 101,
				reqdDefense: 101,
				reqdDexterity: 101,
				reqdAgility: 101,
				reqdCharisma: 101,
				reqdReputation: 8e3,
				repMultiplier: 1,
			}; break;
		case "Secret Agent":
			data = {
				nextPosition: 'Special Operative',
				baseSalary: 990,
				hackingEffectiveness: 15,
				strengthEffectiveness: 15,
				defenseEffectiveness: 15,
				dexterityEffectiveness: 20,
				agilityEffectiveness: 20,
				charismaEffectiveness: 15,
				hackingExpGain: 0.1,
				strengthExpGain: 0.15,
				defenseExpGain: 0.15,
				dexterityExpGain: 0.15,
				agilityExpGain: 0.15,
				charismaExpGain: 0.1,
				reqdHacking: 201,
				reqdStrength: 251,
				reqdDefense: 251,
				reqdDexterity: 251,
				reqdAgility: 251,
				reqdCharisma: 201,
				reqdReputation: 32e3,
				repMultiplier: 1.25,
			}; break;
		case "Special Operative":
			data = {
				nextPosition: null,
				baseSalary: 2000,
				hackingEffectiveness: 15,
				strengthEffectiveness: 15,
				defenseEffectiveness: 15,
				dexterityEffectiveness: 20,
				agilityEffectiveness: 20,
				charismaEffectiveness: 15,
				hackingExpGain: 0.15,
				strengthExpGain: 0.2,
				defenseExpGain: 0.2,
				dexterityExpGain: 0.2,
				agilityExpGain: 0.2,
				charismaExpGain: 0.15,
				reqdHacking: 251,
				reqdStrength: 501,
				reqdDefense: 501,
				reqdDexterity: 501,
				reqdAgility: 501,
				reqdCharisma: 251,
				reqdReputation: 162e3,
				repMultiplier: 1.5,
			}; break;
		case "Waiter":
			data = {
				nextPosition: null,
				baseSalary: 22,
				strengthEffectiveness: 10,
				dexterityEffectiveness: 10,
				agilityEffectiveness: 10,
				charismaEffectiveness: 70,
				strengthExpGain: 0.02,
				defenseExpGain: 0.02,
				dexterityExpGain: 0.02,
				agilityExpGain: 0.02,
				charismaExpGain: 0.05,
				repMultiplier: 1,
			}; break;
		case "Employee":
			data = {
				nextPosition: null,
				baseSalary: 22,
				strengthEffectiveness: 10,
				dexterityEffectiveness: 10,
				agilityEffectiveness: 10,
				charismaEffectiveness: 70,
				strengthExpGain: 0.02,
				defenseExpGain: 0.02,
				dexterityExpGain: 0.02,
				agilityExpGain: 0.02,
				charismaExpGain: 0.04,
				repMultiplier: 1,
			}; break;
		case "Software Consultant":
			data = {
				nextPosition: 'Senior Software Consultant',
				baseSalary: 66,
				hackingEffectiveness: 80,
				charismaEffectiveness: 20,
				hackingExpGain: 0.08,
				charismaExpGain: 0.03,
				reqdHacking: 51,
				repMultiplier: 1,
			}; break;
		case "Senior Software Consultant":
			data = {
				nextPosition: null,
				baseSalary: 132,
				hackingEffectiveness: 75,
				charismaEffectiveness: 25,
				hackingExpGain: 0.25,
				charismaExpGain: 0.06,
				reqdHacking: 251,
				reqdCharisma: 51,
				repMultiplier: 1.2,
			}; break;
		case "Business Consultant":
			data = {
				nextPosition: 'Senior Business Consultant',
				baseSalary: 66,
				hackingEffectiveness: 20,
				charismaEffectiveness: 80,
				hackingExpGain: 0.015,
				charismaExpGain: 0.15,
				reqdHacking: 6,
				reqdCharisma: 51,
				repMultiplier: 1,
			}; break;
		case "Senior Business Consultant":
			data = {
				nextPosition: null,
				baseSalary: 525,
				hackingEffectiveness: 15,
				charismaEffectiveness: 85,
				hackingExpGain: 0.015,
				charismaExpGain: 0.3,
				reqdHacking: 51,
				reqdCharisma: 226,
				repMultiplier: 1.2,
			}; break;
		case "Part-time waiter":
			data = {
				nextPosition: null,
				baseSalary: 20,
				strengthEffectiveness: 10,
				dexterityEffectiveness: 10,
				agilityEffectiveness: 10,
				charismaEffectiveness: 70,
				strengthExpGain: 0.0075,
				defenseExpGain: 0.0075,
				dexterityExpGain: 0.0075,
				agilityExpGain: 0.0075,
				charismaExpGain: 0.04,
				repMultiplier: 1,
			}; break;
		case "Part-time employee":
			data = {
				nextPosition: null,
				baseSalary: 20,
				strengthEffectiveness: 10,
				dexterityEffectiveness: 10,
				agilityEffectiveness: 10,
				charismaEffectiveness: 70,
				strengthExpGain: 0.0075,
				defenseExpGain: 0.0075,
				dexterityExpGain: 0.0075,
				agilityExpGain: 0.0075,
				charismaExpGain: 0.03,
				repMultiplier: 1,
			}; break;
		default:
			data = {};
			break;
	};
	return data;
};