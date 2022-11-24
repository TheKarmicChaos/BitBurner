import * as nstb from "./lib/nstools";
import * as tb from "./lib/toolbox";

/** @param {import("../").NS} ns */
export async function main(ns) {
	//ns.tail('op_bupgr.js'); ns.disableLog("ALL"); ns.clearLog();

	// get total income
	let GLOBAL_VARS = nstb.getGlobals(ns);
	let totalCashPerSec = tb.SumDict(GLOBAL_VARS["income"]);

	const player = () => ns.getPlayer();
	let strats = GLOBAL_VARS["strats"];
	let softCap = 1; if (!("hack_money" in strats)) { softCap = 0.002 };
	let hardCap = 100e12;

	let maxSpend = Math.max(totalCashPerSec, hardCap) // cap out at 2 trillion, but if we are making money fast enough we can keep buying

	await BuyNext(maxSpend);



	async function BuyNext(maxSpend) {
		var debugStr = ""; // Details the next purchase of this function
		var costStr = ""; // Details the cost of the next purchase of this function
		let didBuy = true;
		let toastArr = [];
		let boughtCores = 0;
		let boughtRAM = 0;

		while (didBuy) {
			GLOBAL_VARS = nstb.getGlobals(ns);
			didBuy = false;

			var homeRamCost = Math.floor(await nstb.RunCom(ns, 'ns.singularity.getUpgradeHomeRamCost()'));
			var homeCoreCost = Math.floor(await nstb.RunCom(ns, 'ns.singularity.getUpgradeHomeCoresCost()'));
			var darkCost = 100 * 1e15; var darkStr = "ERR-NoDarkUpgr";
			var cheapest = null;

			if (player().tor == true) {
				var items = await nstb.RunCom(ns, 'ns.singularity.getDarkwebPrograms()');
				for (var x = 0; x < items.length; ++x) {
					var itemname = items[x];
					//ns.print(itemname)

					var cost = await nstb.RunCom(ns, 'ns.singularity.getDarkwebProgramCost()', [itemname]);
					if (cost > 1 && (cheapest == null || cost < darkCost)) {
						// Blacklisted items (buy these only after we have bought the others)
						if ((itemname != "ServerProfiler.exe" && itemname != "DeepscanV1.exe" && itemname != "DeepscanV2.exe" && itemname != "AutoLink.exe" && itemname != "Formulas.exe")
							|| await nstb.RunCom(ns, 'ns.fileExists()', ['SQLInject.exe', 'home'])) {
							cheapest = itemname;
							darkCost = await nstb.RunCom(ns, 'ns.singularity.getDarkwebProgramCost()', [cheapest]);
						}
					}
				}

				if (cheapest != null) {
					ns.print(cheapest)
					if (cheapest == "ServerProfiler.exe") {
						darkStr = "ServerProfiler";
					} else {
						darkStr = cheapest.split(".")[0]
					}
				}
			}
			//ns.print(darkCost)
			//ns.print(darkStr)
			var upgrName = "NULL"; var upgrType;
			let upgrCost = Math.min(homeRamCost, darkCost)
			if (GLOBAL_VARS["strats"]["hack_money"] >= 0.8) { upgrCost = Math.min(upgrCost, homeCoreCost) }

			if (upgrCost == homeRamCost) { upgrType = "HomeRAM"; upgrName = "HomeRAM" }
			else if (upgrCost == homeCoreCost) { upgrType = "HomeCore"; upgrName = "HomeCore" }
			else if (upgrCost == darkCost) { upgrType = "Dark"; upgrName = darkStr; }

			if (upgrCost > 200000 && player().tor == false) { upgrCost = 200000; upgrType = "Tor"; upgrName = "TorBrowser" }

			const cost4sData = 1E9 * GLOBAL_VARS["bnMults"].FourSigmaMarketDataCost;
			const cost4sApi = 25E9 * GLOBAL_VARS["bnMults"].FourSigmaMarketDataApiCost;
			const cost4s = cost4sData + cost4sApi;

			let buyCondsMet = false;
			if (!(upgrCost > cost4s && GLOBAL_VARS["want4s"])
				&& !(upgrCost > 150e9 && GLOBAL_VARS["corp"]["want"])) {
				if (upgrCost <= maxSpend) {
					buyCondsMet = true;
					if (player().money * softCap >= upgrCost) {
						switch (upgrType) {
							case "HomeRAM":
								if (await nstb.RunCom(ns, 'ns.singularity.upgradeHomeRam()')) { didBuy = true; boughtRAM += 1 };
								break;
							case "HomeCore":
								if (await nstb.RunCom(ns, 'ns.singularity.upgradeHomeCores()')) { didBuy = true; boughtCores += 1 };
								break;
							case "Dark":
								if (await nstb.RunCom(ns, 'ns.singularity.purchaseProgram()', [cheapest])) { didBuy = true; toastArr.push(darkStr) };
								break;
							case "Tor":
								if (await nstb.RunCom(ns, 'ns.singularity.purchaseTor()')) { didBuy = true; toastArr.push("TorBrowser") };
								break;
						}
					}
				}
			}
			if (upgrName == "ERR-NoDarkUpgr") {
				debugStr = null;
				costStr = null;
			} else {
				debugStr = "B>" + upgrName;
				costStr = `$${tb.StandardNotation(upgrCost, 3)}`
			}
			
			// replace the hud text with misc other upgrades if we happen to be purchasing those first
			if (upgrCost > cost4s && GLOBAL_VARS["want4s"]) {
				buyCondsMet = true;
				debugStr = "B>4sAPI";
				costStr = `$${tb.StandardNotation(cost4s, 3)}`;
			}
			if (upgrCost > 150e9 && GLOBAL_VARS["corp"]["want"]) {
				buyCondsMet = true;
				debugStr = "B>Corp";
				costStr = `$${tb.StandardNotation(150e9, 3)}`;
			}


			let upd1 = ["!!upd", 'buyupgr', debugStr, costStr];
			let upd2;
			if (buyCondsMet) upd2 = [ "!!color", 'buyupgr', 'money'];
			else if (!buyCondsMet) upd2 = ["!!color", 'buyupgr', 'hp'];
			ns.run('hud.js', 1, ...upd1, ...upd2);
			await ns.sleep(1);
		}

		if (toastArr.length > 0) { ns.toast("Bought: " + toastArr.join(", "), 'success', 5000) }
		if (boughtRAM > 0) { ns.toast("Bought HomeRAM (x" + boughtRAM + ")", 'success', 4000) }
		if (boughtCores > 0) { ns.toast("Bought HomeRAM (x" + boughtCores + ")", 'success', 4000) }

	}

}