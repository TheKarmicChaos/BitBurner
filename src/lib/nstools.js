import * as tb from "/lib/toolbox";
import Queue from "/lib/classes";
import { getNsDataThroughFile, runCommand, checkNsInstance } from "/lib/helpers";

/** Returns an array with the following 2 elements:
 * - 0: An array of every server in the game.
 * - 1: A dictionary with the key/values as serv/parentserv for all servs.
 * @param {import("../..").NS} NS
 * @param {boolean} includePservs - Default value: false
 * - Determines whether the result should include servers purchased by the player.
 * @param {boolean} includeHnodes - Default value: false
 * - Determines whether the result should include hacknet node servers.
 * */
export function ScanAll(ns, includePservs = false, includeHnodes = false) {
	checkNsInstance(ns, 'ScanAll');
	const pservs = [];
	const hservs = [];
	var servQueue = new Queue();
	let seenServs = ['home'];
	let servDict = { 'home': null };

	ScanServ('home'); //ns.print(servQueue)
	while (servQueue.isEmpty() == false) { ScanServ(servQueue.dequeue()) } // while the queue is not empty, scan the next serv in queue
	if (!includePservs) seenServs = tb.ArrSubtract(seenServs, pservs);
	if (!includeHnodes) seenServs = tb.ArrSubtract(seenServs, hservs);

	return [ seenServs, servDict ];

	// This subfunction scans the server 'node' for any new neighbors to add to the queue updating servQueue and seenServs as needed
	function ScanServ(node) {
		var neighbors = ns.scan(node); // scans the current node to get a list of neighbors
		if (!(neighbors[0] == null)) { // if list of neighbors is not empty
			for (let servername of neighbors) { // for each neighboring server
				if (!(seenServs.includes(servername))) { // if this neighbor is new (not already in seenServs)
					servQueue.enqueue(servername); // add the neighbor to the servQueue
					seenServs.push(servername); // add the neighbor to seenServs
					servDict[servername] = node; // store data on this neighbor to remember its parent node
					if (servername.split("-")[1] == "pserv") pservs.push(servername);
					if (servername.split("-")[0] == "hacknet") hservs.push(servername);
				}
			}
		}
	}
}

/** Runs a command remotely, so it doesn't eat up RAM.
 * @param {import("../..").NS} ns
 * @param {string} command - String of an actual function, with no args.
 * - Example: "ns.getServerMaxRam()"
 * @param {any[]} argList - Array of args to pass into the function.
 * @param {boolean} shouldreturn - Default value: true
 * - Bool for whether we can expect a return value from running the command.
 * - ALWAYS set to false if running a command that has no return value.
 * */
export async function RunCom(ns, command, argList, shouldreturn = true) {
	checkNsInstance(ns, 'RunCom');
	let basecommand = command.split("(")[0]

	let filePath = null //'/MiscTemp/' + basecommand.slice(3) + ".txt"

	var realcommand = basecommand + "("
	if (argList != null) {
		for (let x = 0; x < argList.length; ++x) {
			realcommand += "ns.args[" + x + "]"
			if (x != argList.length - 1) { realcommand += ", " }
		}
	}
	realcommand += ")"

	var returnVal = null;
	if (argList != null) {
		if (shouldreturn) { returnVal = await getNsDataThroughFile(ns, String(realcommand), filePath, argList) }
		else { await runCommand(ns, String(realcommand), filePath, argList) }
	} else {
		if (shouldreturn) { returnVal = await getNsDataThroughFile(ns, String(realcommand), filePath) }
		else { await runCommand(ns, String(realcommand), filePath) }
	}

	if (returnVal != null) { return returnVal; }
	//await runCommand(ns, String(realcommand), String(filePath), argList);
}

