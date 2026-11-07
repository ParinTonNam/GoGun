/* eslint-disable @typescript-eslint/no-require-imports */
// Browser regression checks against mocked API responses; never mutates the database.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const origin = process.env.GOGUN_TEST_URL || "http://localhost:3000";
const output = path.resolve(__dirname, "../test-results/redesign");
const host = { id: "host", display_name: "ต้นน้ำ", username: "host", avatar_color: "#58795b", email: "host@example.test", is_guest: false, phone: null, created_at: "2026-09-01" };
const friend = { ...host, id: "friend", display_name: "เมย์", avatar_color: "#8a7399" };
const trip = { id: "design-check", name: "เขาใหญ่ ไปพักใจกัน", destination: "เขาใหญ่", icon: "⛰", trip_type: "overnight", duration_days: 3, proposed_start_date: "2026-11-14", confirmed_start_date: null, date_status: "proposed", currency: "THB", invite_code: "design-invite", organizer_id: host.id, budget_per_person: 3500, allow_member_expenses: true, allow_member_itinerary_edit: true, allow_member_invite: true, created_at: "2026-09-01", organizer: host, members: [host, friend].map((user, i) => ({ id: "member-"+i, trip_id: "design-check", user_id: user.id, role: i ? "member" : "organizer", status: "joined", joined_at: "2026-09-01", user })) };
const days = [1,2,3].map(n => ({ id: "day-"+n, trip_id: trip.id, day_number: n, date: "2026-11-"+(13+n), label: ["ออกเดินทาง","ใช้เวลากับธรรมชาติ","แวะคาเฟ่ก่อนกลับ"][n-1], activities: [{ id: "activity-"+n, day_id: "day-"+n, time: "09:00", title: "เจอกันที่จุดนัดหมาย แล้วออกไปเที่ยวด้วยกัน", tags: ["จุดนัดพบ"], sort_order: 0 }] }));
const bills = [{ id: "bill-1", trip_id: trip.id, name: "ที่พักสำหรับทุกคน", category: "ที่พัก", total_amount: 2400, currency: "THB", paid_by: host, paid_by_id: host.id, created_at: "2026-09-01", splits: [host,friend].map(user => ({ id: "split-"+user.id, user_id: user.id, amount:1200, user })) }];
const quests = [{ id:"quest-1", title:"Color Hunter", description:"ตามหาสีระหว่างทาง", targets:["สีเขียว","สีส้ม","สีฟ้า"], closed:false, created_at:"2026-09-01", progress:[] }];
const tasks = [{trip_id:trip.id, trip_name:trip.name, title:"ตอบวันว่างก่อนออกเดินทาง", path:"availability",kind:"availability"}];
async function mock(page) {
 await page.route("**/*", async route => {
  const url = new URL(route.request().url());
  if(url.origin !== origin) return route.abort();
  if(!url.pathname.startsWith("/api/v1/")) return route.continue();
  const resource=url.pathname.slice(7);
  let data=[];
  if(resource==="/auth/me") data=host;
  else if(resource==="/trips") data=[trip,{...trip,id:"second-trip",name:"ทะเลกับคนที่ใช่",destination:"บางแสน",duration_days:1}];
  else if(resource==="/trips/"+trip.id) data=trip;
  else if(resource==="/trips/my-tasks") data=tasks;
  else if(resource.endsWith("/itinerary")) data=days;
  else if(resource.endsWith("/expenses")) data=bills;
  else if(resource.endsWith("/quests")) data=quests;
  else if(resource.endsWith("/balance")) data={ total_amount:2400,currency:"THB",member_count:2,balances:[host,friend].map(user=>({user_id:user.id,display_name:user.display_name,avatar_color:user.avatar_color,paid:user.id==="host"?2400:0,share:1200,net:user.id==="host"?1200:-1200})) };
  else if(resource.endsWith("/members")) data=trip.members;
  await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({data})});
 });
}
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true});
 const failures=[];
 const routes=["/","/login","/signin","/trips","/recommend","/recommend/bangsaen","/profile","/trips/new",...["","/plan","/group","/expenses","/expenses/add","/availability","/availability/compare","/itinerary","/tools/checklist","/tools/packing","/tools/vote","/tools/wheel","/tools/quests","/settings","/members","/share"].map(s=>"/trips/"+trip.id+s),"/trips/demo","/trips/demo/itinerary","/trips/demo/member/wallet","/trips/demo/tools"];
 try {
  for(const width of [320,390,768,1440]){
   const page=await browser.newPage({reducedMotion:"reduce",viewport:{width,height:900}});
   await mock(page);
   page.on("pageerror",e=>failures.push(width+" "+page.url()+" "+e.message));
   for(const route of routes){
    await page.goto(origin+route,{waitUntil:"networkidle"});
    await page.evaluate(()=>document.fonts.ready);
    const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
    if(overflow.scroll>width+1) failures.push(width+" "+route+" overflow "+overflow.scroll);
    const hiddenSheets = page.locator('.responsive-sheet.translate-y-full');
    for (let i=0;i<await hiddenSheets.count();i++) assert.equal(await hiddenSheets.nth(i).isVisible(),false,"Closed sheet must be hidden");
    if(width===1440 || width===390){
     if(["/","/login","/trips","/recommend","/profile","/trips/new","/trips/demo","/trips/"+trip.id,"/trips/"+trip.id+"/expenses","/trips/"+trip.id+"/itinerary"].includes(route)) await page.screenshot({path:path.join(output,width+"-"+route.replaceAll("/","_")+".png"),fullPage:true});
    }
   }
   await page.goto(origin+"/trips/"+trip.id+"/plan",{waitUntil:"networkidle"});
   const toggle=page.getByRole("button",{name:"เปิดเมนูทริปทั้งหมด"});
   if(width<1024){
    assert.equal(await toggle.isVisible(),true);
    await toggle.click();
    await page.getByRole("dialog",{name:"เมนูทริป",exact:true}).waitFor({state:"visible"});
    assert.equal(await page.getByRole("dialog",{name:"เมนูทริป",exact:true}).isVisible(),true);
    await page.locator('#trip-menu .workspace-nav-item').first().waitFor({state:"visible"});
    await page.evaluate(()=>document.fonts.ready);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    if(width===390) await page.screenshot({path:path.join(output,"390-menu.png")});
    await page.keyboard.press("Escape");
    assert.equal(await toggle.getAttribute("aria-expanded"),"false");
    assert.equal(await toggle.evaluate(e=>e===document.activeElement),true);
   }else{
    assert.equal(await toggle.isVisible(),false);
    assert.equal(await page.locator(".workspace-sidebar").isVisible(),true);
   }
   await page.close();
   console.log("Checked "+width+"px: "+routes.length+" routes");
  }
  fs.writeFileSync(path.join(output,"results.json"),JSON.stringify(failures,null,2));
  assert.deepEqual(failures,[]);
  console.log("Responsive routes, overflow, runtime errors, drawer and keyboard checks passed.");
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

