import * as nstb from "./lib/nstools";
import * as tb from "./lib/toolbox";

/** @param {import("../").NS} ns */
export async function main(ns) {
	ns.closeTail(); await ns.sleep(1); ns.tail('lp_svhack.js'); await ns.sleep(1); ns.resizeTail(340, 295); await ns.sleep(1); ns.moveTail(1540, 155);
	ns.disableLog("ALL"); ns.clearLog();

	let hackInfluencesStocks = false
	let growInfluencesStocks = true

	async function FindAllTargets(servs) {
		var all = ['n00dles'];
		if ((ns.getServerMaxRam('home') < 2048) && ((ns.getServerMaxRam(GetBestServ()) < 1024) || (GetBestServ() == "home"))) {
			targetCoef = 0.5;
		} else {
			targetCoef = 1;
		}

		for (var i = 0; i < servs.length; ++i) { // iterate through every server in servs except 'home'
			var servname = servs[i];
			if (servname != "home") {
				// if we have root access & it isnt a purchased serv & serv has >$0 max
				var pservs = await nstb.RunCom(ns, 'ns.getPurchasedServers()')
				try {
					if (ns.hasRootAccess(servname)
						&& !(pservs.includes(servname))
						&& (ns.getServerMaxMoney(servname) > 0)) {
						// if the hack lv required is low enough
						if (ns.getServerRequiredHackingLevel(servname) <= targetCoef * ns.getHackingLevel()) {
							if (servname != 'n00dles') { all.push(servname) }
						}
					}
				} catch (err) { ns.toast("Err@FindAllTargets: " + servname + " no longer exists", "error", 1000) }
			}
		}
		//let sortedAll = BubbleSort(all, "target")
		all.sort(function (x, y) {
			if (ns.getServerMaxMoney(x) < ns.getServerMaxMoney(y)) {
				return -1;
			}
			if (ns.getServerMaxMoney(x) > ns.getServerMaxMoney(y)) {
				return 1;
			}
			return 0;
		});
		return all
	}

	function FindAllUsable(servs) {
		var all = ['home'];

		for (var i = 0; i < servs.length; ++i) { // iterate through every server in servs
			var servname = servs[i];
			try {
				// if we have root access & serv has >0 RAM
				if (ns.hasRootAccess(servname) && (ns.getServerMaxRam(servname) > 0)) {
					if (servname != 'home' && servname.split("-")[0] != "hacknet") { all.push(servname) }
				}
			} catch (err) { ns.toast("Err@FindAllUsable: " + servname + " no longer exists", "error", 1000) }

		}
		//let sortedAll = BubbleSort(all, "host")
		all.sort(function (x, y) {
			if (ns.getServerMaxRam(x) < ns.getServerMaxRam(y)) {
				return -1;
			}
			if (ns.getServerMaxRam(x) > ns.getServerMaxRam(y)) {
				return 1;
			}
			return 0;
		});
		return all
	}

	function KillEverything(servs) {
		for (var i = 0; i < servs.length; ++i) { // iterate through every server in servs
			var servname = servs[i];
			if ((ns.getServerUsedRam(servname) != 0) && (servname != 'home')) {
				ns.killall(servname);
			}
		}
	}

	async function GetRequiredThreads(servname) {
		var maxmoney = ns.getServerMaxMoney(servname);
		var money = ns.getServerMoneyAvailable(servname);
		let homeserv = await nstb.RunCom(ns, 'ns.getServer()', ['home']);
		var homecores = homeserv.cpuCores
		if (money < 1) { money = 1 }
		var requiredGrowThr = await nstb.RunCom(ns, 'ns.growthAnalyze()', [servname, maxmoney / money]);
		var requiredGrowThrHome = await nstb.RunCom(ns, 'ns.growthAnalyze()', [servname, maxmoney / money, homecores]);
		var bestServ = allUsableServs[allUsableServs.length - 1];
		var bestServRAM = ns.getServerMaxRam(bestServ);
		var moneyBreakpt = Math.ceil((maxmoney / Math.log2(bestServRAM)));
		var moneyRemoval = maxmoney - moneyBreakpt;
		var requiredHackThr = Math.ceil(await nstb.RunCom(ns, 'ns.hackAnalyzeThreads()', [servname, moneyRemoval]));
		var weakenNeeded = ns.getServerSecurityLevel(servname) - ns.getServerMinSecurityLevel(servname);
		var i = 1;
		while (ns.weakenAnalyze(i, homecores) < weakenNeeded) {
			++i;
		}
		let requiredWeakThrHome = i;
		while (ns.weakenAnalyze(i) < weakenNeeded) {
			++i;
		}
		var requiredWeakThr = i;
		//ns.print("WEAK " + requiredWeakThr);
		//ns.print("GROW " + requiredGrowThr);
		//ns.print("HACK " + requiredHackThr);
		return [requiredWeakThr, requiredGrowThr, requiredHackThr, requiredWeakThrHome, requiredGrowThrHome, requiredHackThr]
	}

	async function ChooseAction(servname, forceHack = false) {
		var actionID;
		let moneyAvailable = ns.getServerMoneyAvailable(servname);
		let maxMoney = ns.getServerMaxMoney(servname);
		let secLevel = ns.getServerSecurityLevel(servname);
		let secMin = ns.getServerMinSecurityLevel(servname);
		let hackP = await nstb.RunCom(ns, 'ns.hackAnalyzeChance()', [servname]);
		var secThresh;
		if (secMin < 10) {
			secThresh = secMin + 3
		} else if (secMin < 30) {
			secThresh = secMin + 5
		} else {
			secThresh = secMin + 7
		}
		var priorityTime;

		if ((moneyAvailable < (maxMoney * 0.98)) && (secLevel < secThresh) && !forceHack) {
			actionID = 1;
			priorityTime = Math.ceil(ns.getGrowTime(servname));
		} else if (forceHack || ((hackP >= 0.75) || (secLevel == secMin)) && (moneyAvailable >= (maxMoney * 0.98))) {
			actionID = 2;
			priorityTime = Math.ceil(ns.getHackTime(servname));
		} else {
			actionID = 0;
			priorityTime = Math.ceil(ns.getWeakenTime(servname));
		}
		return [actionID, priorityTime];
	}

	function GetBestServ() {
		allUsableServs = FindAllUsable(allServs);
		var bestServ = allUsableServs[allUsableServs.length - 1];
		return bestServ;
	}

	function IsBeingHacked(serv) {
		if (beingHacked[serv] != null) {
			if (beingHacked[serv][0] >= 0) {
				return true
			}
		} else { return false }
	}

	var allServs = nstb.ScanAll(ns, true)[0];

	var targetCoef = 0.5;
	var allTargetServs = await FindAllTargets(allServs);
	var allUsableServs = FindAllUsable(allServs);
	KillEverything(allUsableServs);

	var beingHacked = {};

	while (true) { await BetterLoop() }

	// ------------------------------------------------------------------------
	// ------------------------------------------------------------------------
	// BETTER LOOP -------------------------------------------------------------------
	// ------------------------------------------------------------------------
	// ------------------------------------------------------------------------


	async function BetterLoop() {

		// initialize/update variables
		allServs = nstb.ScanAll(ns, true)[0];
		allTargetServs = await FindAllTargets(allServs);
		allUsableServs = FindAllUsable(allServs);

		let homeSize = await nstb.RunCom(ns, 'ns.getServerMaxRam()', ['home']);
		let hackSize = await nstb.RunCom(ns, 'ns.getScriptRam()', ['smart-hack.js']);
		let coreCoef;
		if (homeSize <= 2048) { coreCoef = 1 }
		else { coreCoef = 0.5 }
		let maxRamForCore = homeSize * coreCoef;

		// decrement all tick counts for servers in beingHacked
		// removing them from the dict if their ticks value is below 0
		// as this means the hack/weak/grow done to this server is finished.
		// NOTE: 1 tick = 1 second
		for (let key in beingHacked) {
			beingHacked[key][0] -= 1;
		}


		let forcehack = false;
		//if (PeekPort(ns, 1) == 9 && PeekPort(ns, 2, "sumdict") <= 1) { forcehack = true }



		// Iterate through every targetServ (starting with best target), descending the array from best to worst
		for (var i = (allTargetServs.length - 1); i >= 0; --i) {
			var targetservname = allTargetServs[i];
			// IF this targetServ is NOT in "beingHacked"
			if (!(IsBeingHacked(targetservname))) {
				ns.print(targetservname)

				// Get required threads
				let allRequiredThreads = await GetRequiredThreads(targetservname);

				// Pick an action for this server
				let action = await ChooseAction(targetservname, forcehack);
				let actionID = action[0];
				var actionTime = action[1];
				ns.print("ACTION: " + actionID);
				let stockOpt = false;
				if (actionID == 1) { stockOpt = growInfluencesStocks }
				else if (actionID == 2) { stockOpt = hackInfluencesStocks }

				// Get the required threads for the chosen action
				var requiredThr = allRequiredThreads[actionID];
				var requiredThrHome = allRequiredThreads[actionID + 3];
				if (requiredThr <= 0) { requiredThr = 1 }
				if (requiredThrHome <= 0) { requiredThrHome = 1 }
				// For every usableServ in array of allUsableServs (ascending from worst to best)
				for (var x = 0; x < allUsableServs.length; ++x) {
					var usableservname = allUsableServs[x];
					ns.print(targetservname)
					ns.print(usableservname)

					// IF the targetserv is not yet in "beingHacked"
					if (!(IsBeingHacked(targetservname))) {
						var freeRam;
						if (usableservname == 'home') {
							ns.print("needs " + requiredThrHome + " for " + actionID)
							freeRam = ns.getServerMaxRam('home') - ns.getServerUsedRam('home');
							freeRam -= maxRamForCore;
						} else {
							ns.print("needs " + requiredThr + " for " + actionID)
							freeRam = (ns.getServerMaxRam(usableservname) - ns.getServerUsedRam(usableservname))
						}
						var freeThr = Math.floor(freeRam / hackSize);
						ns.print(" HAS " + freeThr)
						ns.print("---------")

						// if the usableserv has enough free space for requiredThr
						var reqThrFinal;
						if (usableservname == 'home') { reqThrFinal = requiredThrHome }
						else { reqThrFinal = requiredThr }


						if (freeThr >= reqThrFinal) {
							var ticksUntilDone = Math.ceil(actionTime / 1000)

							// add targetserv to "beingHacked" dict (w/ value as [# of ticks until done, action ID, pid of script running it])
							
							await AttackServ(usableservname, reqThrFinal, targetservname, actionID, stockOpt);
							//let income = ns.getScriptIncome('smart-hack.js', usableservname, [thrToUse, targetservname, actionID])
							beingHacked[targetservname] = [ticksUntilDone, actionID];
						}
						//await ns.sleep(1000)
					}
				}
			}
		}

		for (var i = (allTargetServs.length - 1); i >= 0; --i) {
			var targetservname = allTargetServs[i];
			// IF this targetServ is NOT in "beingHacked"
			if (!IsBeingHacked(targetservname)) {
				ns.print(targetservname)
				//beingHacked[targetservname] = [0, 7]
				// Set up variables???

				// Get required threads
				let allRequiredThreads = await GetRequiredThreads(targetservname);

				// Pick an action for this server
				let action = await ChooseAction(targetservname, forcehack);
				let actionID = action[0];
				ns.print("ACTION: " + actionID);
				var actionTime = action[1];
				let stockOpt = false;
				if (actionID == 1) { stockOpt = growInfluencesStocks }
				else if (actionID == 2) { stockOpt = hackInfluencesStocks }

				// Get the required threads for the chosen action
				var requiredThr = allRequiredThreads[actionID];
				if (requiredThr <= 0) { requiredThr = 1 }
				// For every usableServ in array of allUsableServs (descending from best to worst)
				for (var x = allUsableServs.length - 1; x >= 0; --x) {
					var usableservname = allUsableServs[x];
					ns.print("Target: ", targetservname)
					ns.print("Usable: ", usableservname)

					// IF the targetserv is not yet in "beingHacked"
					var freeRam;
					ns.print("needs " + requiredThr + " for " + actionID)
					if (usableservname == 'home') {
						freeRam = ns.getServerMaxRam('home') - ns.getServerUsedRam('home');
						freeRam -= maxRamForCore;
					} else { freeRam = (ns.getServerMaxRam(usableservname) - ns.getServerUsedRam(usableservname)) }
					var freeThr = Math.floor(freeRam / hackSize);
					ns.print(" HAS " + freeThr)
					ns.print("-----(filling)----")


					// if the usableserv has enough free space for requiredThr
					if (freeThr >= requiredThr) {
						//if (thrToUse == 0) { ns.toast("ERROR: thrtouse=0", "error", 2000); await ns.sleep(10000);  } else {
						var thrToUse = Math.min(freeThr, requiredThr)
						var ticksUntilDone = Math.ceil(actionTime / 1000)

						// add targetserv to "beingHacked" dict (w/ value as [# of ticks until done, action ID])
						beingHacked[targetservname] = [ticksUntilDone, (actionID + 3)];
						await AttackServ(usableservname, freeThr, targetservname, actionID, stockOpt);
						//}
					} else if (freeThr > 0) {
						await AttackServ(usableservname, freeThr, targetservname, actionID, stockOpt);
						requiredThr -= freeThr;
					}

					if (x == 0) {
						var ticksUntilDone = Math.ceil(actionTime / 1000)
						beingHacked[targetservname] = [ticksUntilDone, (actionID + 3)];
					}
					//await ns.sleep(1000)
				}
			}

		}

		// print debug stats for log
		var printLines = [""];
		var actionName;
		//ns.run('hud.js');
		ns.clearLog();
		for (var x = 0; x < allTargetServs.length; ++x) {
			let servname = allTargetServs[x];
			if (IsBeingHacked(servname)) {
				var timeLeft = beingHacked[servname][0];
				let actionID = beingHacked[servname][1];
				var actionName;
				if (actionID == 0) {
					actionName = ' Weak'
				} else if (actionID == 1) {
					actionName = ' Grow'
				} else if (actionID == 2) {
					actionName = ' Hack'
				} else if (actionID == 3) {
					actionName = '*Weak'
				} else if (actionID == 4) {
					actionName = '*Grow'
				} else if (actionID == 5) {
					actionName = '*Hack'
				} else { actionName = 'ERROR' }
				var prStr = tb.TextFloat(34, actionName + " [" + tb.StandardTime(timeLeft) + "]", " ", servname)
				printLines.push(prStr);
			} else {
				let prStr = tb.TextFloat(34, " - INACTIVE - ", " ", servname)
				printLines.push(prStr);
			}
		}
		for (var x = 0; x < printLines.length; ++x) { ns.print(printLines[x]) }

		// Update income in port
		let hackincome = ns.getScriptIncome('lp_svhack.js', 'home');
		nstb.UpdPort(ns, 2, "dict", ["hacking", hackincome]);
		await ns.sleep(1000);
	}

	async function AttackServ(hostServ, threadsToUse, targetServ, actionID, stockOpt) {
		await nstb.RunCom(ns, 'ns.scp()', ['smart-hack.js', hostServ]);
		if (threadsToUse == 0) { ns.toast("ERROR: Tried to run 0 threads on " + hostServ, "error", 800) }
		else { ns.exec('smart-hack.js', hostServ, threadsToUse, targetServ, actionID, stockOpt); }
	}
}