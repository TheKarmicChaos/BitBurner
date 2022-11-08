/** @param {import("../").NS} ns */
export async function main(ns) {

	// Calculate the growth multiplier that would result from using a certain number of threads on a server
	function GrowthAnalyzeInverse(serv, threads) {
		var maxGrow = 1;
		var minGrow = 1;
		var maxThr = 1;
		var minThr = 1;

		// The strategy is to repeatedly call growthAnalyze() to narrow down maxThr and minThr
		// to be closer to the threads argument.

		// We start by analyzing a low growth amount, and double the growth until the required threads 
		// to get this growth (maxThr) exceeds the num of threads we have at our disposal (the threads arg).
		while (maxThr < threads) {
			minGrow = maxGrow;
			maxGrow *= 2;
			minThr = maxThr;
			maxThr = ns.growthAnalyze(serv, maxGrow);
			//ns.print("Grow between " + minGrow + " & " + maxGrow);
			//ns.print("Thrs between " + minThr + " & " + maxThr);
		}

		// Repeatedly test the growth amount halfway between minGrow and maxGrow, updating them based on if
		// the value returned by growthAnalyze was higher or lower than 'threads'
		while (!(maxThr - minThr < 3)) {
			var testGrow = (minGrow + maxGrow) / 2;
			var testThr = Math.ceil((ns.growthAnalyze(serv, testGrow)));
			if (testThr < threads) { // testGrow was too low
				minGrow = testGrow;
				minThr = testThr;
			} else if (testThr > threads) { // testGrow was too high
				maxGrow = testGrow;
				maxThr = testThr;
			} else { // testGrow was the exact correct amount, so return it.
				//ns.print("Grow is " + testGrow);
				return testGrow;
			}
			//ns.print("Grow between " + minGrow + " & " + maxGrow);
			//ns.print("Thrs between " + minThr + " & " + maxThr);
		}
		return minGrow; // close enough
	}




	// Wait until we acquire the "BruteSSH.exe" program
	while (!ns.fileExists("BruteSSH.exe")) { await SmartLoop(); }

	AutoNuke(allServs);

	// Wait until we acquire the "FTPCrack.exe" program  
	while (!ns.fileExists("FTPCrack.exe")) { await SmartLoop(); }

	AutoNuke(allServs);

	// Wait until we acquire the "relaySMTP.exe" program
	while (!ns.fileExists("relaySMTP.exe")) { await SmartLoop(); }

	AutoNuke(allServs);

	// Wait until we acquire the "HTTPWorm.exe" program
	while (!ns.fileExists("HTTPWorm.exe")) { await SmartLoop(); }
	AutoNuke(allServs);

	// Wait until we acquire the "BSQLInject.exe" program
	while (!ns.fileExists("SQLInject.exe")) { await SmartLoop(); }

	AutoNuke(allServs);





	// ------------------------------------------------------------------------
	// ------------------------------------------------------------------------
	// CHEAP LOOP -------------------------------------------------------------------
	// ------------------------------------------------------------------------
	// ------------------------------------------------------------------------
	
	while ((ns.getServerMaxRam('home') < (coreScriptsSize * 3)) && (ns.getServerMaxRam(GetBestServ()) < (coreScriptsSize * 4))) { await CheapLoop() }

	async function CheapLoop() {
		allTargetServs = FindAllTargets(allServs);
		allUsableServs = FindAllUsable(allServs);
		var bestTarget = allTargetServs[allTargetServs.length - 1];
		// bestTarget = 'iron-gym'; // Override option

		var maxMoney = ns.getServerMaxMoney(bestTarget);
		var moneyAvailable = ns.getServerMoneyAvailable(bestTarget);
		var secLevel = ns.getServerSecurityLevel(bestTarget);
		var secMin = ns.getServerMinSecurityLevel(bestTarget);
		var hackP = 1;
		let hackSize = ns.getScriptRam('smart-hack.js');

		// Update Time Stats
		var weakT = Math.floor(ns.getWeakenTime(bestTarget) / 1000);
		var growT = Math.floor(ns.getGrowTime(bestTarget) / 1000);
		var hackT = Math.floor(ns.getHackTime(bestTarget) / 1000);

		// Update Security Stats
		var secThresh;
		secMin = ns.getServerMinSecurityLevel(bestTarget);
		if (secMin < 10) {
			secThresh = secMin + 3
		} else if (secMin < 30) {
			secThresh = secMin + 5
		} else { secThresh = secMin + 10 }
		secLevel = ns.getServerSecurityLevel(bestTarget);

		// Update Other Stats
		hackP = ns.hackAnalyzeChance(bestTarget).toPrecision(2);
		var bestServ = GetBestServ();
		var bestServRAM = ns.getServerMaxRam(bestServ);
		var bestServThr = bestServRAM / hackSize;
		//var maxGrowth = await GrowthAnalyzeInverse(bestTarget, availableThreads);

		// Update Money Stats
		maxMoney = ns.getServerMaxMoney(bestTarget);
		moneyAvailable = ns.getServerMoneyAvailable(bestTarget);
		var moneyBreakpt = Math.ceil((maxMoney / Math.log2(bestServThr)));
		var moneyRemoval;

		// Action Logic
		var actionChoice = ChooseAction(bestTarget);
		var actionID = actionChoice[0];
		var priorityTime = actionChoice[1];
		var threadsForHack = GetRequiredThreads(bestTarget)[actionID];
		if (threadsForHack < bestServThr) {
			threadsForHack = Math.ceil(1 * threadsForHack);
		}
		if (actionID == 2) {
			moneyRemoval = maxMoney - moneyBreakpt;
		}

		// Run the push file to start this cycle of weak/grow/hacking
		ns.run('push-files.js', 1, bestTarget, actionID, GetRequiredThreads(bestTarget)[actionID], bestServ);

		// Creates a nice stats table for the log
		for (var percent = 0; percent < 100; ++percent) {
			var weakStr = '';
			var growStr = '';
			var hackStr = '';
			var moneyRemStr = '';

			var sleepTime = Math.ceil((priorityTime + 1000) / 100);
			var timeLeft = Math.floor(((priorityTime / 100) + 10) * (100 - percent) / 1000); // in seconds

			if (actionID == 0) {
				weakStr = (" <<<  [" + StandardTime(timeLeft) + " left]");
			} else if (actionID == 1) {
				growStr = (" <<<  [" + StandardTime(timeLeft) + " left]");
			} else {
				hackStr = (" <<<  [" + StandardTime(timeLeft) + " left]");
				moneyRemStr = (" (-$" + StandardNotation(moneyRemoval) + ")");
			}

			//ns.run('hud.js');
			ns.clearLog();
			ns.print("======================-======================");
			ns.print(" BestServ " + bestServ + " (" + bestServThr + " Thr | " + bestServRAM + "gb)");
			ns.print(" ReqThr   " + StandardNotation(Math.ceil(threadsForHack)));
			ns.print(" TARGET   " + bestTarget + " (" + (hackP * 100) + "% Hack Chance)");
			ns.print("==--------------=== MONEY ===--------------==");
			ns.print(" Max	$" + StandardNotation(maxMoney));
			ns.print(" Value	$" + StandardNotation(moneyAvailable) + moneyRemStr);
			ns.print(" BrkPt	$" + StandardNotation(moneyBreakpt));
			ns.print("==------------=== SECURITY ===-------------==");
			ns.print(" Min	" + secMin);
			ns.print(" Thresh	" + secThresh);
			ns.print(" Value	" + secLevel);
			ns.print("==--------------=== TIMES ===--------------==");
			ns.print(" Weak	" + weakT + " sec" + weakStr);
			ns.print(" Grow	" + growT + " sec" + growStr);
			ns.print(" Hack	" + hackT + " sec" + hackStr);
			ns.print(" [" + percent + "%]	" + MakeLoadingBar(37, percent));
			ns.print("======================-======================");

			await ns.sleep(sleepTime);
			ns.clearLog();
		}

		let actionName;
		if (actionID == 0) {
			actionName = "Weak"
		} else if (actionID == 1) {
			actionName = "Grow"
		} else if (actionID == 2) {
			actionName = "Hack"
		} else { actionName = "ERROR" }

		ns.toast(actionName + " COMPLETE (" + bestTarget + ")", 'success', 20000);


	}
}
/** @param {NS} ns */
export async function main(ns) {
	ns.tail('commit-crime.js')

	var goal = ns.args[0]
	var doFocus = ns.args[1]
	var crimeList = ["SHOPLIFT", "ROBSTORE", "MUG", "LARCENY", "DRUGS",
		"BONDFORGERY", "TRAFFICKARMS", "HOMICIDE", "GRANDTHEFTAUTO", "KIDNAP",
		"ASSASSINATION", "HEIST"];
	var pStr = ns.getPlayer().skills.strength
	var pDef = ns.getPlayer().skills.defense
	var pDex = ns.getPlayer().skills.dexterity
	var pAgi = ns.getPlayer().skills.agility


	function GetAvgStatPerSec(statToCheck, crime) {
		var stat = ns.singularity.getCrimeStats(crime)[statToCheck]
		var time = Math.ceil(ns.singularity.getCrimeStats(crime).time / 1000)
		var chanceP = ns.singularity.getCrimeChance(crime)
		var chanceNP = 0;
		if (stat != "money") { chanceNP = 1 - chanceP }
		if ((stat == "money") && (chanceP <= 0.05)) { chanceP = 0 }
		var avgPerCrime = ((chanceP * stat) + (chanceP * chanceNP * (stat / 2))) / 2;
		//ns.print(crime + "	" + (avgPerCrime / time) + "	" + stat)
		return (avgPerCrime / time);
	}

	async function DoCrime(goal, doFocus) {
		// Decide what the best crime to commit is
		var bestCrime = null;
		for (var crime of crimeList) {
			if (bestCrime == null) {
				bestCrime = crime;
			} else if (goal == 'karma') {
				if (GetAvgStatPerSec("karma", crime) > GetAvgStatPerSec("karma", bestCrime)) { bestCrime = crime }
			} else if (goal == 'kills') {
				if (GetAvgStatPerSec("kills", crime) > GetAvgStatPerSec("kills", bestCrime)) { bestCrime = crime }
			} else if (goal == 'money') {
				if (GetAvgStatPerSec("money", crime) > GetAvgStatPerSec("money", bestCrime)) { bestCrime = crime }
			} else if (goal == 'exp') {
				var thisAvgStat = ((GetAvgStatPerSec("strength_exp", crime) / pStr) +
					(GetAvgStatPerSec("defense_exp", crime) / pDef) +
					(GetAvgStatPerSec("dexterity_exp", crime) / pDex) +
					(GetAvgStatPerSec("agility_exp", crime) / pAgi) / 4);
				var bestAvgStat = ((GetAvgStatPerSec("strength_exp", bestCrime) / pStr) +
					(GetAvgStatPerSec("defense_exp", bestCrime) / pDef) +
					(GetAvgStatPerSec("dexterity_exp", bestCrime) / pDex) +
					(GetAvgStatPerSec("agility_exp", bestCrime) / pAgi) / 4);
					if (thisAvgStat > bestAvgStat) { bestCrime = crime }
			} else if (goal == 'progress') {
				var thisAvgStat = ((GetAvgStatPerSec("strength_exp", crime) / 1) +
					(GetAvgStatPerSec("defense_exp", crime) / 1) +
					(GetAvgStatPerSec("dexterity_exp", crime) / 1) +
					(GetAvgStatPerSec("agility_exp", crime) / 1) / 4);
				var bestAvgStat = ((GetAvgStatPerSec("strength_exp", bestCrime) / 1) +
					(GetAvgStatPerSec("defense_exp", bestCrime) / 1) +
					(GetAvgStatPerSec("dexterity_exp", bestCrime) / 1) +
					(GetAvgStatPerSec("agility_exp", bestCrime) / 1) / 4);
				var thisMoney = GetAvgStatPerSec("money", crime);
				var bestMoney = GetAvgStatPerSec("money", bestCrime);
				if ((thisAvgStat * (thisMoney + 0.001)) > (bestAvgStat * (bestMoney + 0.001))) { bestCrime = crime }
			} else {
				if (ns.singularity.getCrimeChance("HOMICIDE") < 0.8) { bestcrime = "MUG" } else { bestcrime = "HOMICIDE" }
			}
		}

		// Commit the best crime
		if (!ns.singularity.isBusy()) {
			ns.singularity.commitCrime(bestCrime, doFocus)
		} else {
			var workData = ns.singularity.getCurrentWork()
			if (((workData.type != 'CRIME') || (workData == null)) && (workData.type != 'CREATE_PROGRAM')) {
				ns.singularity.commitCrime(bestCrime, doFocus)
			} else if (!(ns.singularity.getCurrentWork().crimeType == bestCrime)) { ns.singularity.commitCrime(bestCrime, doFocus) }
		}
	}

	DoCrime(goal, doFocus);

}

