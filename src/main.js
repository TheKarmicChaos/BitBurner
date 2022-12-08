import * as nstb from "./lib/nstools";
import * as tb from "./lib/toolbox";

/** This main script determines what type of run this is, what strategies are valid in this BN, etc. and runs their related automation files accordingly.
 * - NOTE: main.js, and by extention my entire script setup, cannot run without SF 4x3 (for singularity functions) and SF 5x1 (for getBitNodeMultipliers).
 * @param {import("../").NS} ns */
export async function main(ns) {
	ns.closeTail(); await ns.sleep(1); ns.tail('main.js'); await ns.sleep(1); ns.resizeTail(340, 600); await ns.sleep(1); ns.moveTail(1560, 120);
	ns.disableLog("ALL"); ns.clearLog();

	// Kill all core scripts & liquidate stocks
	ns.killall('home');
	try {
		ns.killall('hacknet-node-0');
		ns.exec('lp_stockmaster.js', 'hacknet-node-0', 1, '-l');
 	} catch (err) { }

	// Settings - Customize what can be used this run (For challenges or un-owned SFs)
	// ============================================================
	const allowBHome = true;	// Can automate buying RAM/core upgrades for home computer
	const allowB4s = true;		// Can automate buying 4s Data API

	const allowGang = true;		// Can automate gangs (requires SF 2x1)
	const allowCorp = true;		// Can automate corps (requires SF 3x3)
	const allowBB = true;		// Can automate bladeburner (requires SF 7x1)
	const allowHacknet = true;	// Can automate hacknet (requires SF 9x1)
	const allowSleeves = true;	// Can automate sleeves (requires SF 10x1)
	const allowGraft = true;	// Can automate grafting (requires SF 10x1)
	const allowStanek = false;	// Can automate stanek (requires SF 13x1)


	// Initialize Variables
	// ============================================================
	let player = await nstb.RunCom(ns, 'ns.getPlayer()');
	var bitNode = player["bitNodeN"];
	let sourceFiles = await nstb.RunCom(ns, 'ns.singularity.getOwnedSourceFiles()');
	let bndata = await nstb.RunCom(ns, 'ns.getBitNodeMultipliers()');
	let PREV_VARS = nstb.getGlobals(ns);
	let GLOBAL_VARS;

	let numnodes;
	if (allowHacknet) numnodes = await nstb.RunCom(ns, 'ns.hacknet.numNodes()');
	let inGang;
	if (allowGang) inGang = await nstb.RunCom(ns, "ns.gang.inGang()")

	let scriptsToRun = [];
	let scriptsRunning = [];
	let hnscriptsToRun = [];
	let hnscriptsRunning = [];
	let maxRamForScripts;
	let coreScriptsSize;
	let hnscriptsSize = 0;

	// Determine the name of the bitnode
	let bName;
	switch (bitNode) {
		case 1:
			bName = "Source Genesis"; break;
		case 2:
			bName = "Rise of the Underworld"; break;
		case 3:
			bName = "Corporatocracy"; break;
		case 4:
			bName = "The Singularity"; break;
		case 5:
			bName = "Artificial Intelligence"; break;
		case 6:
			bName = "Bladeburners"; break;
		case 7:
			bName = "Bladeburners 2079"; break;
		case 8:
			bName = "Ghost of Wall Street"; break;
		case 9:
			bName = "Hacktocracy"; break;
		case 10:
			bName = "Digital Carbon"; break;
		case 11:
			bName = "The Big Crash"; break;
		case 12:
			bName = "The Recursion"; break;
		case 13:
			bName = "They're lunatics"; break;
	}

	// Initialize Global Vars
	// ============================================================

	let globalDict = {
		bnMults: {},
		hackMult: 0,
		sourceFiles: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0},
		bitNode: 0,
		loop: 0,
		runType: "",
		want4s: true,
		income: { base: 0, hacknet: 0, gang: 0, corp: 0, playerCrime: 0, sleeveCrime: 0, playerWork: 0, sleeveWork: 0, hacking: 0, bladeburner: 0 },
		hash: { count: 0, income: 0, max: 1 },
		sleeve: { shock: 100 },
		gang: { want: false, has: false, territory: 0, respect: 0},
		corp: { want: false, has: false, hasProd: false, hasLab: false, hasTAII: false, research: 0, funds: 0, profit: 0, products: [] },
		bb: { want: false, has: false, hasSimu: false, city: "Sector-12", doneOps: ["failsafe"], isComplete: false },
		stanek: { want: false, has: false, height: 0, width: 0, numfragments: 0 },
		backdoors: ["home"]
	}
	
	globalDict.bnMults = bndata;
	globalDict.bitNode = bitNode;

	// Preserve loop counter if we didn't just switch bitnodes.
	if (PREV_VARS && (PREV_VARS["bitNode"] === undefined || PREV_VARS["bitNode"] == bitNode)) globalDict.loop = PREV_VARS["loop"];

	// Parse sourceFiles into a dictionary
	for (let obj of sourceFiles) {
		let n = Number(obj["n"])
		let lvl = Number(obj["lvl"])
		globalDict.sourceFiles[n] = lvl
	}

	// Set hackMult
	if (bndata.HackingLevelMultiplier > 0
		&& bndata.HackExpGain > 0
		&& bndata.ServerGrowthRate > 0
		&& bndata.ServerMaxMoney > 0
		&& bndata.ServerStartingMoney > 0
		&& bndata.ServerWeakenRate > 0
		&& bndata.ScriptHackMoney > 0
		&& bndata.ScriptHackMoneyGain > 0) {
		globalDict.hackMult = bndata.ServerGrowthRate * bndata.ServerMaxMoney * bndata.ServerWeakenRate * bndata.ScriptHackMoneyGain;
	}

	// Set Corp "want" & "has"
	if (allowCorp && bndata.CorporationValuation * bndata.CorporationSoftcap > 0) {
		if (player.hasCorporation) globalDict.corp.has = true;
		else if (bndata.CorporationValuation >= 0.35) globalDict.corp.want = true;
	}

	// Set Gang "want" & "has"
	if (allowGang && bndata.GangSoftcap * bndata.GangUniqueAugs > 0) {
		if (inGang) globalDict.gang.has = true;
		else globalDict.gang.want = true;
	}

	// Set Stanek "want", "has", "height", & "width"
	let baseSize = 9 + bndata.StaneksGiftExtraSize + globalDict.sourceFiles["13"]
	globalDict.stanek.height = Math.max(3, Math.min(Math.floor(baseSize / 2 + 0.6), 25));
	globalDict.stanek.width = Math.max(2, Math.min(Math.floor(baseSize / 2 + 1), 25));
	if (allowStanek && globalDict.stanek.height >= 5) {
		let installedAugs = await nstb.RunCom(ns, 'ns.singularity.getOwnedAugmentations()')
		if (installedAugs.includes("Stanek's Gift")) globalDict.stanek.has = true;
		else globalDict.stanek.want = true;
	}

	// Set "want4s"
	if (!allowB4s
		|| bndata.FourSigmaMarketDataApiCost > 4
		|| bndata.FourSigmaMarketDataCost > 5
		|| ns.stock.has4SDataTIXAPI()) {
		globalDict.want4s = false;
	}

	// Figure out which runType works best for this BN
	let runType = "redpill";
	if (allowBB && (bitNode == 6 || bitNode == 7 || bndata.DaedalusAugsRequirement > 60)) {
		runType = "bladeburner";
		globalDict.bb.want = true;
	}
	globalDict.runType = runType;

	// Write global vars to file.
	ns.write("global-vars.txt", JSON.stringify(globalDict), "w")


	// ===========================================================================================================
	// MAIN WHILE LOOP
	// ===========================================================================================================

	while (true) {
		// update player
		player = await nstb.RunCom(ns, 'ns.getPlayer()')
		if (allowHacknet) numnodes = await nstb.RunCom(ns, 'ns.hacknet.numNodes()')
		GLOBAL_VARS = nstb.getGlobals(ns);
		// clear any leftover banked strats
		scriptsToRun = [];
		scriptsRunning = [];
		hnscriptsToRun = [];
		hnscriptsRunning = [];

		// coreCoef is the % of home RAM we reserve to use for scripts run by main.js.
		// The leftover RAM is the amount of space we are allowed to use when running smart-hack.js on home.
		let coreCoef;
		if (ns.getServerMaxRam('home') <= 2048) { coreCoef = 1 }
		else { coreCoef = 0.5 }
		let maxRamForCore = ns.getServerMaxRam('home') * coreCoef
		// 25% of this reserved home RAM is left unassigned, to give us wiggle room to run Comm_NS and manual files like test.js.
		maxRamForScripts = maxRamForCore * 0.75
		// we can only bank a strat if adding it's RAM cost to coreScriptsSize would result in (coreScriptsSize <= maxRamForScripts)
		coreScriptsSize = ns.getScriptRam('main.js') + ns.getScriptRam('hud.js')

		// Strat Banking
		// ========================================================================================================================
		// ========================================================================================================================

		if (bndata.CrimeMoney > 0 || (allowGang && bndata.GangSoftcap * bndata.GangUniqueAugs > 0)) 
			BankStrat('op_task-manager.js');
		if (allowBHome)
			BankStrat('op_bupgr.js');
		if (allowHacknet && bndata.HacknetNodeMoney > 0)
			BankStrat('op_bhnodes.js');
		
		switch (runType) {
			case "bladeburner":
				if (allowGang && bndata.GangSoftcap * bndata.GangUniqueAugs > 0)
					BankStrat('lp_gang.js');
				if (allowSleeves)
					BankStrat('op_sleeve.js');
				if (player.money >= 2e6)
					BankStrat('lp_stockmaster.js');
				BankStrat('mp_bladeburner.js');
				BankStrat('lp_svhack.js');
				BankStrat('mp_nuke-backdoor.js');
				BankStrat('op_joinfacs.js');
				if (allowGraft)
					BankStrat('op_graft.js');
				if (bndata.PurchasedServerLimit > 0)
					BankStrat('op_bservs.js');
				break;
			case "redpill":
				if (player.money >= 2e6)
					BankStrat('lp_stockmaster.js');
				if (bndata.PurchasedServerLimit > 0)
					BankStrat('op_bservs.js');
				BankStrat('lp_svhack.js');
				BankStrat('mp_nuke-backdoor.js');
				BankStrat('op_joinfacs.js');
				if (allowSleeves)
					BankStrat('op_sleeve.js');
				if (allowGraft)
					BankStrat('op_graft.js');
				if (allowGang && bndata.GangSoftcap * bndata.GangUniqueAugs > 0)
					BankStrat('lp_gang.js');
				break;
			default:
				throw new Error("Invalid runType!");
		}

		if (bndata.CodingContractMoney > 0)
			BankStrat('cct_solve.js');
		if (allowStanek)
			BankStrat('lp_stanek.js');
		if (allowCorp && bndata.CorporationValuation * bndata.CorporationSoftcap > 0)
			BankStrat('mp_corp.js');
		if (GLOBAL_VARS["hackMult"] > 0)
			BankStrat('lp_loopmaster.js');

		if (player.skills.hacking >= 3000 * bndata.WorldDaemonDifficulty || GLOBAL_VARS["bb"]["isComplete"]) {
			let myAugs = await nstb.RunCom(ns, 'ns.singularity.getOwnedAugmentations()');
			if (myAugs.includes("The Red Pill") || GLOBAL_VARS["bb"]["isComplete"]) { BankStrat('endBitNode.js') }
		};

		// ========================================================================================================================
		// ========================================================================================================================

		// Hud update, Running Banked Strats
		await UpdHud();
		let runningStr = await RunStrats();
		if (bitNode == 8) { ns.tail('lp_stockmaster.js'); }
		// print debug info
		ns.clearLog();
		ns.print("\nrunType: ", runType);
		ns.print("coreCoef: ", coreCoef);
		ns.print(runningStr);

		await ns.sleep(970);
	};



	// FUNCTIONS
	// ============================================================

	function BankStrat(filename, args = []) {
		// if already running (will be the case for loops / lp_ files)
		if (ns.isRunning(filename, 'home')) {
			coreScriptsSize += ns.getScriptRam(filename); // Account for the RAM usage
			scriptsRunning.push(filename); // Add it to the list of running scripts
			return true;
		}
		// else, if we can afford to run this file, add it to the list of things to run and account for its RAM
		else if (maxRamForScripts >= (coreScriptsSize + ns.getScriptRam(filename))) {
			coreScriptsSize += ns.getScriptRam(filename); // Account for the RAM usage
			scriptsRunning.push(filename); // Add it to the list of running scripts
			// kill it, if it is running on hacknet-node-0
			if (numnodes > 0 && ns.isRunning(filename, 'hacknet-node-0')) ns.killall('hacknet-node-0');
			scriptsToRun.push({ "name": filename, "args": args });
			return true;
		}
		// else, if not in BN-9 and other income >= hnserv income, do the same checks to see if we can run it on hacknet-node-0
		else if (allowHacknet && numnodes > 0 && bitNode != 9 && tb.SumDict(GLOBAL_VARS["income"]) - (2 * GLOBAL_VARS["income"]["hacknet"]) > 0) {
			// if already running (will be the case for loops / lp_ files)
			if (ns.isRunning(filename, 'hacknet-node-0')) {
				hnscriptsSize += ns.getScriptRam(filename); // Account for the RAM usage
				hnscriptsRunning.push(filename); // Add it to the list of running scripts
				return true;
			}
			// else, if we can afford to run this file, add it to the list of things to run and account for its RAM
			else if (ns.getServerMaxRam('hacknet-node-0') >= (hnscriptsSize + ns.getScriptRam(filename))) {
				hnscriptsSize += ns.getScriptRam(filename); // Account for the RAM usage
				hnscriptsRunning.push(filename); // Add it to the list of running scripts
				hnscriptsToRun.push({ "name": filename, "args": args });
				return true;
			} else { return false; };
		} else { return false; };
	};

	async function RunStrats() {
		let printMsg = "\n(home) Scripts:";
		printMsg += "\n" + tb.TextFloat(34, `main.js`, " ", `${ns.getScriptRam('main.js')}gb`)
		printMsg += "\n" + tb.TextFloat(34, `hud.js`, " ", `${ns.getScriptRam('hud.js')}gb`)
		let tempArr1 = [];
		for (let n = 0; n < scriptsToRun.length; ++n) {
			let script = scriptsToRun[n].name;
			let arglist = scriptsToRun[n].args;
			tempArr1.push(script);
			try {
				if (arglist.length > 0) { ns.run(script, 1, ...arglist); }
				else { ns.run(script, 1) };
				printMsg += "\n" + tb.TextFloat(34, `${script}`, " ", `${ns.getScriptRam(script)}gb`)
				if (arglist.length > 0) printMsg += `\n   [ ${arglist} ]`;
			} catch (err) {
				ns.print("ERROR - " + err + " - FILE DOES NOT EXIST: " + script);
			}
			await ns.sleep(10); // Unsync the files
		 	await UpdHud(); // Update hud
		};
		for (let script of tb.ArrSubtract(scriptsRunning, tempArr1)) {
			printMsg += "\n" + tb.TextFloat(34, `${script}`, " ", `${ns.getScriptRam(script)}gb`)
		}
		// do the same thing for scripts on the hnserv
		if (hnscriptsToRun.length > 0) printMsg += "\n\n(hacket-node-0) Scripts:";
		let tempArr2 = [];
		for (let n = 0; n < hnscriptsToRun.length; ++n) {
			let script = hnscriptsToRun[n].name;
			let arglist = hnscriptsToRun[n].args;
			tempArr2.push(script);
			try {
				ns.scp(script, "hacknet-node-0", "home");
				ns.scp("hud.js", "hacknet-node-0", "home");
				ns.scp("helpers.js", "hacknet-node-0", "home");
				ns.scp("tb_toolbox.js", "hacknet-node-0", "home");
				ns.scp("tb_nstools.js", "hacknet-node-0", "home");
				if (arglist.length > 0) { ns.exec(script, "hacknet-node-0", 1, ...arglist); }
				else { ns.exec(script, "hacknet-node-0", 1) };
				printMsg += "\n" + tb.TextFloat(34, `${script}`, " ", `${ns.getScriptRam(script)}gb`)
				if (arglist.length > 0) printMsg += `\n   [ ${arglist} ]`;
			} catch (err) {
				ns.print("ERROR - " + err + " - FILE DOES NOT EXIST: " + script);
			}
			await ns.sleep(10); // Unsync the files
		 	await UpdHud(); // Update hud
		};
		for (let script of tb.ArrSubtract(hnscriptsRunning, tempArr2)) {
			printMsg += `\n${tb.TextFloat(34, script, " ", ns.getScriptRam(script) + " GB")}`
		}

		return printMsg;
	};

	async function UpdHud() {
		let installedAugs = await nstb.RunCom(ns, 'ns.singularity.getOwnedAugmentations()')
		let updArgs = []
		updArgs.push("!!upd", "ram", "RAM", `${tb.StandardNotation(ns.getServerMaxRam('home'), 2)} GB`);
		updArgs.push("!!upd", "aug", "Augs", `${installedAugs.length} / ${bndata.DaedalusAugsRequirement}`)
		updArgs.push("!!upd", "bitnode", `BitNode-${bitNode}:`, bName.substring(0, 14))
		updArgs.push("!!upd", "loop-sf", `Loop ${GLOBAL_VARS["loop"]}`, `SF ${GLOBAL_VARS["sourceFiles"][bitNode]}`)
		// Tooltips
		updArgs.push("!!tooltip", "bitnode", makeToolTipFromDict(GLOBAL_VARS["bnMults"]));
		updArgs.push("!!tooltip", "income", makeToolTipFromDict(GLOBAL_VARS["income"], `%key%: $%val%`, true));
		// Kills
		let kills = player.numPeopleKilled;
		updArgs.push("!!upd", "kill", "Kills", kills);
		// Kill progress (toward the 30 required to access all factions)
		if (kills / 30 < 1) updArgs.push("!!progr show", "kill", "!!progr", "kill", kills, 30);
		else updArgs.push("!!progr hide", "kill");
		// Karma
		var karma = ns.heart.break();
		updArgs.push("!!upd", "karma", "Karma", tb.StandardNotation(karma, 3));
		// Karma progress (toward unlocking gang)
		if (Math.abs(karma) / 54000 < 1 && GLOBAL_VARS["gang"]["want"])
			updArgs.push("!!progr show", "karma", "!!progr", "karma", Math.abs(karma), 54000);
		else updArgs.push("!!progr hide", "karma");
		// Income
		let totalCashPerSec = tb.SumDict(GLOBAL_VARS["income"]);
		updArgs.push("!!upd", "income", "$/sec", `$${tb.StandardNotation(totalCashPerSec, 3)}`);

		ns.run("hud.js", 1, ...updArgs)

		function makeToolTipFromDict(dict, format = `%key%: %val%`, exclude0 = false) {
			let entries = [];
			for (let key in dict) {
				let seg1 = format.split("%key%")[0]
				let seg2 = format.split("%key%")[1].split("%val%")[0]
				let seg3 = format.split("%val%")[1]
				let val = dict[key]
				if (typeof val == "number") val = tb.StandardNotation(val, 3);
				if (exclude0 && dict[key] != 0) {
					entries.push(`${seg1}${key}${seg2}${val}${seg3}`)
				} else if (!exclude0) {
					entries.push(`${seg1}${key}${seg2}${val}${seg3}`)
				}
			}
			return entries.join(`\n`);
		};
	}
}