import * as nstb from "./lib/nstools";
import * as tb from "./lib/toolbox";

/** @param {import("..").NS} ns */
export async function main(ns) {
	ns.closeTail(); await ns.sleep(1); ns.tail('lp_loopmaster.js'); await ns.sleep(1); ns.resizeTail(340, 400); await ns.sleep(1); ns.moveTail(1520, 190);
	ns.disableLog("ALL"); ns.clearLog();

	let GLOBAL_VARS = nstb.getGlobals(ns);
	const runType = GLOBAL_VARS["runType"]
	const bndata = GLOBAL_VARS["bnMults"]
	const strats = GLOBAL_VARS["strats"]

	let loopnum = 0;

	while (true) {
		GLOBAL_VARS = nstb.getGlobals(ns);
		let player = await nstb.RunCom(ns, 'ns.getPlayer()');
		let ownedAugs = await nstb.RunCom(ns, 'ns.singularity.getOwnedAugmentations()', [true])
		const installedAugs = await nstb.RunCom(ns, 'ns.singularity.getOwnedAugmentations()');
		let queuedAugs = tb.ArrSubtract(ownedAugs, installedAugs, 1);

		const hashdata = GLOBAL_VARS["hash"]
		const gangdata = GLOBAL_VARS["gang"]
		const corpdata = GLOBAL_VARS["corp"]
		const bbdata = GLOBAL_VARS["bb"]

		ns.clearLog();
		ns.print("Loops: ", loopnum)

		// Check 1: Sleeves
		// -------------------------
		const reqShock = Math.floor(75 ** bndata["StrengthLevelMultiplier"])
		const sleeveShock = GLOBAL_VARS["sleeve"]["shock"];
		// - All sleeves at shock 0
		const check1 = (sleeveShock < reqShock)
		let checkmark1 = "[ ]"; if (check1) checkmark1 = "[✓]";
		ns.print(`\n${checkmark1} Check #1: Sleeves`)
		if (!check1) ns.print(`• Need all sleeves below shock ${reqShock}`);



		// Check 2: Gang
		// -------------------------
		const hasGang = gangdata["has"]
		const wantGang = gangdata["want"]
		let thugcount = 0;
		let thugmults = [];
		const territory = gangdata["territory"]
		const rep = gangdata["respect"]
		if (hasGang) {
			var members = await nstb.RunCom(ns, 'ns.gang.getMemberNames()');
			thugcount = members.length // 12 thugs
			for (var n = 0; n < thugcount; ++n) {
				let memberInfo = await nstb.RunCom(ns, 'ns.gang.getMemberInformation()', [members[n]]);
				var avgmulti = (memberInfo.str_asc_mult + memberInfo.def_asc_mult + memberInfo.dex_asc_mult + memberInfo.agi_asc_mult) / 4;
				thugmults.push(avgmulti); // a is thug >=lv 4 at an avg >=(x8) asc multiplier
			}
		}
		// - In a gang (if we want one)
		const check2a = (!wantGang)
		// - Gang has 12 thugs
		const check2b = (!hasGang || thugcount == 12)
		// - all thugs >=lv 4
		const check2c = (!hasGang || tb.GetMinOfArray(thugmults) >= 8)
		// - >= 20% territory.
		const check2d = (!hasGang || territory >= 0.20)
		// - >= 2b resp.
		const check2e = (!hasGang || rep >= 2e9)
		const checksum2 = (check2a && check2b && check2c && check2d && check2e)
		let checkmark2 = "[ ]"; if (checksum2) checkmark2 = "[✓]";
		ns.print(`\n${checkmark2} Check #2: Gang`)
		if (!check2a) ns.print("• Need a gang");
		if (!check2b) ns.print("• Need 12 thugs");
		if (!check2c) ns.print("• Need all thugs >= lv 4");
		if (!check2d) ns.print("• Need 20% territory");
		if (!check2e) ns.print("• Need 2b resp");



		// Check 3: Corporation
		// -------------------------
		const hasCorp = player.hasCorporation
		const fundCost = ns.hacknet.hashCost("Sell for Corporation Funds");
		const resrCost = ns.hacknet.hashCost("Exchange for Corporation Research");
		const isFundNotNeeded = (corpdata["profit"] >= 500e6)
		const isResrNotNeeded = (corpdata["hasTAII"] && corpdata["research"] >= 10e6)
		// - Has corp (if we want one)
		const check3a = (!corpdata["want"])
		// - Has Lab
		const check3b = (!hasCorp || corpdata["hasLab"])
		// - Has >= 3 products
		const check3c = (!hasCorp || corpdata["products"].length >= 3)
		// - buying funds w/ hashes is either not needed OR (cost >= 5k*BNmult AND cost > 1min of hash production)
		const check3d = (!hasCorp || !("hackn" in strats) || isFundNotNeeded || fundCost > Math.max(2000 * strats["hackn"], hashdata["income"] * 2))
		// - buying research w/ hashes is either not needed OR (cost >= 5k*BNmult AND cost > 1min of hash production)
		const check3e = (!hasCorp || !("hackn" in strats) || isResrNotNeeded || resrCost > Math.max(3000 * strats["hackn"], hashdata["income"] * 5))
		const checksum3 = (check3a && check3b && check3c && check3d && check3e)
		let checkmark3 = "[ ]"; if (checksum3) checkmark3 = "[✓]";
		ns.print(`\n${checkmark3} Check #3: Corporation`)
		if (!check3a) ns.print("• Need Corp");
		if (!check3b) ns.print("• Need Lab");
		if (!check3c) ns.print("• Need 3 products");
		if (!check3d) ns.print("• B>CorpFund# too affordable!");
		if (!check3e) ns.print("• B>CorpResr# too affordable!");



		// Check 4: Bladeburner
		// -------------------------
		const hasBB = bbdata["has"]
		const BBrankCost = ns.hacknet.hashCost("Exchange for Bladeburner Rank");
		const BBspCost = ns.hacknet.hashCost("Exchange for Bladeburner SP");
		// - Joined BB (if we want to)
		const check4a = (!bbdata["want"])
		// - Joined BB faction
		const check4b = (!hasBB || player.factions.includes("Bladeburners"))
		// - Has The Blade's Simulacrum
		const check4c = (!hasBB || bbdata["hasSimu"] || ownedAugs.includes("The Blade's Simulacrum"))
		// - buying BB rank is no longer cheap
		const check4d = (!hasBB || BBrankCost > Math.max(4250 * strats["hackn"], hashdata["income"] * 60))
		// - buying BB sp is no longer cheap
		const check4e = (!hasBB || BBspCost > Math.max(4000 * strats["hackn"], hashdata["income"] * 60))
		// - not currently performing a BlackOps mission
		const check4f = (!hasBB || ns.bladeburner.getCurrentAction().type != "BlackOp")
		const checksum4 = (check4a && check4b && check4c && check4d && check4e)
		let checkmark4 = "[ ]"; if (checksum4) checkmark4 = "[✓]";
		ns.print(`\n${checkmark4} Check #4: Bladeburner`)
		if (!check4a) ns.print("• Need to join BB");
		if (!check4b) ns.print("• Need to join BB faction");
		if (!check4c) ns.print("• Need The Blade's Simulacrum");
		if (!check4d) ns.print("• B>BBrank# too affordable!");
		if (!check4e) ns.print("• B>BBsp# too affordable!");
		if (!check4f) ns.print("• Need to NOT be doing BlackOp");



		// Check 5: Grafting
		// -------------------------
		let desiredEntr = 6;
		if (("hackn" in strats) && strats["hackn"] >= 0.5) desiredEntr = 8;
		// - Has desired entropy amount (i.e grafted the required/important augs) OR has "nickofolas Congruity Implant"
		const check5a = (player.entropy >= desiredEntr || ownedAugs.includes("nickofolas Congruity Implant"))
		// - Is NOT currently grafting nicofolas!
		const check5b = (ns.singularity.getCurrentWork() == null || ns.singularity.getCurrentWork().type != "GRAFTING" || ns.singularity.getCurrentWork().augmentation != "nickofolas Congruity Implant")
		const checksum5 = (check5a && check5b)
		let checkmark5 = "[ ]"; if (checksum5) checkmark5 = "[✓]";
		ns.print(`\n${checkmark5} Check #5: Grafting`)
		if (!check5a) ns.print(`• Need ${desiredEntr} entropy OR nickofolas`);
		if (!check5b) ns.print(`• Need to be NOT grafting nickofolas`);



		// Check 6: Progression
		// -------------------------
		// 3 minutes have passed since the run started
		const check6a = (ns.getTimeSinceLastAug() > 180000)
		// Player has $20b
		const check6b = (player.money > 20e9)
		// - Has 4sData TIX API
		const check6c = (ns.stock.has4SDataTIXAPI())
		// - Has decent homeRAM size
		const check6d = (ns.getServerMaxRam("home") >= 4096)
		const checksum6 = (check6a && check6b && check6c && check6d)
		let checkmark6 = "[ ]"; if (checksum6) checkmark6 = "[✓]";
		ns.print(`\n${checkmark6} Check #6: Progression`)
		if (!check6a) ns.print(`• Need to wait 3m after install.`);
		if (!check6b) ns.print(`• Need $20b`);
		if (!check6c) ns.print("• Need 4s TIX API");
		if (!check6d) ns.print("• Need homeRAM >= 4TB");



		if (check1 && checksum2 && checksum3 && checksum4 && checksum5 && checksum6) { await MainFunc(); }
		await ns.sleep(1000); loopnum++;


		async function MainFunc() {
			ns.clearLog();
			player = await nstb.RunCom(ns, 'ns.getPlayer()');
			let Bstring = "";
			await ns.sleep(2000)


			// PREPARATION STEPS
			// ==============================

			// 2a. Check all avaialable factions for data. Parse data into an array of augment objects including name, price, repreq, etc.
			// 2b. Then, trim the array so it excludes ones we already own or don't have prereqs for.
			const favorReq = await nstb.RunCom(ns, 'ns.getFavorToDonate()')
			let auglist = []; 
			let augData = [];
			let augDict = {};
			await UpdAugs(); //ns.print(auglist); ns.print(augDict);

			// EXECUTION STEPS
			// ==============================
			// 1. If we have <5 augs left in the array of augs (and have bought >=1) OR have bought >5 augs:
			if (auglist.length > 0) { if (await BuyAugs(auglist, augDict, 180000) == true) { ns.run("endRun.js") }; } // (3 minute wait timer)
			// 2. if there is nothing new to buy & we have no augs to install, try to get NFGs
			else if (auglist.length == 0 && queuedAugs.length == 0) { if (await BuyAugs(auglist, augDict, 60000) == true) { ns.run("endRun.js") }; } // (1 minute wait timer)
			// 3. FAILSAFE: reset the run if there is nothing new to buy, yet we have augs to install
			else if (auglist.length == 0 && queuedAugs.length > 0) { ns.run("endRun.js") }

			// FUNCTIONS
			// ==============================

			/** Returns an array with the following two elements:
			* - An array of all augs from available factions + gang (sorted by desc cost), excluding ones we already own or don't have prereqs for.
			* - A dict with keys: all augs from all factions + gang, and vals: object containing aug cost, repreq, and required faction. */
			async function UpdAugs() {
				let gangdata;
				if (hasGang) { // Add gang augs first so buying an aug from gang takes priority over buying the same aug from regular factions.
					gangdata = await nstb.RunCom(ns, 'ns.gang.getGangInformation()'); // Update gang data
					let currentGangAugs = await nstb.RunCom(ns, 'ns.singularity.getAugmentationsFromFaction()', [gangdata.faction]) // Arr of all augs available through gang
					for (let aug of currentGangAugs) {
						if (!ownedAugs.includes(aug) && await HaveAugPreReqs(aug) && !auglist.includes(aug)) {
							if ((aug == "QLink" && player.money >= 50e12) || aug != "QLink") { // exclude QLink as long as we don't have >$200t
								let reqs = await nstb.RunCom(ns, 'ns.singularity.getAugmentationCost()', [aug]);
								let repreq = reqs[0]; let cost = reqs[1];
								augData.push({ "name": aug, "cost": cost, "repreq": repreq, "faction": gangdata.faction })
								auglist.push(aug);
							}
						}
					};
				}
				let factions = player.factions;
				for (let faction of factions) {
					// Iterate through all non-special and non-gang factions
					if ((!hasGang || faction != gangdata.faction) && !["Bladeburners", "Shadows of Anarchy"].includes(faction)){
						let factionaugs = await nstb.RunCom(ns, 'ns.singularity.getAugmentationsFromFaction()', [faction])
						//ns.print(`\n${faction}:\n${factionaugs}`)
						for (let aug of factionaugs) {
							if (!ownedAugs.includes(aug) && await HaveAugPreReqs(aug) && !auglist.includes(aug)) {
								let reqs = await nstb.RunCom(ns, 'ns.singularity.getAugmentationCost()', [aug]);
								let repreq = reqs[0]; let cost = reqs[1];
								augData.push({ "name": aug, "cost": cost, "repreq": repreq, "faction": faction })
								auglist.push(aug);
							}
						}
					}
				};
				// sort augData from most to least expensive
				augData.sort(function (x, y) {
					if (x.cost > y.cost) { return -1; }
					if (x.cost < y.cost) { return 1; }
					return 0;
				});
				auglist = [] // wipe auglist so we can add augs in sorted order
				for (let augObj of augData) {
					auglist.push(augObj.name);
					augDict[augObj.name] = augObj
				};
			};


			async function HaveAugPreReqs(augment) {
				let prereqs = await nstb.RunCom(ns, 'ns.singularity.getAugmentationPrereq()', [augment])
				for (let aug of prereqs) {
					if (!ownedAugs.includes(aug)) { return false; }
				}; return true;
			}

			async function BuyAugs(list, data, maxWait) {
				player = await nstb.RunCom(ns, 'ns.getPlayer()');
				ownedAugs = await nstb.RunCom(ns, 'ns.singularity.getOwnedAugmentations()', [true]);
				let installedAugs = await nstb.RunCom(ns, 'ns.singularity.getOwnedAugmentations()');
				queuedAugs = tb.ArrSubtract(ownedAugs, installedAugs, 1);
				// If we don't yet have any augs installed on this run...
				if (queuedAugs.length < 1) {
					// try to buy any upgrade
					if (list.length > 0) {
						let augname = await BuyAny(Array.from(list), data, player.money)
						if (augname != "none") {
							ns.print("B> Augment " + augname)
							ns.toast("B> Augment " + augname, "info", 2000)
							queuedAugs.push(augname)
							tb.DelFromArray(augname, list)
						} else { // If we can't, try to buy 1 NFG
							ns.print("Trying to buy NFG...");
							let bestFaction = null;
								for (let faction of ns.getPlayer().factions) {
								if (faction != "Slum Snakes") {
									if (bestFaction == null) { bestFaction = faction }
									else if (ns.singularity.getFactionRep(faction) > ns.singularity.getFactionRep(bestFaction)) { bestFaction = faction }
								}
							}
							if (ns.getPlayer().money >= ns.singularity.getAugmentationPrice("NeuroFlux Governor")
								&& ns.singularity.getFactionRep(bestFaction) >= ns.singularity.getAugmentationRepReq("NeuroFlux Governor")) {
								ns.singularity.purchaseAugmentation(bestFaction, "NeuroFlux Governor");
								queuedAugs.push("NeuroFlux Governer");
							}
						}
					}
					// if no more augs exist, try to buy 1 NFG
					else {
						ns.print("Trying to buy NFG...");
						let bestFaction = null;
						for (let faction of ns.getPlayer().factions) {
							if (faction != "Slum Snakes") {
								if (bestFaction == null) { bestFaction = faction }
								else if (ns.singularity.getFactionRep(faction) > ns.singularity.getFactionRep(bestFaction)) { bestFaction = faction }
							}
						}
						if (ns.getPlayer().money >= ns.singularity.getAugmentationPrice("NeuroFlux Governor")
							&& ns.singularity.getFactionRep(bestFaction) >= ns.singularity.getAugmentationRepReq("NeuroFlux Governor")) {
							ns.singularity.purchaseAugmentation(bestFaction, "NeuroFlux Governor");
							queuedAugs.push("NeuroFlux Governer");
						}
					}
					return false;
				} else {
					// Trigger a refreshable wait timer of duration "maxWait"
					// This enters a while loop until the maxWait time has passed since the last aug was bought.
					// after the while loop breaks, return true to end the run.
					let lastAugT = ns.getTimeSinceLastAug()
					let resetOnT = lastAugT + maxWait
					while (ns.getTimeSinceLastAug() <= resetOnT && list.length > 0) {
						let countdownT = (resetOnT - await nstb.RunCom(ns, 'ns.getTimeSinceLastAug()')) / 1000
						player = await nstb.RunCom(ns, 'ns.getPlayer()');
						ns.clearLog(); ns.print(Bstring);

						if (await BuyBest(Array.from(list), data, player.money)) {
							lastAugT = ns.getTimeSinceLastAug()
							resetOnT = lastAugT + maxWait
							let augname = list.shift()
							Bstring += `\nB> ${augname.substring(0, 20)}`
							ns.toast("B> Augment " + augname, "info", 2000)
							queuedAugs.push(augname)
						} else if (countdownT <= 5) { // if the countdown is about to end, buy any augment we can afford and refresh the timer, cutting off the list at our purchase
							let augname = await BuyAny(Array.from(list), data, player.money)
							if (augname != "none") {
								lastAugT = await nstb.RunCom(ns, 'ns.getTimeSinceLastAug()')
								resetOnT = lastAugT + maxWait
								let templist = [];
								for (let aug of list) { if (data[aug].cost < data[augname].cost) { templist.push(aug) }; }
								list = templist;
								Bstring += `\nB> ${augname.substring(0, 20)}`
								ns.toast("B> Augment " + augname, "info", 2000)
								queuedAugs.push(augname)
							}
						}
						ns.run("hud.js", 1, "!!upd", "augtimer", "Aug Countdwn", tb.StandardTime(Math.ceil(countdownT)))
						ns.print(`Buyable Augs:`);
						for (let aug of list) { ns.print( tb.TextFloat(34, aug.substring(0,20), " ", "$" + tb.StandardNotation(data[aug].cost, 3)) ); }
						await ns.sleep(1000);
					}
					return true;
				}
			}

			async function BuyBest(mylist, data, money) {
				let aug = mylist.shift()
				while (mylist.length > 0 &&
					favorReq < await nstb.RunCom(ns, 'ns.singularity.getFactionFavorGain()', [data[aug].faction]) + await nstb.RunCom(ns, 'ns.singularity.getFactionFavor()', [data[aug].faction])
					&& !(favorReq < await nstb.RunCom(ns, 'ns.singularity.getFactionFavor()', [data[aug].faction]))) { aug = mylist.shift() }
				let cost = await nstb.RunCom(ns, 'ns.singularity.getAugmentationPrice()', [aug])
				let aData = data[aug]

				ns.print(`Best Augment:\n${tb.TextFloat(34, aug.substring(0,20), " ", tb.StandardNotation(cost, 3))}\n\n`)

				if (money >= cost && aData.repreq <= await nstb.RunCom(ns, 'ns.singularity.getFactionRep()', [aData.faction])) {
					if (await nstb.RunCom(ns, 'ns.singularity.purchaseAugmentation()', [aData.faction, aug])) return true;
				}
				return false;
			}

			async function BuyAny(mylist, data, money) {
				for (var aug of mylist) {
					let cost = await nstb.RunCom(ns, 'ns.singularity.getAugmentationPrice()', [aug])
					let aData = data[aug]
					if (money >= cost && aData.repreq <= await nstb.RunCom(ns, 'ns.singularity.getFactionRep()', [aData.faction])) {
						await nstb.RunCom(ns, 'ns.singularity.purchaseAugmentation()', [aData.faction, aug]);
						return aug;
					}
				};
				return "none";
			}

		}
	}
}