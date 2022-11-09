import * as nstb from "./lib/nstools";
import * as tb from "./lib/toolbox";

/** @param {import("..").NS} ns */
export async function main(ns) {
	//ns.tail('mp_bladeburner.js'); //ns.disableLog("ALL"); ns.clearLog();

    while (!await nstb.RunCom(ns, 'ns.bladeburner.joinBladeburnerDivision()')) await ns.sleep(10000);
    nstb.UpdPort(ns, 9, "dict", ["hasBB", true]);

    if (nstb.PeekPort(ns, 9)["hasSimu"] || !ns.singularity.isBusy() || ns.singularity.getCurrentWork().type != "GRAFTING") {
        if (!nstb.PeekPort(ns, 9)["hasSimu"]) ns.singularity.stopAction();

        const player = ns.getPlayer();
        const cities = ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"];
        let [curSta, maxSta] = ns.bladeburner.getStamina()
        const curAct = () => ns.bladeburner.getCurrentAction();

        const shouldRecover = (/*player.hp.current / player.hp.max < 0.5 ||*/ curSta / maxSta < 0.80)

        // if we are not at max health or stamina, recover.
        if (shouldRecover && curAct().name != 'Hyperbolic Regeneration Chamber') {
            ns.bladeburner.startAction('General', 'Hyperbolic Regeneration Chamber')
        }
        // if we are not currently recovering back to full stamina, start automating actions.
        else if (!(shouldRecover && curAct().name == 'Hyperbolic Regeneration Chamber')) {

            await updateCity();

            await doNextAction();

            await levelSkills();
        }

        async function updateCity() {
            let [bestCity, bestPop] = await getBestCity(); // city with highest population
            let curCity = await nstb.RunCom(ns, 'ns.bladeburner.getCity()'); // current city
            let curCityPop = await nstb.RunCom(ns, 'ns.bladeburner.getCityEstimatedPopulation()', [curCity]); 
            // If current city's pop is < 1b or 20% less than best city pop, switch to best city
            if (curCityPop < 1e9 || curCityPop < bestPop * 0.8) await nstb.RunCom(ns, 'ns.bladeburner.switchCity()', [bestCity]);
        }

        async function getBestCity() {
            let bestCity = null;
            let bestPop = 0;
            for (let city of cities) {
                let cityPop = await nstb.RunCom(ns, 'ns.bladeburner.getCityEstimatedPopulation()', [city])
                if (bestCity == null || bestPop < cityPop) {
                    bestCity = city;
                    bestPop = cityPop;
                }
                await nstb.RunCom(ns, 'ns.bladeburner.getActionEstimatedSuccessChance()', ['Contracts', 'Tracking']);
            }
            return [bestCity, bestPop]
        }

        async function doNextAction() {
            let [trackLo, trackHi] = await nstb.RunCom(ns, 'ns.bladeburner.getActionEstimatedSuccessChance()', ['Contracts', 'Tracking']);
            let [bountyLo, bountyHi] = await nstb.RunCom(ns, 'ns.bladeburner.getActionEstimatedSuccessChance()', ['Contracts', 'Bounty Hunter']);
            let [raidLo, raidHi] = await nstb.RunCom(ns, 'ns.bladeburner.getActionEstimatedSuccessChance()', ['Operations', 'Raid']);
            let [assLo, assHi] = await nstb.RunCom(ns, 'ns.bladeburner.getActionEstimatedSuccessChance()', ['Operations', 'Assassination']);
            let actType;
            let actName;
            // Determine what our best action would be
            if (nstb.PeekPort(ns, 6)["sleeveShock"] > 0 && Math.max(trackHi - trackLo, bountyHi - bountyLo, raidHi - raidLo, assLo - assHi) >= 0.15) {
                actType = "General";
                actName = "Field Analysis";       
            } else if (assLo >= 0.4 && await nstb.RunCom(ns, 'ns.bladeburner.getActionCountRemaining()', ['Operations', 'Assassination']) > 0) {
                actType = "Operations";
                actName = "Assasination";
            } else if (raidLo >= 0.4 && await nstb.RunCom(ns, 'ns.bladeburner.getActionCountRemaining()', ['Operations', 'Raid']) > 0) {
                actType = "Operations";
                actName = "Raid";
            } else if (bountyLo >= 0.4 && await nstb.RunCom(ns, 'ns.bladeburner.getActionCountRemaining()', ['Contracts', 'Bounty Hunter']) > 0) {
                actType = "Contracts";
                actName = "Bounty Hunter";
            } else {
                actType = "Contracts";
                actName = "Tracking";
            }
            // Start doing our best action if we aren't already.
            if (curAct().name != actName) ns.bladeburner.startAction(actType, actName);
        }

        async function levelSkills() {
            return;
        }
    }
    
}