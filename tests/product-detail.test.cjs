const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('js/product-detail.js','utf8');
async function setup({id='6',stock=1,product,error=null}={}) {
 const nodes={}; const names=['detail-message','detail','product-name','product-description','product-category','product-price','product-stock','detail-add','detail-cart-message'];
 for(const n of names)nodes[n]={hidden:true,textContent:'',disabled:true,addEventListener(_,fn){this.click=fn;}};
 let queries=0,added=[];
 const data=product===undefined?{product_id:6,name:'<b>Power Bank</b>',price:99,stock,category:{category_name:'Accessories'}}:product;
 const ctx={URLSearchParams,console,cart:[],addToCart(p){added.push(p);ctx.cart.push({quantity:1});},window:{location:{search:'?id='+id}},document:{title:'',getElementById:n=>nodes[n]},authClient:{from(table){assert.equal(table,'product');queries++;return {select(){return this;},eq(k,v){assert.equal(k,'product_id');assert.equal(v,id);return this;},single:async()=>({data,error})};}}};
 vm.runInNewContext(source,ctx);await new Promise(setImmediate);return {nodes,queries,added};
}
test('details read saved product and render literal name, price and low stock',async()=>{const x=await setup();assert.equal(x.nodes['product-name'].textContent,'<b>Power Bank</b>');assert.equal(x.nodes['product-price'].textContent,'AED 99.00');assert.match(x.nodes['product-stock'].textContent,/Low Stock.*1/);assert.equal(x.nodes.detail.hidden,false);x.nodes['detail-add'].click();assert.equal(x.added[0].id,6);});
test('out-of-stock product disables add to cart',async()=>{const x=await setup({stock:0});assert.equal(x.nodes['detail-add'].disabled,true);assert.match(x.nodes['product-stock'].textContent,/Out of Stock/);});
test('invalid product id does not request database data',async()=>{const x=await setup({id:'-1 OR 1=1'});assert.equal(x.queries,0);assert.match(x.nodes['detail-message'].textContent,/Invalid/);});
test('missing or denied product remains hidden',async()=>{const x=await setup({product:null,error:{message:'not found'}});assert.equal(x.nodes.detail.hidden,true);assert.match(x.nodes['detail-message'].textContent,/not found/);});
test('missing description is explicit rather than fabricated',async()=>{const x=await setup();assert.equal(x.nodes['product-description'].textContent,'No product description has been provided.');});