/** Returns the average gains per second for a specified stat from a specified crime.
 * @param {import("../..").NS} ns
 * @param {string} crime - Name of crime.
 * @param {string} stat - The name of the stat of which to calculate the avg gains per second.
 * - Possible values: "karma", "money", "kills", "hacking_exp", "strength_exp", "defense_exp", "dexterity_exp", "agility_exp",
 * "charisma_exp", "intelligence_exp"
 * @param {number} crimeChance - The chance of the given crime succeeding. Leave as default value to let the function calculate this for you.
 * - If using this function for sleeves, you must calculate this chance yourself and pass it into the function.
 * */
export async function GetCrimeGains(ns, crime, stat, crimeChance = -1) {
	checkNsInstance(ns, 'GetCrimeGains');
	if (crimeChance == -1) crimeChance = await RunCom(ns, 'ns.singularity.getCrimeChance()', [crime]);
	const crimeStats = await RunCom(ns, 'ns.singularity.getCrimeStats()', [crime])
	const time = Math.ceil(crimeStats.time / 1000);
	const chanceNP = 1 - crimeChance;

	let avgPerCrime = crimeChance * crimeStats[stat];
	if (stat != "karma" && stat != "money" && stat != "kills") {
		avgPerCrime += chanceNP * (crimeStats[stat] / 2)
		avgPerCrime /= 2;
	}
	return avgPerCrime / time;
}

/** Returns the chance of a given sleeve succeeding at committing a given crime.
 * @param {import("../..").NS} ns
 * @param {number} id - ID number of the sleeve committing the crime.
 * @param {string} crime - The name of the crime the sleeve would be committing.
 * - Possible values: "MUG", "HOMICIDE"
 * */
export async function GetSleeveCrimeChance(ns, id, crime) {
	checkNsInstance(ns, 'GetSleeveCrimeChance');
	const slstats = await RunCom(ns, 'ns.sleeve.getSleeveStats()', [id])
	let slchance = 0;
	switch (crime) {
		case "MUG":
			slchance =
				(slstats.strength * 1.5) +
				(slstats.defense * 0.5) +
				(slstats.dexterity * 1.5) +
				(slstats.agility * 0.5);
			slchance /= 0.2;
			break;
		case "HOMICIDE":
			slchance =
				(slstats.strength * 2) +
				(slstats.defense * 2) +
				(slstats.dexterity * 0.5) +
				(slstats.agility * 0.5);
			slchance /= 1;
			break;
	}
	slchance /= 975
	return slchance;
}

/** Returns the average gains per second for a specified stat for your job at a specified company.
 * @param {import("../..").NS} ns
 * @param {string} company - Name of company (must have a job here).
 * @param {string} stat - The name of the stat of which to calculate the avg gains per second.
 * - Possible values: "money", "hacking_exp", "strength_exp", "defense_exp", "dexterity_exp", "agility_exp",
 * "charisma_exp", "intelligence_exp"
 * - "rep" not yet supported.
 * @param {number} sleeveid - The numerical ID of the sleeve working this job.
 * - Leave as default value if the player is the one working.
 * */
