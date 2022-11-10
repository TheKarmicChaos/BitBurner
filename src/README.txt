===========================
        Port Data:
===========================
Port
Num | Topic of Contents     | Contents
----+----------------------------------------------------------
1   | Bitnode & Run Info    | { "bitNode": bitNode, "mults": bndata, "runType": "redpill", "strats": strats, "sourceFiles": sourceFiles }
2   | Income ($/sec)        | { "baseIncome": 0, "hnodes": 0, "gang": 0, "corp": 0, "plcrime": 0, "slcrime": 0, "plwork": 0, "slwork": 0, "hacking": 0, ... }
3   | Hashes                | { "hashes": 0, "income": 0, "maxhashes": 1 }
4   |                       | 
5   |                       | 
6   | Run Progress          | { "backdoors": ["home"], "sleeveShock": 100 }
7   | Gang                  | { "wantGang": false, "hasGang": false, "territory": 0, "respect": 0 }
8   | Corporation           | { "wantCorp": false, "hasCorp": false, "hasProd": false, "hasLab": false, "hasTA.II": false, "research": 0, "funds": 0, "profit": 0, "products": [] }
9   | BladeBurner           | { "wantBB": false, "hasBB": false, "hasSimu": false, "city": "Sector-12", "blackOpsDone": ["failsafe"] }
10  |                       | 

===========================
    File Name Prefixes:
===========================

Prefix  | Unabbreviation        | Description
--------+-----------------------+--------------------------
lp_     | looping               | When this file is run, it will loop forever, remaining constantly active. Must be killed to stop.
op_     | one pass              | Runs once when called, and quickly ends with minimal delay/loops. Will not run again until called again.
mp_     | mixed/multi pass      | Either an lp_ file that switches to op_ if a condition is met, OR an op_ file with a delay/loop that can cause it to run for extended periods.



