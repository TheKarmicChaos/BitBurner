		// ==================================================================================================
		// PHASE 1: Set up Agriculture
		// ==================================================================================================

		// if we do not own Smart Supply
		if (!ns.corporation.hasUnlockUpgrade("Smart Supply")) {
			ns.corporation.unlockUpgrade("Smart Supply"); // buy smart supply
		}
		/*
		// if we would reasonably benefit from this phase, do it.
		if (VALUATION_MULT >= valThresh) {

			// if we do not have Agri division & 
			if (!divArr.includes("Agri")) {
				// expand into agriculture
				ns.corporation.expandIndustry("Agriculture", "Agri");
				ns.toast("Corp expanded into industry: Agriculture", "success", 10000);
			}

			// if we haven't yet initialized Agri
			else if (!ns.corporation.getDivision("Agri").cities.includes("Volhaven") || ns.corporation.getOffice("Agri", "Volhaven").employees.length < 3) {

				for (let city of cities) { 	// for each city

					// if we dont own an office
					if (!ns.corporation.getDivision("Agri").cities.includes(city)) {
						ns.corporation.expandCity("Agri", city); // buy office
						ns.corporation.purchaseWarehouse("Agri", city) // buy warehouse
					};

					let whouse = () => ns.corporation.getWarehouse("Agri", city);
					let office = () => ns.corporation.getOffice("Agri", city);

					// if the warehouse < lv3 (size 300), buy until it is
					if (whouse().level < 3) {
						ns.corporation.upgradeWarehouse("Agri", city, 3 - whouse().level);
					};

					// enable smart supply
					ns.corporation.setSmartSupply("Agri", city, true);

					// sell Plants and Food at "MAX", "MP"
					ns.corporation.sellMaterial("Agri", city, "Plants", "MAX", "MP");
					ns.corporation.sellMaterial("Agri", city, "Food", "MAX", "MP");

					// if the office has < 3 employees, hire until it has 3
					while (office().employees.length < 3) {
						ns.corporation.hireEmployee("Agri", city);
					};

					// Assign proper job positions
					SetJobAssign("Agri", city, [1, 1, 1, 0, 0, 0]);
				};
			}

			// if Agri has 0 awareness and popularity
			else if (ns.corporation.getDivision("Agri").popularity == 0 && ns.corporation.getDivision("Agri").awareness == 0) {
				ns.corporation.hireAdVert("Agri"); // Buy 1 advert
			}

			// if we don't yet have basic global upgrades, get them
			else if (ns.corporation.getUpgradeLevel("Smart Factories") < 2) {
				if (ns.corporation.getUpgradeLevel("FocusWires") < 1) { ns.corporation.levelUpgrade("FocusWires") }
				else if (ns.corporation.getUpgradeLevel("Neural Accelerators") < 1) { ns.corporation.levelUpgrade("Neural Accelerators") }
				else if (ns.corporation.getUpgradeLevel("Speech Processor Implants") < 1) { ns.corporation.levelUpgrade("Speech Processor Implants") }
				else if (ns.corporation.getUpgradeLevel("Nuoptimal Nootropic Injector Implants") < 1) { ns.corporation.levelUpgrade("Nuoptimal Nootropic Injector Implants") }
				else if (ns.corporation.getUpgradeLevel("Smart Factories") < 1) { ns.corporation.levelUpgrade("Smart Factories") }
				else if (ns.corporation.getUpgradeLevel("FocusWires") < 2) { ns.corporation.levelUpgrade("FocusWires") }
				else if (ns.corporation.getUpgradeLevel("Neural Accelerators") < 2) { ns.corporation.levelUpgrade("Neural Accelerators") }
				else if (ns.corporation.getUpgradeLevel("Speech Processor Implants") < 2) { ns.corporation.levelUpgrade("Speech Processor Implants") }
				else if (ns.corporation.getUpgradeLevel("Nuoptimal Nootropic Injector Implants") < 2) { ns.corporation.levelUpgrade("Nuoptimal Nootropic Injector Implants") }
				else if (ns.corporation.getUpgradeLevel("Smart Factories") < 2) { ns.corporation.levelUpgrade("Smart Factories") }
			}

			// if we have not yet bought materials for each warehouse in agri
			else if (ns.corporation.getMaterial("Agri", "Volhaven", "Real Estate").qty < 27000) {
				for (let city of cities) { 	// for each city
					// Buy up to the correct amount of mats
					if (await BuyToExactMat("Agri", city, "Hardware", 125)) {
						if (await BuyToExactMat("Agri", city, "AI Cores", 75)) {
							await BuyToExactMat("Agri", city, "Real Estate", 27000);
						};
					};
				};
			}

			// if we haven't gotten our 1st investment
			else if (invOffer.round == 1) {
				// if the offer is over 210 billion, accept
				if (invOffer.funds >= 210000000000 * VALUATION_MULT) {
					await ns.sleep(20100); // wait for 20 sec to get some extra funds
					ns.corporation.acceptInvestmentOffer();
				};
			}

			// if we haven't yet upgrded our amount of employees and warehouse space
			else if (ns.corporation.getWarehouse("Agri", "Volhaven").level < 10) {

				for (let city of cities) { 	// for each city
					let whouse = () => ns.corporation.getWarehouse("Agri", city);
					let office = () => ns.corporation.getOffice("Agri", city);

					// if the office cant hold 9 employees, upgrade size
					if (office().size < 9) {
						ns.corporation.upgradeOfficeSize("Agri", city, 9 - office().size);
					};

					// if the office has < 9 employees, hire until it has 9
					if (office().size >= 9) {
						while (office().employees.length < 9) {
							ns.corporation.hireEmployee("Agri", city);
						};

						// Assign proper job positions
						SetJobAssign("Agri", city, [2, 2, 1, 2, 2, 0]);
					}

					// if the warehouse < lv10 (size 1000), buy until it is
					if (whouse().level < 10) {
						ns.corporation.upgradeWarehouse("Agri", city, 10 - whouse().level);
					};
				};
			}

			// if Smart Factories & Smart Storage are < lv10, upgrade them
			else if (ns.corporation.getUpgradeLevel("Smart Factories") < 5 || ns.corporation.getUpgradeLevel("Smart Storage") < 5) {
				if (getCorp().funds >= 30000000000) {
					while (ns.corporation.getUpgradeLevel("Smart Factories") < 5) {
						ns.corporation.levelUpgrade("Smart Factories");
						await ns.sleep(1);
					};
					while (ns.corporation.getUpgradeLevel("Smart Storage") < 5) {
						ns.corporation.levelUpgrade("Smart Storage");
						await ns.sleep(1);
					};
				}
			}

			// if we do not yet have the needed materials for each warehouse in agri
			else if (ns.corporation.getMaterial("Agri", "Volhaven", "Hardware").qty < 2800) {
				for (let city of cities) { 	// for each city
					// Buy up to the correct amount of mats
					if (await BuyToExactMat("Agri", city, "Real Estate", 146400)) {
						if (await BuyToExactMat("Agri", city, "AI Cores", 2520)) {
							if (await BuyToExactMat("Agri", city, "Robots", 96)) {
								await BuyToExactMat("Agri", city, "Hardware", 2800);
							};
						};
					};
				};
			}

			// if we haven't gotten our 2nd investment
			else if (invOffer.round == 2) {
				// if the offer is over 5 trillion, accept
				if (invOffer.funds >= 5000000000000 * VALUATION_MULT) {
					await ns.sleep(20100); // wait for 20 sec to get some extra funds
					ns.corporation.acceptInvestmentOffer();
				};
			}

			// if we haven't yet upgrded warehouse space
			else if (ns.corporation.getWarehouse("Agri", "Volhaven").level < 19) {
				for (let city of cities) { 	// for each city
					let whouse = () => ns.corporation.getWarehouse("Agri", city);

					// if the warehouse < lv19, buy until it is
					if (whouse().level < 19) {
						ns.corporation.upgradeWarehouse("Agri", city, 19 - whouse().level);
					};
				};
			}

			// if we do not yet have the needed materials for each warehouse in agri
			else if (ns.corporation.getMaterial("Agri", "Volhaven", "Hardware").qty < 9300 * VALUATION_MULT) {
				for (let city of cities) { 	// for each city
					// Buy up to the correct amount of mats
					if (await BuyToExactMat("Agri", city, "Real Estate", 230400 * VALUATION_MULT)) {
						if (await BuyToExactMat("Agri", city, "AI Cores", 6270 * VALUATION_MULT)) {
							if (await BuyToExactMat("Agri", city, "Robots", 726 * VALUATION_MULT)) {
								await BuyToExactMat("Agri", city, "Hardware", 9300 * VALUATION_MULT);
							};
						};
					};
				};
			}
			// At this point, the Agri production multiplier should be over 500
		};
		*/