/** @param {NS} ns */
export async function main(ns) {
	function CreateProgram() {
		var hackLv = ns.getHackingLevel();
		if ((!(ns.fileExists("BruteSSH.exe", "home"))) && (hackLv >= 50)) {
			ns.singularity.createProgram("BruteSSH.exe", true);
		} else if ((!(ns.fileExists("FTPCrack.exe", "home"))) && (hackLv >= 100)) {
			ns.singularity.createProgram("FTPCrack.exe", true);
		} else if ((!(ns.fileExists("relaySMTP.exe", "home"))) && (hackLv >= 250)) {
			ns.singularity.createProgram("relaySMTP.exe", true);
		} else if ((!(ns.fileExists("HTTPWorm.exe", "home"))) && (hackLv >= 500)) {
			ns.singularity.createProgram("HTTPWorm.exe", true);
		} else if ((!(ns.fileExists("SQLInject.exe", "home"))) && (hackLv >= 750)) {
			ns.singularity.createProgram("SQLInject.exe", true);
		}
	}

	CreateProgram();
}




















/** @param {NS} ns */
import { StandardNotation_NS, Comm_NS } from "tb_nstools.js";
import { StandardTime, DelFromArray, TextFloat } from "tb_toolbox.js"

export async function main(ns) {
	//ns.tail('lp_aug.js', 'home', 2);
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("sleep");
	ns.disableLog("run");

	ns.clearLog();

	var installedAugs = await Comm_NS('ns.singularity.getOwnedAugmentations()');
	var currentAugs = await Comm_NS('ns.singularity.getOwnedAugmentations()', [true]);
	var hasFocusAug = installedAugs.includes("Neuroreceptor Management Implant"); // boolean value
	var canAscend = installedAugs.includes("The Red Pill");

	var nfgBought = 0;
	for (var i = 0; i < currentAugs.length; ++i) { if (currentAugs[i] == 'NeuroFlux Governor') { nfgBought += 1 } }

	async function DoCrime(goal, doFocus) { ns.run('commit-crime.js', 1, goal, doFocus) }
	async function TryAscend() { if (canAscend) { ns.run('endBitNode.js') } }

	async function JobFor(company, doFocus) {
		ns.singularity.applyToCompany(company, "IT");

		if (!ns.singularity.isBusy()) {
			ns.singularity.workForCompany(company, doFocus)
		} else {
			var workData = ns.singularity.getCurrentWork()
			if ((workData.type != "COMPANY") || (workData.companyName != company)) {
				ns.singularity.workForCompany(company, doFocus)
			}
		}
	}

	async function WorkFor(faction, goal, doFocus) {
		if (!ns.singularity.isBusy()) {
			if (!ns.singularity.workForFaction(faction, "Hacking Contracts", doFocus)) {
				if (!ns.singularity.workForFaction(faction, "Field Work", doFocus)) {
					ns.singularity.workForFaction(faction, "Security Work", doFocus);
				}
			}
		} else {
			var workData = ns.singularity.getCurrentWork()
			if ((workData.type != "FACTION") || (workData.factionName != faction)) {
				if (goal == "rep") {
					if (!ns.singularity.workForFaction(faction, "Hacking Contracts", doFocus)) {
						if (!ns.singularity.workForFaction(faction, "Field Work", doFocus)) {
							ns.singularity.workForFaction(faction, "Security Work", doFocus);
						}
					}
				} else if (goal == "exp") {
					if (!ns.singularity.workForFaction(faction, "Field Work", doFocus)) {
						if (!ns.singularity.workForFaction(faction, "Security Work", doFocus)) {
							ns.singularity.workForFaction(faction, "Hacking Contracts", doFocus);
						}
					}
				}
			}
		}
	}



	async function CompleteLoop(augsDict, loop) {

		var loopStr = TextFloat(15, '---- Loop ' + loop, "-", '-') + "|- "

		var nfgReq;
		if (loop < 5) {
			nfgReq = 3
		} else if (loop < 20) {
			nfgReq = 1
		} else if (loop < 99) {
			nfgReq = 1
		} else {
			nfgReq = 7
		}

		// Step 1: Get an array of augments we still need
		var augsLeft = []
		for (let augment in augsDict) {
			if (!installedAugs.includes(augment) && (augment != 'NeuroFlux Governor')) {
				// If we don't have this augment yet, add it to augsLeft
				augsLeft.push(augment)
			}
		}

		// If the array of augments needed is empty, we already finished this loop, so end func here.
		if ((augsLeft.length == 0) && (loop < 99)) { return false }

		// Remove augs we have bought but not installed yet.
		for (let augment in augsDict) {
			if (currentAugs.includes(augment) && (augment != 'NeuroFlux Governor')) {
				DelFromArray(augment, augsLeft);
			}
		}



		// Step 2: Get a dict of factions we still need augs from
		var factions = {}
		for (var x = 0; x < augsLeft.length; ++x) {
			var augment = augsLeft[x];
			var repReq = -1;
			var faction = augsDict[augment];
			// If this faction is new, add it to our factions dict
			// with the current repReq as the highest repreq for this faction
			if (!(faction in factions)) {
				factions[faction] = repReq
			}
		}

		ns.print(factions)

		if (loop < 99) {

			// Step 3: Loop until we get the invites for and join all factions needed.
			for (let faction in factions) {
				if ((faction == "Sector-12") || (faction == "Chongqing")
					|| (faction == "New Tokyo") || (faction == "Ishima")
					|| (faction == "Aevum") || (faction == "Volhaven")) {
					while (!(ns.getPlayer().factions.includes(faction))) {
						var playerSkills = ns.getPlayer().skills;
						var money = Math.floor(ns.getServerMoneyAvailable('home'));
						var hackLv = playerSkills.hacking;

						// Invite requirements
						var neededMoney = 0;
						var neededHackLv = 0;
						if (faction == "Sector-12") { neededMoney = 15200000; }
						else if (faction == "Chongqing") { neededMoney = 20200000 }
						else if (faction == "New Tokyo") { neededMoney = 20200000 }
						else if (faction == "Ishima") { neededMoney = 30200000 }
						else if (faction == "Aevum") { neededMoney = 40200000 }
						else if (faction == "Volhaven") { neededMoney = 50200000 }

						if ((money >= neededMoney) && (hackLv >= neededHackLv)) {
							ns.singularity.travelToCity(faction);
							ns.singularity.joinFaction(faction);
							WorkFor(faction, "rep", !hasFocusAug);
						}

						TryAscend();

						// ------ Joining Factions
						ns.clearLog();
						ns.print(factions);

						let str1 =
							TextFloat(15, "FacReq", null, "$" + StandardNotation_NS(ns, money, 2)) + "|" +
							TextFloat(10, "/" + StandardNotation_NS(ns, neededMoney, 1), null, null);
						let str2 =
							TextFloat(15, "HackLv", null, StandardNotation_NS(ns, hackLv, 1)) + "|" +
							TextFloat(10, "/" + StandardNotation_NS(ns, neededHackLv, 1), null, null)
						var loopStr3 = loopStr + "3/6 ----"
						ns.run('hud.js', 1, 'loops', loopStr3, str1, str2);
						await ns.sleep(1000)
					}
				} else {
					while (!(ns.getPlayer().factions.includes(faction))) {
						// PLACEHOLDER
						await ns.sleep(1000);
					}
				}
			}











			// GANG RUN STEP: prep the next batch of gang augments for purchase
			// =================================================================
			var gangPurchaseList = [];
			var gangAugs = [];
			if (runType == 2 && loop == 5) {
				// get a list of augments from the gang and remove the ones already installed/purchased
				var templist = await Comm_NS('ns.singularity.getAugmentationsFromFaction()', ["Slum Snakes"]);
				for (let aug of templist) {
					if (!installedAugs.includes(aug)) { gangAugs.push(aug) }
				}
				// if an augment from this list requires a prereq not in the list, remove it.
				templist = gangAugs;
				for (let aug of gangAugs) {
					var preReqList = ns.singularity.getAugmentationPrereq(aug)
					if (preReqList.length > 0) {
						for (var preReq of preReqList) {
							if (!gangAugs.includes(preReq) && !currentAugs.includes(preReq)) {
								DelFromArray(aug, templist);
							}
						}
					}
				}
				gangAugs = templist;


				if (gangAugs.length + gangPurchaseList.length <= 3) { return false }

				// set aside the 4 cheapest augs from the list
				templist = gangAugs;
				for (var n = 0; n < Math.min(gangAugs.length, 4); ++n) {
					var augToBuy = null;
					for (var x = 0; x < gangAugs.length; ++x) {
						var augment = gangAugs[x];
						if ((augToBuy == null) || (ns.singularity.getAugmentationBasePrice(augment) < ns.singularity.getAugmentationBasePrice(augToBuy))) {
							augToBuy = augment;
						}
					}
					gangPurchaseList.push(augToBuy)
					DelFromArray(augToBuy, templist);
				}
				gangAugs = templist;



				// remove ones that are already purchased
				var newlist = [];
				for (let aug of gangPurchaseList) {
					if (!currentAugs.includes(aug)) { newlist.push(aug) }
				}
				gangPurchaseList = newlist;
			}








			// Repeat step 2, now filling in their highest needed rep.
			if (!(runType == 2 && loop == 5)) {

				for (var x = 0; x < augsLeft.length; ++x) {
					var augment = augsLeft[x];
					var repReq = ns.singularity.getAugmentationRepReq(augment);
					ns.print(augment + " needs " + repReq + "rep");
					var faction = augsDict[augment];
					// If this faction is new, add it to our factions dict
					// with the current repReq as the highest repreq for this faction
					if (!(faction in factions)) {
						factions[faction] = repReq
						// else, check if this repreq beats the existing highest repreq for this faction
					} else if (repReq > factions[faction]) {
						// if so, replace it
						factions[faction] = repReq;
					}
				}
			} else {
				for (var x = 0; x < gangPurchaseList.length; ++x) {
					var augment = gangPurchaseList[x];
					var repReq = ns.singularity.getAugmentationRepReq(augment);
					ns.print(augment + " needs " + repReq + "rep");
					var faction = "Slum Snakes";
					// If this faction is new, add it to our factions dict
					// with the current repReq as the highest repreq for this faction
					if (!(faction in factions)) {
						factions[faction] = repReq
						// else, check if this repreq beats the existing highest repreq for this faction
					} else if (repReq > factions[faction]) {
						// if so, replace it
						factions[faction] = repReq;
					}
				}
			}





			// Step 4: Work for/donate to each faction until we have the rep needed for all augments
			// =====================================================================================
			for (var faction in factions) {
				let favorReq = ns.getFavorToDonate();
				let currentFavor = ns.singularity.getFactionFavor(faction);
				let canDonate = (currentFavor >= favorReq);

				while (ns.singularity.getFactionRep(faction) < factions[faction]) {

					var reqDonation;
					if (canDonate) {
						var repReq = factions[faction] - ns.singularity.getFactionRep(faction);
						var repMulti = ns.getPlayer().mults.faction_rep
						// (donation amt * rep multi) / 10^6 = rep gain
						// (rep gain * 10^6) / rep multi = donation amt
						reqDonation = Math.ceil((repReq * (10 ** 6)) / repMulti)
						if (ns.getServerMoneyAvailable('home') >= reqDonation) { ns.run('donate-faction.js', 1, faction, reqDonation) }
					} else {
						// if resetting now would give enough favor to donate, and we are < 75% done with this faction's required rep amount
						if ((ns.singularity.getFactionFavorGain(faction) >= (favorReq - currentFavor))
							&& (ns.singularity.getFactionRep(faction) <= 0.75 * factions[faction])) {
							// remove augments from augsLeft that are from this faction but above our current rep
							var indexOfRemovals = [];
							for (const augment of augsLeft) {
								if ((augsDict[augment] == faction) && (ns.singularity.getAugmentationRepReq(augment) > ns.singularity.getFactionRep(faction))) {

									var augIndex;
									for (var i = 0; i < augsLeft.length; i++) {
										if (augsLeft[i] == augment) {
											indexOfRemovals.push(i);
										}
									}
								}
							}
							while (indexOfRemovals.length > 0) {
								var index = indexOfRemovals.pop()
								if (index > -1) { // only splice array when item is found
									augsLeft.splice(index, 1); // 2nd parameter means remove one item only
								}
							}

							// change faction's neeeded rep to be our current amount
							factions[faction] = ns.singularity.getFactionRep(faction);

							// drop the nfgReq to whatever we can afford
							nfgReq = 0;
						}
					}
					TryAscend();

					if (runType == 1) {
						WorkFor(faction, "rep", !hasFocusAug)
					} else if ((runType == 2) && (faction != "Slum Snakes")) { WorkFor(faction, "rep", !hasFocusAug) }
					ns.clearLog();
					ns.print(factions);
					var str1;
					if (canDonate) {
						str1 =
							TextFloat(15, "Dona", null, "$" + StandardNotation_NS(ns, ns.getServerMoneyAvailable('home'), 1)) + "|" +
							TextFloat(10, "/" + StandardNotation_NS(ns, reqDonation, 2), null, null)
					} else {
						str1 =
							TextFloat(15, "DonFav", null, StandardNotation_NS(ns, currentFavor + ns.singularity.getFactionFavorGain(faction), 2)) + "|" +
							TextFloat(10, "/" + StandardNotation_NS(ns, favorReq, 2), null, null)
					}
					var str2 =
						TextFloat(15, "RepReq", null, StandardNotation_NS(ns, ns.singularity.getFactionRep(faction), 1)) + "|" +
						TextFloat(10, "/" + StandardNotation_NS(ns, factions[faction], 2), null, null)
					var loopStr4 = loopStr + "4/6 ----"
					ns.run('hud.js', 1, 'loops', loopStr4, str1, str2);
					await ns.sleep(1000)
				}
			}
			//Spend the rest of the run getting extra favor for the faction that's the NFG target of this loop
			if (!(runType == 2 && loop == 5)) { WorkFor(augsDict['NeuroFlux Governor'], "rep", !hasFocusAug) } else {
				ns.singularity.travelToCity("Chongqing");
				ns.singularity.joinFaction("Tian Di Hui");
				WorkFor("Tian Di Hui", "rep", !hasFocusAug);
			}











			// Step 5 is complicated. This is where the augments are bought.
			// =============================================================
			var maxWaitTime = -1;
			var worstTime = (ns.getTimeSinceLastAug() + (maxWaitTime * 1000))
			while (augsLeft.length > 0) {

				ns.singularity.travelToCity("Chongqing");
				ns.singularity.joinFaction("Tian Di Hui");
				WorkFor("Tian Di Hui", "rep", !hasFocusAug);
				ns.clearLog();
				var str1 = 'AugDelay ERR|ERROR';
				var str2 = 'BuyAug ERR|ERROR';
				var loopStr5 = loopStr + "5/6 ----";
				var money = ns.getServerMoneyAvailable('home');


				if (runType == 1 || loop != 5) {
					// Step 5a: Determine the augment w/ the highest base price that we need
					var augToBuy = null;
					for (var x = 0; x < augsLeft.length; ++x) {
						var augment = augsLeft[x];
						if ((augToBuy == null) || (ns.singularity.getAugmentationBasePrice(augment) > ns.singularity.getAugmentationBasePrice(augToBuy))) {
							augToBuy = augment;
						}
					}
					// Step 5b: Replace this choice with one of its unbought prereqs, if any exist
					var preReqList = ns.singularity.getAugmentationPrereq(augToBuy)
					TryAscend();
					ns.clearLog();
					if (preReqList.length > 0) {
						for (var x = preReqList.length - 1; x >= 0; --x) {
							var preReq = preReqList[x];
							if ((augsLeft.includes(preReq)) && (!(currentAugs.includes(preReq)))) {
								ns.toast("ERROR: " + augToBuy + " needs prereq " + preReq, "error", 1000);
								augToBuy = preReq;
							}
						}
					}
					//ns.print(augsLeft);

					str1 =
						TextFloat(15, "AugsLeft", null, null) + "|" +
						TextFloat(10, null, null, augsLeft.length)
					str2 =
						TextFloat(15, "BuyAug", null, null) + "|" +
						TextFloat(10, null, null, "$" + StandardNotation_NS(ns, ns.singularity.getAugmentationPrice(augToBuy), 2))

					// Step 5c: Buy this augment and knock it off the list
					if (ns.singularity.purchaseAugmentation(augsDict[augToBuy], augToBuy)) {
						ns.toast("Bought Augmentation " + augToBuy, "success", 15000);
						//ns.scriptKill('lp_buy.js', 'home');
						DelFromArray(augToBuy, augsLeft);
					}




				} else if (runType == 2 && loop == 5) {
					if (gangPurchaseList.length > 0) {

						ns.print(gangPurchaseList)

						// Step 5a: Determine the augment w/ the highest base price that we need
						var augToBuy = null;
						for (var x = 0; x < gangPurchaseList.length; ++x) {
							var augment = gangPurchaseList[x];
							if ((augToBuy == null) || (ns.singularity.getAugmentationBasePrice(augment) > ns.singularity.getAugmentationBasePrice(augToBuy))) {
								augToBuy = augment;
							}
						}

						// Step 5b: Replace this choice with one of its unbought prereqs, if any exist
						var preReqList = ns.singularity.getAugmentationPrereq(augToBuy)
						TryAscend();
						if (preReqList.length > 0) {
							for (var x = preReqList.length - 1; x >= 0; --x) {
								var preReq = preReqList[x];
								if ((gangPurchaseList.includes(preReq)) && (!(currentAugs.includes(preReq)))) {
									ns.toast("ERROR: " + augToBuy + " needs prereq " + preReq, "error", 1000);
									augToBuy = preReq;
								}
							}
						}

						str1 =
							TextFloat(15, "AugsLeft", null, null) + "|" +
							TextFloat(10, null, null, gangPurchaseList.length)
						str2 =
							TextFloat(15, "BuyAug", null, null) + "|" +
							TextFloat(10, null, null, "$" + StandardNotation_NS(ns, ns.singularity.getAugmentationPrice(augToBuy), 2))

						// Step 5c: Buy this augment and knock it off the list
						if (ns.singularity.purchaseAugmentation("Slum Snakes", augToBuy)) {
							ns.toast("Bought Augmentation " + augToBuy, "success", 15000);
							//ns.scriptKill('lp_buy.js', 'home');
							DelFromArray(augToBuy, gangPurchaseList);
						}


						// Step 5d: continuously buy the cheapest augment available until this is no longer possible within a given timeframe.
					} else {
						if (maxWaitTime = -1) { maxWaitTime = Math.min(300, ((ns.getTimeSinceLastAug() * 4) / 1000)) };
						// Figure out the cheapest augment
						var cheapaug = null;
						for (var x = 0; x < gangAugs.length; ++x) {
							var augment = gangAugs[x];
							ns.print(augment)
							if ((cheapaug == null) || (ns.singularity.getAugmentationPrice(augment) < ns.singularity.getAugmentationPrice(cheapaug))) {
								cheapaug = augment;
							}
						}

						// attempt to buy the cheapest aug and knock it off the list repeatedly until the timer runs out.
						if (money >= 0.95 * ns.singularity.getAugmentationPrice(cheapaug) || ns.getTimeSinceLastAug() < worstTime) {
							loopStr5 = loopStr + "6/6 ----"
							str1 =
								TextFloat(15, "AugDelay", null, null) + "|" +
								TextFloat(10, null, null, "[" + StandardTime(Math.ceil((worstTime - ns.getTimeSinceLastAug()) / 1000)) + "]")
							str2 =
								TextFloat(15, "BuyAug", null, null) + "|" +
								TextFloat(10, null, null, "$" + StandardNotation_NS(ns, ns.singularity.getAugmentationPrice(cheapaug), 2))

							if (ns.singularity.purchaseAugmentation("Slum Snakes", cheapaug)) {
								ns.toast("Bought Augmentation " + cheapaug, "success", 15000);
								DelFromArray(cheapaug, gangAugs);
								worstTime = (ns.getTimeSinceLastAug() + (maxWaitTime * 1000));
							}
							// When the timer runs out, break out of the loop to restart & install augments.
						} else {
							augsLeft = [];
						}
					}
				}
				//ns.print(augsLeft)
				TryAscend();
				ns.run('hud.js', 1, 'loops', loopStr5, str1, str2);
				await ns.sleep(1009);
			}
		}







		// Step 6: Buy some NFGs (minimum amount + as many as we can afford)
		// =================================================================
		if (runType != 2 || loop != 5) {
			while ((nfgBought < nfgReq) ||
				((ns.singularity.getFactionRep(augsDict['NeuroFlux Governor']) >= ns.singularity.getAugmentationRepReq('NeuroFlux Governor'))
					&& (ns.getServerMoneyAvailable('home') >= 0.99 * ns.singularity.getAugmentationPrice('NeuroFlux Governor')))) {
				var targetFaction = augsDict['NeuroFlux Governor'];
				WorkFor(targetFaction, "exp", !hasFocusAug);
				let favorReq = ns.getFavorToDonate();
				let currentFavor = ns.singularity.getFactionFavor(targetFaction);
				let canDonate = (currentFavor >= favorReq);
				var factRep = ns.singularity.getFactionRep(targetFaction);
				var repCost = ns.singularity.getAugmentationRepReq('NeuroFlux Governor');

				var money = Math.floor(ns.getServerMoneyAvailable('home'));
				var cost = ns.singularity.getAugmentationPrice('NeuroFlux Governor');


				if (ns.singularity.purchaseAugmentation(targetFaction, 'NeuroFlux Governor')) { nfgBought += 1; }
				if (canDonate) {
					var reqDonation = ns.singularity.getAugmentationPrice('NeuroFlux Governor')
					if (ns.getServerMoneyAvailable('home') >= (2 * reqDonation)) { ns.run('donate-faction.js', 1, targetFaction, reqDonation) }
				}
				TryAscend();


				var str1 =
					TextFloat(15, "BuyNFG", null, "$" + StandardNotation_NS(ns, money, 1)) + "|" +
					TextFloat(10, "/" + StandardNotation_NS(ns, cost, 2), null, null);
				var str2 =
					TextFloat(15, "RepReq", null, StandardNotation_NS(ns, factRep, 2)) + "|" +
					TextFloat(10, "/" + StandardNotation_NS(ns, repCost, 2), null, null);
				var loopStr6 = loopStr + "6/6 ----"
				ns.run('hud.js', 1, 'loops', loopStr6, str1, str2);
				await ns.sleep(1000);
			}
		}

		// End this run/loop.
		return true;
	}




	// RUN TYPES:
	// 1: Regular (Use every asset)
	// 2: Gang Augments (combat skills, then regular)
	var runType = ns.args[0] || 2





	// RUN TYPE #1 - Regular
	if (runType == 1) {
		var loop = 1; var augsToBuy =
		{

			"Social Negotiation Assistant (S.N.A)": "Tian Di Hui", // (7.5k rep)
			"ADR-V1 Pheromone Gene": "Tian Di Hui",

			"Hacknet Node Core Direct-Neural Interface": "Netburners", // (??? rep)
			"Hacknet Node Kernel Direct-Neural Interface": "Netburners",

			"Synaptic Enhancement Implant": "CyberSec", // (3.75k rep)
			"Neurotrainer I": "CyberSec",

			"CashRoot Starter Kit": "Sector-12", // (12.5k rep)

			"NeuroFlux Governor": "NiteSec"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 2; augsToBuy =
		{
			"Hacknet Node CPU Architecture Neural-Upload": "Netburners", // (12.5k rep)
			"Hacknet Node Cache Architecture Neural-Upload": "Netburners",
			"Hacknet Node NIC Architecture Neural-Upload": "Netburners",

			"BitWire": "NiteSec", // (10k rep)
			"Artificial Synaptic Potentiation": "NiteSec",
			"Cranial Signal Processors - Gen I": "NiteSec",
			"Neurotrainer II": "NiteSec",

			"NeuroFlux Governor": "NiteSec"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 3; augsToBuy =
		{
			"Embedded Netburner Module": "NiteSec", // (50k rep)
			"Cranial Signal Processors - Gen II": "NiteSec",
			"Neural-Retention Enhancement": "NiteSec",
			"CRTX42-AA Gene Modification": "NiteSec",
			"Cranial Signal Processors - Gen III": "NiteSec",

			"Neuregen Gene Modification": "Chongqing", // (37.5k rep)

			"NeuroFlux Governor": "NiteSec"

		}

		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 4; augsToBuy =
		{
			"Neuralstimulator": "The Black Hand", // (175k rep)
			"Enhanced Myelin Sheathing": "The Black Hand",
			"The Black Hand": "The Black Hand",
			"DataJack": "The Black Hand",
			"Cranial Signal Processors - Gen IV": "The Black Hand",
			"Embedded Netburner Module Core Implant": "The Black Hand",

			"NeuroFlux Governor": "The Black Hand"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 5; augsToBuy =
		{
			"PCMatrix": "Aevum", // (100k rep)

			"Neural Accelerator": "BitRunners", // (275k rep)???
			"Cranial Signal Processors - Gen V": "BitRunners",
			"Artificial Bio-neural Network Implant": "BitRunners",

			"NeuroFlux Governor": "BitRunners"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 6; augsToBuy =
		{
			"BitRunners Neurolink": "BitRunners", // (1m rep)???
			"Embedded Netburner Module Core V2 Upgrade": "BitRunners",

			"NeuroFlux Governor": "BitRunners"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 7; augsToBuy =
		{
			"Embedded Netburner Module Analyze Engine": "Daedalus", // (2.5m rep)
			"Embedded Netburner Module Direct Memory Access Upgrade": "Daedalus",
			"Embedded Netburner Module Core V3 Upgrade": "Daedalus",
			"The Red Pill": "Daedalus",

			"NeuroFlux Governor": "Daedalus"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		// --------------------------------------------------------------------------------------------
		// from this point onward if I can ascend, I will
		// --------------------------------------------------------------------------------------------
		loop = 20; augsToBuy =
		{
			"Wired Reflexes": "Tian Di Hui", // (75k rep)
			"Speech Enhancement": "Tian Di Hui",
			"Nuoptimal Nootropic Injector Implant": "Tian Di Hui",
			"Speech Processor Implant": "Tian Di Hui",
			"Nanofiber Weave": "Tian Di Hui",
			"Neuroreceptor Management Implant": "Tian Di Hui",

			"NutriGen Implant": "New Tokyo",
			"INFRARET Enhancement": "Ishima",

			"NeuroFlux Governor": "Tian Di Hui"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 21; augsToBuy =
		{
			"Augmented Targeting I": "Blade Industries",
			"Combat Rib I": "Blade Industries",
			"PC Direct-Neural Interface": "Blade Industries",
			"PC Direct-Neural Interface Optimization Submodule": "Blade Industries",
			"HyperSight Corneal Implant": "Blade Industries",
			"Neotra": "Blade Industries",

			"NeuroFlux Governor": "Blade Industries"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 22; augsToBuy =
		{
			"Bionic Spine": "Blade Industries",
			"Bionic Legs": "Blade Industries",
			"Augmented Targeting II": "Blade Industries",
			"Augmented Targeting III": "Blade Industries",
			"Synfibril Muscle": "Blade Industries",
			"Combat Rib II": "Blade Industries",
			"Combat Rib III": "Blade Industries",

			"NeuroFlux Governor": "Blade Industries"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 23; augsToBuy =
		{
			"PC Direct-Neural Interface NeuroNet Injector": "Fulcrum Secret Technologies",
			"NEMEAN Subdermal Weave": "Fulcrum Secret Technologies",
			"Graphene Bone Lacings": "Fulcrum Secret Technologies",
			"Graphene Bionic Legs Upgrade": "Fulcrum Secret Technologies",
			"Graphene Bionic Spine Upgrade": "Fulcrum Secret Technologies",
			"Synthetic Heart": "Fulcrum Secret Technologies",

			"NeuroFlux Governor": "Blade Industries"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 24; augsToBuy =
		{
			"SmartJaw": "Bachman & Associates", // (375k rep)
			"ADR-V2 Pheromone Gene": "Bachman & Associates",
			"FocusWire": "Bachman & Associates",
			"Enhanced Social Interaction Implant": "Bachman & Associates",

			"NeuroFlux Governor": "Blade Industries"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 25; augsToBuy =
		{
			"Neuronal Densification": "Clarke Incorporated", // (437.5k rep)
			"nextSENS Gene Modification": "Clarke Incorporated",
			"NeuroFlux Governor": "Blade Industries"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 26; augsToBuy =
		{
			"OmniTek InfoLoad": "OmniTek Incorporated", // (625k rep)
			"NeuroFlux Governor": "Blade Industries"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 27; augsToBuy =
		{
			"Neurotrainer III": "NWO", // (1.25m rep)
			"Power Recirculation Core": "NWO",
			"Xanipher": "NWO",
			"Hydroflame Left Arm": "NWO",
			"NeuroFlux Governor": "NWO"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 28; augsToBuy =
		{
			"ECorp HVMind Implant": "ECorp", // (1.5m rep)
			"NeuroFlux Governor": "ECorp"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 29; augsToBuy =
		{
			"DermaForce Particle Barrier": "The Syndicate", // (15k rep)
			"NeuroFlux Governor": "Blade Industries"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 30; augsToBuy =
		{
			"DermaForce Particle Barrier": "Volhaven", // (15k rep)
			"Photosynthetic Cells": "KuaiGong International", // (562k rep)
			"CordiARC Fusion Reactor": "MegaCorp", // (1.125m rep)
			"NeuroFlux Governor": "MegaCorp"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		// At this point I have run out of pre-picked augments to purchase, so just grind NFGs until ascension.
		loop = 99; augsToBuy =
		{
			"NeuroFlux Governor": "Blade Industries"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
	}





	// RUN TYPE #2 - Gang Augmenting
	if (runType == 2 && ns.gang.inGang()) {
		var loop = 1; var augsToBuy =
		{
			"CashRoot Starter Kit": "Sector-12", // (12.5k rep)

			"Social Negotiation Assistant (S.N.A)": "Tian Di Hui", // (7.5k rep)
			"ADR-V1 Pheromone Gene": "Tian Di Hui",

			"NeuroFlux Governor": "Sector-12"

		}
		/*if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 2; augsToBuy =
		{
			//"Neuroreceptor Management Implant": "Slum Snakes",
			"The Shadow's Simulacrum": "Slum Snakes",
			"ADR-V2 Pheromone Gene": "Slum Snakes",
			"The Black Hand": "Slum Snakes",
			"Neurotrainer I": "Slum Snakes",
			"Neurotrainer II": "Slum Snakes",
			"DataJack": "Slum Snakes",
	
			"NeuroFlux Governor": "Tetrads"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 3; augsToBuy =
		{
			//"Neuroreceptor Management Implant": "Slum Snakes",
			"Neurotrainer III": "Slum Snakes",
			"PCMatrix": "Slum Snakes",
	
			"NeuroFlux Governor": "Tetrads"
		}*/
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		// -----------------------------------------------------------------------------
		// Loop this part until we buy literally everything the gang has to offer
		// -----------------------------------------------------------------------------
		loop = 5; augsToBuy =
		{
			// Special loop, this is a specific keyphrase
			"BuyEverything": "Slum Snakes"

		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 19; augsToBuy =
		{
			"Embedded Netburner Module Analyze Engine": "Daedalus", // (2.5m rep)
			"Embedded Netburner Module Direct Memory Access Upgrade": "Daedalus",
			"Embedded Netburner Module Core V3 Upgrade": "Daedalus",
			"The Red Pill": "Daedalus",

			"NeuroFlux Governor": "Daedalus"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		// --------------------------------------------------------------------------------------------
		// now follow the path of runtype 1
		// --------------------------------------------------------------------------------------------
		/*loop = 20; augsToBuy =
		{
			"Neuroreceptor Management Implant": "Tian Di Hui",
			
			"NeuroFlux Governor": "Tian Di Hui"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }*/
		loop = 21; augsToBuy =
		{
			"Social Negotiation Assistant (S.N.A)": "Tian Di Hui", // (7.5k rep)
			"ADR-V1 Pheromone Gene": "Tian Di Hui",

			"Hacknet Node Core Direct-Neural Interface": "Netburners", // (??? rep)
			"Hacknet Node Kernel Direct-Neural Interface": "Netburners",

			"Synaptic Enhancement Implant": "CyberSec", // (3.75k rep)
			"Neurotrainer I": "CyberSec",

			"CashRoot Starter Kit": "Sector-12", // (12.5k rep)

			"NeuroFlux Governor": "CyberSec"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 22; augsToBuy =
		{
			"Hacknet Node CPU Architecture Neural-Upload": "Netburners", // (12.5k rep)
			"Hacknet Node Cache Architecture Neural-Upload": "Netburners",
			"Hacknet Node NIC Architecture Neural-Upload": "Netburners",

			"BitWire": "NiteSec", // (10k rep)
			"Artificial Synaptic Potentiation": "NiteSec",
			"Cranial Signal Processors - Gen I": "NiteSec",
			"Neurotrainer II": "NiteSec",

			"NeuroFlux Governor": "NiteSec"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 23; augsToBuy =
		{
			"Embedded Netburner Module": "NiteSec", // (50k rep)
			"Cranial Signal Processors - Gen II": "NiteSec",
			"Neural-Retention Enhancement": "NiteSec",
			"CRTX42-AA Gene Modification": "NiteSec",
			"Cranial Signal Processors - Gen III": "NiteSec",

			"Neuregen Gene Modification": "Chongqing", // (37.5k rep)

			"NeuroFlux Governor": "NiteSec"

		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 24; augsToBuy =
		{
			"Neuralstimulator": "The Black Hand", // (175k rep)
			"Enhanced Myelin Sheathing": "The Black Hand",
			"The Black Hand": "The Black Hand",
			"DataJack": "The Black Hand",
			"Cranial Signal Processors - Gen IV": "The Black Hand",
			"Embedded Netburner Module Core Implant": "The Black Hand",

			"NeuroFlux Governor": "The Black Hand"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 25; augsToBuy =
		{
			"PCMatrix": "Aevum", // (100k rep)

			"Neural Accelerator": "BitRunners", // (275k rep)???
			"Cranial Signal Processors - Gen V": "BitRunners",
			"Artificial Bio-neural Network Implant": "BitRunners",

			"NeuroFlux Governor": "BitRunners"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 26; augsToBuy =
		{
			"BitRunners Neurolink": "BitRunners", // (1m rep)???
			"Embedded Netburner Module Core V2 Upgrade": "BitRunners",

			"NeuroFlux Governor": "BitRunners"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 27; augsToBuy =
		{
			"Embedded Netburner Module Analyze Engine": "Daedalus", // (2.5m rep)
			"Embedded Netburner Module Direct Memory Access Upgrade": "Daedalus",
			"Embedded Netburner Module Core V3 Upgrade": "Daedalus",
			"The Red Pill": "Daedalus",

			"NeuroFlux Governor": "Daedalus"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 30; augsToBuy =
		{
			"Wired Reflexes": "Tian Di Hui", // (75k rep)
			"Speech Enhancement": "Tian Di Hui",
			"Nuoptimal Nootropic Injector Implant": "Tian Di Hui",
			"Speech Processor Implant": "Tian Di Hui",
			"Nanofiber Weave": "Tian Di Hui",
			"Neuroreceptor Management Implant": "Tian Di Hui",

			"NutriGen Implant": "New Tokyo",
			"INFRARET Enhancement": "Ishima",

			"NeuroFlux Governor": "Tian Di Hui"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 31; augsToBuy =
		{
			"Augmented Targeting I": "Blade Industries",
			"Combat Rib I": "Blade Industries",
			"PC Direct-Neural Interface": "Blade Industries",
			"PC Direct-Neural Interface Optimization Submodule": "Blade Industries",
			"HyperSight Corneal Implant": "Blade Industries",
			"Neotra": "Blade Industries",

			"NeuroFlux Governor": "Blade Industries"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 32; augsToBuy =
		{
			"Bionic Spine": "Blade Industries",
			"Bionic Legs": "Blade Industries",
			"Augmented Targeting II": "Blade Industries",
			"Augmented Targeting III": "Blade Industries",
			"Synfibril Muscle": "Blade Industries",
			"Combat Rib II": "Blade Industries",
			"Combat Rib III": "Blade Industries",

			"NeuroFlux Governor": "Blade Industries"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 33; augsToBuy =
		{
			"PC Direct-Neural Interface NeuroNet Injector": "Fulcrum Secret Technologies",
			"NEMEAN Subdermal Weave": "Fulcrum Secret Technologies",
			"Graphene Bone Lacings": "Fulcrum Secret Technologies",
			"Graphene Bionic Legs Upgrade": "Fulcrum Secret Technologies",
			"Graphene Bionic Spine Upgrade": "Fulcrum Secret Technologies",
			"Synthetic Heart": "Fulcrum Secret Technologies",

			"NeuroFlux Governor": "Blade Industries"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 34; augsToBuy =
		{
			"SmartJaw": "Bachman & Associates", // (375k rep)
			"ADR-V2 Pheromone Gene": "Bachman & Associates",
			"FocusWire": "Bachman & Associates",
			"Enhanced Social Interaction Implant": "Bachman & Associates",

			"NeuroFlux Governor": "Blade Industries"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 35; augsToBuy =
		{
			"Neuronal Densification": "Clarke Incorporated", // (437.5k rep)
			"nextSENS Gene Modification": "Clarke Incorporated",
			"NeuroFlux Governor": "Blade Industries"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 36; augsToBuy =
		{
			"OmniTek InfoLoad": "OmniTek Incorporated", // (625k rep)
			"NeuroFlux Governor": "Blade Industries"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 37; augsToBuy =
		{
			"Neurotrainer III": "NWO", // (1.25m rep)
			"Power Recirculation Core": "NWO",
			"Xanipher": "NWO",
			"Hydroflame Left Arm": "NWO",
			"NeuroFlux Governor": "NWO"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 38; augsToBuy =
		{
			"ECorp HVMind Implant": "ECorp", // (1.5m rep)
			"NeuroFlux Governor": "ECorp"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 39; augsToBuy =
		{
			"DermaForce Particle Barrier": "The Syndicate", // (15k rep)
			"NeuroFlux Governor": "Blade Industries"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		loop = 40; augsToBuy =
		{
			"DermaForce Particle Barrier": "Volhaven", // (15k rep)
			"Photosynthetic Cells": "KuaiGong International", // (562k rep)
			"CordiARC Fusion Reactor": "MegaCorp", // (1.125m rep)
			"NeuroFlux Governor": "MegaCorp"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		// ------------------------------------------------------------------------
		// At this point I have finished runType 1.
		// ------------------------------------------------------------------------
		loop = 90; augsToBuy =
		{
			"QLink": "Illuminati",

			"NeuroFlux Governor": "Illuminati"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
		// ------------------------------------------------------------------------
		// At this point I have run out of pre-picked augments to purchase, so just grind NFGs until ascension.
		// ------------------------------------------------------------------------
		loop = 99; augsToBuy =
		{
			"NeuroFlux Governor": "Tetrads"
		}
		if (await CompleteLoop(augsToBuy, loop)) { ns.run('endRun.js') }
	}
}

/*"Neurotrainer I": "Slum Snakes",
"Hacknet Node NIC Architecture Neural-Upload": "Slum Snakes",
"Synaptic Enhancement Implant": "Slum Snakes",
"Speech Enhancement": "Slum Snakes",
"Hacknet Node Cache Architecture Neural-Upload": "Slum Snakes",
"Hacknet Node CPU Architecture Neural-Upload": "Slum Snakes",
"BitWire": "Slum Snakes",

"Augmented Targeting I": "Slum Snakes",
"Nuoptimal Nootropic Injector Implant": "Slum Snakes",
"LuminCloaking-V2 Skin Implant": "Slum Snakes",
"Artificial Synaptic Potentiation": "Slum Snakes",
"Combat Rib I": "Slum Snakes",
"Speech Processor Implant": "Slum Snakes",
"Hacknet Node Kernel Direct-Neural Interface": "Slum Snakes",

"INFRARET Enhancement": "Slum Snakes",
"Augmented Targeting II": "Slum Snakes",
"HemoRecirculator": "Slum Snakes",
"Cranial Signal Processors - Gen I": "Slum Snakes",
"Neurotrainer II": "Slum Snakes",
"Hacknet Node Core Direct-Neural Interface": "Slum Snakes",
"BrachiBlades": "Slum Snakes",

"Embedded Netburner Module": "Slum Snakes",
"DermaForce Particle Barrier": "Slum Snakes",
"Combat Rib II": "Slum Snakes",
"Cranial Signal Processors - Gen II": "Slum Snakes",
"Neural-Retention Enhancement": "Slum Snakes",
"SmartSonar Implant": "Slum Snakes",
"TITN-41 Gene-Modification Injection": "Slum Snakes",

"Neurotrainer III": "Slum Snakes",
"Power Recirculation Core": "Slum Snakes",
"Augmented Targeting III": "Slum Snakes",
"Combat Rib III": "Slum Snakes",
"Nanofiber Weave": "Slum Snakes",
"The Shadow's Simulacrum": "Slum Snakes",
"Neuregen Gene Modification": "Slum Snakes",

"Bionic Spine": "Slum Snakes",
"CRTX42-AA Gene Modification": "Slum Snakes",
"Neuralstimulator": "Slum Snakes",
"Cranial Signal Processors - Gen III": "Slum Snakes",
"ADR-V2 Pheromone Gene": "Slum Snakes",
"Bionic Arms": "Slum Snakes",
"FocusWire": "Slum Snakes",

"Neuroreceptor Management Implant": "Slum Snakes",
"Enhanced Myelin Sheathing": "Slum Snakes",
"The Black Hand": "Slum Snakes",
"PCMatrix": "Slum Snakes",
"DataJack": "Slum Snakes",
"Cranial Signal Processors - Gen IV": "Slum Snakes",
"Bionic Legs": "Slum Snakes",

"HyperSight Corneal Implant": "Slum Snakes",
"Embedded Netburner Module Core Implant": "Slum Snakes",
"Neuronal Densification": "Slum Snakes",
"Neural Accelerator": "Slum Snakes",
"Graphene BrachiBlades Upgrade": "Slum Snakes",
"Cranial Signal Processors - Gen V": "Slum Snakes",
"Artificial Bio-neural Network Implant": "Slum Snakes",

"Unstable Circadian Modulator": "Slum Snakes",
"Enhanced Social Interaction Implant": "Slum Snakes",
"PC Direct-Neural Interface": "Slum Snakes",
"SmartJaw": "Slum Snakes",
"Synfibril Muscle": "Slum Snakes",
"nextSENS Gene Modification": "Slum Snakes",
"PC Direct-Neural Interface Optimization Submodule": "Slum Snakes",

"Graphene Bionic Arms Upgrade": "Slum Snakes",
"Neotra": "Slum Snakes",
"Photosynthetic Cells": "Slum Snakes",
"Embedded Netburner Module Analyze Engine": "Slum Snakes",
"OmniTek InfoLoad": "Slum Snakes",
"Synthetic Heart": "Slum Snakes",
"Graphene Bionic Legs Upgrade": "Slum Snakes",

"NEMEAN Subdermal Weave": "Slum Snakes",
"Xanipher": "Slum Snakes",
"BitRunners Neurolink": "Slum Snakes",
"Embedded Netburner Module Core V2 Upgrade": "Slum Snakes",
"Embedded Netburner Module Direct Memory Access Upgrade": "Slum Snakes",
"Graphene Bone Lacings": "Slum Snakes",
"CordiARC Fusion Reactor": "Slum Snakes",

"SPTN-97 Gene Modification": "Slum Snakes",
"Hydroflame Left Arm": "Slum Snakes",
"PC Direct-Neural Interface NeuroNet Injector": "Slum Snakes",
"ECorp HVMind Implant": "Slum Snakes",
"Graphene Bionic Spine Upgrade": "Slum Snakes",
"Embedded Netburner Module Core V3 Upgrade": "Slum Snakes",
"QLink": "Slum Snakes",
"The Red Pill": "Slum Snakes",*/

/*

LuminCloaking-V2 Skin Implant

Missing 1 pre-requisite(s)

$57.000m

5.000k rep

Artificial Synaptic Potentiation

$152.000m

6.250k rep

NutriGen Implant

$4.750m

6.250k rep

Combat Rib I

$45.125m

7.500k rep

Speech Processor Implant

$95.000m

7.500k rep

Hacknet Node Kernel Direct-Neural Interface

$76.000m

7.500k rep

INFRARET Enhancement

$57.000m

7.500k rep

Augmented Targeting II

Missing 1 pre-requisite(s)

$80.750m

8.750k rep

HemoRecirculator

$85.500m

10.000k rep

Cranial Signal Processors - Gen I

$133.000m

10.000k rep

Neurotrainer II

$85.500m

10.000k rep

Hacknet Node Core Direct-Neural Interface

$114.000m

12.500k rep

CashRoot Starter Kit

$237.500m

12.500k rep

BrachiBlades

$171.000m

12.500k rep

Embedded Netburner Module

$475.000m

15.000k rep

DermaForce Particle Barrier

$95.000m

15.000k rep

Combat Rib II

Missing 1 pre-requisite(s)

$123.500m

18.750k rep

Cranial Signal Processors - Gen II

Missing 1 pre-requisite(s)

$237.500m

18.750k rep

Neural-Retention Enhancement

$475.000m

20.000k rep

SmartSonar Implant

$142.500m

22.500k rep

TITN-41 Gene-Modification Injection

$361.000m

25.000k rep

Neurotrainer III

$247.000m

25.000k rep

Power Recirculation Core

$342.000m

25.000k rep

Augmented Targeting III

Missing 2 pre-requisite(s)

$218.500m

27.500k rep

Combat Rib III

Missing 2 pre-requisite(s)

$228.000m

35.000k rep

Nanofiber Weave

$237.500m

37.500k rep

The Shadow's Simulacrum

$760.000m

37.500k rep

Neuregen Gene Modification

$712.500m

37.500k rep

Bionic Spine

$237.500m

45.000k rep

CRTX42-AA Gene Modification

$427.500m

45.000k rep

Neuralstimulator

$5.700b

50.000k rep

Cranial Signal Processors - Gen III

Missing 2 pre-requisite(s)

$1.045b

50.000k rep

ADR-V2 Pheromone Gene

$1.045b

62.500k rep

Bionic Arms

$522.500m

62.500k rep

FocusWire

$1.710b

75.000k rep

Neuroreceptor Management Implant

$1.045b

75.000k rep

Enhanced Myelin Sheathing

$2.613b

100.000k rep

The Black Hand

$1.045b

100.000k rep

PCMatrix

$3.800b

100.000k rep

DataJack

$855.000m

112.500k rep

Cranial Signal Processors - Gen IV

Missing 3 pre-requisite(s)

$2.090b

125.000k rep

Bionic Legs

$712.500m

150.000k rep

HyperSight Corneal Implant

$5.225b

150.000k rep

Embedded Netburner Module Core Implant

Missing 1 pre-requisite(s)

$4.750b

175.000k rep

Neuronal Densification

$2.613b

187.500k rep

Neural Accelerator

$3.325b

200.000k rep

Graphene BrachiBlades Upgrade

Missing 1 pre-requisite(s)

$4.750b

225.000k rep

Cranial Signal Processors - Gen V

Missing 4 pre-requisite(s)

$4.275b

250.000k rep

Artificial Bio-neural Network Implant

$5.700b

275.000k rep

Unstable Circadian Modulator

$9.500b

362.500k rep

Enhanced Social Interaction Implant

$2.613b

375.000k rep

PC Direct-Neural Interface

$7.125b

375.000k rep

SmartJaw

$5.225b

375.000k rep

Synfibril Muscle

$2.138b

437.500k rep

nextSENS Gene Modification

$3.658b

437.500k rep

PC Direct-Neural Interface Optimization Submodule

Missing 1 pre-requisite(s)

$8.550b

500.000k rep

Graphene Bionic Arms Upgrade

Missing 1 pre-requisite(s)

$7.125b

500.000k rep

Neotra

$5.463b

562.500k rep

Photosynthetic Cells

$5.225b

562.500k rep

Embedded Netburner Module Analyze Engine

Missing 1 pre-requisite(s)

$11.400b

625.000k rep

OmniTek InfoLoad

$5.463b

625.000k rep

Synthetic Heart

$5.463b

750.000k rep

Graphene Bionic Legs Upgrade

Missing 1 pre-requisite(s)

$8.550b

750.000k rep

NEMEAN Subdermal Weave

$6.175b

875.000k rep

Xanipher

$8.075b

875.000k rep

BitRunners Neurolink

$8.313b

875.000k rep

Embedded Netburner Module Core V2 Upgrade

Missing 2 pre-requisite(s)

$8.550b

1.000m rep

Embedded Netburner Module Direct Memory Access Upgrade

Missing 1 pre-requisite(s)

$13.300b

1.000m rep

Graphene Bone Lacings

$8.075b

1.125m rep

CordiARC Fusion Reactor

$9.500b

1.125m rep

SPTN-97 Gene Modification

$9.263b

1.250m rep

Hydroflame Left Arm

$4.750t

1.250m rep

PC Direct-Neural Interface NeuroNet Injector

Missing 1 pre-requisite(s)

$14.250b

1.500m rep

ECorp HVMind Implant

$10.450b

1.500m rep

Graphene Bionic Spine Upgrade

Missing 1 pre-requisite(s)

$11.400b

1.625m rep

Embedded Netburner Module Core V3 Upgrade

Missing 3 pre-requisite(s)

$14.250b

1.750m rep

QLink

$47.500t

1.875m rep

The Red Pill

$0.000

2.500m rep
*/