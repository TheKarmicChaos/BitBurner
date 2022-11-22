import * as nstb from "./lib/nstools";

/** @param {import("../").NS} ns */
export async function main(ns) {
	// ns.tail('endRun.js'); ns.disableLog("ALL"); ns.clearLog();
	const GLOBAL_VARS = nstb.getGlobals(ns);
	
	ns.killall("home", true);
	ns.toast(`RUN RESETS IN: 10`, "error", 900); await ns.sleep(1000)
	nstb.updGlobals(ns, ["loop", GLOBAL_VARS["loop"] + 1]);
	ns.toast(`RUN RESETS IN: 9`, "error", 900); await ns.sleep(1000)
	ns.run("lp_stockmaster.js", 1, "-l");
	ns.toast(`RUN RESETS IN: 8`, "error", 900); await ns.sleep(1000)
	if (!ns.getPlayer().hasCorporation && ns.getPlayer().money >= 150e9) {
		ns.run("mp_corp.js")
		while (ns.isRunning("mp_corp.js")) { ns.toast(`AWAITING mp_corp.js`, "error", 900); await ns.sleep(1000) }
	}
	ns.toast(`RUN RESETS IN: 7`, "error", 900); await ns.sleep(1000)
	let bestFaction = null;
	for (let faction of ns.getPlayer().factions) {
		if (faction != "Slum Snakes" && faction != "Bladeburners") {
			if (bestFaction == null) { bestFaction = faction }
			else if (ns.singularity.getFactionRep(faction) > ns.singularity.getFactionRep(bestFaction)) { bestFaction = faction }
		}
	}
	while (ns.getPlayer().money >= ns.singularity.getAugmentationPrice("NeuroFlux Governor")
		&& ns.singularity.getFactionRep(bestFaction) >= ns.singularity.getAugmentationRepReq("NeuroFlux Governor")) {
		ns.singularity.purchaseAugmentation(bestFaction, "NeuroFlux Governor")
		await ns.sleep(1)
	}
	ns.toast(`RUN RESETS IN: 6`, "error", 900); await ns.sleep(1000)
	ns.run("op_sleeve.js", 1, "endrun");
	for (let n = 5; n >= 1; n--) {
		ns.toast(`RUN RESETS IN: ${n}`, "error", 900); await ns.sleep(1000);
	}
	ns.singularity.installAugmentations('initRun.js');
	ns.singularity.softReset('initRun.js');
}