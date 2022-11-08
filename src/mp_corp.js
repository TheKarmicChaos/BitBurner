import * as nstb from "./lib/nstools";

/** @param {import("..").NS} ns */
export async function main(ns) {
	//ns.tail('mp_corp.js'); ns.disableLog("ALL"); ns.clearLog();

	const CorpApi = ns.corporation
	const corp = "CorpoCorp";
	const doLog = true;
	const cities = ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"];

	// try to get a corp, regardless of whether we want one or not (stocks will not liquidate if wantCorp is false, giving a longer delay)
	await purchaseCorp();

	const getCorp = () => ns.corporation.getCorporation();

	const bndata = nstb.PeekPort(ns, 1)["mults"];
	const SOFTCAP_MULT = bndata.CorporationSoftcap || 1;
	const VALUATION_MULT = bndata.CorporationValuation || 1;

	let round = CorpApi.getInvestmentOffer().round - 1;
	const analyzefile = "/analyze-corp.txt";
	const all_divisions = ["Software", "Agriculture", "Fishing", "Chemical", "Tobacco", "Food"]
	const main_division = "Software";
	const prodMat = "AI Cores";
	const division_goals = [1]
	const employee_goals = [3]
	const storage_goals = [8]
	const speech_goals = [0]
	const dream_goals = [0]
	const smart_goals = [7]
	const project_goals = [0]
	const abc_goals = [0]
	const adv_goals = [3]
	const start = ns.getPlayer().playtimeSinceLastBitnode;

	// if valuations are high enough, start by committing fraud
	if (round == 0 && VALUATION_MULT >= 0.35) { await CommitFraud(); }
	else { await GrowTobacco(); }


	// This function was provided by _Jakob_ from the bitburner discord!
	async function CommitFraud() {

		await prep()
		await party()
		await waitState("START")
		await takeOffer();
		await end();



		
		async function prep() {
			//divisions
			while (CorpApi.getCorporation(corp).divisions.length < division_goals[round]) {
				let name = all_divisions[CorpApi.getCorporation(corp).divisions.length]
				CorpApi.expandIndustry(name, name);

			}
			//upgrades && unlocks
			while (CorpApi.getUpgradeLevel("Smart Storage") < smart_goals[round]) { await CorpApi.levelUpgrade("Smart Storage"); }
			while (CorpApi.getUpgradeLevel("Project Insight") < project_goals[round]) { await CorpApi.levelUpgrade("Project Insight") }
			while (CorpApi.getUpgradeLevel("Neural Accelerators") < project_goals[round]) { await CorpApi.levelUpgrade("Neural Accelerators") }
			while (CorpApi.getUpgradeLevel("Nuoptimal Nootropic Injector Implants") < project_goals[round]) { await CorpApi.levelUpgrade("Nuoptimal Nootropic Injector Implants") }
			while (CorpApi.getUpgradeLevel("FocusWires") < project_goals[round]) { await CorpApi.levelUpgrade("FocusWires") }
			while (CorpApi.getUpgradeLevel("Speech Processor Implants") < speech_goals[round]) { await CorpApi.levelUpgrade("Speech Processor Implants"); }
			while (CorpApi.getUpgradeLevel("DreamSense") < dream_goals[round]) { await CorpApi.levelUpgrade("DreamSense"); }
			while (CorpApi.getUpgradeLevel("ABC SalesBots") < abc_goals[round]) { await CorpApi.levelUpgrade("ABC SalesBots"); }

			//prep each division & city
			for (const division of CorpApi.getCorporation().divisions) {
				//expand to all cities in all divisions
				while (CorpApi.getDivision(division.name).cities.length < cities.length) {
					for (let city of cities) { if (!CorpApi.getDivision(division.name).cities.includes(city)) { await CorpApi.expandCity(division.name, city); } }

				}
				//buy some ads 
				while (CorpApi.getHireAdVertCount(division.name) < adv_goals[round]) { await CorpApi.hireAdVert(division.name); }
				//buy Warehouses
				for (let city of cities) {
					if (CorpApi.hasWarehouse(division.name, city) == false) { await CorpApi.purchaseWarehouse(division.name, city); }
				}
				//prep each city to goal
				for (let city of cities) {
					//upgrade Warehouses to current goal
					while (CorpApi.getWarehouse(division.name, city).level < storage_goals[round]) { await CorpApi.upgradeWarehouse(division.name, city); await ns.sleep(1) }
					//upgrade Office size to goal
					while (CorpApi.getOffice(division.name, city).size < employee_goals[round]) { CorpApi.upgradeOfficeSize(division.name, city, 3); }
					//hire to max
					while (CorpApi.getOffice(division.name, city).employees.length < CorpApi.getOffice(division.name, city).size) { await CorpApi.hireEmployee(division.name, city); }

					//make sure we have mats for qlt update later
					if (division.name == main_division) {
						CorpApi.buyMaterial(division.name, city, "Energy", 0.01)
						CorpApi.buyMaterial(division.name, city, "Hardware", 0.01)
					}
				}
			}
		}
		async function party() {

			for (const division of CorpApi.getCorporation().divisions) {
				for (let city of cities) {
					await CorpApi.setAutoJobAssignment(division.name, city, "Business", 0);
					await CorpApi.setAutoJobAssignment(division.name, city, "Operations", 0);
					await CorpApi.setAutoJobAssignment(division.name, city, "Engineer", 0);
					await CorpApi.setAutoJobAssignment(division.name, city, "Management", 0);
					await CorpApi.setAutoJobAssignment(division.name, city, "Research & Development", CorpApi.getOffice(division.name, city).employees.length);
				}

			}
			let done = 0;
			while (done < CorpApi.getCorporation().divisions.length) {
				done = 0;
				for (const division of CorpApi.getCorporation().divisions) {
					let d_mor = 0;
					let d_ene = 0;
					let d_hap = 0;
					for (let city of cities) {
						let tmorale = 0;
						let tenergy = 0;
						let thappiness = 0;
						CorpApi.getOffice(division.name, city).employees.forEach(x => tmorale += CorpApi.getEmployee(division.name, city, x).mor);
						CorpApi.getOffice(division.name, city).employees.forEach(x => tenergy += CorpApi.getEmployee(division.name, city, x).ene);
						CorpApi.getOffice(division.name, city).employees.forEach(x => thappiness += CorpApi.getEmployee(division.name, city, x).hap);
						tmorale = tmorale / CorpApi.getOffice(division.name, city).employees.length;
						tenergy = tenergy / CorpApi.getOffice(division.name, city).employees.length;
						thappiness = thappiness / CorpApi.getOffice(division.name, city).employees.length;
						let party = 3e6 * (round + 1);
						tmorale > 99.8 && thappiness > 99.8 ? party = 1e5 : null;
						tmorale < 100 || thappiness < 100 ? CorpApi.throwParty(division.name, city, party) : null;
						tenergy < 100 ? CorpApi.buyCoffee(division.name, city) : null;

						tmorale > 99.9 ? d_mor += 1 : null;
						tenergy > 99.9 ? d_ene += 1 : null;
						thappiness > 99.9 ? d_hap += 1 : null;
					}
					d_mor == 6 && d_ene == 6 && d_hap == 6 ? done++ : null;
				}
				await waitState("START", 1, true)
			}
		}
		async function takeOffer() {
			//we buy a ton of cores to sell them later the cores we produce set the quality
			for (const division of CorpApi.getCorporation().divisions) {
				for (let city of cities) {
					await CorpApi.setAutoJobAssignment(division.name, city, "Research & Development", 0);
					//we need engineers to produce and the more the higher the qlt gained 
					await CorpApi.setAutoJobAssignment(division.name, city, "Engineer", CorpApi.getOffice(division.name, city).employees.length);
					//we leave a bit of space for so we can actually produce high qlt cores
					const amt = CorpApi.getWarehouse(division.name, city).size - CorpApi.getWarehouse(division.name, city).sizeUsed - 5;
					CorpApi.buyMaterial(division.name, city, "AI Cores", amt);
				}
			}
			//wait for warehouse to fill
			while (CorpApi.getWarehouse(main_division, cities[0]).sizeUsed < CorpApi.getWarehouse(main_division, cities[0]).size - 5) { await ns.sleep(100) }
			//reset buys to 0
			for (const division of CorpApi.getCorporation().divisions) { for (let city of cities) { CorpApi.buyMaterial(division.name, city, "AI Cores", 0) } }
			//set employees for fraud
			for (const division of CorpApi.getCorporation().divisions) {
				for (let city of cities) {

					await CorpApi.setAutoJobAssignment(division.name, city, "Research & Development", 0);
					await CorpApi.setAutoJobAssignment(division.name, city, "Operations", 0);
					await CorpApi.setAutoJobAssignment(division.name, city, "Engineer", 0);
					await CorpApi.setAutoJobAssignment(division.name, city, "Management", 0);
					await CorpApi.setAutoJobAssignment(division.name, city, "Business", CorpApi.getOffice(division.name, city).employees.length);
				}
			}

			await waitState("EXPORT")
			//we make sure that we dont sell anything early :3
			for (const division of CorpApi.getCorporation().divisions) {
				for (let city of cities) {
					CorpApi.sellMaterial(division.name, city, prodMat, "MAX", "MP");
				}
			}
			//we wait for 5 cycles so the game forgets all bad cycles and we wait for "START" to end to be sure that the Offer is at its peak
			await waitState("START", 5, true)

			const offer = CorpApi.getInvestmentOffer().funds;
			await CorpApi.acceptInvestmentOffer();
			round++
			analyze(offer);
		}
		async function end() {
			!CorpApi.hasUnlockUpgrade("Smart Supply") && CorpApi.getUnlockUpgradeCost("Smart Supply") < CorpApi.getCorporation().funds ? CorpApi.unlockUpgrade("Smart Supply") : null;

			for (const division of CorpApi.getCorporation().divisions) {
				for (let city of cities) {
					CorpApi.setSmartSupply(division.name, city, true)
					await CorpApi.setAutoJobAssignment(division.name, city, "Business", 0);
					await CorpApi.setAutoJobAssignment(division.name, city, "Research & Development", CorpApi.getOffice(division.name, city).employees.length / 3);
					await CorpApi.setAutoJobAssignment(division.name, city, "Engineer", CorpApi.getOffice(division.name, city).employees.length / 3);
					await CorpApi.setAutoJobAssignment(division.name, city, "Management", CorpApi.getOffice(division.name, city).employees.length / 3);


				}
			}
		}
		function analyze(offer) {
			const end = ns.getPlayer().playtimeSinceLastBitnode;
			const runtime = ns.tFormat(end - start);
			const result = round + ": " + offer + " after " + runtime;
			round == 1 ? ns.write(analyzefile, "\n" + result, "a") : ns.write(analyzefile, " " + result, "a");

		}
	}


	// if we already have a corp, go down the following list of commands and execute the first one we haven't done yet
	async function GrowTobacco() {

		let divs = getCorp().divisions
		let divArr = []
		for (let divObj of divs) { divArr.push(divObj.name); };
		//ns.print("Corp: \n", getCorp());
		let invOffer = ns.corporation.getInvestmentOffer()
		let profitPerSec = (getCorp().revenue - getCorp().expenses) / 10
		//ns.print("profitPerSec: ", profitPerSec)
		let desiredDividend = 0.2;
		// adjustedDividend, should give us the desired same effect as the desiredDividend, but compensates for SOFTCAP_MULT (maxes out at 50% dividend)
		let adjustedDividend = Math.min(0.5, desiredDividend / SOFTCAP_MULT);


		// write income to port
		nstb.UpdPort(ns, 2, "dict", ["corp", getCorp().dividendEarnings]);
		nstb.UpdPort(ns, 8, "dict", ["wantCorp", false, "hasCorp", true, "funds", getCorp().funds]);


		// ==================================================================================================
		// PHASE 2: Set up Tobacco
		// ==================================================================================================

		// Get smart supply if we skipped fraud.
		!CorpApi.hasUnlockUpgrade("Smart Supply") && CorpApi.getUnlockUpgradeCost("Smart Supply") < CorpApi.getCorporation().funds ? CorpApi.unlockUpgrade("Smart Supply") : null;

		// if we do not have Toba division
		if (!hasDivision("Toba")) {
			if (doLog) ns.print("Trying to expand into Tobacco");
			ns.corporation.expandIndustry("Tobacco", "Toba"); // expand into tobacco
			ns.toast("Corp expanded into industry: Tobacco", "success", 10000);
		}

		// if at any point we have > 5000 research & don't own Hi-Tech R&D Laboratory
		else if (ns.corporation.getDivision("Toba").research > 5000 && !ns.corporation.hasResearched("Toba", "Hi-Tech R&D Laboratory")) {
			if (doLog) ns.print("Trying to research R&D Lab");
			// research it
			ns.corporation.research("Toba", "Hi-Tech R&D Laboratory");
			ns.toast("Corp @Toba researched: Hi-Tech R&D Laboratory", "success", 5000);
		}

		// if at any point we have > 100k research & don't own Market-TA.II
		else if (ns.corporation.getDivision("Toba").research > 100e3 && !ns.corporation.hasResearched("Toba", "Market-TA.II")) {
			if (doLog) ns.print("Trying to research TA.II");
			// research Market-TA.I & Market-TA.II
			ns.corporation.research("Toba", "Market-TA.I");
			ns.toast("Corp @Toba researched: Market-TA.I", "success", 5000);
			await ns.sleep(10000)
			ns.corporation.research("Toba", "Market-TA.II");
			ns.toast("Corp @Toba researched: Market-TA.II", "success", 5000);
		}

		// if we haven't yet initialized Toba cities
		else if (!ns.corporation.getDivision("Toba").cities.includes("Volhaven")) {
			if (doLog) ns.print("Trying to initialize all cities for Toba");

			for (const city of cities) { // for each city

				// if we dont own an office in this city, buy office & warehouse
				if (!ns.corporation.getDivision("Toba").cities.includes(city)) {
					ns.corporation.expandCity("Toba", city);
					ns.corporation.purchaseWarehouse("Toba", city);
				}
				let whouse = () => ns.corporation.getWarehouse("Toba", city);
				let office = () => ns.corporation.getOffice("Toba", city);

				// if the warehouse < lv3, buy until it is
				if (whouse().level < 3) {
					if (getCorp().funds >= ns.corporation.getUpgradeWarehouseCost("Toba", city, 3 - whouse().level))
						ns.corporation.upgradeWarehouse("Toba", city, 3 - whouse().level);
				}
				// enable smart supply
				ns.corporation.setSmartSupply("Toba", city, true);
				// hire to max
				while (office().employees.length < office().size) { await CorpApi.hireEmployee("Toba", city); }
				// Assign proper job positions
				SetJobAssign("Toba", city, [1, 1, 1, 0, 0, 0]);
			}
		}

		// if we do not have 15 Aevum employees
		else if (ns.corporation.getOffice("Toba", "Aevum").employees.length < 15) {
			if (doLog) ns.print("Trying to get 15 Aevum employees");

			let office = () => ns.corporation.getOffice("Toba", "Aevum");
			// if the office cant hold 15 employees, upgrade size
			if (office().size < 15) ns.corporation.upgradeOfficeSize("Toba", "Aevum", 15 - office().size);
			// hire to max
			while (office().employees.length < office().size) { await CorpApi.hireEmployee("Toba", "Aevum"); }
			// Assign proper job positions
			SetJobAssign("Toba", "Aevum", [3, 3, 3, 3, 3, 0]);
		}

		// If we don't have tier 1 (basic) global upgrades, get them
		else if (ns.corporation.getUpgradeLevel("Smart Factories") < 2) {
			if (doLog) ns.print("Trying to get t1 global upgrades");
			if (ns.corporation.getUpgradeLevel("FocusWires") < 2) { ns.corporation.levelUpgrade("FocusWires") }
			else if (ns.corporation.getUpgradeLevel("Neural Accelerators") < 2) { ns.corporation.levelUpgrade("Neural Accelerators") }
			else if (ns.corporation.getUpgradeLevel("Speech Processor Implants") < 2) { ns.corporation.levelUpgrade("Speech Processor Implants") }
			else if (ns.corporation.getUpgradeLevel("Nuoptimal Nootropic Injector Implants") < 2) { ns.corporation.levelUpgrade("Nuoptimal Nootropic Injector Implants") }
			else if (ns.corporation.getUpgradeLevel("Smart Factories") < 2) { ns.corporation.levelUpgrade("Smart Factories") }
		}

		// if we do not have any products in the works
		else if (ns.corporation.getDivision("Toba").products.length < 1) {
			if (doLog) ns.print("Trying to develop 1st product");
			// develop our first product
			ns.corporation.makeProduct("Toba", "Aevum", "Toba-1", 500e6, 500e6);
			ns.toast("Corp developing new product: Toba-1", "success", 5000);
		}

		// loop here until we have 2 product slots filled (1 completed and 1 in dev)
		else if (ns.corporation.getDivision("Toba").products.length < 2) {
			if (doLog) ns.print("Buying ads/wilson while waiting for 1st product to finish");
			let wilCost = ns.corporation.getUpgradeLevelCost("Wilson Analytics");
			let adCost = ns.corporation.getHireAdVertCost("Toba");
			// if we can afford a Wilson Analytics level, buy it
			if (getCorp().funds - 1.5e9 >= wilCost) { ns.corporation.levelUpgrade("Wilson Analytics"); }
			// otherwise if we can afford an advert, buy it
			else if (getCorp().funds - 1.5e9 >= adCost) { ns.corporation.hireAdVert("Toba"); }
			// if Toba-1 is done being developed
			if (ns.corporation.getProduct("Toba", "Toba-1").developmentProgress == 100) {
				// Update the price of Toba-1
				await UpdatePrice("Toba", "Toba-1");
				// develop our second product
				ns.corporation.makeProduct("Toba", "Aevum", "Toba-2", 500e6, 500e6);
				ns.toast("Corp developing new product: Toba-2", "success", 5000);
			}
		}

		// ==================================================================================================
		// PHASE 3: Final Logic & Going Public
		// ==================================================================================================

		// if we don't yet have tier 2 global upgrades (and can afford them), get them
		else if (ns.corporation.getUpgradeLevel("Project Insight") < 10 && getCorp().funds >= 10e9) {
			if (doLog) ns.print("Trying to get t2 global upgrades");
			if (ns.corporation.getUpgradeLevel("Smart Storage") < 5) { ns.corporation.levelUpgrade("Smart Storage") }
			else if (ns.corporation.getUpgradeLevel("Smart Factories") < 5) { ns.corporation.levelUpgrade("Smart Factories") }
			else if (ns.corporation.getUpgradeLevel("FocusWires") < 10) { ns.corporation.levelUpgrade("FocusWires") }
			else if (ns.corporation.getUpgradeLevel("Neural Accelerators") < 10) { ns.corporation.levelUpgrade("Neural Accelerators") }
			else if (ns.corporation.getUpgradeLevel("Speech Processor Implants") < 10) { ns.corporation.levelUpgrade("Speech Processor Implants") }
			else if (ns.corporation.getUpgradeLevel("Nuoptimal Nootropic Injector Implants") < 10) { ns.corporation.levelUpgrade("Nuoptimal Nootropic Injector Implants") }
			else if (ns.corporation.getUpgradeLevel("Project Insight") < 10) { ns.corporation.levelUpgrade("Project Insight") };
		}

		// if we don't yet have tier 3 global upgrades (and can afford them), get them
		else if (ns.corporation.getUpgradeLevel("Project Insight") < 20 && getCorp().funds >= 50e9) {
			if (doLog) ns.print("Trying to get t3 global upgrades");
			if (ns.corporation.getUpgradeLevel("Smart Storage") < 10) { ns.corporation.levelUpgrade("Smart Storage") }
			else if (ns.corporation.getUpgradeLevel("Smart Factories") < 10) { ns.corporation.levelUpgrade("Smart Factories") }
			else if (ns.corporation.getUpgradeLevel("FocusWires") < 20) { ns.corporation.levelUpgrade("FocusWires") }
			else if (ns.corporation.getUpgradeLevel("Neural Accelerators") < 20) { ns.corporation.levelUpgrade("Neural Accelerators") }
			else if (ns.corporation.getUpgradeLevel("Speech Processor Implants") < 20) { ns.corporation.levelUpgrade("Speech Processor Implants") }
			else if (ns.corporation.getUpgradeLevel("Nuoptimal Nootropic Injector Implants") < 20) { ns.corporation.levelUpgrade("Nuoptimal Nootropic Injector Implants") }
			else if (ns.corporation.getUpgradeLevel("Project Insight") < 20) { ns.corporation.levelUpgrade("Project Insight") };
		}

		// put all other research we want below, like so:
		else if (ns.corporation.getDivision("Toba").research > 140e3 && !ns.corporation.hasResearched("Toba", "uPgrade: Capacity.II")) {
			ns.corporation.research("Toba", "uPgrade: Fulcrum");
			ns.toast("Corp @Toba researched: uPgrade: Fulcrum", "success", 5000); await ns.sleep(10000);
			ns.corporation.research("Toba", "uPgrade: Capacity.I");
			ns.toast("Corp @Toba researched: uPgrade: Capacity.I", "success", 5000); await ns.sleep(10000);
			ns.corporation.research("Toba", "uPgrade: Capacity.II");
			ns.toast("Corp @Toba researched: uPgrade: Capacity.II", "success", 5000);
		}
		// put all other upgrades we want below, like so:
		else if (CanGetUnlock("Shady Accounting")) {
			ns.corporation.unlockUpgrade("Shady Accounting");
			ns.toast("Corp unlocked: Shady Accounting", "success", 5000);
		}
		else if (CanGetUnlock("Government Partnership")) {
			ns.corporation.unlockUpgrade("Government Partnership");
			ns.toast("Corp unlocked: Government Partnership", "success", 5000);
		}
		else if (CanGetLevel(profitPerSec * 30, "Project Insight")) { BuyLevel(profitPerSec * 30, "Project Insight") }
		else if (CanGetLevel(profitPerSec * 0.2, "Smart Storage")) { BuyLevel(profitPerSec * 0.2, "Smart Storage") }
		else if (CanGetLevel(profitPerSec * 0.2, "Smart Factories")) { BuyLevel(profitPerSec * 0.2, "Smart Factories") }
		else if (CanGetLevel(profitPerSec * 0.1, "Nuoptimal Nootropic Injector Implants")) { BuyLevel(profitPerSec * 0.1, "Nuoptimal Nootropic Injector Implants") }
		else if (CanGetLevel(profitPerSec * 0.1, "Speech Processor Implants")) { BuyLevel(profitPerSec * 0.1, "Speech Processor Implants") }
		else if (CanGetLevel(profitPerSec * 0.1, "Neural Accelerators")) { BuyLevel(profitPerSec * 0.1, "Neural Accelerators") }
		else if (CanGetLevel(profitPerSec * 0.1, "FocusWires")) { BuyLevel(profitPerSec * 0.1, "FocusWires") }
		else if (CanGetLevel(profitPerSec * 0.1, "ABC SalesBots")) { BuyLevel(profitPerSec * 0.1, "ABC SalesBots") }
		else if (CanGetLevel(profitPerSec * 0.01, "DreamSense")) { BuyLevel(profitPerSec * 0.01, "DreamSense") }
		// put all other random purchases we want below, like so:
		else if (CanGetWarehouse(profitPerSec * 0.1, "Toba", "Aevum", 10)) { BuyWarehouse(profitPerSec * 0.1, "Toba", "Aevum", 10); }
		else if (CanGetWarehouse(profitPerSec * 0.1, "Toba", "Chongqing", 10)) { BuyWarehouse(profitPerSec * 0.1, "Toba", "Chongqing", 10); }
		else if (CanGetWarehouse(profitPerSec * 0.1, "Toba", "Sector-12", 10)) { BuyWarehouse(profitPerSec * 0.1, "Toba", "Sector-12", 10); }
		else if (CanGetWarehouse(profitPerSec * 0.1, "Toba", "New Tokyo", 10)) { BuyWarehouse(profitPerSec * 0.1, "Toba", "New Tokyo", 10); }
		else if (CanGetWarehouse(profitPerSec * 0.1, "Toba", "Ishima", 10)) { BuyWarehouse(profitPerSec * 0.1, "Toba", "Ishima", 10); }
		else if (CanGetWarehouse(profitPerSec * 0.1, "Toba", "Volhaven", 10)) { BuyWarehouse(profitPerSec * 0.1, "Toba", "Volhaven", 10); }


		// If we have not gone public & are ready to do so (ie when we have Market-TA.II OR our profit >= $1b/sec)
		else if (!getCorp().public && (ns.corporation.hasResearched("Toba", "Market-TA.II") || getCorp().revenue - getCorp().expenses >= 1e9 / SOFTCAP_MULT)) {
			if (ns.corporation.goPublic(0)) { // go public, isssue no ISO because we are greedy
				ns.toast("Corp has gone public!", "success", 20000);
			};
		}

		// if we are public and have not issued dividends
		else if (getCorp().public && getCorp().dividendRate != adjustedDividend) {
			// issue dividends such that, post-multiplier, we get the desiredDividend amount (maxes out at 50% dividend)
			ns.corporation.issueDividends(adjustedDividend);
		}


		// Otherwise, just keep running through the following logic to exponentially grow profit!
		// ==================================================================================================
		// ==================================================================================================
		else {
			if (doLog) ns.print("Attempting to run through final logic loop");

			// bribe factions if necessary
			if (profitPerSec >= 10 * 1e15) {
				let factions = ns.getPlayer().factions;
				for (let faction of factions) {
					// at profitPerSec between 10q and 10Q, bribe factions until we can afford everything.
					if (faction != "Slum Snakes" && profitPerSec < 10 * 1e18) { 
						while (await GetRepNeeded(faction) > 0 && getCorp().funds >= profitPerSec) {
							ns.corporation.bribe(faction, profitPerSec); await ns.sleep(1);
						};
					}
					// at profitPerSec above 10Q, always bribe all factions with a small fraction of our profitPerSec
					else if (faction != "Slum Snakes" && profitPerSec >= 10 * 1e18) {
						ns.corporation.bribe(faction, profitPerSec/1000); await ns.sleep(1);
					}
				};
			};

			const maxProds = GetMaxProds("Toba"); // max # of products we can have
			let prods = ns.corporation.getDivision("Toba").products; // array of all the products we have

			// failsafe: if we don't have max prods, make the missing ones
			if (prods.length < maxProds) {
				let nextnum = (Number(prods[prods.length - 1].split("-")[1]) + 1)
				ns.corporation.makeProduct("Toba", "Aevum", "Toba-" + nextnum, 100e6, 100e6); // 100 million
				ns.toast("Corp developing new product: Toba-" + nextnum, "success", 5000);
			}

			// if we have max # of products and they are all done being developed
			else if (ns.corporation.getProduct("Toba", prods[maxProds - 1]).developmentProgress == 100) {
				// if we can develop a better product than the ones we already have
				if (ns.corporation.getDivision("Toba").research > 100e3 || !ns.corporation.hasResearched("Toba", "Market-TA.II")) {
					// discontinue the cheapest product
					ns.corporation.discontinueProduct("Toba", prods[0]);
					// start developing the next product
					let nextnum = (Number(prods[maxProds - 1].split("-")[1]) + 1)
					ns.corporation.makeProduct("Toba", "Aevum", "Toba-" + nextnum, profitPerSec, profitPerSec);
					ns.toast("Corp developing new product: Toba-" + nextnum, "success", 5000);
				};
			}

			// if all slots filled but one is being developed
			if (ns.corporation.getProduct("Toba", prods[maxProds - 1]).developmentProgress <= 100) {
				let office = () => ns.corporation.getOffice("Toba", "Aevum");

				let advertPrice = ns.corporation.getHireAdVertCost("Toba");
				let wilsonPrice = ns.corporation.getUpgradeLevelCost("Wilson Analytics");
				let officePrice = ns.corporation.getOfficeSizeUpgradeCost("Toba", "Aevum", 15);
				let subOfficePrice = ns.corporation.getOfficeSizeUpgradeCost("Toba", "Volhaven", 15) * 5;

				// if we can afford the cheapest of the 3 upgrades listed above
				if (getCorp().funds >= Math.min(advertPrice, wilsonPrice * 0.5, officePrice)) {
					let minPrice = Math.min(advertPrice, wilsonPrice * 0.5, officePrice);

					// if subOfficePrice is cheaper than the 3 upgrades AND sub offices are more than 60 behind Aevum in terms of size
					if (Math.min(minPrice, subOfficePrice) == subOfficePrice && ns.corporation.getOffice("Toba", "Volhaven").size < office().size - 60) {
						for (let city of cities) { // for all cities (except Aevum)
							if (city != "Aevum") {

								// buy the office size upgrade
								ns.corporation.upgradeOfficeSize("Toba", city, 15);
								// fill it with employees
								while (ns.corporation.getOffice("Toba", city).employees.length < ns.corporation.getOffice("Toba", city).size) {
									ns.corporation.hireEmployee("Toba", city);
								};
								// Assign proper job positions
								let frac = Math.floor(ns.corporation.getOffice("Toba", city).size / 5);
								SetJobAssign("Toba", city, [frac + 1, frac + 1, frac + 1, frac, frac, 0]);
							};
						};
					}

					// if advert was the cheapest, buy it
					else if (minPrice == advertPrice) {
						ns.corporation.hireAdVert("Toba");
					}

					// if wilson was the cheapest, buy it (or save up for it)
					else if (minPrice == wilsonPrice * 0.5) {
						if (getCorp().funds >= wilsonPrice)
							ns.corporation.levelUpgrade("Wilson Analytics");
					}

					// if office was the cheapest
					else if (minPrice == officePrice) {
						// buy it
						ns.corporation.upgradeOfficeSize("Toba", "Aevum", 15);
						// fill it with employees
						while (office().employees.length < office().size) {
							ns.corporation.hireEmployee("Toba", "Aevum");
						};
						// Assign proper job positions
						let frac = Math.floor(office().size / 5);
						SetJobAssign("Toba", "Aevum", [frac, frac, frac, frac, frac, 0]);
					};

				};
			};

			// update all product prices
			prods = ns.corporation.getDivision("Toba").products;
			for (let prod of prods) {
				await UpdatePrice("Toba", prod);
			};
		};
		// ==================================================================================================
		// ==================================================================================================

		// write progress to port
		let progrArr = ["profit", getCorp().revenue - getCorp().expenses]
		if (ns.corporation.getDivision("Toba") && ns.corporation.getDivision("Toba").products.length >= 2) { progrArr = progrArr.concat(["hasProd", true]) }
		if (ns.corporation.getDivision("Toba") && ns.corporation.hasResearched("Toba", "Hi-Tech R&D Laboratory")) { progrArr = progrArr.concat(["hasLab", true]) }
		if (ns.corporation.getDivision("Toba") && ns.corporation.hasResearched("Toba", "Market-TA.II")) { progrArr = progrArr.concat(["hasTA.II", true]) }
		if (ns.corporation.getDivision("Toba") && ns.corporation.getDivision("Toba").research > 0) { progrArr = progrArr.concat(["research", ns.corporation.getDivision("Toba").research]) }
		if (ns.corporation.getDivision("Toba")) { progrArr = progrArr.concat(["products", ns.corporation.getDivision("Toba").products]) }
		ns.print(ns.corporation.getDivision("Toba").products)
		ns.print(progrArr)
		nstb.UpdPort(ns, 8, "dict", progrArr)
	};





	function SetJobAssign(division, city, jobArr) {
		// reset current job assignments
		ns.corporation.setAutoJobAssignment(division, city, "Operations", 0);
		ns.corporation.setAutoJobAssignment(division, city, "Engineer", 0);
		ns.corporation.setAutoJobAssignment(division, city, "Business", 0);
		ns.corporation.setAutoJobAssignment(division, city, "Management", 0);
		ns.corporation.setAutoJobAssignment(division, city, "Research & Development", 0);
		ns.corporation.setAutoJobAssignment(division, city, "Training", 0);

		// set new job assignments
		ns.corporation.setAutoJobAssignment(division, city, "Operations", jobArr[0]);
		ns.corporation.setAutoJobAssignment(division, city, "Engineer", jobArr[1]);
		ns.corporation.setAutoJobAssignment(division, city, "Business", jobArr[2]);
		ns.corporation.setAutoJobAssignment(division, city, "Management", jobArr[3]);
		ns.corporation.setAutoJobAssignment(division, city, "Research & Development", jobArr[4]);
		ns.corporation.setAutoJobAssignment(division, city, "Training", jobArr[5]);
	};

	async function BuyToExactMat(division, city, material, amt) {
		let currentAmt = ns.corporation.getMaterial(division, city, material).qty;
		if (currentAmt >= amt) { return true; }
		else {
			// until the next tick happens
			while (ns.corporation.getMaterial(division, city, material).qty == currentAmt) {

				// Set buying rate to get the amount we need to reach amt on the next tick.
				let amtNeeded = amt - currentAmt;
				ns.corporation.buyMaterial(division, city, material, amtNeeded / 10);

				await ns.sleep(500);
			};
			// immediately disable buying of this material
			ns.corporation.buyMaterial(division, city, material, 0);

			// if we successfully got the amount desired, return true
			if (ns.corporation.getMaterial(division, city, material).qty >= amt) { return true; }

			// else, raise an error notification, return false
			else { ns.toast("ERROR: Failed to buy corrent amt of " + material + " @" + division + ", " + city, "error", 3000); return false; };
		};
	};

	// Gets the max # of products we can have in this division
	function GetMaxProds(division) {
		let maxProds = 0;
		if (ns.corporation.getDivision(division).makesProducts == true) {
			maxProds = 3;
			if (ns.corporation.hasResearched(division, "uPgrade: Capacity.I")) { maxProds += 1; }
			if (ns.corporation.hasResearched(division, "uPgrade: Capacity.II")) { maxProds += 1; }
		}
		return maxProds;
	};

	// Can we afford this unlock
	function CanGetUnlock(unlock) {
		const getCorp = () => ns.corporation.getCorporation();
		let cost = ns.corporation.getUnlockUpgradeCost(unlock);
		if (!ns.corporation.hasUnlockUpgrade(unlock) && getCorp().funds > cost) { return true; }
		else { return false; };
	};

	// Can we afford this upgrade (if the price is lower than specified)
	function CanGetLevel(buyWhenBelow, upgrade) {
		const getCorp = () => ns.corporation.getCorporation();
		let cost = ns.corporation.getUpgradeLevelCost(upgrade);
		if (buyWhenBelow >= cost && getCorp().funds > cost) { return true; }
		else { return false; };
	};

	// Buys as many levels of an upgrade as we can while the above function is true
	function BuyLevel(buyWhenBelow, upgrade) {
		while (CanGetLevel(buyWhenBelow, upgrade)) {
			ns.corporation.levelUpgrade(upgrade);
		};
	};

	// Can we afford this warehouse upgrade (if the price is lower than specified)
	function CanGetWarehouse(buyWhenBelow, division, city, amt) {
		const getCorp = () => ns.corporation.getCorporation();
		let cost = ns.corporation.getUpgradeWarehouseCost(division, city, amt);
		if (buyWhenBelow >= cost && getCorp().funds > cost) { return true; }
		else { return false; };
	};

	// Buys as many of this warehouse upgrade as we can while the above function is true
	function BuyWarehouse(buyWhenBelow, division, city, amt) {
		while (CanGetWarehouse(buyWhenBelow, division, city, amt)) {
			ns.corporation.upgradeWarehouse(division, city, amt);
		};
	};

	// Updates the price of a product
	async function UpdatePrice(division, product) {
		const getCorp = () => ns.corporation.getCorporation();
		// only run this function if this product is actually finished
		if (ns.corporation.getProduct(division, product).developmentProgress == 100) {
			// If we have Market-TA.II, simply set it to be active on the product
			if (ns.corporation.hasResearched(division, "Market-TA.II")) {
				ns.corporation.sellProduct(division, "Aevum", product, "MAX", "MP", true);
				ns.corporation.setProductMarketTA2(division, product, true);
			}
			// If the rating is very low, just keep the price at MP for now
			else if (ns.corporation.getProduct(division, product).rat < 1000) {
				ns.corporation.sellProduct(division, "Aevum", product, "MAX", "MP", true);
			}
			// Otherwise, we must update the price manually (but only when info is fresh!)
			else if (getCorp().state == 'EXPORT'){
				let citdata = ns.corporation.getProduct(division, product).cityData["Aevum"]; // Chosen arbitrarily from non-Aevum cities
				let numInWarehouse = citdata[0];
				let prodPerSec = citdata[1];
				let soldPerSec = citdata[2];
				let delta = prodPerSec - soldPerSec;
				// Debug line to see current mults as they change  DELTA ${delta}
				//ns.toast(`${product}: ${ns.corporation.getProduct(division, product).sCost}`, "error", 10800);

				let prod = ns.corporation.getProduct(division, product)
				let mult = prod.sCost
				// if price is simply set to "MP" or "MP*1" & it has a delta <= 0
				if (!mult || typeof mult == Number || (mult == "MP" || mult == "MP*1" && delta <= 0)) {
					// set price to MP * (product #)^2
					ns.corporation.sellProduct(division, "Aevum", product, "MAX", "MP*" + (Number(product.split("-")[1]) ** 2), true);
				} else {
					// if delta is <= -1, price could be higher (more demand than supply)
					if (delta <= 0 && Number(ns.corporation.getProduct(division, product).sCost.split("*")[1]) > 1) {
						// multiply price by 1.01 (ceil)
						let currentMult = Number(ns.corporation.getProduct(division, product).sCost.split("*")[1]);
						ns.corporation.sellProduct(division, "Aevum", product, "MAX", "MP*" + Math.max(Math.ceil(currentMult * 1.01), 1), true);
					}
					// if delta is > 0, price could be lower (more supply than demand)
					else if (delta > 0 && Number(ns.corporation.getProduct(division, product).sCost.split("*")[1]) > 1) {
							// multiply price by 0.97 (floor)

							let currentMult = Number(mult.split("*")[1]);
							ns.corporation.sellProduct(division, "Aevum", product, "MAX", "MP*" + Math.max(Math.floor(currentMult * 0.97), 1), true);
						
					};
				};
			};
		};
	};

	async function GetRepNeeded(faction) {
		let factionAugs = await nstb.RunCom(ns, 'ns.singularity.getAugmentationsFromFaction()', [faction]);
		// get the needed aug with the highest rep cost in this faction
		var bestAug = null;
		for (let aug of factionAugs) {
			if (bestAug == null) { bestAug = aug }
			else {
				var bestRep = await nstb.RunCom(ns, 'ns.singularity.getAugmentationRepReq()', [bestAug]);
				var augRep = await nstb.RunCom(ns, 'ns.singularity.getAugmentationRepReq()', [aug]);
				if (augRep > bestRep) { bestAug = aug }
			}
		}; if (bestAug == null) { return 0; }

		let bestAugRep = await nstb.RunCom(ns, 'ns.singularity.getAugmentationRepReq()', [bestAug]);
		let curRep = await nstb.RunCom(ns, 'ns.singularity.getFactionRep()', [faction]);
		if (curRep < bestAugRep) { return bestAugRep; }	// If we cannot currently afford the bestAug ...
		else { return 0; } // otherwise, we don't need more rep for this faction.
	};

	function hasDivision(div) {
		for (const division of CorpApi.getCorporation(corp).divisions) {
			if (division.name == div) { return true; }
		};
		return false;
	}


	async function purchaseCorp() {
		let player = ns.getPlayer();
		if (!player.hasCorporation) {
			if (player.bitNodeN == 3) {
				CorpApi.createCorporation(corp, false);
			} else {
				while (ns.getPlayer().money < 150e9) {
					ns.clearLog();
					ns.print("Waiting for Money to create Corp");
					await ns.sleep(30 * 1000);
				}
				CorpApi.createCorporation(corp, true);
				nstb.UpdPort(ns, 8, "dict", ["wantCorp", false, "hasCorp", true]);

			}
		} else { nstb.UpdPort(ns, 8, "dict", ["wantCorp", false, "hasCorp", true]); }
	}

	async function waitState(state, times = 1, onpoint = false) {
		for (let i = 0; i < times; i++) {
			while (CorpApi.getCorporation().state != state) { await ns.sleep(11); }
			if (onpoint) {
				while (CorpApi.getCorporation().state == state) { await ns.sleep(11); }
			}
		}
	}

}