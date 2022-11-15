import * as nstb from './lib/nstools';

/** @param {import("../").NS} ns */
export async function main(ns) {
	//ns.tail('op_joinfacs.js'); ns.disableLog("ALL"); ns.clearLog();

	let GLOBAL_VARS = nstb.getGlobals(ns);
	const hasBB = GLOBAL_VARS["bb"]["has"]
	let reserve = 100e6
	let pldata = await nstb.RunCom(ns, 'ns.getPlayer()')
	let plskills = pldata.skills;
	let factions = pldata.factions;
	let hackLv = plskills.hacking;
	let money = pldata.money - reserve
	let karma = ns.heart.break();
	let kills = pldata.numPeopleKilled;
	var combatLv = Math.min(plskills.strength, plskills.defense, plskills.dexterity, plskills.agility);

	if (!factions.includes("Netburners") && money >= 10e6 && hackLv >= 80) {
		ns.print("Trying to join ", "Netburners")
		//Requires Total Hacknet Levels of 100, RAM of 8, & Cores of 4
		let numnodes = await nstb.RunCom(ns, 'ns.hacknet.numNodes()');
		if (numnodes < 4) {
			for (var i = numnodes; i < 4; i++) { await nstb.RunCom(ns, 'ns.hacknet.purchaseNode()') }
		}
		for (var i = 0; i < 4; i++) {
			let nodestats = await nstb.RunCom(ns, 'ns.hacknet.getNodeStats()', [i]);
			var level = nodestats.level
			var ram = nodestats.ram;
			if (level < 34) {
				var reqLvs = 34 - level;
				await nstb.RunCom(ns, 'ns.hacknet.upgradeLevel()', [i, reqLvs]);
			}
			if (ram < 4) {
				var reqRam;
				if (ram == 1) { reqRam = 2 }
				else if (ram == 2) { reqRam = 1 }
				await nstb.RunCom(ns, 'ns.hacknet.upgradeRam()', [i, reqRam]);
			}
		}

	} else if (!factions.includes("Tian Di Hui") && money >= 1.2e6 && hackLv >= 50) {
		ns.print("Trying to join ", "Tian Di Hui")
		await nstb.RunCom(ns, 'ns.singularity.travelToCity()', ["Chongqing"])

	} else if (!factions.includes("Tetrads") && money >= 200e3 && combatLv >= 75 && karma <= -18) {
		ns.print("Trying to join ", "Tetrads")
		await nstb.RunCom(ns, 'ns.singularity.travelToCity()', ["Chongqing"])

	} else if (!factions.includes("The Syndicate") && money >= 10.2e6 && hackLv >= 200 && combatLv >= 200 && karma <= -90 && !hasBB) {
		ns.print("Trying to join", "The Syndicate")
		await nstb.RunCom(ns, 'ns.singularity.travelToCity()', ["Sector-12"])

	} else if (!factions.includes("The Dark Army") && money >= 200e3 && hackLv >= 300 && combatLv >= 300 && karma <= -45 && kills >= 5 && !hasBB) {
		ns.print("Trying to join ", "The Dark Army")
		await nstb.RunCom(ns, 'ns.singularity.travelToCity()', ["Chongqing"])

	} else if ((factions.includes("Sector-12") || factions.includes("Aevum")) && !(factions.includes("Sector-12") && factions.includes("Aevum"))) {
		if (!factions.includes("Sector-12") && money >= 15.2e6) {
			ns.print("Trying to join ", "Sector-12")
			await nstb.RunCom(ns, 'ns.singularity.travelToCity()', ["Sector-12"])
			await nstb.RunCom(ns, 'ns.singularity.joinFaction()', ["Sector-12"]);
		} else if (!factions.includes("Aevum") && money >= 40.2e6) {
			ns.print("Trying to join ", "Aevum")
			await nstb.RunCom(ns, 'ns.singularity.travelToCity()', ["Aevum"])
			await nstb.RunCom(ns, 'ns.singularity.joinFaction()', ["Aevum"]);
		}

	} else if ((factions.includes("Chongqing") || factions.includes("New Tokyo") || factions.includes("Ishima")) && !(factions.includes("Chongqing") && factions.includes("New Tokyo") && factions.includes("Ishima"))) {
		if (!factions.includes("Chongqing") && money >= 20.2e6) {
			ns.print("Trying to join ", "Chongqing")
			await nstb.RunCom(ns, 'ns.singularity.travelToCity()', ["Chongqing"])
			await nstb.RunCom(ns, 'ns.singularity.joinFaction()', ["Chongqing"]);
		} else if (!factions.includes("New Tokyo") && money >= 20.2e6) {
			ns.print("Trying to join ", "New Tokyo")
			await nstb.RunCom(ns, 'ns.singularity.travelToCity()', ["New Tokyo"])
			await nstb.RunCom(ns, 'ns.singularity.joinFaction()', ["New Tokyo"]);
		} else if (!factions.includes("Ishima") && money >= 30.2e6) {
			ns.print("Trying to join ", "Ishima")
			await nstb.RunCom(ns, 'ns.singularity.travelToCity()', ["Ishima"])
			await nstb.RunCom(ns, 'ns.singularity.joinFaction()', ["Ishima"]);
		}

	} else if (!factions.includes("Silhouette") && money >= 15e6) { // -22 Karma AND CTO, CFO, or CEO of a company
		ns.print("Trying to join ", "Silhouette")
	}


	var invitations = await nstb.RunCom(ns, 'ns.singularity.checkFactionInvitations()');
	if (invitations.length > 0) {
		for (var i = 0; i < invitations.length; ++i) {
			var factName = invitations[i];
			if ((factName != "New Tokyo") && (factName != "Ishima")
				&& (factName != "Chongqing") && (factName != "Volhaven")
				&& (factName != "Aevum") && (factName != "Sector-12")) {
				await nstb.RunCom(ns, 'ns.singularity.joinFaction()', [factName]);
				ns.toast('Joined Faction: ' + factName, 'info', 1000);
			}
		}
	}
}