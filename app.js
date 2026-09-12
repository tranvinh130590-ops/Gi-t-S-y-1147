const KEY="giat_say_pro_v1";
const defaultData={
  stores:[{id:"CH1",name:"Cửa hàng 1"}],
  activeStore:"CH1",
  services:[
    {id:"S1",name:"Giặt thường",unit:"kg",price:15000},
    {id:"S2",name:"Giặt + Sấy",unit:"kg",price:22000},
    {id:"S3",name:"Chăn / Ga / Gối",unit:"món",price:50000}
  ],
  orders:[],
  customers:[]
};
let db=JSON.parse(localStorage.getItem(KEY)||"null")||defaultData;
const money=n=>new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND",maximumFractionDigits:0}).format(n||0);
const save=()=>localStorage.setItem(KEY,JSON.stringify(db));
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const today=()=>new Date().toISOString().slice(0,10);
function statusClass(s){return {"Đã nhận":"s-received","Đang giặt":"s-wash","Đang sấy":"s-dry","Hoàn thành":"s-done","Đã trả":"s-done"}[s]||"s-received"}
function renderStores(){storeSelect.innerHTML=db.stores.map(s=>`<option value="${s.id}" ${s.id===db.activeStore?"selected":""}>${esc(s.name)}</option>`).join("")}
function page(name){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===name));document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===name));document.getElementById("pageTitle").textContent={dashboard:"Tổng quan",orders:"Đơn hàng",customers:"Khách hàng",services:"Bảng giá",reports:"Báo cáo"}[name];if(name==="dashboard")renderDashboard();if(name==="orders")renderOrders();if(name==="customers")renderCustomers();if(name==="services")renderServices();if(name==="reports")renderReports()}
function storeOrders(){return db.orders.filter(o=>o.storeId===db.activeStore)}
function renderDashboard(){const os=storeOrders(),t=today(),todayOs=os.filter(o=>o.date===t),revenue=todayOs.reduce((a,o)=>a+o.total,0);todayRevenue.textContent=money(revenue);todayOrders.textContent=todayOs.length+" đơn";processingOrders.textContent=os.filter(o=>!["Hoàn thành","Đã trả"].includes(o.status)).length;readyOrders.textContent=os.filter(o=>o.status==="Hoàn thành").length;customerCount.textContent=db.customers.filter(c=>c.storeId===db.activeStore).length;recentOrders.innerHTML=os.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,8).map(o=>`<tr><td><b>${o.code}</b></td><td>${esc(o.customer)}</td><td>${esc(o.service)}</td><td>${money(o.total)}</td><td><span class="badge ${statusClass(o.status)}">${o.status}</span></td></tr>`).join("")||`<tr><td colspan="5">Chưa có đơn hàng.</td></tr>`}
function renderOrders(){let os=storeOrders();const q=(orderSearch.value||"").toLowerCase(),f=statusFilter.value;os=os.filter(o=>(!q||[o.code,o.customer,o.phone].join(" ").toLowerCase().includes(q))&&(!f||o.status===f));ordersTable.innerHTML=os.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(o=>`<tr><td><b>${o.code}</b></td><td>${o.date}</td><td>${esc(o.customer)}<br><small>${esc(o.phone)}</small></td><td>${esc(o.service)}</td><td>${o.qty}</td><td><b>${money(o.total)}</b></td><td><span class="badge ${o.payment!=="Chưa thanh toán"?"s-paid":"s-unpaid"}">${o.payment}</span></td><td><select onchange="updateStatus('${o.id}',this.value)">${["Đã nhận","Đang giặt","Đang sấy","Hoàn thành","Đã trả"].map(s=>`<option ${s===o.status?"selected":""}>${s}</option>`).join("")}</select></td></tr>`).join("")||`<tr><td colspan="8">Không tìm thấy đơn hàng.</td></tr>`}
window.updateStatus=(id,status)=>{const o=db.orders.find(x=>x.id===id);if(o){o.status=status;save();renderOrders();renderDashboard()}};
function renderCustomers(){const q=(customerSearch.value||"").toLowerCase();const cs=db.customers.filter(c=>c.storeId===db.activeStore).filter(c=>!q||[c.name,c.phone].join(" ").toLowerCase().includes(q));customersTable.innerHTML=cs.map(c=>{const os=storeOrders().filter(o=>o.phone===c.phone);return `<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.phone)}</td><td>${esc(c.address||"")}</td><td>${os.length}</td><td>${money(os.reduce((a,o)=>a+o.total,0))}</td></tr>`}).join("")||`<tr><td colspan="5">Chưa có khách hàng.</td></tr>`}
function renderServices(){servicesTable.innerHTML=db.services.map(s=>`<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.unit)}</td><td><input type="number" value="${s.price}" onchange="changePrice('${s.id}',this.value)"></td><td><button class="link-btn" onclick="deleteService('${s.id}')">Xóa</button></td></tr>`).join("")}
window.changePrice=(id,v)=>{const s=db.services.find(x=>x.id===id);if(s){s.price=Number(v)||0;save();fillServiceSelect()}};
window.deleteService=id=>{if(confirm("Xóa dịch vụ này?")){db.services=db.services.filter(s=>s.id!==id);save();renderServices();fillServiceSelect()}};
function renderReports(){const os=storeOrders(),m=new Date().toISOString().slice(0,7),mo=os.filter(o=>o.date.startsWith(m)),rev=mo.reduce((a,o)=>a+o.total,0);monthRevenue.textContent=money(rev);monthOrders.textContent=mo.length+" đơn";avgOrder.textContent=money(mo.length?rev/mo.length:0);const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const key=d.toISOString().slice(0,10);return {key,label:d.toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit"}),value:os.filter(o=>o.date===key).reduce((a,o)=>a+o.total,0)}});const max=Math.max(...days.map(x=>x.value),1);reportBars.innerHTML=days.map(d=>`<div class="bar-wrap"><b>${money(d.value)}</b><div class="bar" style="height:${Math.max(3,d.value/max*190)}px"></div><span>${d.label}</span></div>`).join("")}
function fillServiceSelect(){serviceInput.innerHTML=db.services.map(s=>`<option value="${s.id}">${esc(s.name)} — ${money(s.price)}/${s.unit}</option>`).join("");syncPrice()}
function syncPrice(){const s=db.services.find(x=>x.id===serviceInput.value);if(s)priceInput.value=s.price;calcTotal()}
function calcTotal(){const total=Math.max(0,(Number(qtyInput.value)||0)*(Number(priceInput.value)||0)-(Number(discountInput.value)||0));totalPreview.textContent=money(total);return total}
function openOrder(){orderModal.classList.add("open");orderForm.reset();qtyInput.value=1;discountInput.value=0;fillServiceSelect();calcTotal()}
function closeModals(){document.querySelectorAll(".modal").forEach(x=>x.classList.remove("open"))}
orderForm.addEventListener("submit",e=>{e.preventDefault();const total=calcTotal();const name=customerName.value.trim(),phone=customerPhone.value.trim();const id=crypto.randomUUID();const s=db.services.find(x=>x.id===serviceInput.value);db.orders.push({id,code:"GS"+Date.now().toString().slice(-6),storeId:db.activeStore,date:today(),createdAt:new Date().toISOString(),customer:name,phone,address:customerAddress.value.trim(),service:s?.name||"",qty:Number(qtyInput.value),price:Number(priceInput.value),discount:Number(discountInput.value)||0,total,payment:paymentInput.value,status:"Đã nhận",note:noteInput.value.trim()});let c=db.customers.find(x=>x.storeId===db.activeStore&&x.phone===phone);if(!c)db.customers.push({id:"C"+Date.now(),storeId:db.activeStore,name,phone,address:customerAddress.value.trim()});else{c.name=name;c.address=customerAddress.value.trim()}save();closeModals();page("orders")});
serviceInput.addEventListener("change",syncPrice);[qtyInput,priceInput,discountInput].forEach(x=>x.addEventListener("input",calcTotal));
document.querySelectorAll(".nav").forEach(x=>x.addEventListener("click",()=>page(x.dataset.page)));
document.querySelectorAll("[data-page-link]").forEach(x=>x.addEventListener("click",()=>page(x.dataset.pageLink)));
newOrderBtn.addEventListener("click",openOrder);newOrderBtn2.addEventListener("click",openOrder);
document.querySelectorAll("[data-close]").forEach(x=>x.addEventListener("click",closeModals));
document.querySelectorAll(".modal").forEach(x=>x.addEventListener("click",e=>{if(e.target===x)closeModals()}));
orderSearch.addEventListener("input",renderOrders);statusFilter.addEventListener("change",renderOrders);customerSearch.addEventListener("input",renderCustomers);
storeSelect.addEventListener("change",()=>{db.activeStore=storeSelect.value;save();page(document.querySelector(".page.active").id)});
addCustomerBtn.addEventListener("click",()=>{simpleTitle.textContent="Thêm khách hàng";simpleForm.innerHTML=`<label>Họ tên</label><input id="scName" required><label>Số điện thoại</label><input id="scPhone" required><label>Địa chỉ</label><input id="scAddress"><button class="primary full">Lưu khách hàng</button>`;simpleModal.classList.add("open");simpleForm.onsubmit=e=>{e.preventDefault();db.customers.push({id:"C"+Date.now(),storeId:db.activeStore,name:scName.value,phone:scPhone.value,address:scAddress.value});save();closeModals();renderCustomers()}});
addServiceBtn.addEventListener("click",()=>{simpleTitle.textContent="Thêm dịch vụ";simpleForm.innerHTML=`<label>Tên dịch vụ</label><input id="ssName" required><label>Đơn vị</label><select id="ssUnit"><option>kg</option><option>món</option><option>lần</option></select><label>Đơn giá</label><input id="ssPrice" type="number" required><button class="primary full">Lưu dịch vụ</button>`;simpleModal.classList.add("open");simpleForm.onsubmit=e=>{e.preventDefault();db.services.push({id:"S"+Date.now(),name:ssName.value,unit:ssUnit.value,price:Number(ssPrice.value)||0});save();closeModals();renderServices();fillServiceSelect()}});
todayText.textContent=new Date().toLocaleDateString("vi-VN",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"});
renderStores();fillServiceSelect();renderDashboard();
