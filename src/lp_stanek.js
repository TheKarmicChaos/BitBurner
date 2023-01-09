import * as nstb from "./lib/nstools";
import * as tb from "./lib/toolbox";


/** @param {import("..").NS} ns */
export async function main(ns) {
    ns.closeTail(); await ns.sleep(1); ns.tail('lp_stanek.js'); await ns.sleep(1);
    ns.disableLog("ALL"); ns.clearLog();

    let GLOBAL_VARS = nstb.getGlobals(ns)
    const giftY = GLOBAL_VARS["stanek"]["height"]
    const giftX = GLOBAL_VARS["stanek"]["width"]
    const giftDim = `${giftX}x${giftY}`
    //ns.stanek.clearGift()

    /*
    Fragments:
    -----------------------

    Hacking (h)         ID: 0
    [_, h, h],          Power: 1
    [h, h, _],

    Hacking (z)         ID: 1
    [z, z, _],          Power: 1
    [_, z, z],

    Hacking Speed (P)   ID: 5
    [P, P, P],          Power: 1.3
    [_, P, _],

    Hacking Money (M)   ID: 6
    [M, M, M, M],       Power: 2

    Hacking Grow (G)    ID: 7
    [G, _, _],          Power: 0.5
    [G, G, G],

    Strength (s)        ID: 10
    [s, s, s],          Power: 2
    [_, s, _],

    Defense (d)         ID: 12
    [_, _, d],          Power: 2
    [d, d, d],

    Dexterity (x)       ID: 14
    [_, _, x],          Power: 2
    [x, x, x],

    Agility (a)         ID: 16
    [_, a, a],          Power: 2
    [a, a, _],

    Charisma (c)        ID: 18
    [_, c, c],          Power: 3
    [c, c, _],

    Hacknet Money (N)   ID: 20
    [N, N, N, N],       Power: 1

    Hacknet Cost (O)    ID: 21
    [O, O],             Power: 2
    [O, O],

    Rep (R)             ID: 25
    [R, _, _],          Power: 0.5
    [R, R, R],

    Work Money (W)      ID: 27
    [W, _, _],          Power: 10
    [W, W, W],

    Crime (C)           ID: 28
    [_, _, C],          Power: 2
    [C, C, C],

    Bladeburner (B)     ID: 30
    [_, B, B],          Power: 0.4
    [B, B, _],

    Boosters:
    -----------------------

    [_, X, X],          ID: 100
    [X, X, _],
    [_, X, _],

    [X, X, X, X],       ID: 101
    [X, _, _, _],

    [_, X, X, X],       ID: 102
    [X, X, _, _],
 
    [X, X, X, _],       ID: 103
    [_, _, X, X],

    [_, X, X],          ID: 104
    [_, X, _],
    [X, X, _],

    [_, _, X],          ID: 105
    [_, X, X],
    [X, X, _],

    [X, _, _],          ID: 106
    [X, X, X],
    [X, _, _],

    [_, X, _],          ID: 107
    [X, X, X],
    [_, X, _],

    Configurations:
    -----------------------
    (Note: Script will not run if the gift size is smaller than 5x5)
    (Note: All configs can swap h for B to use it for a bladeburner run.) */

    const configs = {

        //  N _ X X X 
        //  N X X O O 
        //  N R h O O 
        //  N R h h _ 
        //  R R _ h _ 
        "5x5": null,

        //  R R X X X N
        //  R X X O O N
        //  R W h O O N
        //  _ W h h _ N
        //  W W _ h _ _
        "5x6": null,

        //  _ _ _ _ _ _
        //  N _ X X X _
        //  N X X O O _
        //  N R h O O _
        //  N R h h _ _
        //  R R _ h _ _
        "6x6": null,

        //  _ _ _ _ _ _ _
        //  N _ X X X _ _
        //  N X X O O _ _
        //  N R h O O _ _
        //  N R h h _ _ _
        //  R R _ h _ _ _
        "6x7": null,

        //  _ _ _ _ _ _ _
        //  N _ X X X _ _
        //  N X X O O _ _
        //  N R h O O _ _
        //  N R h h _ _ _
        //  R R _ h _ _ _
        "7x7": null,

        //  _ _ _ _ _ _ _
        //  N _ X X X _ _
        //  N X X O O _ _
        //  N R h O O _ _
        //  N R h h _ _ _
        //  R R _ h _ _ _
        "7x8": null,

        //  _ _ _ _ _ _ _
        //  N _ X X X _ _
        //  N X X O O _ _
        //  N R h O O _ _
        //  N R h h _ _ _
        //  R R _ h _ _ _
        "8x8": null,

    //GENERAL (MAX 12x13)

    }  



}
