import * as nstb from "./lib/nstools";
import * as tb from "./lib/toolbox";

/** @param {import("..").NS} ns */
export async function main(ns) {
	ns.closeTail(); await ns.sleep(1); ns.tail('lp_loopmaster.js'); await ns.sleep(1); ns.resizeTail(340, 400); await ns.sleep(1); ns.moveTail(1520, 190);
	ns.disableLog("ALL"); ns.clearLog();

	const runType = nstb.PeekPort(ns, 1)["runType"]
	const bndata = nstb.PeekPort(ns, 1)["mults"]
	const strats = nstb.PeekPort(ns, 1)["strats"]

	let loopnum = 0;

	while (true) {
		let player = await nstb.RunCom(ns, 'ns.getPlayer()');
		let ownedAugs = await nstb.RunCom(ns, 'ns.singularity.getOwnedAugmentations()', [true])
		const installedAugs = await nstb.RunCom(ns, 'ns.singularity.getOwnedAugmentations()');
		let queuedAugs = tb.ArrSubtract(ownedAugs, installedAugs, 1);

		ns.clearLog();
		ns.print("Loops: ", loopnum)

		// Check 1: Sleeves
		// -------------------------
		const reqShock = Math.floor(75 ** bndata["StrengthLevelMultiplier"])
		const sleeveShock = nstb.PeekPort(ns, 6)["sleeveShock"];
		// - All sleeves at shock 0
		const check1 = (sleeveShock < reqShock)
		let checkmark1 = "[ ]"; if (check1) checkmark1 = "[✓]";
		ns.print(`\n${checkmark1} Check #1: Sleeves`)
		if (!check1) ns.print(`• Need all sleeves below shock ${reqShock}`);



		// Check 2: Gang
		// -------------------------
		const hasGang = nstb.PeekPort(ns, 7)["hasGang"]
		const wantGang = nstb.PeekPort(ns, 7)["wantGang"]
		let thugcount = 0;
		let thugmults = [];
		const territory = nstb.PeekPort(ns, 7)["territory"]
		const rep = nstb.PeekPort(ns, 7)["respect"]
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
		const wantCorp = nstb.PeekPort(ns, 8)["wantCorp"]
		// - Has corp (if we want one)
		const check3a = (!wantCorp)
		// - Has Lab
		const check3b = (!hasCorp || nstb.PeekPort(ns, 8)["hasLab"])
		// - Has >= 3 products
		const check3c = (!hasCorp || nstb.PeekPort(ns, 8)["products"].length >= 3)
		const checksum3 = (check3a && check3b && check3c)
		let checkmark3 = "[ ]"; if (checksum3) checkmark3 = "[✓]";
		ns.print(`\n${checkmark3} Check #3: Corporation`)
		if (!check3a) ns.print("• Need Corp");
		if (!check3b) ns.print("• Need Lab");
		if (!check3c) ns.print("• Need 3 products");



		// Check 4: Upgrades
		// -------------------------
		const fundCost = ns.hacknet.hashCost("Sell for Corporation Funds");
		const resrCost = ns.hacknet.hashCost("Exchange for Corporation Research");
		const isFundNotNeeded = (nstb.PeekPort(ns, 8)["profit"] >= 500e6)
		const isResrNotNeeded = (nstb.PeekPort(ns, 8)["hasTA.II"] && nstb.PeekPort(ns, 8)["research"] >= 10e6)
		const hasBB = nstb.PeekPort(ns, 9)["hasBB"]
		const wantBB = nstb.PeekPort(ns, 9)["wantBB"]
		const BBrankCost = ns.hacknet.hashCost("Exchange for Bladeburner Rank");
		const BBspCost = ns.hacknet.hashCost("Exchange for Bladeburner SP");
		// - Has 4sData TIX API
		const check4a = (ns.stock.has4SDataTIXAPI())
		// - Has decent homeRAM size
		const check4b = (ns.getServerMaxRam("home") >= 4096)
		// - buying funds w/ hashes is either not needed OR (cost >= 5k*BNmult AND cost > 1min of hash production)
		const check4c = (!hasCorp || !("hackn" in strats) || isFundNotNeeded || fundCost > Math.max(2000 * strats["hackn"], nstb.PeekPort(ns, 3)["income"] * 2))
		// - buying research w/ hashes is either not needed OR (cost >= 5k*BNmult AND cost > 1min of hash production)
		const check4d = (!hasCorp || !("hackn" in strats) || isResrNotNeeded || resrCost > Math.max(3000 * strats["hackn"], nstb.PeekPort(ns, 3)["income"] * 5))
		// - buying BB rank is no longer cheap
		const check4e = (!hasBB || BBrankCost > Math.max(4250 * strats["hackn"], nstb.PeekPort(ns, 3)["income"] * 60))
		// - buying BB sp is no longer cheap
		const check4f = (!hasBB || BBspCost > Math.max(4000 * strats["hackn"], nstb.PeekPort(ns, 3)["income"] * 60))
		const checksum4 = (check4a && check4b && check4c && check4d && check4e && check4f)
		let checkmark4 = "[ ]"; if (checksum4) checkmark4 = "[✓]";
		ns.print(`\n${checkmark4} Check #4: Upgrades`)
		if (!check4a) ns.print("• Need 4s TIX API");
		if (!check4b) ns.print("• Need homeRAM >= 4TB");
		if (!check4c) ns.print("• B>CorpFund# too affordable!");
		if (!check4d) ns.print("• B>CorpResr# too affordable!");
		if (!check4e) ns.print("• B>BBrank# too affordable!");
		if (!check4f) ns.print("• B>BBsp# too affordable!");



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



		// Check 6: Timer
		// -------------------------
		// 3 minutes have passed since the run started
		const check6a = (ns.getTimeSinceLastAug() > 180000)
		// Player has $20b
		const check6b = (player.money > 20e9)
		const checksum6 = (check6a && check6b)
		let checkmark6 = "[ ]"; if (checksum6) checkmark6 = "[✓]";
		ns.print(`\n${checkmark6} Check #6: Time`)
		if (!check6a) ns.print(`• Need to wait 3m after install.`);
		if (!check6b) ns.print(`• Need $20b`);



		if (check1 && checksum2 && checksum3 && checksum4 && checksum5 && checksum6) { await MainFunc(); }
		await ns.sleep(1000); loopnum++;


		async function MainFunc() {
			ns.clearLog();
			player = await nstb.RunCom(ns, 'ns.getPlayer()');
			let Bstring = "";
			await ns.sleep(2000)


			// PREPARATION STEPS
			// ==============================


			let gangdata;
			let [gangAugs, gangDict] = await UpdGang(); //ns.print(gangAugs); ns.print(gangDict);

			// 2a. Check all avaialable factions for data. Parse data into an array of augment objects including name, price, repreq, etc.
			// 2b. Then, trim the array so it excludes ones we already own or don't have prereqs for.
			const favorReq = await nstb.RunCom(ns, 'ns.getFavorToDonate()')
			let auglist = []; let augData = []; let augDict = {};
			let factions = player.factions;
			await UpdFacs(); //ns.print(auglist); ns.print(augDict);


			// EXECUTION STEPS
			// ==============================
			// 1b. If there are gang augments we have prereqs for that are unbought (excluding QLink):
			if (hasGang && gangAugs.length > 0) { if (await BuyAugs(gangAugs, gangDict, 180000) == true) { ns.run("endRun.js") }; } // (3 minute wait timer)

			// 2c. If we have <5 augs left in the array of augs (and have bought >=1) OR have bought >5 augs:
			else if (auglist.length > 0) { if (await BuyAugs(auglist, augDict, 180000) == true) { ns.run("endRun.js") }; }	// (3 minute wait timer)

			// 3. if there is nothing new to buy & we have no augs to install, try to get NFGs
			else if (auglist.length == 0 && gangAugs.length == 0 && queuedAugs.length == 0) { if (await BuyAugs(auglist, augDict, 60000) == true) { ns.run("endRun.js") }; } // (1 minute wait timer)

			// 4. FAILSAFE: reset the run if there is nothing new to buy, yet we have augs to install
			else if (auglist.length == 0 && gangAugs.length == 0 && queuedAugs.length > 0) { ns.run("endRun.js") }


			// FUNCTIONS
			// ==============================

			/** Returns an array with the following two elements:
			* - An array of all gang augs (sorted by desc cost), excluding ones we already own or don't have prereqs for. Also excludes QLink if we don't have $200t.
			* - A dict with keys: all augs offered by gang, and vals: object containing aug cost, repreq, and required faction. */
			async function UpdGang() {
				if (hasGang) {
					gangdata = await nstb.RunCom(ns, 'ns.gang.getGangInformation()'); // Update gang data
					let currentGangAugs = await nstb.RunCom(ns, 'ns.singularity.getAugmentationsFromFaction()', [gangdata.faction]) // Arr of all augs available through gang
					const gangAugData = []; // Temporary array of augment objects including name, price, repreq, etc. for sorting purposes.

					for (let aug of currentGangAugs) {
						if (!ownedAugs.includes(aug) && await HaveAugPreReqs(aug)) {
							if ((aug == "QLink" && player.money >= 200e12) || aug != "QLink") { // exclude QLink as long as we don't have >$200t
								let reqs = await nstb.RunCom(ns, 'ns.singularity.getAugmentationCost()', [aug]);
								let repreq = reqs[0]; let cost = reqs[1];
								gangAugData.push({ "name": aug, "cost": cost, "repreq": repreq, "faction": gangdata.faction })
							}
						}
					}; // sort gangAugData from most to least expensive
					gangAugData.sort(function (x, y) {
						if (x.cost > y.cost) { return -1; }
						if (x.cost < y.cost) { return 1; }
						return 0;
					});

					const gangAugs = []; // Array of 
					const gangDict = {};
					for (let gangAugObj of gangAugData) {
						gangAugs.push(gangAugObj.name); // fill gangAugs
						gangDict[gangAugObj.name] = gangAugObj; // fill gangDict with objects from gangAugData
					};
					return [gangAugs, gangDict];
				} else { return [[], {}]; }
			};

			/** Returns an array with the following two elements:
			* - An array of all augs from available non-gang factions (sorted by desc cost), excluding ones we already own or don't have prereqs for.
			* - A dict with keys: all augs from non-gang factions, and vals: object containing aug cost, repreq, and required faction. */
			async function UpdFacs() {
				let factions = player.factions
				for (let faction of factions) {
					if (!hasGang || faction != gangdata.faction) {
						let factionaugs = await nstb.RunCom(ns, 'ns.singularity.getAugmentationsFromFaction()', [faction])
						//ns.print(`\n${faction}:\n${factionaugs}`)
						for (let aug of factionaugs) {
							if (!ownedAugs.includes(aug) && await HaveAugPreReqs(aug)) {
								let reqs = await nstb.RunCom(ns, 'ns.singularity.getAugmentationCost()', [aug]);
								let repreq = reqs[0]; let cost = reqs[1]
								if (!ownedAugs.includes(aug)) {
									augData.push({ "name": aug, "cost": cost, "repreq": repreq, "faction": faction })
								}
							}
						}
					}
				}; // sort augData from most to least expensive
				augData.sort(function (x, y) {
					if (x.cost > y.cost) { return -1; }
					if (x.cost < y.cost) { return 1; }
					return 0;
				}); //ns.print("augData:\n", augData)
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
						ns.run("hud.js", 1, "upd", "augtimer", "Aug Countdwn", tb.StandardTime(Math.ceil(countdownT)))
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