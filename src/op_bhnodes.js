import * as nstb from "./lib/nstools";
import * as tb from "./lib/toolbox";

/** @param {import("../").NS} ns */
export async function main(ns) {
	//ns.tail('op_bhnodes.js'); ns.disableLog("ALL"); ns.clearLog();

	// get total income
	let totalCashPerSec = nstb.PeekPort(ns, 2, "sumdict")
	let strats = nstb.PeekPort(ns, 1)["strats"];
	let bitNode = nstb.PeekPort(ns, 1)["bitNode"];
	const BITNODE_MULT = strats["hackn"];
	let defaultnum = 0.8; if (bitNode == 9) { defaultnum = 1};

	let softCap = 0.0001; if (strats["hackn"] >= 0.1) { softCap = Math.min(defaultnum, strats["hackn"]) };
	let hardCap = 500e12;
	let maxSpend = Math.max(hardCap, totalCashPerSec / 1) // cap out at hardCap, but if we are making money fast enough we can keep buying

	const getMoney = () => ns.getPlayer().money * softCap;
	let hashes = () => ns.hacknet.numHashes()
	let maxHash = () => ns.hacknet.hashCapacity()

	let hacknetProduction = 0;
	await BuyNext();
	if (ns.hacknet.numNodes()) { await SpendHash(hacknetProduction); }

	nstb.UpdPort(ns, 3, "dict", ["income", hacknetProduction, "hashes", hashes(), "maxhashes", maxHash()])
	ns.run('hud.js', 1, "upd", 'hashincome', "#/sec", `#${tb.StandardNotation(hacknetProduction, 3)}`);

	// Functions

	async function BuyNext() {

		let didBuy = true;
		let buyCount = 0;

		let purCost = hardCap * 10;
		let purName = "NONE";
		let purArgs;
		let buyCondsMet = false;
		var debugStr = ""; // Details the next purchase of this function

		let toastArr = [];
		let newNodes = 0;

		// if we have no hacknet nodes, just buy one asap
		if (!ns.hacknet.numNodes()) {
			purCost = ns.hacknet.getPurchaseNodeCost();
			purName = "1stNode";
			await AttemptPurchase();
		} else {
			let ratios = await GenerateRatios();
			while (didBuy && buyCount < 101) {
				didBuy = false;
				ratios = await UpdateNextPurchase(ratios);
				await AttemptPurchase();

				let hashStr;
				if (hashes() < maxHash()) { hashStr = "Hashes" }
				else { hashStr = "Hashes (MAX)" }
				ns.run('hud.js', 1, "upd", 'hash', hashStr, `#${tb.StandardNotation(hashes(), 3)}`);
		
				if (buyCondsMet) {
					ns.run('hud.js', 1, "upd", 'buynodeOFF');
					ns.run('hud.js', 1, "upd", 'buynodeON', debugStr, `$${tb.StandardNotation(purCost, 3)}`);
				} else if (!buyCondsMet) {
					ns.run('hud.js', 1, "upd", 'buynodeOFF', debugStr, `$${tb.StandardNotation(purCost, 3)}`);
					ns.run('hud.js', 1, "upd", 'buynodeON');
				}

				await ns.sleep(10);
				buyCount++;
			}
		}

		if (newNodes > 0) { ns.toast(`Bought ${newNodes} new hNodes`, 'warning', 4000) }
		if (toastArr.length > 0) { ns.toast(`Bought hNode Upgrades: ${toastArr.join(", ")}`, 'warning', 3000) }
		if (purName == "1stNode") { return true; } else {return false}


		async function GenerateRatios() {
			const getProd = (level, ram, cores) => (level * 1.5) * Math.pow(1.035, ram - 1) * ((cores + 5) / 6);
			const getHashProd = (level, ram, cores, ramUsed) => (level * 0.001) * Math.pow(1.07, Math.log2(ram)) * (1 + (cores - 1) / 5) * (1 - ramUsed / ram)
			//const getProd = (level, ram, cores) => ns.hashGainRate(level, ram, ram, cores)
			// your production multiplier
			var multips = await nstb.RunCom(ns, 'ns.getHacknetMultipliers()')
			const PROD_MULTIPLIER = multips.production;
			const ratios = [];
			hacknetProduction = 0;

			// loop through all nodes
			for (let index = 0; index < ns.hacknet.numNodes(); index++) {
				// get current node stats
				const { level, ram, cores, production, ramUsed } = ns.hacknet.getNodeStats(index);
				hacknetProduction += production;
				// get upgrades cost
				const levelUpgradeCost = ns.hacknet.getLevelUpgradeCost(index, 1);
				const ramUpgradeCost = ns.hacknet.getRamUpgradeCost(index);
				const coreUpgradeCost = ns.hacknet.getCoreUpgradeCost(index);
				// get prod. growth / cost ratios
				const levelUpgradeRatio = ((getProd(level + 1, ram, cores) * PROD_MULTIPLIER) - production) / levelUpgradeCost;
				const ramUpgradeRatio = ((getProd(level, ram * 2, cores) * PROD_MULTIPLIER) - production) / ramUpgradeCost;
				const coreUpgradeRatio = ((getProd(level, ram, cores + 1) * PROD_MULTIPLIER) - production) / coreUpgradeCost;
				// get prod. growth / cost ratios
				const levelUpgradeHashRatio = ((getHashProd(level + 1, ram, cores, ramUsed) * PROD_MULTIPLIER) - production) / levelUpgradeCost;
				const ramUpgradeHashRatio = ((getHashProd(level, ram * 2, cores, ramUsed * 2) * PROD_MULTIPLIER) - production) / ramUpgradeCost;
				const coreUpgradeHashRatio = ((getHashProd(level, ram, cores + 1, ramUsed) * PROD_MULTIPLIER) - production) / coreUpgradeCost;
				// time until this upgrade turns a profit (in secs)
				const leveltUntilProfit = levelUpgradeCost / ((getProd(level + 1, ram, cores) * PROD_MULTIPLIER) - production);
				const ramtUntilProfit = ramUpgradeCost / ((getProd(level, ram * 2, cores) * PROD_MULTIPLIER) - production);
				const coretUntilProfit = coreUpgradeCost / ((getProd(level, ram, cores + 1) * PROD_MULTIPLIER) - production);
				// possible upgrades of current node
				const currentNodeUpgrades = [
					{ tprofit: leveltUntilProfit, hratio: levelUpgradeHashRatio, ratio: levelUpgradeRatio, cost: levelUpgradeCost, nodeIndex: index, upgrade: "NodeLV" },
					{ tprofit: ramtUntilProfit, hratio: ramUpgradeHashRatio, ratio: ramUpgradeRatio, cost: ramUpgradeCost, nodeIndex: index, upgrade: "NodeRAM" },
					{ tprofit: coretUntilProfit, hratio: coreUpgradeHashRatio, ratio: coreUpgradeRatio, cost: coreUpgradeCost, nodeIndex: index, upgrade: "NodeCore" }
				];
				// push current node upgrades to all upgrades
				ratios.push(...currentNodeUpgrades);
			}
			
			// sort options by ratio
			ratios.sort((a, b) => b.hratio - a.hratio)
			return ratios;
		}

		async function UpdateNextPurchase(ratios) {
			var upgrade;
			const numNodes = ns.hacknet.numNodes();
			const maxnumNodes = ns.hacknet.maxNumNodes();
			const purNodeCost = ns.hacknet.getPurchaseNodeCost();
			// Get ready to buy the most profitable upgrade.
			if (ratios.length > 0) {
				var { cost, nodeIndex, upgrade, tprofit } = ratios[0];
				if (cost !== Infinity && cost) {
					purName = upgrade;
					purCost = cost;
					purArgs = [nodeIndex, tprofit]
				}
			}
			// if a NewNode is cheaper than that *10 OR we can afford it within 10 minutes, get it instead.
			if (numNodes < maxnumNodes && (purNodeCost <= purCost * 10 || (hacknetProduction/4) * 600 * 1000000 >= purNodeCost)) {
				purName = "NewNode";
				purCost = purNodeCost;
			}
			// iterate through all nodes again, this time just for the cost of the cheapest increase to hashCaps
			let cheapestHashCap; let cheapestHashCapCost;
			for (let index = 0; index < numNodes; index++) {
				const hashCapCost = ns.hacknet.getCacheUpgradeCost(index, 1)
				if (hashCapCost !== Infinity && hashCapCost) {
					if (!cheapestHashCap) { cheapestHashCap = index; cheapestHashCapCost = hashCapCost; }
					else if (hashCapCost <= cheapestHashCapCost) { cheapestHashCap = index; cheapestHashCapCost = hashCapCost; }
				}
			}
			// if a hash cache upgrade is cheaper than that *100 OR we can afford it within 10s, get that instead.
			if (cheapestHashCapCost !== Infinity && cheapestHashCapCost) {
				if (cheapestHashCapCost * 100 < purCost || (hacknetProduction/4) * 10 * 1000000 >= cheapestHashCapCost) {
					purName = "NodeCache";
					purCost = cheapestHashCapCost
					purArgs = [cheapestHashCap]
				}
			}
			// at this point, if we still stuck with our first choice, remove it from ratios array
			if (purName == upgrade) { ratios.shift() }
			return ratios;
		}

		async function AttemptPurchase() {
			if (purName != "NONE") {
				debugStr = "B>" + purName
				if (purCost <= maxSpend || purName == "1stNode") {
					// once cost is above 500m (9b for newnodes), save up for a corp if we want one (& TIX API)
					if ((purCost < 500e6 * BITNODE_MULT && purName != "NewNode") || (purCost < 9e9 * BITNODE_MULT && purName == "NewNode") // || nstb.PeekPort(ns, 2, "sumdict") < 50e6
					|| (!nstb.PeekPort(ns,8)["wantCorp"] && ns.stock.has4SDataTIXAPI())){
						buyCondsMet = true;
						if (getMoney() >= purCost) { 
							let nodeIndex;
							switch (purName) {
								case "1stNode":
									if (ns.hacknet.purchaseNode()) { didBuy = true; newNodes += 1 };
									break;
								case "NewNode":
									if (ns.hacknet.purchaseNode()) { didBuy = true; newNodes += 1; };
									break;
								case "NodeLV":
									nodeIndex = purArgs[0];
									let curLv = ns.hacknet.getNodeStats(nodeIndex).level
									for (let lv = Math.min(curLv + 50, 499); lv > 0; --lv) {
										if (ns.hacknet.upgradeLevel(nodeIndex, lv)) { didBuy = true; /*toastArr.push(`Lv(x${lv}) @ node-${nodeIndex}`);*/ break; };
									}
									break;
								case "NodeRAM":
									nodeIndex = purArgs[0];
									if (ns.hacknet.upgradeRam(nodeIndex)) { didBuy = true; toastArr.push("RAM @ node-" + nodeIndex) };
									break;
								case "NodeCore":
									nodeIndex = purArgs[0];
									let curCore = ns.hacknet.getNodeStats(nodeIndex).cores
									for (let num = 50 - curCore; num > 0; --num) {
										if (ns.hacknet.upgradeCore(nodeIndex, num)) { didBuy = true; toastArr.push(`Core(x${num}) @ node-${nodeIndex}`); break; };
									}
									break;
								case "NodeCache":
									nodeIndex = purArgs[0];
									if (ns.hacknet.upgradeCache(nodeIndex, 1)) { didBuy = true; toastArr.push("Cache @ node-" + nodeIndex) };
									break;
							};
						};
					};
				};
			}; if (debugStr == "") { debugStr = null };
		}
	};

	async function SpendHash(hPerSec) {
		let debugStr = ""

		// if we spent all hashes on money, how much would we make per second?
		let hashToCashPerSec = 0;
		let tUntilCash = ns.hacknet.hashCost("Sell for Money") / hPerSec
		hashToCashPerSec = 1e6 / tUntilCash;

		let incomeDict = nstb.PeekPort(ns, 2);
		let hIncome = incomeDict["hnodes"];
		let otherIncome = nstb.PeekPort(ns, 2, "sumdict") - hIncome

		// unil we have a decent income of hashes, AND have other reliable sources of cash, only use hashes to buy money
		if (hPerSec < 6.000 * BITNODE_MULT && (nstb.PeekPort(ns, 1)["bitnode"] != 9 || hIncome * 2 >= otherIncome)) {
			while (hashes() >= ns.hacknet.hashCost("Sell for Money")) {
				ns.hacknet.spendHashes("Sell for Money");
			}
			ns.run('hud.js', 1, "upd", 'buyhashON', "B>Money", `#${tb.StandardNotation(ns.hacknet.hashCost("Sell for Money"), 3)}`);
			ns.run('hud.js', 1, "upd", 'buyhashOFF');
		}

		// if we already have a decent income of hashes & cash, diversify hash upgrades
		else {
			hashToCashPerSec = 0; // stop buying cash

			// Determine the next corp upgrade (if we have corp)
			let nextCupgr; let nextCupgrCost; let portC = nstb.PeekPort(ns, 8);
			let hasCorp = portC["hasCorp"];
			let fundCost = ns.hacknet.hashCost("Sell for Corporation Funds");
			let resrCost = ns.hacknet.hashCost("Exchange for Corporation Research");

			// should buy more funds if:	profit/s < $500m AND can easily afford more
			const shouldBuyFund = portC["profit"] < 500e6 && fundCost <= Math.max(hPerSec * 60, 2000 * BITNODE_MULT)
			// should buy more research if: (low on research(<140k) OR don't have TA.II) AND can easily afford more
			const shouldBuyResr = (portC["hasTA.II"] == false || portC["research"] <= 10e6) && resrCost <= Math.max(hPerSec * 120, 3000 * BITNODE_MULT)

			if (shouldBuyFund) {
				nextCupgr = "CorpFunds";
				nextCupgrCost = fundCost
			} else if (shouldBuyResr || Math.max(hPerSec * 120, 3000 * BITNODE_MULT) - resrCost >= Math.max(hPerSec * 60, 2000 * BITNODE_MULT) - fundCost) {
				nextCupgr = "CorpResr";
				nextCupgrCost = resrCost
			} else {
				nextCupgr = "CorpFunds";
				nextCupgrCost = fundCost
			}
			
			if (hasCorp && hashes() >= nextCupgrCost) {
				if (nextCupgrCost == fundCost) { ns.hacknet.spendHashes("Sell for Corporation Funds") }
				else if (nextCupgrCost == resrCost) { ns.hacknet.spendHashes("Exchange for Corporation Research") }
			}


			// Determine the next bb upgrade (if this is a bladeburner run & we have access)
			let nextBupgr; let nextBupgrCost; let hasBB = nstb.PeekPort(ns, 9)["hasBB"];
			// "Exchange for Bladeburner Rank", "Exchange for Bladeburner SP"


			// Determine the next generic upgrade
			let genericUpgrStr;
			let studyCost = ns.hacknet.hashCost("Improve Studying");
			let gymCost = ns.hacknet.hashCost("Improve Gym Training");
			let nextGupgr;
			let nextGupgrCost = Math.min(gymCost, studyCost);
			const shouldBuyStudy = (studyCost < hPerSec)
			const shouldBuyGym = (gymCost < hPerSec)
			if (nextGupgrCost == studyCost) {
				nextGupgr = "StudyUpg";
				if (hashes() >= nextGupgrCost && shouldBuyStudy) { ns.hacknet.spendHashes("Improve Studying") }
			} else if (nextGupgrCost == gymCost) {
				nextGupgr = "GymUpg";
				if (hashes() >= nextGupgrCost && shouldBuyGym) { ns.hacknet.spendHashes("Improve Gym Training") }
			}



			// If we don't have the capacity for any of our next upgrades, start selling hashes for money
			const shouldBuyMoney = (maxHash() < nextBupgrCost || !hasBB) && (maxHash() < nextCupgrCost || (!shouldBuyFund && !shouldBuyResr) || !hasCorp) && nextGupgrCost >= hPerSec
			let genericCostStr = `#${tb.StandardNotation(ns.hacknet.hashCost("Sell for Money"), 3)}`
			if (shouldBuyMoney) {
				while (hashes() >= hPerSec && hashes() >= ns.hacknet.spendHashes("Sell for Money")) {
					ns.hacknet.spendHashes("Sell for Money");
					await ns.sleep(1)
				}
				hashToCashPerSec = 1000000 / tUntilCash; // start buying cash again
				genericUpgrStr = "B>Money"
			} else if (!shouldBuyStudy && !shouldBuyGym) {
				genericUpgrStr = "B>Money"
			} else {
				genericUpgrStr = "B>" + nextGupgr
				genericCostStr = `#${tb.StandardNotation(nextGupgrCost, 3)}`
			}



			// Update all relevant hud elements

			if (hasCorp) {
				let corpStr = "B>" + nextCupgr
				if (nextCupgrCost <= maxHash() && (shouldBuyFund || shouldBuyResr)) {
					ns.run('hud.js', 1, "upd", 'buyhashcorpON', corpStr, `#${tb.StandardNotation(nextCupgrCost, 3)}`);
					ns.run('hud.js', 1, "upd", 'buyhashcorpOFF');
				}
				else {
					ns.run('hud.js', 1, "upd", 'buyhashcorpON');
					ns.run('hud.js', 1, "upd", 'buyhashcorpOFF', corpStr, `#${tb.StandardNotation(nextCupgrCost, 3)}`);
				}
			} else {
				ns.run('hud.js', 1, "upd", 'buyhashcorpON');
				ns.run('hud.js', 1, "upd", 'buyhashcorpOFF');
			}

			if (hasBB) {
				let bladeStr = "B>" + nextBupgr
				if (nextBupgrCost <= maxHash()) {
					ns.run('hud.js', 1, "upd", 'buyhashbladeON', bladeStr, `#${tb.StandardNotation(nextBupgrCost, 3)}`);
					ns.run('hud.js', 1, "upd", 'buyhashbladeOFF');
				}
				else {
					ns.run('hud.js', 1, "upd", 'buyhashbladeON');
					ns.run('hud.js', 1, "upd", 'buyhashbladeOFF', bladeStr, `#${tb.StandardNotation(nextBupgrCost, 3)}`);
				}
			} else {
				ns.run('hud.js', 1, "upd", 'buyhashbladeON');
				ns.run('hud.js', 1, "upd", 'buyhashbladeOFF');
			}

			if (hashToCashPerSec > 0 || (nextGupgrCost <= maxHash() && (shouldBuyStudy || shouldBuyGym))) {
				ns.run('hud.js', 1, "upd", 'buyhashON', genericUpgrStr, genericCostStr);
				ns.run('hud.js', 1, "upd", 'buyhashOFF');
			} else {
				ns.run('hud.js', 1, "upd", 'buyhashON');
				ns.run('hud.js', 1, "upd", 'buyhashOFF', genericUpgrStr, genericCostStr);
			}
		}




		// write income to port
		nstb.UpdPort(ns, 2, "dict", ["hnodes", hashToCashPerSec]);

	}

}