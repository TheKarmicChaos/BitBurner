import * as nstb from "./lib/nstools";
import * as tb from "./lib/toolbox";

/** @param {import("../").NS} ns */
export async function main(ns) {
	//ns.tail('op_sleeve.js'); ns.disableLog("ALL"); ns.clearLog();

	var player = await nstb.RunCom(ns, 'ns.getPlayer()')
	let GLOBAL_VARS = nstb.getGlobals(ns);
	const bndata = GLOBAL_VARS["bnMults"]
	const strats = GLOBAL_VARS["strats"]
	const runType = GLOBAL_VARS["runType"]

	let metaPlan = "nogang";
	if (ns.args[0]) metaPlan = ns.args[0];
	if (runType == "bladeburner") { metaPlan = "bladeburner" }
	else if (('hack_money' in strats) && ("gang" in strats)) { metaPlan = "all" }
	else if (!('hack_money' in strats)) { metaPlan = "pillonly" }

	let maxSpend = player.money / 2
	if (metaPlan == "pillonly") { maxSpend = player.money / 900 }


	const hasGang = await nstb.RunCom(ns, 'ns.gang.inGang()')
	const hasBB = GLOBAL_VARS["bb"]["has"]
	const slnum = await nstb.RunCom(ns, 'ns.sleeve.getNumSleeves()')
	let occupiedFacs = []; if (hasGang) occupiedFacs.push("Slum Snakes");
	let occupiedJobs = [];
	let sleeveshocks = [];

	let neededAugs = await GetNeededAugs();
	//ns.print("NeededAugs: ", neededAugs)

	let factions = tb.ArrSubtract(await GetFactions(), ["Bladeburners"]);
	let joinedfactions = player.factions
	ns.print(">> Factions:\n", factions)

	let companiesNeeded = await GetCompanyFacsNeeded();
	ns.print(">> CompaniesNeeded:\n", companiesNeeded)

	// Sleeves can only buy augs if it is their turn, with every (10 mins) divided amongst the sleeves into segments called loopturns.
	let globaltime = await nstb.RunCom(ns, 'ns.getTimeSinceLastAug()')
	let loopdur = 600000 // duration of 1 full loop (each sleeve only gets 1 turn to purchase augments per each loop)
	let looptime = globaltime % loopdur // time that has passed in this loop
	let loopturn = GetLoopTurn()
	ns.print(">> LoopTurn: ", loopturn)


	// ==================================================================================================
	// MAIN LOOP
	// ==================================================================================================

	for (let id = 0; id < slnum; ++id) { // reset any company/faction work
		let task = await nstb.RunCom(ns, 'ns.sleeve.getTask()', [id]);
		if (task == null || task.type == "FACTION" || task.type == "COMPANY") {
			ns.print(`resetting ${id}...`)
			await nstb.RunCom(ns, 'ns.sleeve.setToCommitCrime()', [id, 'MUG'])
		}
	}

	for (let id = 0; id < slnum; ++id) { // iterate over every sleeve
		player = await nstb.RunCom(ns, 'ns.getPlayer()');
		let plstats = player.skills;
		let stats = await nstb.RunCom(ns, 'ns.sleeve.getSleeveStats()', [id]);
		var buyableAugs = await nstb.RunCom(ns, 'ns.sleeve.getSleevePurchasableAugs()', [id]);
		ns.print("\nSleeve #" + id);
		// customizable conditions in case you want to delay/prevent sleeve actions
		if (ns.getTimeSinceLastAug() >= 0 && stats.shock < 100) {
			
			// Step 1: buy any sleeve augs that might be available.
			if (buyableAugs.length > 0 && stats.shock == 0 && (id == loopturn || metaPlan == "endrun")) { await BuyAugs(id, buyableAugs) }

			// Step 2: Get Sync up to 100 and shock below 95 (or lower depending on bn mults)
			if (stats.sync < 100) { await nstb.RunCom(ns, 'ns.sleeve.setToSynchronize()', [id]) }
			else if (stats.shock >= 95 ** bndata["StrengthLevelMultiplier"]) { await nstb.RunCom(ns, 'ns.sleeve.setToShockRecovery()', [id]) }

			// Step 3: Get the gang up and running
			else if (!hasGang && (metaPlan == "all" || metaPlan == "bladeburner")) {
				ns.print("Getting Gang");
				// If we have combat work available for factions, run that for skill exp (until homicide nets more karma than mugging)
				if (factions.length > 0 && (await nstb.GetCrimeGains(ns, "HOMICIDE", "karma", await nstb.GetSleeveCrimeChance(ns, id, "HOMICIDE")) < await nstb.GetCrimeGains(ns, "MUG", "karma", await nstb.GetSleeveCrimeChance(ns, id, "MUG")))) {
					let nextfac = factions.shift()
					if (nextfac != "Netburners" && nextfac != "CyberSec" && nextfac != "Bitrunners" && nextfac != "NiteSec") { await WorkForFac(id, nextfac) }
					// if no such factions exist, go back to the same plan
					else if ((await TrainStats(id, stats, 10)) == true) { await GetKarma(id) }

					// Otherwise just grind up to lv10 combat stats, then grind karma
				} else if ((await TrainStats(id, stats, 10)) == true) { await GetKarma(id) }
			}

			// Step 4a: Get shock down below 75
			else if (stats.shock > 75 ** bndata["StrengthLevelMultiplier"]) { ns.print("Lowering shock to 75"); await nstb.RunCom(ns, 'ns.sleeve.setToShockRecovery()', [id]) }

			// Step 5: Get shock down below 0
			else if (stats.shock > 0) { ns.print("Lowering shock to 0"); await nstb.RunCom(ns, 'ns.sleeve.setToShockRecovery()', [id]) }

			else if (metaPlan != "bladeburner" || !hasBB) {
				// Step 6a: If any are unoccupied, work for a faction until it has enough rep to purchase all augs.
				if (tb.ArrSubtract(factions, occupiedFacs).length > 0) { ns.print("Working for fac"); await WorkForFac(id, tb.ArrSubtract(factions, occupiedFacs).shift()) }
				// Step 7a: If any are unoccupied, work for a company until we can join its faction.
				else if (companiesNeeded.length > 0 && metaPlan != "pillonly" && player.skills.hacking >= 225) { ns.print("Working for comp"); await WorkForCom(id) }
				// Otherwise, build player stats infinitely
				else { ns.print("Building Player Stats infinitely"); await BuildStats(id, plstats) }
			} else if (metaPlan == "bladeburner") {
				// Step 6b: Set specific sleeves to do specific tasks
				let task = await nstb.RunCom(ns, 'ns.sleeve.getTask()', [id]);
				switch (id) {
					case 0: // Work for factions/companies like normal
						if (tb.ArrSubtract(factions, occupiedFacs).length > 0) { ns.print("Working for fac"); await WorkForFac(id, tb.ArrSubtract(factions, occupiedFacs).shift()) }
						else if (companiesNeeded.length > 0 && metaPlan != "pillonly" && player.skills.hacking >= 225) { ns.print("Working for comp"); await WorkForCom(id) }
						else { ns.print("Building Player Stats infinitely"); await BuildStats(id, plstats) }
						break;
					case 1: // Work for factions/companies like normal
						if (tb.ArrSubtract(factions, occupiedFacs).length > 0) { ns.print("Working for fac"); await WorkForFac(id, tb.ArrSubtract(factions, occupiedFacs).shift()) }
						else if (companiesNeeded.length > 0 && metaPlan != "pillonly" && player.skills.hacking >= 225) { ns.print("Working for comp"); await WorkForCom(id) }
						else { ns.print("Building Player Stats infinitely"); await BuildStats(id, plstats) }
						break;
					case 2: // Permanently do BB Field Analysis
						ns.print("Doing BB Field Analysis");
						if (task == null || task.type != null || task.actionType != "General" || task.actionName != "Field Analysis")
							ns.sleeve.setToBladeburnerAction(id, "Field analysis");
						break;
					case 3: // Permanently do BB Diplomacy
						ns.print("Doing BB Diplomacy");
						if (task == null || task.type != null || task.actionType != "General" || task.actionName != "Diplomacy")
							await nstb.RunCom(ns, 'ns.sleeve.setToBladeburnerAction()', [id, "Diplomacy"]);
						break;
					case 4: // Cycle through BB Contracts (WIP)
						ns.print("Doing BB Contracts");
						let trackCount = await nstb.RunCom(ns, 'ns.bladeburner.getActionCountRemaining()', ['Contracts', 'Tracking']);
						let bountyCount = await nstb.RunCom(ns, 'ns.bladeburner.getActionCountRemaining()', ['Contracts', 'Bounty Hunter']);
						let retireCount = await nstb.RunCom(ns, 'ns.bladeburner.getActionCountRemaining()', ['Contracts', 'Retirement']);
						if (trackCount + bountyCount + retireCount == 0) { // If no contracts left, infiltrate
							if (task == null || task.type != "INFILTRATE")
								await nstb.RunCom(ns, 'ns.sleeve.setToBladeburnerAction()', [id, "Infiltrate synthoids"]);
						} else {
							let contract = "Tracking";
							if (retireCount > 0) contract = "Retirement";
							else if (bountyCount > 0) contract = "Bounty Hunter";
							else contract = "Tracking";
							if (task == null || task.type != null || task.actionName != contract)
								await nstb.RunCom(ns, 'ns.sleeve.setToBladeburnerAction()', [id, "Take on contracts", contract]);
						}
						break;
					default: // Permanently do BB Infiltration
						ns.print("Doing BB Infiltration");
						if (task == null || task.type != "INFILTRATE") {
							await nstb.RunCom(ns, 'ns.sleeve.setToBladeburnerAction()', [id, "Infiltrate synthoids"])
						}
						break;
				}
			}
			ns.print(await nstb.RunCom(ns, 'ns.sleeve.getTask()', [id]));
			sleeveshocks.push(stats.shock);
		}
	}
	// push sleeve shock numbers to globals
	if (sleeveshocks.length == slnum) nstb.updGlobals(ns, ["sleeve.shock", tb.GetMinOfArray(sleeveshocks)])


	// ==================================================================================================
	// Functions
	// ==================================================================================================

	// returns the id of the sleeve who's turn it is to purchase augs
	function GetLoopTurn() {
		let divs = loopdur / slnum;
		for (let x = 0; x < slnum; ++x) {
			if (x * divs <= looptime && looptime < ((x + 1) * divs)) { return x }
		}
	}

	async function TrainStats(id, stats, level) {
		if (tb.SumDict(GLOBAL_VARS["income"]) >= 10000) {
			if (stats.strength < level) { await nstb.RunCom(ns, 'ns.sleeve.setToGymWorkout()', [id, "Powerhouse Gym", "strength"]); return false; }
			else if (stats.defense < level) { await nstb.RunCom(ns, 'ns.sleeve.setToGymWorkout()', [id, "Powerhouse Gym", "defense"]); return false; }
			else if (stats.dexterity < level) { await nstb.RunCom(ns, 'ns.sleeve.setToGymWorkout()', [id, "Powerhouse Gym", "dexterity"]); return false; }
			else if (stats.agility < level) { await nstb.RunCom(ns, 'ns.sleeve.setToGymWorkout()', [id, "Powerhouse Gym", "agility"]); return false; }
			else { return true; }
		} else if (stats.strength < level || stats.defense < level || stats.dexterity < level || stats.agility < level) {
			let task = await nstb.RunCom(ns, 'ns.sleeve.getTask()', [id]);
			if (task == null || task.type != "CRIME" || (task.type == "CRIME" && task.crimeType != "MUG")) await nstb.RunCom(ns, 'ns.sleeve.setToCommitCrime()', [id, 'MUG']);
			return false;
		} else { return true; }
	}

	async function BuildStats(id, stats, maxLevel) {
		if (maxLevel == null) { maxLevel = 9999999 }

		let lowStat;
		if (metaPlan == "all" || metaPlan == "nogang") {
			let combatLv = (stats.strength + stats.defense + stats.dexterity + stats.agility) / 4
			if (combatLv < stats.hacking && combatLv < maxLevel) { lowStat = "combat" }
			else if (stats.hacking < maxLevel) { lowStat = "hacking" }
			else { return true }
		}
		else if (metaPlan == "pillonly" && stats.hacking < maxLevel) { lowStat = "hacking" }
		else { return false }

		let potentialFacs = tb.ArrSubtract(joinedfactions, occupiedFacs)
		if (lowStat == "combat") { potentialFacs = tb.ArrSubtract(potentialFacs, ["Netburners", "CyberSec", "Bitrunners", "NiteSec"])}
		else if (lowStat == "hacking") { potentialFacs = tb.ArrSubtract(potentialFacs, ["Tetrads", "Slum Snakes"])}
		if (potentialFacs.length > 0) {
			let nextfac = potentialFacs.shift()
			await WorkForFac(id, nextfac)
		} else if (await TrainStats(id, stats, 10)) {
			if (lowStat == "combat" || metaPlan == "pillonly") { await nstb.RunCom(ns, 'ns.sleeve.setToCommitCrime()', [id, 'MUG']) }
			else if (lowStat == "hacking" && tb.SumDict(GLOBAL_VARS["income"]) >= 10000) { await nstb.RunCom(ns, 'ns.sleeve.setToUniversityCourse()', [id, "Rothman University", "Algorithms"]) }
			return false;
		}
	}


	async function GetKarma(id) {
		let task = await nstb.RunCom(ns, 'ns.sleeve.getTask()', [id]);
		if (await nstb.GetCrimeGains(ns, "HOMICIDE", "karma", await nstb.GetSleeveCrimeChance(ns, id, "HOMICIDE")) >= await nstb.GetCrimeGains(ns, "MUG", "karma", await nstb.GetSleeveCrimeChance(ns, id, "MUG"))) {
			if (task == null || task.type != "CRIME" || (task.type == "CRIME" && task.crimeType != "HOMICIDE")) await nstb.RunCom(ns, 'ns.sleeve.setToCommitCrime()', [id, 'HOMICIDE']);
		} else { if (task == null || task.type != "CRIME" || (task.type == "CRIME" && task.crimeType != "MUG")) await nstb.RunCom(ns, 'ns.sleeve.setToCommitCrime()', [id, 'MUG']); }
	};


	async function GetNeededAugs(aug) {
		let joinedfactions = player.factions;
		let neededAugs = [];
		for (var faction of joinedfactions) {
			let faugs = await nstb.RunCom(ns, 'ns.singularity.getAugmentationsFromFaction()', [faction])
			for (var aug of faugs) {
				if (aug != "NeuroFlux Governor") {
					for (var id = 0; id < slnum; ++id) {
						let slaugs = await nstb.RunCom(ns, 'ns.sleeve.getSleeveAugmentations()', [id])
						if (!slaugs.includes(aug) && !neededAugs.includes(aug)) { neededAugs.push(aug); break; }
					}
				}
			}
		}
		return neededAugs;
	}


	async function GetRepNeeded(faction) {
		let factionAugs = await nstb.RunCom(ns, 'ns.singularity.getAugmentationsFromFaction()', [faction]);
		// get the needed aug with the highest rep cost in this faction
		var bestAug = null;
		for (let aug of factionAugs) {
			if (neededAugs.includes(aug)) {
				if (bestAug == null) { bestAug = aug }
				else {
					var bestRep = await nstb.RunCom(ns, 'ns.sleeve.getSleeveAugmentationRepReq()', [bestAug]);
					var augRep = await nstb.RunCom(ns, 'ns.sleeve.getSleeveAugmentationRepReq()', [aug]);
					if (augRep > bestRep) { bestAug = aug }
				}
			}
		}; if (bestAug == null) { return 0; }

		let bestAugRep = await nstb.RunCom(ns, 'ns.sleeve.getSleeveAugmentationRepReq()', [bestAug]);
		let curRep = await nstb.RunCom(ns, 'ns.singularity.getFactionRep()', [faction]);
		if (curRep < bestAugRep) { return bestAugRep; }	// If we cannot currently afford the bestAug ...
		else { return 0; } // otherwise, we don't need more rep for this faction.
	}

	async function GetFactions() {
		let joinedfactions = player.factions
		let factions = [];

		for (let faction of joinedfactions) {
			// If the faction still needs more rep 
			if (await GetRepNeeded(faction) > 0) {
				if (await GetFavorUntilDonate(faction) > 0) { factions.push(faction) } // if the faction isnt ready for donations next loop, add to list
				else if (await GetFavorUntilDonate(faction) == -1) { await TryDonate(faction) } // if we can donate right now, try it.
			}
		}
		return factions;
	}


	async function GetCompanyFacsNeeded() {
		let allComps =
			["Fulcrum Technologies", "ECorp", "MegaCorp", "KuaiGong International", "Four Sigma", "NWO",
				"Blade Industries", "OmniTek Incorporated", "Bachman & Associates",
				"Clarke Incorporated"]
		let companies = [];

		for (let comp of allComps) {
			var compfac;
			if (comp == "Fulcrum Technologies") { compfac = "Fulcrum Secret Technologies" }
			else { compfac = comp }
			// If the related faction has not yet been joined, add it to the list
			if (!player.factions.includes(compfac)) { companies.push(comp) }
		}
		return companies;
	}

	async function BuyAugs(id, augslist) {
		ns.print("Buyable Augs: "); ns.print(augslist);
		let totalcost = 0
		for (var aug of augslist) {
			if (player.money >= aug.cost && aug.cost <= maxSpend) {
				if (await nstb.RunCom(ns, 'ns.sleeve.purchaseSleeveAug()', [id, aug.name])) {
					ns.toast("Bought aug " + aug.name + " for Sleeve " + id, "info", 1500)
				}
			}
		}
	}

	async function GetFavorUntilDonate(faction) {
		let favor = await nstb.RunCom(ns, 'ns.singularity.getFactionFavor()', [faction]);
		let favorToDonate = await nstb.RunCom(ns, 'ns.getFavorToDonate()');
		var favorOnReset = await nstb.RunCom(ns, 'ns.singularity.getFactionFavorGain()', [faction]);
		if (favor + favorOnReset < favorToDonate) { return favorToDonate - (favor + favorOnReset) } // need more favor to donate
		else if (favor >= favorToDonate) { return -1 } // can donate right now
		else { return 0; } //can donate next loop
	}

	async function TryDonate(faction) {
		player = await nstb.RunCom(ns, 'ns.getPlayer()')
		let repReq = await GetRepNeeded(faction) - await nstb.RunCom(ns, 'ns.singularity.getFactionRep()', [faction]);
		var repMulti = player.mults.faction_rep
		// (donation amt * rep multi) / 10^6 = rep gain
		// (rep gain * 10^6) / rep multi = donation amt
		let reqDonation = Math.ceil((repReq * (10 ** 6)) / repMulti)
		if (player.money >= reqDonation && reqDonation <= maxSpend) { await nstb.RunCom(ns, 'ns.singularity.donateToFaction()', [faction, reqDonation]) }
	}



	async function WorkForFac(id, faction) {
		let sldata = await nstb.RunCom(ns, 'ns.sleeve.getSleeveStats()', [id])
		let player = await nstb.RunCom(ns, 'ns.getPlayer()')
		let pldata = player.skills
		occupiedFacs.push(faction)
		var avgCombat = (sldata.strength + sldata.defense + sldata.dexterity + sldata.agility) / 4
		let workPriority = [];
		if (avgCombat < sldata.hacking) { workPriority = ["Hacking Contracts", "Security Work", "Field Work"] }
		else { workPriority = ["Security Work", "Field Work", "Hacking Contracts"] }
		//ns.print(workPriority)

		var bestWork = null;
		for (var index = 0; index < 3; ++index) {
			if (bestWork == null) {
				let trywork = await nstb.RunCom(ns, 'ns.sleeve.setToFactionWork()', [id, faction, workPriority[index]])
				if (trywork) { bestWork = workPriority[index]; }
			}
		}
	}



	async function WorkForCom(id) {
		for (let company of companiesNeeded) {
			let canWork = false;
			try { canWork = await nstb.RunCom(ns, 'ns.sleeve.setToCompanyWork()', [id, company]) }
			catch (err) { ns.print("ERROR: \n", err) }
			//ns.print(company)
			//ns.print(canWork)
			if (canWork) {
				tb.DelFromArray(company, companiesNeeded);
				return;
			}
		}
	}

}