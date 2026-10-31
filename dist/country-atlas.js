const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function groupCities(stadiums,positions){
 const groups=new Map();
 for(const stadium of stadiums){const group=groups.get(stadium.city)||{name:stadium.city,members:[]};group.members.push(stadium);groups.set(stadium.city,group);}
 return [...groups.values()].map(group=>({...group,position:[0,1].map(i=>group.members.reduce((sum,s)=>sum+positions[s.id][i],0)/group.members.length)}));
}

// North-up local projection. It preserves relative distances at the region's latitude.
export function fitProjection(points,width,height,padding=40){
 const latitude=points.reduce((sum,p)=>sum+p[0],0)/points.length,cos=Math.cos(latitude*Math.PI/180),xy=points.map(([lat,lon])=>[lon*cos,lat]),xs=xy.map(p=>p[0]),ys=xy.map(p=>p[1]);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),scale=Math.min((width-2*padding)/Math.max(maxX-minX,.001),(height-2*padding)/Math.max(maxY-minY,.001));
 return {project:([lat,lon])=>[width/2+(lon*cos-(minX+maxX)/2)*scale,height/2-(lat-(minY+maxY)/2)*scale],scale,cos};
}

function localInset(city,positions){
 const width=260,height=112,cos=Math.cos(city.position[0]*Math.PI/180),km=111.2;
 const coords=city.members.map(s=>{const [lat,lon]=positions[s.id];return {s,x:(lon-city.position[1])*cos*km,y:(lat-city.position[0])*km};});
 const spanX=Math.max(12,...coords.map(p=>Math.abs(p.x)*2.8)),spanY=Math.max(7,...coords.map(p=>Math.abs(p.y)*2.8)),scale=Math.min(220/spanX,76/spanY);
 const nodes=coords.map((p,i)=>({s:p.s,x:130+p.x*scale,y:56-p.y*scale,number:String(i+1).padStart(2,'0')}));
 const scaleKm=Math.max(1,Math.round(55/scale));
 return `<section class="country-inset" data-inset-city="${escape(city.name)}" aria-label="${escape(city.name)}球场方位图"><header><span>${escape(city.name)} <small>/ 城内主场</small></span><b>↑ N</b></header><div class="country-local-chart"><svg viewBox="0 0 260 112" preserveAspectRatio="none" aria-hidden="true"><path d="M0 28H260M0 56H260M0 84H260M65 0V112M130 0V112M195 0V112"/><circle cx="130" cy="56" r="43"/><path class="local-scale" d="M15 94v4h${(scaleKm*scale).toFixed(1)}v-4"/><text x="15" y="89">约 ${scaleKm} km</text></svg>${nodes.map(p=>`<button class="country-local-pin" data-atlas-open="${p.s.id}" data-lat="${positions[p.s.id][0]}" data-lon="${positions[p.s.id][1]}" aria-label="飞入${escape(p.s.name)}" style="left:${p.x/width*100}%;top:${p.y/height*100}%;--club-color:${p.s.color}">${p.number}</button>`).join('')}</div><div class="country-local-legend">${nodes.map(p=>`<button data-atlas-open="${p.s.id}"><b style="color:${p.s.color}">${p.number}</b><span>${escape(p.s.club.split(' / ')[0])}<small>${escape(p.s.name)}</small></span><i>↗</i></button>`).join('')}</div></section>`;
}

export function countryMapMarkup(region,data,members,positions,width){
 const mobile=width<500,height=mobile?360:440,cities=groupCities(members,positions),points=data.polygons.flatMap(poly=>poly[0].map(([lon,lat])=>[lat,lon]));
 const {project}=fitProjection(points,width,height,mobile?35:58),paths=data.polygons.map(poly=>poly.map(ring=>ring.map(([lon,lat],i)=>{const [x,y]=project([lat,lon]);return(i?'L':'M')+x.toFixed(2)+','+y.toFixed(2);}).join('')+'Z').join('')).join('');
 const labels=[],labelWidth=mobile?105:128;
 const cityMarkup=cities.map((city,i)=>{
  const [x,y]=project(city.position),placements=[[12,-22],[12,-67],[-labelWidth-12,-22],[-labelWidth-12,-67],[12,10],[-labelWidth-12,10]];
  const candidates=placements.map(([dx,dy])=>({left:Math.max(5,Math.min(width-labelWidth-5,x+dx)),top:Math.max(5,Math.min(height-54,y+dy))}));
  const overlaps=r=>labels.reduce((sum,a)=>sum+Math.max(0,Math.min(a.left+labelWidth,r.left+labelWidth)-Math.max(a.left,r.left))*Math.max(0,Math.min(a.top+49,r.top+49)-Math.max(a.top,r.top)),0);
  candidates.sort((a,b)=>overlaps(a)-overlaps(b));const label=candidates[0];labels.push(label);
  const single=city.members.length===1,s=city.members[0],tag=single?'button':'div',action=single?` data-atlas-open="${s.id}" aria-label="飞入${escape(s.name)}"`:'';
  return `<span class="country-city-light" data-city-light="${escape(city.name)}" style="left:${x/width*100}%;top:${y/height*100}%;--city-delay:${i*100}ms"><i></i></span><${tag} class="country-city-label ${single?'is-direct':'is-multiple'}" data-map-city="${escape(city.name)}"${action} style="left:${label.left/width*100}%;top:${label.top/height*100}%;width:${labelWidth}px;--city-delay:${i*100}ms"><strong>${escape(city.name)}${single?'<b>↗</b>':''}</strong><small>${single?escape(s.name):city.members.length+' 座主场 · 已展开局部图'}</small></${tag}>`;
 }).join('');
 const multiple=cities.filter(city=>city.members.length>1);
 return `<header class="country-map-header"><div><span>WORLD / ${escape(region.en)}</span><h3>${escape(region.name)}<small>${cities.length} 座城市 · ${members.length} 座主场</small></h3></div><button data-country-back>↖ 返回地球</button></header><div class="country-main" style="height:${height}px"><svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="${escape(region.name)}主场城市地图" role="img"><defs><linearGradient id="country-land" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#314654"/><stop offset=".52" stop-color="#1c323f"/><stop offset="1" stop-color="#111f2a"/></linearGradient><pattern id="country-grain" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".4" fill="#dde6e8" opacity=".11"/></pattern><filter id="country-glow"><feGaussianBlur stdDeviation="5"/></filter></defs><path d="${paths}" fill="none" stroke="#ddc68f" stroke-width="5" opacity=".12" filter="url(#country-glow)"/><path class="country-shape" d="${paths}" fill="url(#country-land)"/><path d="${paths}" fill="url(#country-grain)"/></svg><span class="country-map-north">N<br>↑</span>${cityMarkup}</div>${multiple.length?`<div class="country-insets" aria-label="同城球场自动展开">${multiple.map(city=>localInset(city,positions)).join('')}</div>`:'<p class="country-direct-hint">点亮的城市，直达它的主场。 ↗</p>'}<footer class="country-map-footer"><span>城市已自动点亮 · 点击球队进入球场</span><small>方位示意 / 非导航地图</small></footer>`;
}
