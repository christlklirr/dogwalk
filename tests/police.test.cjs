const test=require("node:test");
const assert=require("node:assert/strict");
const {policeCorridor}=require("../police.js");
const base={lat:48.15,lon:16.31};
const east=111195*Math.cos(base.lat*Math.PI/180);
const pt=(x,y)=>({lat:base.lat+y/111195,lon:base.lon+x/east});
const way=(id,nodes,geometry,name="Testgasse")=>({id,nodes,geometry,tags:{name}});
const distance=(a,b)=>Math.hypot((b[1]-a[1])*east,(b[0]-a[0])*111195);
const meters=line=>line.slice(1).reduce((sum,p,i)=>sum+distance(line[i],p),0);
test("Projects onto the road and follows a bend and joined segment for 100 m on either side",()=>{
  const lines=policeCorridor({...pt(0,8),street:"Testgasse"},[
    way(1,[1,2,3,4],[pt(-140,0),pt(-10,0),pt(25,0),pt(25,35)]),
    way(2,[4,5],[pt(25,35),pt(25,140)])]);
  assert.equal(lines.length,2);
  lines.forEach(line=>assert.ok(Math.abs(meters(line)-100)<.01));
  assert.ok(lines[1].length>=4);
});
test("Stops at a street end and skips an unmatched address or distant street",()=>{
  const roads=[way(1,[1,2],[pt(-40,0),pt(60,0)])];
  assert.deepEqual(policeCorridor(base,roads).map(l=>Math.round(meters(l))),[40,60]);
  assert.deepEqual(policeCorridor({...base,street:"Andere Gasse"},roads),[]);
  assert.deepEqual(policeCorridor(pt(0,90),roads),[]);
});
test("Does not fan out along two possible same-name branches",()=>{
  const roads=[way(1,[1,2],[pt(-120,0),pt(20,0)]),way(2,[2,3],[pt(20,0),pt(150,0)]),way(3,[2,4],[pt(20,0),pt(100,30)])];
  assert.equal(Math.round(meters(policeCorridor(base,roads)[1])),20);
});