export async function GetJobGains(ns, company, stat, sleeveid = -1) {
	checkNsInstance(ns, 'GetJobGains');
	const player = await RunCom(ns, "ns.getPlayer()");
	let skills; let mults;
	if (sleeveid == -1) {skills = player.skills; mults = player.mults }
	else {
		skills = await RunCom(ns, "ns.sleeve.getSleeveStats()", [sleeveid]);
		let sleeve = await RunCom(ns, "ns.sleeve.getInformation()", [sleeveid]);
		mults = sleeve.mult;
	}

	const companyPositionName = player.jobs[company];
	const companyPositionData = tb.GetBaseJobData(companyPositionName);
	const salaryMult = 1; const expMult = 1;

	// If player has SF-11, calculate salary multiplier from favor
	let favor = await RunCom(ns, "ns.singularity.getCompanyFavor()", [company])
	let favorMult = 1 + favor / 100;
	if (isNaN(favorMult)) {
	  favorMult = 1;
	}
	let hasSF11 = false
	for (let sf in PeekPort(ns, 1)["sourceFiles"]) { if (sf["n"] == 11 && sf["lvl"] > 0) hasSF11 = true; }
	let bn11Mult = 1;
	if (hasSF11) {
	  bn11Mult = favorMult;
	}

	/*
	let jobPerformance = companyPosition.calculateJobPerformance(
	  skills.hacking,
	  skills.strength,
	  skills.defense,
	  skills.dexterity,
	  skills.agility,
	  skills.charisma,
	);
	jobPerformance += skills.intelligence / 975;
	*/
	let jobPerformance = 0;

	let gainsPerSec = 0;
	switch (stat) {
		case "money":
			gainsPerSec = companyPositionData.baseSalary * salaryMult * mults.work_money * PeekPort(ns, 1)["mults"].CompanyWorkMoney * bn11Mult;
			break;
		case "rep":
			gainsPerSec = jobPerformance * mults.company_rep * favorMult;
			break;
		case "hacking_exp":
			let hackExpGain = companyPositionData.hackingExpGain || 0
			gainsPerSec = hackExpGain * expMult * mults.hacking_exp * PeekPort(ns, 1)["mults"].CompanyWorkExpGain;
			break;
		case "strength_exp":
			let strExpGain = companyPositionData.strengthExpGain || 0
			gainsPerSec = strExpGain * expMult * mults.strength_exp * PeekPort(ns, 1)["mults"].CompanyWorkExpGain;
			break;
		case "defense_exp":
			let defExpGain = companyPositionData.defenseExpGain || 0
			gainsPerSec = defExpGain * expMult * mults.defense_exp * PeekPort(ns, 1)["mults"].CompanyWorkExpGain;
			break;
		case "dexterity_exp":
			let dexExpGain = companyPositionData.dexterityExpGain || 0
			gainsPerSec = dexExpGain * expMult * mults.dexterity_exp * PeekPort(ns, 1)["mults"].CompanyWorkExpGain;
			break;
		case "agility_exp":
			let agiExpGain = companyPositionData.agilityExpGain || 0
			gainsPerSec = agiExpGain * expMult * mults.agility_exp * PeekPort(ns, 1)["mults"].CompanyWorkExpGain;
			break;
		case "charisma_exp":
			let chaExpGain = companyPositionData.charismaExpGain || 0
			gainsPerSec = chaExpGain * expMult * mults.charisma_exp * PeekPort(ns, 1)["mults"].CompanyWorkExpGain;
			break;
		case "intelligence_exp":
			gainsPerSec = 0;
			break;
	}
	return gainsPerSec;
};

/** Retrieves the global variable dictionary from global-vars.txt
 * @param {import("../..").NS} ns
 * */
export function getGlobals(ns) {
	checkNsInstance(ns, 'getGlobals');
	const fileData = ns.read('global-vars.txt');
    return JSON.parse(fileData); // Deserialize it back into an object/array and return
};

/** Updates global variables and writes them to global-vars.txt
 * @param {import("../..").NS} ns
 * @param {any[]} args - An array containing the update data.
 * - The array contains a list of strings for each key to update in the dict,
 * with each key immediately followed by the value for that key.
 * - Example: ["key1", 10, "category1.key2", true, "key17", "redpill"]
 * */
 export function updGlobals(ns, args) {
	checkNsInstance(ns, 'updGlobals');
	let curDict = getGlobals(ns);
	try {
		while (args.length > 0) {
			let nextKey = args.shift();
			let nextVal = args.shift();
			let depth = nextKey.split(".").length
			let reference = curDict;
			while (depth > 1) {
				reference = reference[nextKey.split(".")[0]];
				nextKey = nextKey.replace(`${nextKey.split(".")[0]}.`, "");
				depth = nextKey.split(".").length;
			}
			reference[nextKey] = nextVal;
		};
		ns.write('global-vars.txt', JSON.stringify(curDict), "w")
	} catch (err) { ns.toast("ERROR: updGlobals was passed invalid args array for the specified dataStruct.") };
};