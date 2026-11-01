export const matchQuestions=[
 {id:'tempo',title:'一个比赛夜，你更想看到怎样的节奏？',description:'用比赛中的场均总进球，区分开放与紧凑的比分。',options:[{id:'open',title:'进球不断，比分更开放',detail:'愿意看到双方频繁改写比分',criteria:[['goalsPerMatch',.9]]},{id:'tight',title:'比分紧凑，每一球都重要',detail:'享受小比分中的拉锯与悬念',criteria:[['goalsPerMatch',.1]]},{id:'any',title:'两种都愿意体验',detail:'这一项不设偏好',criteria:[]}]},
 {id:'winning',title:'追随一支球队，你更看重哪种体验？',description:'用多赛季国内联赛的胜率衡量赢球频率。',options:[{id:'steady',title:'尽量多地分享赢球的快乐',detail:'偏向样本中胜率较高的球队',criteria:[['winRate',.9]]},{id:'journey',title:'也愿意陪它经历赢输起伏',detail:'可以接受样本中相对较低的赢球频率',criteria:[['winRate',.3]]},{id:'any',title:'胜率不是我的选择标准',detail:'这一项不设偏好',criteria:[]}]},
 {id:'edge',title:'哪一种球队表现，更让你过瘾？',description:'分别用场均进球和零封比例刻画进攻产出与守门结果。',options:[{id:'attack',title:'用火力打开局面',detail:'看重球队自身的进球产出',criteria:[['scoringRate',.9]]},{id:'defence',title:'把球门稳稳守住',detail:'看重一场比赛不失球的频率',criteria:[['cleanSheetRate',.9]]},{id:'any',title:'进攻与防守，我都欣赏',detail:'这一项不设偏好',criteria:[]}]},
 {id:'home',title:'你期待主场带来怎样的力量？',description:'对照主客场的积分获取率，感受不同球队的主场关系。',options:[{id:'fortress',title:'回到主场，明显更有底气',detail:'更想感受主场对成绩的加成',criteria:[['homeLift',.9]]},{id:'travel',title:'走到哪里，也能稳定拿分',detail:'更看重客场表现与较小的主客差异',criteria:[['awayPointsRate',.9],['homeLift',.15]]},{id:'any',title:'主客场差异不影响我',detail:'这一项不设偏好',criteria:[]}]}
];
export const metricLabels={goalsPerMatch:'场均总进球',winRate:'联赛胜率',scoringRate:'球队场均进球',cleanSheetRate:'零封率',homeLift:'主场积分率加成',awayPointsRate:'客场积分率'};
export function formatMatchMetric(key,value){if(['goalsPerMatch','scoringRate'].includes(key))return Number(value).toFixed(2)+' 球';if(key==='homeLift')return(value>=0?'+':'')+(value*100).toFixed(1)+' 个百分点';return(value*100).toFixed(1)+'%';}
export function validateMatchData(data,stadiums){
 if(!data?.metadata||!data.clubs||!Number.isInteger(data.metadata.totalMatches)||data.metadata.totalMatches<=0)throw Error('比赛数据不完整');
 for(const stadium of stadiums){const p=data.clubs[stadium.id];if(!p||!Number.isInteger(p.matches)||p.matches<1||p.wins+p.draws+p.losses!==p.matches)throw Error('缺少球队比赛样本：'+stadium.club);for(const key of Object.keys(metricLabels))if(!Number.isFinite(p[key]))throw Error('球队统计缺失：'+key);for(const key of ['winRate','cleanSheetRate','homePointsRate','awayPointsRate'])if(p[key]<0||p[key]>1)throw Error('球队比例超出范围');}
 return data;
}
function percentile(value,values){const less=values.filter(v=>v<value).length,equal=values.filter(v=>v===value).length;return(less+equal/2)/values.length;}
export function recommendTeams(answers,data,stadiums){
 validateMatchData(data,stadiums);const criteria=[];
 for(const question of matchQuestions){const answer=question.options.find(o=>o.id===answers[question.id]);if(!answer)throw Error('请完成全部问题');for(const [metric,target] of answer.criteria)criteria.push({metric,target,weight:1/answer.criteria.length,choice:answer.title});}
 const metrics=Object.keys(metricLabels),populations=Object.fromEntries(metrics.map(key=>[key,stadiums.map(s=>data.clubs[s.id][key])]));
 if(!criteria.length){const picks=[];for(const metric of ['goalsPerMatch','cleanSheetRate','homeLift']){const s=[...stadiums].filter(s=>!picks.some(p=>p.stadium.id===s.id)).sort((a,b)=>data.clubs[b.id][metric]-data.clubs[a.id][metric]||a.id.localeCompare(b.id))[0];picks.push({stadium:s,profile:data.clubs[s.id],evidence:[{metric,raw:data.clubs[s.id][metric],choice:'从这种比赛特征开始认识',distance:0}]});}return{mode:'explore',picks,preferenceCount:0};}
 const weight=criteria.reduce((n,c)=>n+c.weight,0),scored=stadiums.map(stadium=>{const profile=data.clubs[stadium.id],evidence=criteria.map(c=>({...c,raw:profile[c.metric],percentile:percentile(profile[c.metric],populations[c.metric]),distance:Math.abs(percentile(profile[c.metric],populations[c.metric])-c.target)}));return{stadium,profile,score:1-Math.sqrt(evidence.reduce((n,c)=>n+c.weight*c.distance*c.distance,0)/weight),evidence:evidence.sort((a,b)=>a.distance-b.distance).slice(0,2)};}).sort((a,b)=>b.score-a.score||a.stadium.id.localeCompare(b.stadium.id));
 return{mode:'matched',picks:scored.slice(0,3),preferenceCount:matchQuestions.filter(q=>q.options.find(o=>o.id===answers[q.id])?.criteria.length).length};
}
