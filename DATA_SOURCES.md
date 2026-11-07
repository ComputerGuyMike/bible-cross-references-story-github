# Data sources and licenses

Everything in `data.js` and `land.js` is adapted from the sources below. This repository as a whole is released under CC BY-SA 4.0 (see `LICENSE`).

| Source | What it provides here | License |
|---|---|---|
| [Theographic Bible Metadata](https://github.com/robertrouse/theographic-bible-metadata) (Robert Rouse and contributors) | King James Version text with people and places tagged inline, 450 timeline events, people, places with coordinates, Easton's dictionary entries | CC BY-SA 4.0 |
| [UBS Paratext Parallel Passages](https://github.com/ubsicap/ubs-open-license/tree/main/parallel%20passages) (United Bible Societies) | Parallel passages and Old Testament quotations in the New Testament | CC BY-SA 4.0 |
| [OpenBible.info cross-references](https://www.openbible.info/labs/cross-references/) | Verse-to-verse cross-references with vote counts | CC BY |
| [kalvesmaki.com, New Testament and Septuagint chart](https://www.kalvesmaki.com/LXX/NTChart.htm) | New Testament quotations of the Old Testament, taken from [Luke Plant's Bible Quotation Database](https://github.com/spookylukey/bible-quotation-database) | CC BY 4.0 (the site's stated licence for its own work) |
| [Natural Earth](https://www.naturalearthdata.com/) 110m land | Coastline for the map view | Public domain |
| King James Version | Bible text (via Theographic) | Public domain |

## Changes made to the sources

- Verses are grouped into passages by the King James paragraph breaks: one-verse paragraphs are merged forward and paragraphs over 16 verses are split into chunks of about 12 verses. All links are recorded between these passages, not between single verses.
- Cross-references with fewer than 3 votes are dropped, and each passage keeps its 16 strongest links.
- Quotation and parallel pairs from UBS and kalvesmaki.com are mapped onto the King James verse numbering. 24 UBS references could not be mapped and are left out.
- Only the pairs of references are used from the kalvesmaki.com chart, not its text or commentary. Rows of Luke Plant's database that cite other sources are not included.
- The Natural Earth outline is trimmed to the Bible lands.
- Dates follow one scholar's chronology (Floyd Nolen Jones), as used by Theographic, and are a guide to order, not settled fact.

## Credit

OpenBible.info; Theographic (Robert Rouse and the sources in its documentation); United Bible Societies; kalvesmaki.com; Luke Plant (Bible Quotation Database); Natural Earth.
