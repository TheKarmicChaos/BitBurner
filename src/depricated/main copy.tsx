import { NS } from "@ns";
import { ArrSubtract, StandardNotation, TextFloat } from './toolbox';
import { Comm_NS, PeekPort_NS, UpdPort_NS } from './lib/nstools';

/** This main script determines what type of run this is, what strategies are valid in this BN, etc. and runs their related automation files accordingly.
 * @param {import("../").NS} ns */
export async function main(ns: NS) {
	ns.closeTail(); await ns.sleep(1); ns.tail('main.js'); await ns.sleep(1); ns.resizeTail(340, 600); await ns.sleep(1); ns.moveTail(1560, 120);
	ns.disableLog("ALL"); ns.clearLog();

	ns.killall('home');
	try {
		ns.killall('hacknet-node-0');
		ns.exec('lp_stockmaster.js', 'hacknet-node-0', 1, '-l');
 	} catch (err) { }

	let pldata = await Comm_NS(ns, 'ns.getPlayer()');
	var bitNode = pldata["bitNodeN"]; let bName: string;
	let sourceFiles = await Comm_NS(ns, 'ns.singularity.getOwnedSourceFiles()')
	let bndata = await Comm_NS(ns, 'ns.getBitNodeMultipliers()')
	let runType = "redpill";
	let numnodes = await Comm_NS(ns, 'ns.hacknet.numNodes()')

	let scriptsToRun: any[] = [];
	let scriptsRunning: string[] = [];
	let hnscriptsToRun: any[] = [];
	let hnscriptsRunning: string[] = [];
	let strats: any = {};
	let maxRamForScripts: number; let coreScriptsSize: number;
	let hnscriptsSize = 0;


	// Initialize all port data structures
	// ============================================================

	// PORT 1: BITNODE INFO - BN NUMBER, runType, CURRENT SOURCE FILES, & BN MULTIPLIERS
	ns.getPortHandle(1).clear()

	// PORT 2: ALL INCOME SOURCES
	ns.getPortHandle(2).clear()
	ns.getPortHandle(2).write({ "baseIncome": 0, "hnodes": 0, "gang": 0, "corp": 0, "plcrime": 0, "slcrime": 0, "plwork": 0, "slwork": 0, "hacking": 0})

	// PORT 3: HASHES
	ns.getPortHandle(3).clear()
	ns.getPortHandle(3).write({ "hashes": 0, "income": 0, "maxhashes": 1})

	// PORT 6: RUN PROGRESS TRACKER
	ns.getPortHandle(6).clear()
	ns.getPortHandle(6).write({ "backdoors": ["home"] })

	// PORT 7: GANG PROGRESS TRACKER
	ns.getPortHandle(7).clear()
	ns.getPortHandle(7).write({ "wantGang": false, "hasGang": false })

	// PORT 8: CORP PROGRESS TRACKER
	ns.getPortHandle(8).clear()
	ns.getPortHandle(8).write({ "wantCorp": false, "hasProd": false, "hasLab": false, "hasTA.II": false, "research": 0, "funds": 0, "profit": 0, "products": [] })

	// PORT 9: BLADEBURNER PROGRESS TRACKER
	ns.getPortHandle(9).clear()
	ns.getPortHandle(9).write({ "wantBB": false, "hasBB": false })






	// SETTINGS & SETUP
	// ============================================================

	// Determine the name of the bitnode
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
			bName = "They’re lunatics"; break;
	}

	// Money-making strategies
	if (bndata.HackingLevelMultiplier > 0
		&& bndata.HackExpGain > 0
		&& bndata.ServerGrowthRate > 0
		&& bndata.ServerMaxMoney > 0
		&& bndata.ServerStartingMoney > 0
		&& bndata.ServerWeakenRate > 0
		&& bndata.ScriptHackMoney > 0
		&& bndata.ScriptHackMoneyGain > 0) {
		strats["hack_money"] = bndata.ServerGrowthRate * bndata.ServerMaxMoney * bndata.ServerWeakenRate * bndata.ScriptHackMoneyGain
	}
	if (bndata.CorporationValuation > 0
		&& bndata.CorporationSoftcap > 0) {
		strats["corp"] = bndata.CorporationSoftcap;
		UpdPort_NS(ns, 8, "dict", ["wantCorp", true]);
	}
	if (bndata.CrimeMoney > 0) {
		strats["crime_money"] = bndata.CrimeMoney
	}
	/*if (bndata.GangSoftcap > 0
		&& bndata.GangUniqueAugs > 0) {
		strats["gang"] = bndata.GangSoftcap
		UpdPort_NS(ns, 7, "dict", ["wantGang", true]);
	}*/
	if (bndata.HacknetNodeMoney > 0) {
		strats["hackn"] = bndata.HacknetNodeMoney
	}
	if (bndata.CodingContractMoney > 0) {
		strats["cct"] = bndata.CodingContractMoney
	}
	if (bndata.InfiltrationMoney > 0) {
		strats["infil_money"] = bndata.InfiltrationMoney
	}
	if (bndata.FourSigmaMarketDataApiCost < 100
		&& bndata.FourSigmaMarketDataCost < 100) {
		strats["stocks"] = 1
	}

	// EXP-making strategies
	if (bndata.HackingLevelMultiplier > 0
		&& bndata.HackExpGain > 0
		&& bndata.ServerGrowthRate > 0
		&& bndata.ServerWeakenRate > 0) {
		strats["hack_exp"] = bndata.HackingLevelMultiplier * bndata.HackExpGain * bndata.ServerWeakenRate * bndata.ServerGrowthRate
	}
	if (bndata.CompanyWorkExpGain > 0
		&& bndata.HackExpGain > 0
		&& bndata.ServerGrowthRate > 0
		&& bndata.ServerWeakenRate > 0) {
		strats["company_exp"] = bndata.HackingLevelMultiplier * bndata.HackExpGain * bndata.ServerWeakenRate * bndata.ServerGrowthRate
	}

	// Reputation-making strategies
	if (bndata.InfiltrationMoney > 0) {
		strats["infil_rep"] = 1
	}

	// Figure out which runType works best for this BN
	if (bndata.DaedalusAugsRequirement <= 60) {
		runType = "redpill"
	} else if (bndata.BladeburnerRank > 0) {
		runType = "bladeburner"
	}

	ns.getPortHandle(1).write({ "bitNode": bitNode, "mults": bndata, "runType": runType, "strats": strats, "sourceFiles": sourceFiles })

	// ===========================================================================================================
	// RUN TYPE 1: REDPILL
	// ===========================================================================================================

	if (runType == "redpill") {
		while (true) {

			// Info Updates
			// ============================================================

			// update pldata
			pldata = await Comm_NS(ns, 'ns.getPlayer()')
			numnodes = await Comm_NS(ns, 'ns.hacknet.numNodes()')
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
			// ============================================================

			if ("crime_money" in strats || 'gang' in strats || "work_money" in strats) { BankStrat('op_task-manager.js'); }
			
			BankStrat('op_bupgr.js')

			if ('hackn' in strats) { BankStrat('op_bhnodes.js') }

			if ("stocks" in strats && pldata.money >= 2e6) { BankStrat('lp_stockmaster.js'); }

			if (bndata.PurchasedServerLimit > 0) { BankStrat('op_bservs.js') }
			
			BankStrat('lp_svhack.js');

			BankStrat('mp_nuke-backdoor.js');

			BankStrat('op_sleeve.js');

			if ('cct' in strats) { BankStrat('cct_solve.js') }

			BankStrat('op_joinfacs.js');

			BankStrat('op_graft.js');

			if (pldata.skills.hacking >= 3000 * bndata.WorldDaemonDifficulty) {
				let myAugs = await Comm_NS(ns, 'ns.singularity.getOwnedAugmentations()');
				if (myAugs.includes("The Red Pill")) { BankStrat('endBitNode.js') }
			}

			//if ('gang' in strats) { BankStrat('lp_gang.js') }

			if ("corp" in strats) { BankStrat('mp_corp.js') }

			if ('hack_money' in strats) { BankStrat('lp_loopmaster.js') }

			// Hud Update
			// ============================================================

			await UpdHud();

			// Running Banked Strats
			// ============================================================

			let runningStr = await RunStrats();
			if (bitNode == 8) { ns.tail('lp_stockmaster.js'); }
			
			// print debug info
			ns.clearLog();
			ns.print("Strats: ", strats);
			ns.print("\nrunType: ", runType);
			ns.print("coreCoef: ", coreCoef);
			ns.print(runningStr);

			await ns.sleep(970);
		};
	}


	// ===========================================================================================================
	// RUN TYPE 2: BLADEBURNER
	// ===========================================================================================================

	else if (runType == "bladeburner") {
		while (true) {
			await ns.sleep(970);
		};
	};





	// FUNCTIONS
	// ============================================================

	function BankStrat(filename: string, args = []) {
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
		else if (numnodes > 0 && bitNode != 9 && PeekPort_NS(ns, 2, "sumdict") - (2 * PeekPort_NS(ns, 2)["hnodes"]) > 0) {
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
		printMsg += "\n" + TextFloat(34, `main.js`, " ", `${ns.getScriptRam('main.js')}gb`)
		printMsg += "\n" + TextFloat(34, `hud.js`, " ", `${ns.getScriptRam('hud.js')}gb`)
		let tempArr1 = [];
		for (let n = 0; n < scriptsToRun.length; ++n) {
			let script = scriptsToRun[n].name;
			let arglist = scriptsToRun[n].args;
			tempArr1.push(script);
			try {
				if (arglist.length > 0) { ns.run(script, 1, ...arglist); }
				else { ns.run(script, 1) };
				printMsg += "\n" + TextFloat(34, `${script}`, " ", `${ns.getScriptRam(script)}gb`)
				if (arglist.length > 0) printMsg += `\n   [ ${arglist} ]`;
			} catch (err) {
				ns.print("ERROR - " + err + " - FILE DOES NOT EXIST: " + script);
			}
			await ns.sleep(10); // Unsync the files
		 	await UpdHud(); // Update hud
		};
		for (let script of ArrSubtract(scriptsRunning, tempArr1)) {
			printMsg += "\n" + TextFloat(34, `${script}`, " ", `${ns.getScriptRam(script)}gb`)
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
				printMsg += "\n" + TextFloat(34, `${script}`, " ", `${ns.getScriptRam(script)}gb`)
				if (arglist.length > 0) printMsg += `\n   [ ${arglist} ]`;
			} catch (err) {
				ns.print("ERROR - " + err + " - FILE DOES NOT EXIST: " + script);
			}
			await ns.sleep(10); // Unsync the files
		 	await UpdHud(); // Update hud
		};
		for (let script of ArrSubtract(hnscriptsRunning, tempArr2)) {
			printMsg += `\n${TextFloat(34, script, " ", ns.getScriptRam(script) + " GB")}`
		}

		return printMsg;
	};

	async function UpdHud() {
		let installedAugs = await Comm_NS(ns, 'ns.singularity.getOwnedAugmentations()')
		var ramStr = `RAM | ${StandardNotation(ns.getServerMaxRam('home'), 2)} GB`
		var augStr = `Augs | ${installedAugs.length} / ${bndata.DaedalusAugsRequirement}`
		var bnStr = `BitNode-${PeekPort_NS(ns, 1)["bitNode"]}: | ${bName.substring(0, 14)}`
		ns.run("hud.js", 1, "upd", "ram", ramStr)
		ns.run("hud.js", 1, "upd", "aug", augStr)
		ns.run("hud.js", 1, "upd", "bitnode", bnStr)
	}
}