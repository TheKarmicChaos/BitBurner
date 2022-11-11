import * as nstb from "./lib/nstools";
import * as tb from "./lib/toolbox";

/** @param {import("../").NS} ns */
export async function main(ns) {
	//ns.tail('op_bservs.js'); ns.disableLog("ALL"); ns.clearLog();


	let totalCashPerSec = nstb.PeekPort(ns, 2, "sumdict"); // get total income
	let player = await nstb.RunCom(ns, 'ns.getPlayer()');
	let strats = nstb.PeekPort(ns, 1)["strats"];
	let softCap = 0.001; if ("hack_money" in strats) { softCap = Math.max(strats['hack_money'], 0.8) };
	const hardCap = 100e12;
	let maxSpend = Math.max(hardCap, totalCashPerSec / 10) // cap out at hardCap, but if we are making money fast enough we can keep buying

	let sv1; let sv2;
	if ('hack_money' in strats) { sv1 = 4, sv2 = 16 }
	else { sv1 = 7, sv2 = 10 }

	let maxRAM = 2 ** sv2; // The RAM (gb) we want servs to have before we stop buying in phase 2 or 3b
	let startingRAM = 2 ** sv1 // The RAM (gb) we want for servs in phase 1
	while (maxRAM > ns.getPurchasedServerMaxRam()) { maxRAM /= 2; startingRAM /= 2; }
	if (startingRAM < 4) { startingRAM = 4; }

	const hardRamCap = ns.getPurchasedServerMaxRam();
	let didBuy = true;
	let boughtServs = 0; let bestRAMpur = 0;
	let desiredRAM; let buyCondsMet; let servNum;
	let pServs = await nstb.RunCom(ns, 'ns.getPurchasedServers()');
	let debugStr = ""; // Details the next purchase of this function
	
	while (didBuy) { await BuyNext(); }
	if (boughtServs > 0) { ns.toast(`Bought ${boughtServs} servs, up to ${bestRAMpur} GB`, 'success', 4000); }

	// Determines what we want to purchase as our next server and attempts to buy it,
	async function BuyNext() {
		didBuy = false; buyCondsMet = false; servNum = 1;
		pServs = await nstb.RunCom(ns, 'ns.getPurchasedServers()');
		desiredRAM = hardRamCap;

		// PHASE 1: ----------------------------------------
		// Buy 1 starter serv with specified starting ram
		if (pServs.length < 1) {
			desiredRAM = startingRAM;
		}
		// PHASE 2: ----------------------------------------
		// Buy a serv of each ram size until we hit our maxRAM
		else if (ns.getServerMaxRam(pServs[(pServs.length - 1)]) < maxRAM) {
			let lastServ = pServs[(pServs.length - 1)];
			desiredRAM = 2 * ns.getServerMaxRam(lastServ);
		}
		// PHASE 3: ----------------------------------------
		// Replace the lowest serv until we have only servs with maxRAM
		else if (ns.getServerMaxRam(pServs[0]) < maxRAM) {
			let lastServ = pServs[(pServs.length - 1)];
			desiredRAM = maxRAM;
			servNum = parseInt(lastServ.split("-")[2]) + 1;
		}
		// PHASE 4: ----------------------------------------
		// Buy a serv of each ram size until we hit the hardRamCap.
		else if (ns.getServerMaxRam(pServs[(pServs.length - 1)]) < hardRamCap) {
			let lastServ = pServs[(pServs.length - 1)];
			desiredRAM = 2 * ns.getServerMaxRam(lastServ);
		}
		// PHASE 5: ----------------------------------------
		// Replace the lowest serv until we have only servs with the hardRamCap.
		else if (ns.getServerMaxRam(pServs[0]) < hardRamCap) {
			let lastServ = pServs[(pServs.length - 1)];
			desiredRAM = hardRamCap;
			servNum = parseInt(lastServ.split("-")[2]) + 1;
		}
		// Otherwise, we are done purchasing servs.
		else { desiredRAM = -1; servNum = -1; }

		// Attempt to buy serv & update debugstr
		let servCost;
		let costStr = "(MAXED)";
		if (desiredRAM != -1) {
			servCost = ns.getPurchasedServerCost(desiredRAM);
			debugStr = `B>Sv ${tb.StandardNotation(desiredRAM, 1)} GB`;
			costStr = `$${tb.StandardNotation(servCost, 3)}`;
			await BuyServ(desiredRAM, servNum);
		} else { debugStr = "B>Sv" }
		// Update Hud
		ns.run('hud.js', 1, "upd", 'buyserv', debugStr, costStr);
		if (buyCondsMet) ns.run('hud.js', 1, "updcol", 'buyserv', 'money');
		else if (!buyCondsMet) ns.run('hud.js', 1, "updcol", 'buyserv', 'hp');

		await ns.sleep(1);
	}

	// Buy the next serv, of size desiredRAM, with servNum being the number at the end of the serv's name
	async function BuyServ(desiredRAM, servNum) {
		buyCondsMet = false;
		didBuy = false;
		let servCost = ns.getPurchasedServerCost(desiredRAM);
		// once cost is above 1b, save up for a corp if we want one (& TIX API)
		if (servCost < 1e9 || (!nstb.PeekPort(ns,8)["wantCorp"] && ns.stock.has4SDataTIXAPI())) {
			buyCondsMet = true;
			// if we can afford it, buy it
			if (servCost <= maxSpend && player.money * softCap > servCost) {
				// if we are replacing a server, kill and delete that one
				if (pServs.length == ns.getPurchasedServerLimit()) {
					await nstb.RunCom(ns, 'ns.killall()', [pServs[0]]);
					await nstb.RunCom(ns, 'ns.deleteServer()', [pServs[0]]);
				};
				if (await nstb.RunCom(ns, 'ns.purchaseServer()', [`${desiredRAM}-pserv-${servNum}`, desiredRAM])) {
					didBuy = true; boughtServs += 1; bestRAMpur = Math.max(desiredRAM, bestRAMpur);
				}
			}
		}
	}
}