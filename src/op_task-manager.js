import * as nstb from "./lib/nstools";

/** @param {import("..").NS} ns */
export async function main(ns) {
	//ns.tail('op_task-manager.js'); ns.disableLog("ALL"); ns.clearLog();
	
	const allComps =
		["Fulcrum Technologies", "ECorp", "MegaCorp", "KuaiGong International", "Four Sigma", "NWO",
		"Blade Industries", "OmniTek Incorporated", "Bachman & Associates",
		"Clarke Incorporated"];
	const allCrimes =
		["SHOPLIFT", "ROBSTORE", "MUG", "LARCENY", "DRUGS",
		"BONDFORGERY", "TRAFFICKARMS", "HOMICIDE", "GRANDTHEFTAUTO", "KIDNAP",
		"ASSASSINATION", "HEIST"];
	const player = () => ns.getPlayer()
	const augs = await nstb.RunCom(ns, 'ns.singularity.getOwnedAugmentations()');
	const hasNMI = augs.includes('Neuroreceptor Management Implant');
	// Constantly apply to every company of interest and ask for promotions
	for (let company of allComps) { await nstb.RunCom(ns, 'ns.singularity.applyToCompany()', [company, "Software"]) }

    if (player().numPeopleKilled < 30 || nstb.PeekPort(ns, 7)["wantGang"] || !nstb.PeekPort(ns, 9)["hasBB"] || nstb.PeekPort(ns, 9)["hasSimu"]) { // Once we have 30 kills & gang, bladeburner actions take player priority.
        let [bestcrime, canDoWork] = await GetBestCrime();
        let bestCrimeinc = 0; if (bestcrime) bestCrimeinc = await nstb.GetCrimeGains(ns, bestcrime, "money");

        let [bestwork, canDoCrime] = await GetBestWork();
        let bestWorkinc = 0; if (bestwork) bestWorkinc = await nstb.GetJobGains(ns, bestwork, "money");

        // Do crime until we meet reqs to do work instead
        if (!canDoWork || Object.keys(player().jobs).length == 0) { await DoCrime(bestcrime) }
        // Then do work until we meet reqs to do crime instead
        else if (!canDoCrime) { await DoWork(bestwork) }
        // Then do the more profitable of the two; work or crime.
        else if (bestCrimeinc < bestWorkinc) { await DoWork(bestwork) }
        else { await DoCrime(bestcrime) }
    }


	// ==================================================================================================
	// Functions
	// ==================================================================================================
	
	// Get the name of the best crime for us to commit at this stage of the game. returns [crimename, canDoWorkInstead (bool)]
	async function GetBestCrime() {
		let canDoWorkInstead = false;
		let bestcrime;

		// if homicide chance < 0.4, always commit mug.
		if (await nstb.RunCom(ns, 'ns.singularity.getCrimeChance()', ["HOMICIDE"]) < 0.4) { bestcrime = "MUG" }
		// else, if kills < 30, commit homicide. (30 kills needed for all faction invites)
		else if (player().numPeopleKilled < 30) { bestcrime = "HOMICIDE" }
		// else, if we want a gang & don't yet have one, commit the crime with the best karma gains.
		else if (nstb.PeekPort(ns, 7)["wantGang"]) {
			if (await nstb.GetCrimeGains(ns, "HOMICIDE", "karma") >= await nstb.GetCrimeGains(ns, "MUG", "karma")) { bestcrime = "HOMICIDE" }
			else { bestcrime = "MUG" }
		}
		// else, commit the crime with the best profit.
		else {
			bestcrime = "SHOPLIFT"
			for (const crime of allCrimes) {
				if (await nstb.RunCom(ns, 'ns.singularity.getCrimeChance()', [crime]) >= 0.1 &&
					await nstb.GetCrimeGains(ns, bestcrime, "money") < await nstb.GetCrimeGains(ns, crime, "money")) bestcrime = crime;
			}
			canDoWorkInstead = true;
		}

		// calculate sleeve crime income
		let numsleeves = await nstb.RunCom(ns, 'ns.sleeve.getNumSleeves()')
		var sleeveinc = 0;
		for (var x = 0; x < numsleeves; ++x) {
			let sltask = await nstb.RunCom(ns, 'ns.sleeve.getTask()', [x])
			if (sltask != null && sltask.type == "CRIME") { sleeveinc += await nstb.GetCrimeGains(ns, sltask.crimeType, "money", await nstb.GetSleeveCrimeChance(ns, x, sltask.crimeType)) }
		}
		// calculate player crime income//
		let playerinc = 0;
        let curWork = await nstb.RunCom(ns, 'ns.singularity.getCurrentWork()')
		if (curWork != null && curWork.type == 'CRIME') { playerinc = await nstb.GetCrimeGains(ns, bestcrime, "money") };
		if (!(await nstb.RunCom(ns, 'ns.singularity.isFocused()')) && !hasNMI) { playerinc *= 0.8 }

		// write income to port
		nstb.UpdPort(ns, 2, "dict", ["plcrime", playerinc])
		nstb.UpdPort(ns, 2, "dict", ["slcrime", sleeveinc])

		return [bestcrime, canDoWorkInstead];
	}

	// Do this crime
	async function DoCrime(bestcrime) {
		// commit the best crime if we aren't busy
		if (!await nstb.RunCom(ns, 'ns.singularity.isBusy()')) { await nstb.RunCom(ns, 'ns.singularity.commitCrime()', [bestcrime, !hasNMI]) }
		// if we are committing a different crime or working, switch to committing the best crime
        let curWork = await nstb.RunCom(ns, 'ns.singularity.getCurrentWork()')
		if (curWork != null && (curWork.type == 'COMPANY' || (curWork.type == 'CRIME' && curWork.crimeType != bestcrime))) { await nstb.RunCom(ns, 'ns.singularity.commitCrime()', [bestcrime, !hasNMI]); }
		// calculate sleeve crime income
		let numsleeves = await nstb.RunCom(ns, 'ns.sleeve.getNumSleeves()')
		var sleeveinc = 0;
		for (var x = 0; x < numsleeves; ++x) {
			let sltask = await nstb.RunCom(ns, 'ns.sleeve.getTask()', [x])
			if (sltask != null && sltask.type == "CRIME") {
				sleeveinc += await nstb.GetCrimeGains(ns, sltask.crimeType, "money", await nstb.GetSleeveCrimeChance(ns, x, sltask.crimeType))
			}
		}
		// calculate player crime income
        curWork = await nstb.RunCom(ns, 'ns.singularity.getCurrentWork()')
		let playerinc = 0; if (curWork != null && curWork.type == 'CRIME') { playerinc = await nstb.GetCrimeGains(ns, bestcrime, "money") };
		if (!(await nstb.RunCom(ns, 'ns.singularity.isFocused()')) && !hasNMI) { playerinc *= 0.8 }

		// write income to port
		nstb.UpdPort(ns, 2, "dict", ["plcrime", playerinc])
		nstb.UpdPort(ns, 2, "dict", ["slcrime", sleeveinc])
	}

	// Get the name of the best company for us to work for at this stage of the game. returns [compname, canDoCrimeInstead (bool)]
	async function GetBestWork() {
		let canDoCrimeInstead = false;
        let compFacsNeeded = await GetCompanyFacsNeeded()
        ns.print(compFacsNeeded)
		let bestcomp;
        
        // if there are companies that still need faction invites, work for them
		if (compFacsNeeded.length > 0) { bestcomp = compFacsNeeded.shift() }
		// else, work the job with the best profit.
		else {
			bestcomp = Object.keys(player().jobs)[0]
			for (const comp of allComps) {
				if (comp in player().jobs) {
                   if (await nstb.GetJobGains(ns, bestcomp, "money") < await nstb.GetJobGains(ns, comp, "money")) bestcomp = comp;
                }
			}
			canDoCrimeInstead = true;
		}
		
		// calculate sleeve work income
		let numsleeves = await nstb.RunCom(ns, 'ns.sleeve.getNumSleeves()')
		var sleeveinc = 0;
        for (var x = 0; x < numsleeves; ++x) {
			let sltask = await nstb.RunCom(ns, 'ns.sleeve.getTask()', [x])
			if (sltask != null && sltask.type == "COMPANY") { sleeveinc += await nstb.GetJobGains(ns, sltask.companyName, "money", x) }
		}
		// calculate player work income
		let playerinc = 0;
        let curWork = await nstb.RunCom(ns, 'ns.singularity.getCurrentWork()')
		if (curWork != null && curWork.type == 'COMPANY') { playerinc = await nstb.GetJobGains(ns, bestcomp, "money") };
		if (!(await nstb.RunCom(ns, 'ns.singularity.isFocused()')) && !hasNMI) { playerinc *= 0.8 }

		// write income to port
		if (!isNaN(playerinc)) {nstb.UpdPort(ns, 2, "dict", ["plwork", playerinc])}
        else { nstb.UpdPort(ns, 2, "dict", ["plwork", 0]) }
        if (!isNaN(sleeveinc)) { nstb.UpdPort(ns, 2, "dict", ["slwork", sleeveinc]) }
        else { nstb.UpdPort(ns, 2, "dict", ["slwork", 0]) }

		return [bestcomp, canDoCrimeInstead];
	}

	// Work for this company
	async function DoWork(bestwork) {
        // work the best job if we aren't busy
		if (!await nstb.RunCom(ns, 'ns.singularity.isBusy()')) { await nstb.RunCom(ns, 'ns.singularity.workForCompany()', [bestwork, !hasNMI]) }
        // if we are working a different job or committing crime, switch to working the best job
        let curWork = await nstb.RunCom(ns, 'ns.singularity.getCurrentWork()')
		if (curWork != null && (curWork.type == 'CRIME' || (curWork.type == 'COMPANY' && curWork.companyName != bestwork))) { await nstb.RunCom(ns, 'ns.singularity.workForCompany()', [bestwork, !hasNMI]) }
		
        // calculate sleeve work income
		let numsleeves = await nstb.RunCom(ns, 'ns.sleeve.getNumSleeves()')
		var sleeveinc = 0;
        for (var x = 0; x < numsleeves; ++x) {
			let sltask = await nstb.RunCom(ns, 'ns.sleeve.getTask()', [x])
			if (sltask != null && sltask.type == "COMPANY") { sleeveinc += await nstb.GetJobGains(ns, sltask.companyName, "money", x) }
		}
		// calculate player work income
		let playerinc = 0;
        curWork = await nstb.RunCom(ns, 'ns.singularity.getCurrentWork()')
		if (curWork != null && curWork.type == 'COMPANY') { playerinc = await nstb.GetJobGains(ns, bestwork, "money") };
		if (!(await nstb.RunCom(ns, 'ns.singularity.isFocused()')) && !hasNMI) { playerinc *= 0.8 }

		// write income to port
		if (!isNaN(playerinc)) {nstb.UpdPort(ns, 2, "dict", ["plwork", playerinc])}
        else { nstb.UpdPort(ns, 2, "dict", ["plwork", 0]) }
        if (!isNaN(sleeveinc)) { nstb.UpdPort(ns, 2, "dict", ["slwork", sleeveinc]) }
        else { nstb.UpdPort(ns, 2, "dict", ["slwork", 0]) }

	}

    // Get a list of the companies that still need faction invites
    async function GetCompanyFacsNeeded() {
		let companies = [];
		for (let comp of allComps) {
			var compfac;
			if (comp == "Fulcrum Technologies") { compfac = "Fulcrum Secret Technologies" }
			else { compfac = comp }
			// If the related faction has not yet been joined, add it to the list
			if (!player().factions.includes(compfac) && comp in player().jobs) { companies.push(comp) }
		}
		return companies;
	}

}