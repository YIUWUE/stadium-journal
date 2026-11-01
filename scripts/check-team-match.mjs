import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stadiums} from '../dist/catalog.js';
import {matchQuestions,recommendTeams,validateMatchData} from '../dist/team-match.js';
const data=JSON.parse(fs.readFileSync('dist/assets/club-match-data.json'));
validateMatchData(data,stadiums);
assert.equal(data.metadata.clubCount,24);assert.equal(data.metadata.sourceFileCount,47);
assert.ok(data.metadata.totalMatches>=data.metadata.clubInvolvedUniqueMatches);
assert.equal(Object.values(data.clubs).reduce((n,p)=>n+p.matches,0),data.metadata.clubMatchAppearances);
for(const profile of Object.values(data.clubs)){
 assert.equal(profile.homeMatches+profile.awayMatches,profile.matches);
 assert.equal(profile.homeWins+profile.awayWins,profile.wins);
 assert.ok(Math.abs(profile.scoringRate-profile.goalsFor/profile.matches)<.000002);
 assert.ok(Math.abs(profile.goalsPerMatch-(profile.goalsFor+profile.goalsAgainst)/profile.matches)<.000002);
 assert.ok(Math.abs(profile.winRate-profile.wins/profile.matches)<.000002);
 assert.ok(Math.abs(profile.cleanSheetRate-profile.cleanSheets/profile.matches)<.000002);
}
const combinations=matchQuestions.reduce((sets,q)=>sets.flatMap(answers=>q.options.map(option=>({...answers,[q.id]:option.id}))),[{}]);
const winners=new Set();
for(const answers of combinations){
 const result=recommendTeams(answers,data,stadiums);
 assert.equal(result.picks.length,3);assert.equal(new Set(result.picks.map(p=>p.stadium.id)).size,3);
 assert.deepEqual(result,recommendTeams(answers,data,stadiums));
 for(const pick of result.picks)for(const e of pick.evidence)assert.equal(e.raw,data.clubs[pick.stadium.id][e.metric]);
 if(result.mode==='matched'){assert.ok(result.picks.every(p=>Number.isFinite(p.score)&&p.score>=0&&p.score<=1));winners.add(result.picks[0].stadium.id);}
 else assert.deepEqual(answers,{tempo:'any',winning:'any',edge:'any',home:'any'});
}
assert.ok(winners.size>5,'Answers must produce meaningfully different recommendations');
assert.throws(()=>recommendTeams({tempo:'missing'},data,stadiums));
const bad=structuredClone(data);bad.clubs.bernabeu.matches=0;assert.throws(()=>validateMatchData(bad,stadiums));
console.log(`Match checks passed: ${combinations.length} answer paths, ${winners.size} different leading candidates, deterministic rankings, neutral handling and source-consistent metrics.`);
