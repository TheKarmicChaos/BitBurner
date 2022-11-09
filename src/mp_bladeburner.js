import { checkNsInstance } from "./lib/helpers";
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
            let cityBests = await getBestForCities();

            await levelSkills(cityBests);

            await doNextAction(cityBests);

            // If variance is too high in any city, reduce uncertainty with analysis

            // If variance is too high in an

        }

        async function getBestForCities() {
            let cityDict = {"All": {type: 'Contracts', name: 'Tracking', city: "Aevum", chance: 0}, "Aevum": {}, "Chongqing": {}, "Sector-12": {}, "New Tokyo": {}, "Ishima": {}, "Volhaven": {}};
            for (let city of cities) { // For each city
                await nstb.RunCom(ns, 'ns.bladeburner.switchCity()', [city]);
                let highVariance = true;
                
                while (highVariance) {
                    // Get the success range of all important actions
                    ns.print('Tracking variance of ', city);
                    let [trackLo, trackHi] = await nstb.RunCom(ns, 'ns.bladeburner.getActionEstimatedSuccessChance()', ['Contracts', 'Tracking']);
                    let [bountyLo, bountyHi] = await nstb.RunCom(ns, 'ns.bladeburner.getActionEstimatedSuccessChance()', ['Contracts', 'Bounty Hunter']);
                    let [raidLo, raidHi] = await nstb.RunCom(ns, 'ns.bladeburner.getActionEstimatedSuccessChance()', ['Operations', 'Raid']);
                    let [assLo, assHi] = await nstb.RunCom(ns, 'ns.bladeburner.getActionEstimatedSuccessChance()', ['Operations', 'Assassination']);
                    // While variance is too high, reduce it.
                    if (Math.max(trackHi - trackLo, bountyHi - bountyLo, raidHi - raidLo, assLo - assHi) >= 0.15) {
                        if (curAct().name != 'Field Analysis') ns.bladeburner.startAction('General', 'Field Analysis');
                        await ns.sleep(10000);
                    } else { // Once variance is at acceptable levels...
                        highVariance = false;
                        // Determine the best action for this city

                        // Check Assasination
                        if (assLo >= 0.4 && await nstb.RunCom(ns, 'ns.bladeburner.getActionCountRemaining()', ['Operations', 'Assassination']) > 0) {
                            // update this city's cityDict vals
                            cityDict[city].type = 'Operations';
                            cityDict[city].name = 'Assassination';
                            cityDict[city].chance = assLo;
                            // update cityDict "All" if this is better
                            if (!(cityDict["All"].name == 'Assassination' && cityDict["All"].chance > assLo)) {
                                cityDict["All"].type = 'Operations';
                                cityDict["All"].name = 'Assassination';
                                cityDict["All"].city = city;
                                cityDict["All"].chance = assLo;
                            }
                        }
                        // Check Raid
                        else if (raidLo >= 0.4 && await nstb.RunCom(ns, 'ns.bladeburner.getActionCountRemaining()', ['Operations', 'Raid']) > 0) {
                            // update this city's cityDict vals
                            cityDict[city].type = 'Operations';
                            cityDict[city].name = 'Raid';
                            cityDict[city].chance = raidLo;
                            // update cityDict "All" if this is better
                            if (cityDict["All"].name != 'Assassination' && !(cityDict["All"].name == 'Raid' && cityDict["All"].chance > raidLo)) {
                                cityDict["All"].type = 'Operations';
                                cityDict["All"].name = 'Raid';
                                cityDict["All"].city = city;
                                cityDict["All"].chance = raidLo;
                            }
                        }
                        // Check Bounty Hunter
                        else if (bountyLo >= 0.4 && await nstb.RunCom(ns, 'ns.bladeburner.getActionCountRemaining()', ['Contracts', 'Bounty Hunter']) > 0) {
                            // update this city's cityDict vals
                            cityDict[city].type = 'Contracts';
                            cityDict[city].name = 'Bounty Hunter';
                            cityDict[city].chance = bountyLo;
                            // update cityDict "All" if this is better
                            if (cityDict["All"].name == 'Tracking' || (cityDict["All"].name == 'Bounty Hunter' && cityDict["All"].chance < bountyLo)) {
                                cityDict["All"].type = 'Contracts';
                                cityDict["All"].name = 'Bounty Hunter';
                                cityDict["All"].city = city;
                                cityDict["All"].chance = bountyLo;
                            }
                        }
                        // Otherwise default to Tracking
                        else {
                            // update this city's cityDict vals
                            cityDict[city].type = 'Contracts';
                            cityDict[city].name = 'Tracking';
                            cityDict[city].chance = trackLo;
                            // update cityDict "All" if this is better
                            if (cityDict["All"].name == 'Tracking' && cityDict["All"].chance < trackLo) {
                                cityDict["All"].type = 'Contracts';
                                cityDict["All"].name = 'Tracking';
                                cityDict["All"].city = city;
                                cityDict["All"].chance = trackLo;
                            }
                        }
                       // await ns.sleep(1);
                    }
                }
            }
            ns.print(cityDict);
            return cityDict;
        }

        async function levelSkills(cityBests) {
            return;
        }

        async function doNextAction(cityBests) {
            // Go to the city with our best action.
            if (await nstb.RunCom(ns, 'ns.bladeburner.getCity()') != cityBests["All"].city) await nstb.RunCom(ns, 'ns.bladeburner.switchCity()', [cityBests["All"].city]);
            // Start doing our best action if we aren't already.
            if (curAct().name != cityBests["All"].name) ns.bladeburner.startAction(cityBests["All"].type, cityBests["All"].name);
        }
    }
}