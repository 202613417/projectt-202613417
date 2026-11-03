const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('js/checkout.js','utf8');
function setup(raw, replies=[], authenticated=true) {
 const data=new Map(raw===undefined?[]:[['shopnow_cart',raw]]), session=new Map(), nodes={}, calls=[];
 const storage=m=>({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)});
 for(const id of ['checkout-form','place-order','checkout-items','checkout-total','checkout-message','customer-name','customer-email','customer-phone','customer-address']) nodes[id]={textContent:'',value:'',children:[],setAttribute(){},replaceChildren(){this.children=[];},appendChild(n){this.children.push(n);},addEventListener(t,f){this[t]=f;},reportValidity(){return true;},reset(){}};
 Object.assign(nodes['customer-name'],{value:'Lab Test'});nodes['customer-email'].value='test@example.invalid';nodes['customer-phone'].value='0000000000';nodes['customer-address'].value='Lab test address';
 const context={authClient:{auth:{getSession:async()=>({data:{session:authenticated?{access_token:'test-user-token'}:null},error:null})}},document:{getElementById:id=>nodes[id],createElement:()=>({textContent:''})},localStorage:storage(data),sessionStorage:storage(session),crypto:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'},window:{addEventListener(){},location:{assign(url){nodes.redirect=url;}}},fetch:async(url,options)=>{calls.push({url,headers:options.headers,body:JSON.parse(options.body)}); const r=replies.shift();if(r instanceof Error)throw r;return {ok:r.ok,status:r.status||200,json:async()=>r.body};}};
 vm.runInNewContext(source,context);
 return {nodes,data,session,calls,submit:()=>nodes['checkout-form'].submit({preventDefault(){}})};
}
const cart=JSON.stringify([{id:1,name:'<img src=x onerror=alert(1)>',price:12.35,quantity:2}]);
test('renders literal product text and AED total',()=>{const x=setup(cart);assert.equal(x.nodes['checkout-total'].textContent,'24.70');assert.match(x.nodes['checkout-items'].children[0].textContent,/^<img/);assert.equal(x.nodes['place-order'].disabled,false);});
test('empty and malformed carts cannot submit',async()=>{for(const raw of [undefined,'bad','{}',JSON.stringify([{id:1,price:2,quantity:-1}])]) {const x=setup(raw);assert.equal(x.nodes['place-order'].disabled,true);}});
test('whitespace-only customer is rejected',async()=>{const x=setup(cart);x.nodes['customer-name'].value='   ';await x.submit();assert.equal(x.calls.length,0);assert.match(x.nodes['checkout-message'].textContent,/valid/);});
test('server failure preserves cart; retry reuses request ID',async()=>{const x=setup(cart,[new Error('Failed to fetch'),{ok:false,status:403,body:{}}]);await x.submit();const first=x.calls[0].body.p_request_id;assert.equal(x.data.get('shopnow_cart'),cart);await x.submit();assert.equal(x.calls[1].body.p_request_id,first);assert.equal(x.data.get('shopnow_cart'),cart);assert.equal(x.nodes['place-order'].disabled,false);});
test('confirmed success clears cart, uses server total, resets retry token',async()=>{const x=setup(cart,[{ok:true,body:{order_id:42,total_amount:25}}]);await x.submit();assert.equal(x.data.has('shopnow_cart'),false);assert.match(x.nodes['checkout-message'].textContent,/Order #42.*25.00/);assert.equal(x.nodes['place-order'].disabled,true);assert.equal(x.session.has('shopnow_checkout_request'),false);assert.deepEqual(x.calls[0].body.p_items,[{product_id:1,quantity:2}]);});
test('invalid success response preserves cart',async()=>{const x=setup(cart,[{ok:true,body:{}}]);await x.submit();assert.equal(x.data.get('shopnow_cart'),cart);assert.match(x.nodes['checkout-message'].textContent,/did not confirm/);});

test('checkout sends the user token and public API key',async()=>{const x=setup(cart,[{ok:true,body:{order_id:43,total_amount:24.7}}]);await x.submit();assert.equal(x.calls[0].headers.Authorization,'Bearer test-user-token');assert.match(x.calls[0].headers.apikey,/^sb_publishable_/);});
test('expired login sends no order and retains the cart',async()=>{const x=setup(cart,[],false);await x.submit();assert.equal(x.calls.length,0);assert.equal(x.data.get('shopnow_cart'),cart);assert.match(x.nodes['checkout-message'].textContent,/log in again/);});

test('confirmed checkout opens its order confirmation page',async()=>{const x=setup(cart,[{ok:true,body:{order_id:44,total_amount:24.7}}]);await x.submit();assert.equal(x.nodes.redirect,'order-confirmation.html?id=44');});
test('phone validation rejects letters and short numbers',async()=>{for(const value of ['abc12345','123']){const x=setup(cart);x.nodes['customer-phone'].value=value;await x.submit();assert.equal(x.calls.length,0);}});
