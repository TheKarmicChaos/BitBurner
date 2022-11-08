import * as nstb from "./lib/nstools";
import * as tb from "./lib/toolbox";

/** @param {import("../").NS} ns */
export async function main(ns) {
	//ns.tail("op_graft.js"); ns.disableLog("ALL"); ns.clearLog();

	const strats = nstb.PeekPort(ns, 1)["strats"]
	let metastrat = "redpill";
	if ("hack_money" in strats) metastrat = "all";

	let ownedAugs = await nstb.RunCom(ns, 'ns.singularity.getOwnedAugmentations()', [true])
	let installedAugs = await nstb.RunCom(ns, 'ns.singularity.getOwnedAugmentations()')
	let player = await nstb.RunCom(ns, 'ns.getPlayer()')
	const bndata = nstb.PeekPort(ns, 1)["mults"]
	let maxSpend = player.money
	if (metastrat == "redpill") { maxSpend /= 200 }

	let allAugs = await nstb.RunCom(ns, 'ns.grafting.getGraftableAugmentations()')
	// Start with mandatory upgrades, in order of importance.
	var graftlist = [];

	

	let entrLimit; // at this entropy we stop grafting until we can get nicofolas
	let minMoneyToGraft; // we only graft when we have a least this much money

	// If we have >=30 kills (for faction invites) AND grafting is our next priority
	if (player.numPeopleKilled >= 30 && (!nstb.PeekPort(ns, 8)["wantCorp"] || player.money <= 8e9)) {
		switch (metastrat) {
			case "all":
				await PrepRunAll(); // ns.print(graftlist);

				var shouldGraft = (player.money >= 150e12 || (player.entropy < entrLimit && player.money >= minMoneyToGraft));
				if (shouldGraft) { ns.print("GRAFTING..."); await GraftNext(await GetNextGraft(graftlist)); };

				break;
			case "redpill":
				await PrepRunRedpill(); //ns.print(graftlist);

				var shouldGraft = (player.money >= 155e12 || (player.entropy < entrLimit && player.money >= minMoneyToGraft));
				if (shouldGraft) { ns.print("GRAFTING..."); await GraftNext(await GetNextGraft(graftlist)); };

				break;
		}
	}


	// Functions
	// =================================================

	// push all elements from the each of the following arrays, in order, after sorting them based on stats gained per sec spent grafting
	async function PrepRunAll() {
		if ("hackn" in strats) {
			if (strats["hackn"] >= 0.5) { entrLimit = 8; minMoneyToGraft = 0.5e9; }
			else if (strats["hackn"] < 0.5) { entrLimit = 6; minMoneyToGraft = 1e9; }
			graftlist = ["Neuroreceptor Management Implant", "nickofolas Congruity Implant", "CashRoot Starter Kit", "BitRunners Neurolink"];
			if (player.entropy >= 3 || installedAugs.includes("nickofolas Congruity Implant")) {
				PushSet(await SortSet(allAugs, ["nodes"]));

				if (installedAugs.includes("nickofolas Congruity Implant")) {
					PushSet(await SortSet(allAugs, ["facrep"]));
					PushSet(await SortSet(allAugs, ["hack"]));
					PushSet(await SortSet(allAugs, ["comrep", "cha"]));
					PushSet(await SortSet(allAugs, ["hackeffects"]));
					PushSet(await SortSet(allAugs, ["str", "def", "dex", "agi"]));
					PushSet(await SortSet(allAugs, ["all"]));
				}
			}
		} else {
			graftlist = ["Neuroreceptor Management Implant", "nickofolas Congruity Implant", "CashRoot Starter Kit", "BitRunners Neurolink"];
			entrLimit = 6; minMoneyToGraft = 1e9;
			if (player.entropy >= 3 || installedAugs.includes("nickofolas Congruity Implant")) {
				PushSet(await SortSet(allAugs, ["facrep"]));
				PushSet(await SortSet(allAugs, ["hack"]));
				PushSet(await SortSet(allAugs, ["comrep", "cha"]));
				PushSet(await SortSet(allAugs, ["hackeffects"]));
				PushSet(await SortSet(allAugs, ["str", "def", "dex", "agi"]));
				PushSet(await SortSet(allAugs, ["all"]));
			}
		}
	}

	async function PrepRunRedpill() {
		minMoneyToGraft = 15e9;
		if (player.skills.hacking <= 1.05 * 3000 * bndata.WorldDaemonDifficulty) {
			graftlist = ["Neuroreceptor Management Implant", "nickofolas Congruity Implant", "BitRunners Neurolink"]
			entrLimit = bndata.DaedalusAugsRequirement - 16;
			PushSet(await SortSet(allAugs, ["hack"]))
		} else if (installedAugs.length < bndata.DaedalusAugsRequirement) {
			graftlist = ["Neuroreceptor Management Implant", "nickofolas Congruity Implant", "BitRunners Neurolink"]
			entrLimit = bndata.DaedalusAugsRequirement - 16;
			PushSet(await SortSet(allAugs, ["fastest"]))
		} else {
			graftlist = ["Neuroreceptor Management Implant", "nickofolas Congruity Implant", "CashRoot Starter Kit", "BitRunners Neurolink"]
			entrLimit = 6;
			if (strats["hackn"] >= 0.4) PushSet(await SortSet(allAugs, ["nodes"]));
			PushSet(await SortSet(allAugs, ["facrep"]));
			PushSet(await SortSet(allAugs, ["comrep", "cha"]));
			PushSet(await SortSet(allAugs, ["all"]));
			PushSet(await SortSet(allAugs, ["hackeffects"]));
			PushSet(await SortSet(allAugs, ["hack", "str", "def", "dex", "agi"]));
		}
	}

	async function GetNextGraft(graftlist) {
		// remove stuff from the graftlist that needs prereqs we dont yet have
		let templist = graftlist;
		for (let aug of graftlist) {
			var preReqList = ns.singularity.getAugmentationPrereq(aug)
			if (preReqList.length > 0) {
				for (var preReq of preReqList) {
					if (!ns.singularity.getOwnedAugmentations(true).includes(preReq)) {
						tb.DelFromArray(aug, templist);
					}
				}
			}
		}
		graftlist = templist;

		var listlen = graftlist.length
		for (var x = 0; x < listlen; ++x) {
			let aug = graftlist.shift()
			//ns.print(aug)
			if (!ns.singularity.getOwnedAugmentations(true).includes(aug) &&
				((maxSpend > ns.grafting.getAugmentationGraftPrice(aug) && ns.getPlayer().money >= ns.grafting.getAugmentationGraftPrice(aug)) ||
					(ns.getPlayer().money >= ns.grafting.getAugmentationGraftPrice(aug) && aug == "nickofolas Congruity Implant"))) {
				ns.print(" FINAL GRAFTLIST <<<<<<<<<< ")
				ns.print(graftlist)
				ns.print(" NEXT AUGMENT <<<<<<<<<< ")
				ns.print(aug)
				return aug
			}
		}
	}

	async function GraftNext(aug) {
		if (!ns.singularity.isBusy() || ns.singularity.getCurrentWork().type != "GRAFTING" && aug != null) {
			try { ns.grafting.graftAugmentation(aug) }
			catch (err) { ns.singularity.travelToCity("New Tokyo") }
		}
	}

	async function GetRatio(aug, goals) {
		let stats = await nstb.RunCom(ns, 'ns.singularity.getAugmentationStats()', [aug])
		let grTime = await nstb.RunCom(ns, 'ns.grafting.getAugmentationGraftTime()', [aug])
		let params = [];
		if (goals[0] == "all") { goals = ["hack", "str", "def", "dex", "agi", "cha", "facrep", "comrep", "work", "crime", "hackeffects", "nodes"] }
		else if (goals[0] == "skills") { goals = ["hack", "str", "def", "dex", "agi", "cha"] }
		else if (goals[0] == "combat") { goals = ["str", "def", "dex", "agi"] }
		else if (goals[0] == "fastest")

			if (goals.includes("facrep")) { params = params.concat(["faction_rep"]) }
		if (goals.includes("comrep")) { params = params.concat(["company_rep"]) }
		if (goals.includes("hack")) { params = params.concat(["hacking", "hacking_exp"]) }
		if (goals.includes("hack -exp")) { params = params.concat(["hacking"]) }
		if (goals.includes("str")) { params = params.concat(["strength", "strength_exp"]) }
		if (goals.includes("def")) { params = params.concat(["defense", "defense_exp"]) }
		if (goals.includes("dex")) { params = params.concat(["dexterity", "dexterity_exp"]) }
		if (goals.includes("agi")) { params = params.concat(["agility", "agility_exp"]) }
		if (goals.includes("cha")) { params = params.concat(["charisma", "charisma_exp"]) }
		if (goals.includes("work")) { params = params.concat(["work_money"]) }
		if (goals.includes("crime")) { params = params.concat(["crime_success", "crime_money"]) }
		if (goals.includes("hackeffects")) { params = params.concat(["hacking_chance", "hacking_speed", "hacking_money", "hacking_grow"]) }
		if (goals.includes("nodes")) {
			params = params.concat(["hacknet_node_money", "hacknet_node_purchase_cost", "hacknet_node_ram_cost",
				"hacknet_node_core_cost", "hacknet_node_level_cost"])
		}

		if (goals.includes("bladeburner")) {
			params = params.concat(["bladeburner_max_stamina", "bladeburner_stamina_gain", "bladeburner_analysis", "bladeburner_success_chance"])
		}


		var totalgains = 0

		if (!goals.includes("fastest")) {
			for (var stat of params) {
				var multiplier = 1;
				var combstat = stat.split("_")[0]
				if (combstat == "strength" || combstat == "defense" ||
					combstat == "dexterity" || combstat == "agility") {
					multiplier = stats[stat] / player.mults[stat]
				}

				if (stat.split("_")[1] == "exp") { totalgains += (stats[stat] - 1) * 0.4 * multiplier }
				else if (stat.split("_")[1] == "speed") { totalgains += (1 - stats[stat]) * multiplier }
				else if (stat.split("_")[3] == "cost") { totalgains += (1 - stats[stat]) * multiplier }
				else { totalgains += stats[stat] - 1 }
			}
		} else { return 1 / grTime }
		//if (goals.includes("facrep")){ns.print(aug, " ", (totalgains / (grTime / 1000)))}

		return (totalgains / (grTime / 1000));
	}

	async function SortSet(augSet, goal) {
		let sortedSet = [];
		let augData = [];

		for (var aug of augSet) {
			if (!ownedAugs.includes(aug)) {// prunes out augs we already own
				let ratio = await GetRatio(aug, goal)

				if (ratio > 0) { // prunes out augs  with the wrong stats
					//if (goal == "facrep") { ns.print(aug, " ", ratio) }
					augData.push({ "name": aug, "ratio": ratio })
				}
			}
		}

		augData.sort((a, b) => a.ratio > b.ratio)
		//ns.print(" SORTED DATA <<<<<<<<<< ")
		//ns.print(augData)
		//ns.print(" ========== <<<<<<<<<< ")

		for (var x = 0; x < augData.length; ++x) { sortedSet.push(augData[x].name) }
		//ns.print(" SORTED SET <<<<<<<<<< ")
		//ns.print(sortedSet)
		//ns.print(" ========== <<<<<<<<<< ")
		return sortedSet;
	}

	function PushSet(sortedSet) {
		//ns.print(" PUSHING SET <<<<<<<<<< ")
		for (var aug of sortedSet) {
			if (!graftlist.includes(aug)) { graftlist.push(aug) }
		}
	}



}