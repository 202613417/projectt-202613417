const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('js/order-confirmation.js','utf8');
async function setup({id='5',signedIn=true,error=null,order}={}){
 const nodes={};let queried=0,redirect;
 for(const name of ['confirmation-message','order-details','order-number','order-status','order-total','order-items'])nodes[name]={hidden:true,textContent:'',children:[],replaceChildren(){this.children=[];},appendChild(n){this.children.push(n);}};
 const context={URLSearchParams,window:{location:{search:'?id='+id,replace(url){redirect=url;}}},getCurrentUser:async()=>signedIn?{id:'own-user'}:null,document:{getElementById:id=>nodes[id],createElement:()=>({textContent:''})},authClient:{from(table){assert.equal(table,'orders');queried++;return {select(){return this;},eq(key,value){assert.equal(key,'order_id');assert.equal(value,id);return this;},single:async()=>({data:order,error})};}}};
 vm.runInNewContext(source,context);await new Promise(setImmediate);
 return {nodes,queried,redirect};
}
test('confirmation renders saved total, status, and literal product name',async()=>{const x=await setup({order:{order_id:5,total_amount:24.7,status:'Paid',order_item:[{quantity:2,unit_price:12.35,product:{name:'<img src=x>'}}]}});assert.equal(x.nodes['order-total'].textContent,'24.70');assert.equal(x.nodes['order-status'].textContent,'Paid');assert.match(x.nodes['order-items'].children[0].textContent,/^<img/);assert.equal(x.nodes['order-details'].hidden,false);});
test('invalid order number makes no database request',async()=>{const x=await setup({id:'0 OR 1=1'});assert.equal(x.queried,0);assert.match(x.nodes['confirmation-message'].textContent,/invalid/);});
test('signed-out visitor is sent to login without querying orders',async()=>{const x=await setup({signedIn:false});assert.equal(x.redirect,'login.html');assert.equal(x.queried,0);});
test('unavailable or unauthorized order shows no details',async()=>{const x=await setup({error:{message:'No row'}});assert.equal(x.nodes['order-details'].hidden,true);assert.match(x.nodes['confirmation-message'].textContent,/unavailable/);});
